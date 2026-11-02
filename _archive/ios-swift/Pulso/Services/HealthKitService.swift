import Foundation
import HealthKit
import PulsoCore

/// Puente con Salud (Apple Health): lee la actividad del iPhone/Apple Watch/Strava
/// y escribe comidas, agua y sesiones de fuerza.
@MainActor @Observable final class HealthKitService {
    struct Today: Equatable {
        var activeKcal: Double = 0
        var steps: Double = 0
        var exerciseMinutes: Double = 0
        var standHours: Double = 0
        var moveGoal: Double?
        var exerciseGoal: Double?
        var standGoal: Double?
    }

    struct Workout: Identifiable, Equatable {
        let id: UUID
        let kind: Kind
        let start: Date
        let duration: TimeInterval
        let kcal: Double
        let distanceMeters: Double
        let avgHeartRate: Double?
        let source: String

        enum Kind: Equatable { case run, strength, other(String) }
    }

    private let store = HKHealthStore()
    private(set) var today = Today()
    private(set) var workouts: [Workout] = []
    private(set) var authorized = false
    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    private let readTypes: Set<HKObjectType> = [
        HKQuantityType(.activeEnergyBurned), HKQuantityType(.basalEnergyBurned),
        HKQuantityType(.stepCount), HKQuantityType(.appleExerciseTime), HKQuantityType(.appleStandTime),
        HKQuantityType(.heartRate), HKQuantityType(.restingHeartRate), HKQuantityType(.vo2Max),
        HKQuantityType(.distanceWalkingRunning), HKQuantityType(.bodyMass),
        HKObjectType.workoutType(), HKObjectType.activitySummaryType(),
    ]

    private let shareTypes: Set<HKSampleType> = [
        HKQuantityType(.dietaryEnergyConsumed), HKQuantityType(.dietaryProtein),
        HKQuantityType(.dietaryCarbohydrates), HKQuantityType(.dietaryFatTotal),
        HKQuantityType(.dietaryWater), HKQuantityType(.activeEnergyBurned),
        HKQuantityType(.bodyMass), HKObjectType.workoutType(),
    ]

    func requestAuthorization() async {
        guard isAvailable else { return }
        do {
            try await store.requestAuthorization(toShare: shareTypes, read: readTypes)
            authorized = true
            startObserving()
            await refresh()
        } catch {
            print("HealthKit auth:", error)
        }
    }

    func refresh() async {
        guard isAvailable else { return }
        let start = Calendar.current.startOfDay(for: .now)
        async let kcal = sum(.activeEnergyBurned, unit: .kilocalorie(), from: start)
        async let steps = sum(.stepCount, unit: .count(), from: start)
        async let exercise = sum(.appleExerciseTime, unit: .minute(), from: start)
        async let summary = activitySummary()
        async let recent = recentWorkouts()

        var t = Today(activeKcal: await kcal, steps: await steps, exerciseMinutes: await exercise)
        if let s = await summary {
            t.moveGoal = s.activeEnergyBurnedGoal.doubleValue(for: .kilocalorie())
            t.exerciseGoal = s.appleExerciseTimeGoal.doubleValue(for: .minute())
            t.standHours = s.appleStandHours.doubleValue(for: .count())
            t.standGoal = s.appleStandHoursGoal.doubleValue(for: .count())
        }
        today = t
        workouts = await recent
    }

    // MARK: Lectura

    private func sum(_ id: HKQuantityTypeIdentifier, unit: HKUnit, from start: Date) async -> Double {
        let predicate = HKQuery.predicateForSamples(withStart: start, end: nil)
        let query = HKStatisticsQueryDescriptor(
            predicate: .quantitySample(type: HKQuantityType(id), predicate: predicate),
            options: .cumulativeSum)
        let result = try? await query.result(for: store)
        return result?.sumQuantity()?.doubleValue(for: unit) ?? 0
    }

    /// Anillos reales de Actividad del Apple Watch (Moverse / Ejercicio / De pie).
    private func activitySummary() async -> HKActivitySummary? {
        var components = Calendar.current.dateComponents([.year, .month, .day, .era], from: .now)
        components.calendar = Calendar.current
        let predicate = HKQuery.predicateForActivitySummary(with: components)
        return await withCheckedContinuation { continuation in
            let query = HKActivitySummaryQuery(predicate: predicate) { _, summaries, _ in
                continuation.resume(returning: summaries?.first)
            }
            store.execute(query)
        }
    }

