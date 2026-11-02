import Foundation

public enum MuscleGroup: String, Codable, CaseIterable, Sendable {
    case chest = "Pecho", back = "Espalda", shoulders = "Hombros", biceps = "Bíceps",
         triceps = "Tríceps", quads = "Cuádriceps", hamstrings = "Isquios",
         glutes = "Glúteos", calves = "Gemelos", core = "Core", fullBody = "Full body"
}

public struct ExerciseDefinition: Hashable, Codable, Sendable, Identifiable {
    public var id: String { name }
    public let name: String
    public let muscle: MuscleGroup

    public init(_ name: String, _ muscle: MuscleGroup) {
        self.name = name
        self.muscle = muscle
    }
}

public struct LoggedSet: Equatable, Sendable {
    public var reps: Int
    public var weightKg: Double
    public var rpe: Double?

    public init(reps: Int, weightKg: Double, rpe: Double? = nil) {
        self.reps = reps
        self.weightKg = weightKg
        self.rpe = rpe
    }
}

public enum StrengthMath {
    /// 1RM estimado (Epley). Con RPE se suman las repeticiones en reserva.
    public static func estimatedOneRepMax(_ set: LoggedSet) -> Double {
        guard set.reps > 0, set.weightKg > 0 else { return 0 }
        let reserve = set.rpe.map { max(0, 10 - $0) } ?? 0
        let effectiveReps = Double(set.reps) + reserve
        if effectiveReps <= 1 { return set.weightKg }
        return set.weightKg * (1 + effectiveReps / 30)
    }

    public static func volume(_ sets: [LoggedSet]) -> Double {
        sets.reduce(0) { $0 + Double($1.reps) * $1.weightKg }
    }

    public static func bestOneRepMax(_ sets: [LoggedSet]) -> Double {
        sets.map(estimatedOneRepMax).max() ?? 0
    }

    /// Sugerencia de sobrecarga progresiva para la próxima sesión.
    public static func nextTarget(last: LoggedSet, repRange: ClosedRange<Int> = 6...12, increment: Double = 2.5) -> LoggedSet {
        if last.reps >= repRange.upperBound {
            return LoggedSet(reps: repRange.lowerBound, weightKg: last.weightKg + increment)
        }
        return LoggedSet(reps: last.reps + 1, weightKg: last.weightKg)
    }
}

public enum ExerciseCatalog {
    public static let all: [ExerciseDefinition] = [
        .init("Press banca", .chest), .init("Press inclinado mancuernas", .chest), .init("Fondos", .chest),
        .init("Dominadas", .back), .init("Remo con barra", .back), .init("Jalón al pecho", .back),
        .init("Press militar", .shoulders), .init("Elevaciones laterales", .shoulders),
        .init("Curl bíceps", .biceps), .init("Extensión tríceps polea", .triceps),
        .init("Sentadilla", .quads), .init("Prensa", .quads), .init("Zancadas", .quads),
        .init("Peso muerto rumano", .hamstrings), .init("Curl femoral", .hamstrings),
        .init("Hip thrust", .glutes), .init("Gemelos de pie", .calves),
        .init("Plancha", .core), .init("Peso muerto", .fullBody), .init("Kettlebell swing", .fullBody),
    ]

    public static func named(_ name: String) -> ExerciseDefinition? {
        all.first { $0.name == name }
    }
}
