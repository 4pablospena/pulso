import Foundation

public enum Sex: String, Codable, CaseIterable, Sendable {
    case male, female
}

public enum Goal: String, Codable, CaseIterable, Sendable {
    case cut, maintain, bulk

    public var label: String {
        switch self {
        case .cut: "Definición"
        case .maintain: "Mantenimiento"
        case .bulk: "Ganancia muscular"
        }
    }

    /// Ajuste sobre el gasto total del día.
    var energyFactor: Double {
        switch self {
        case .cut: 0.80
        case .maintain: 1.0
        case .bulk: 1.10
        }
    }
}

public struct BodyProfile: Codable, Equatable, Sendable {
    public var sex: Sex
    public var age: Int
    public var heightCm: Double
    public var weightKg: Double
    public var goal: Goal

    public init(sex: Sex, age: Int, heightCm: Double, weightKg: Double, goal: Goal) {
        self.sex = sex
        self.age = age
        self.heightCm = heightCm
        self.weightKg = weightKg
        self.goal = goal
    }

    public static let example = BodyProfile(sex: .male, age: 32, heightCm: 178, weightKg: 78, goal: .maintain)

    /// Metabolismo basal (Mifflin-St Jeor).
    public var bmr: Double {
        let base = 10 * weightKg + 6.25 * heightCm - 5 * Double(age)
        return sex == .male ? base + 5 : base - 161
    }
}

public struct Macros: Equatable, Sendable {
    public var kcal: Double
    public var protein: Double
    public var carbs: Double
    public var fat: Double

    public init(kcal: Double, protein: Double, carbs: Double, fat: Double) {
        self.kcal = kcal
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
    }

    public static let zero = Macros(kcal: 0, protein: 0, carbs: 0, fat: 0)

    public static func + (a: Macros, b: Macros) -> Macros {
        Macros(kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat)
    }

    public static func - (a: Macros, b: Macros) -> Macros {
        Macros(kcal: a.kcal - b.kcal, protein: a.protein - b.protein, carbs: a.carbs - b.carbs, fat: a.fat - b.fat)
    }
}

/// Calcula el objetivo diario a partir del basal + la actividad real leída de Salud.
/// La actividad (fuerza, running, pasos) entra solo como energía activa de HealthKit,
/// así no se cuenta dos veces un entreno que también existe en Strava.
public enum EnergyBudget {
    /// Factor NEAT mínimo para el día sin contar entrenos (ya vienen en activeKcal).
    static let baselineActivity = 1.15

    public static func target(profile: BodyProfile, activeKcal: Double, dayType: NutritionFocus) -> Macros {
        let tdee = profile.bmr * baselineActivity + max(activeKcal, 0)
        let kcal = (tdee * profile.goal.energyFactor).rounded()

        let proteinPerKg: Double = switch dayType {
        case .highProtein: 2.2
        case .refeed: 1.8
        default: 2.0
        }
        let fatShare: Double = switch dayType {
        case .refeed: 0.20
        case .mediumCarbs: 0.25
        default: 0.30
        }

        let protein = (profile.weightKg * proteinPerKg).rounded()
        let fat = (kcal * fatShare / 9).rounded()
        let carbs = max(0, ((kcal - protein * 4 - fat * 9) / 4).rounded())
        return Macros(kcal: kcal, protein: protein, carbs: carbs, fat: fat)
    }

    /// Estimación de kcal para fuerza cuando el reloj no las mide (MET ≈ 5).
    public static func strengthKcal(weightKg: Double, duration: TimeInterval) -> Double {
        (5.0 * weightKg * duration / 3600).rounded()
    }
}