    private func recentWorkouts(days: Int = 30) async -> [Workout] {
        let since = Calendar.current.date(byAdding: .day, value: -days, to: .now)!
        let query = HKSampleQueryDescriptor(
            predicates: [.workout(HKQuery.predicateForSamples(withStart: since, end: nil))],
            sortDescriptors: [SortDescriptor(\.startDate, order: .reverse)],
            limit: 50)
        let samples = (try? await query.result(for: store)) ?? []
        let bpm = HKUnit.count().unitDivided(by: .minute())
        return samples.map { w in
            let kind: Workout.Kind = switch w.workoutActivityType {
            case .running: .run
            case .traditionalStrengthTraining, .functionalStrengthTraining: .strength
            default: .other(w.workoutActivityType.name)
            }
            return Workout(
                id: w.uuid, kind: kind, start: w.startDate, duration: w.duration,
                kcal: w.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0,
                distanceMeters: w.statistics(for: HKQuantityType(.distanceWalkingRunning))?.sumQuantity()?.doubleValue(for: .meter()) ?? 0,
                avgHeartRate: w.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: bpm),
                source: w.sourceRevision.source.name)
        }
    }

    /// Recalcula en cuanto llegan entrenos o energía nueva (Watch, Strava, esta app…).
    private func startObserving() {
        for type in [HKObjectType.workoutType(), HKQuantityType(.activeEnergyBurned)] {
            let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, completion, _ in
                Task { @MainActor in
                    await self?.refresh()
                    completion()
                }
            }
            store.execute(query)
        }
    }

    // MARK: Escritura

    /// Guarda una sesión de fuerza como entreno en Salud (aparece en Fitness y en los anillos).
    func saveStrengthWorkout(start: Date, end: Date, kcal: Double, title: String) async throws -> UUID? {
        let config = HKWorkoutConfiguration()
        config.activityType = .traditionalStrengthTraining
        config.locationType = .indoor
        let builder = HKWorkoutBuilder(healthStore: store, configuration: config, device: .local())
        try await builder.beginCollection(at: start)
        let energy = HKQuantitySample(type: HKQuantityType(.activeEnergyBurned),
                                      quantity: HKQuantity(unit: .kilocalorie(), doubleValue: kcal),
                                      start: start, end: end)
        try await builder.addSamples([energy])
        try await builder.addMetadata([HKMetadataKeyWorkoutBrandName: "Pulso", "PulsoTitle": title])
        try await builder.endCollection(at: end)
        let workout = try await builder.finishWorkout()
        await refresh()
        return workout?.uuid
    }

    /// Escribe los macros de una comida y devuelve los IDs para poder borrarlos luego.
    func saveFood(_ macros: Macros, name: String, at date: Date) async throws -> [UUID] {
        let meta: [String: Any] = [HKMetadataKeyFoodType: name]
        let samples: [HKQuantitySample] = [
            (.dietaryEnergyConsumed, HKUnit.kilocalorie(), macros.kcal),
            (.dietaryProtein, .gram(), macros.protein),
            (.dietaryCarbohydrates, .gram(), macros.carbs),
            (.dietaryFatTotal, .gram(), macros.fat),
        ].filter { $0.2 > 0 }.map { id, unit, value in
            HKQuantitySample(type: HKQuantityType(id), quantity: HKQuantity(unit: unit, doubleValue: value),
                             start: date, end: date, metadata: meta)
        }
        try await store.save(samples)
        return samples.map(\.uuid)
    }

    func deleteSamples(_ ids: [UUID]) async {
        guard !ids.isEmpty else { return }
        let predicate = HKQuery.predicateForObjects(with: Set(ids))
        for id in [HKQuantityTypeIdentifier.dietaryEnergyConsumed, .dietaryProtein, .dietaryCarbohydrates, .dietaryFatTotal] {
            _ = try? await store.deleteObjects(of: HKQuantityType(id), predicate: predicate)
        }
    }

    func saveWater(ml: Double, at date: Date = .now) async {
        let sample = HKQuantitySample(type: HKQuantityType(.dietaryWater),
                                      quantity: HKQuantity(unit: .literUnit(with: .milli), doubleValue: ml),
                                      start: date, end: date)
        try? await store.save(sample)
    }

    func latestBodyMass() async -> Double? {
        let query = HKSampleQueryDescriptor(
            predicates: [.quantitySample(type: HKQuantityType(.bodyMass))],
            sortDescriptors: [SortDescriptor(\.endDate, order: .reverse)], limit: 1)
        return try? await query.result(for: store).first?.quantity.doubleValue(for: .gramUnit(with: .kilo))
    }
}

private extension HKWorkoutActivityType {
    var name: String {
        switch self {
        case .cycling: "Ciclismo"
        case .walking: "Caminata"
        case .swimming: "Natación"
        case .hiking: "Senderismo"
        case .yoga: "Yoga"
        case .highIntensityIntervalTraining: "HIIT"
        default: "Entreno"
        }
    }
}
