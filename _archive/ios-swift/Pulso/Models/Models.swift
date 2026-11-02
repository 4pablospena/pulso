import Foundation
import SwiftData
import PulsoCore

enum MealSlot: String, Codable, CaseIterable, Identifiable {
    case breakfast = "Desayuno", lunch = "Comida", snack = "Merienda", dinner = "Cena"
    var id: String { rawValue }

    var symbol: String {
        switch self {
        case .breakfast: "sunrise.fill"
        case .lunch: "sun.max.fill"
        case .snack: "cup.and.saucer.fill"
        case .dinner: "moon.stars.fill"
        }
    }
}

enum FoodSource: String, Codable {
    case manual, barcode, photo
}

@Model final class FoodEntry {
    var date: Date
    var slotRaw: String
    var name: String
    var grams: Double
    var kcal: Double
    var protein: Double
    var carbs: Double
    var fat: Double
    var sourceRaw: String
    var healthSampleIDs: [UUID] = []

    init(date: Date = .now, slot: MealSlot, name: String, grams: Double,
         macros: Macros, source: FoodSource) {
        self.date = date
        self.slotRaw = slot.rawValue
        self.name = name
        self.grams = grams
        self.kcal = macros.kcal
        self.protein = macros.protein
        self.carbs = macros.carbs
        self.fat = macros.fat
        self.sourceRaw = source.rawValue
    }

    var slot: MealSlot { MealSlot(rawValue: slotRaw) ?? .snack }
    var macros: Macros { Macros(kcal: kcal, protein: protein, carbs: carbs, fat: fat) }
}

@Model final class WaterEntry {
    var date: Date
    var ml: Double
    init(date: Date = .now, ml: Double) {
        self.date = date
        self.ml = ml
    }
}

@Model final class StrengthSession {
    var start: Date
    var end: Date?
    var title: String
    @Relationship(deleteRule: .cascade, inverse: \PerformedExercise.session)
    var exercises: [PerformedExercise] = []
    var stravaActivityID: Int?
    var savedToHealth = false

    init(title: String, start: Date = .now) {
        self.title = title
        self.start = start
    }

    var orderedExercises: [PerformedExercise] { exercises.sorted { $0.order < $1.order } }
    var completedSets: [LoggedSet] { exercises.flatMap(\.completedSets) }
    var volume: Double { StrengthMath.volume(completedSets) }
    var duration: TimeInterval { (end ?? .now).timeIntervalSince(start) }
}

@Model final class PerformedExercise {
    var name: String
    var muscleRaw: String
    var order: Int
    var session: StrengthSession?
    @Relationship(deleteRule: .cascade, inverse: \SetEntry.exercise)
    var sets: [SetEntry] = []

    init(definition: ExerciseDefinition, order: Int) {
        self.name = definition.name
        self.muscleRaw = definition.muscle.rawValue
        self.order = order
    }

    var muscle: MuscleGroup { MuscleGroup(rawValue: muscleRaw) ?? .fullBody }
    var orderedSets: [SetEntry] { sets.sorted { $0.order < $1.order } }
    var completedSets: [LoggedSet] { orderedSets.filter(\.done).map(\.logged) }
}

@Model final class SetEntry {
    var order: Int
    var reps: Int
    var weightKg: Double
    var rpe: Double?
    var done = false
    var exercise: PerformedExercise?

    init(order: Int, reps: Int, weightKg: Double, rpe: Double? = nil) {
        self.order = order
        self.reps = reps
        self.weightKg = weightKg
        self.rpe = rpe
    }

    var logged: LoggedSet { LoggedSet(reps: reps, weightKg: weightKg, rpe: rpe) }
}

@Model final class ShoppingItem {
    var name: String
    var quantity: String
    var aisleRaw: String
    var checked = false
    var addedAt: Date

    init(name: String, quantity: String = "") {
        self.name = name
        self.quantity = quantity
        self.aisleRaw = Aisle.categorize(name).rawValue
        self.addedAt = .now
    }

    var aisle: Aisle { Aisle(rawValue: aisleRaw) ?? .other }
}

enum PulsoSchema {
    static let models: [any PersistentModel.Type] = [
        FoodEntry.self, WaterEntry.self, StrengthSession.self,
        PerformedExercise.self, SetEntry.self, ShoppingItem.self,
    ]
}

extension ModelContext {
    /// Añade a la lista evitando duplicados que aún estén pendientes.
    func addToShopping(_ names: [String]) {
        let pending = (try? fetch(FetchDescriptor<ShoppingItem>(predicate: #Predicate { !$0.checked }))) ?? []
        let existing = Set(pending.map { $0.name.lowercased() })
        for name in names where !existing.contains(name.lowercased()) {
            insert(ShoppingItem(name: name))
        }
    }

    /// Última serie completada de un ejercicio, para proponer la sobrecarga progresiva.
    func lastSet(of exerciseName: String) -> LoggedSet? {
        var descriptor = FetchDescriptor<PerformedExercise>(predicate: #Predicate { $0.name == exerciseName })
        descriptor.fetchLimit = 20
        let history = (try? fetch(descriptor)) ?? []
        return history
            .filter { $0.session?.end != nil }
            .max { ($0.session?.start ?? .distantPast) < ($1.session?.start ?? .distantPast) }?
            .completedSets.last
    }
}
