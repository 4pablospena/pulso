import Foundation
import SwiftData
import PulsoCore

/// Punto único donde se cruzan los módulos: entreno → Salud/Strava → calorías → compra.
@MainActor @Observable final class AppModel {
    let settings = UserSettings()
    let health = HealthKitService()
    let strava = StravaService()
    var lastError: String?

    var plan: PlanDay { WeeklyPlan.day(for: .now) }

    /// Objetivo de hoy: basal + energía activa real de Salud, con macros según el plan del día.
    var target: Macros {
        EnergyBudget.target(profile: settings.profile, activeKcal: health.today.activeKcal, dayType: plan.nutrition)
    }

    var fasting: FastingStatus? {
        settings.fastingStart.map { FastingClock.status(start: $0, protocol: settings.fastingProtocol) }
    }

    func bootstrap() async {
        await health.requestAuthorization()
        if let kg = await health.latestBodyMass() { settings.profile.weightKg = (kg * 10).rounded() / 10 }
        if strava.isConnected { try? await strava.loadActivities() }
        if let start = settings.fastingStart { FastingNotifier.schedule(start: start, protocol: settings.fastingProtocol) }
    }

    // MARK: Ayuno

    func startFasting(at date: Date = .now) {
        settings.fastingStart = date
        FastingNotifier.schedule(start: date, protocol: settings.fastingProtocol)
    }

    func stopFasting() {
        settings.fastingStart = nil
        FastingNotifier.cancel()
    }

    // MARK: Nutrición

    func log(_ food: FoodCandidate, slot: MealSlot, source: FoodSource, in context: ModelContext) {
        let entry = FoodEntry(slot: slot, name: food.name, grams: food.grams, macros: food.macros.value, source: source)
        context.insert(entry)
        Task {
            entry.healthSampleIDs = (try? await health.saveFood(entry.macros, name: entry.name, at: entry.date)) ?? []
        }
    }

    func delete(_ entry: FoodEntry, in context: ModelContext) {
        let ids = entry.healthSampleIDs
        context.delete(entry)
        Task { await health.deleteSamples(ids) }
    }

    func logWater(ml: Double, in context: ModelContext) {
        context.insert(WaterEntry(ml: ml))
        Task { await health.saveWater(ml: ml) }
    }

    // MARK: Fuerza

    func startSession(for day: PlanDay?, in context: ModelContext) -> StrengthSession {
        let session = StrengthSession(title: day?.title ?? "Entreno libre")
        context.insert(session)
        for (i, name) in (day?.routine ?? []).enumerated() {
            guard let def = ExerciseCatalog.named(name) else { continue }
            addExercise(def, order: i, to: session, in: context)
        }
        return session
    }

    func addExercise(_ def: ExerciseDefinition, order: Int, to session: StrengthSession, in context: ModelContext) {
        let exercise = PerformedExercise(definition: def, order: order)
        exercise.session = session
        context.insert(exercise)
        // Propone la siguiente carga a partir de la última sesión (sobrecarga progresiva).
        let suggestion = context.lastSet(of: def.name).map { StrengthMath.nextTarget(last: $0) }
            ?? LoggedSet(reps: 10, weightKg: 20)
        for i in 0..<3 {
            let set = SetEntry(order: i, reps: suggestion.reps, weightKg: suggestion.weightKg)
            set.exercise = exercise
            context.insert(set)
        }
    }

    /// Cierra la sesión y la propaga: Salud (anillos + gasto) → Strava → objetivo calórico.
    func finish(_ session: StrengthSession) async {
        session.end = .now
        let kcal = EnergyBudget.strengthKcal(weightKg: settings.profile.weightKg, duration: session.duration)
        do {
            _ = try await health.saveStrengthWorkout(start: session.start, end: session.end!, kcal: kcal, title: session.title)
            session.savedToHealth = true
        } catch {
            lastError = "No se pudo guardar en Salud: \(error.localizedDescription)"
        }

        guard settings.autoUploadToStrava, strava.isConnected else { return }
        do {
            session.stravaActivityID = try await strava.uploadStrength(
                title: session.title, start: session.start, duration: session.duration,
                description: summary(of: session))
        } catch {
            lastError = error.localizedDescription
        }
    }

    func summary(of session: StrengthSession) -> String {
        let lines = session.orderedExercises.compactMap { ex -> String? in
            let sets = ex.completedSets
            guard !sets.isEmpty else { return nil }
            let detail = sets.map { "\($0.reps)×\($0.weightKg.formatted())kg" }.joined(separator: ", ")
            return "• \(ex.name): \(detail)"
        }
        return (lines + ["", "Volumen total: \(Int(session.volume)) kg · Registrado con Pulso"]).joined(separator: "\n")
    }
}
