import Foundation

public enum TrainingKind: String, Codable, Sendable {
    case strength, run, mobility, rest
}

public enum NutritionFocus: String, Codable, Sendable {
    case highProtein = "Alta proteína"
    case mediumCarbs = "Carbohidratos medios"
    case normal = "Normocalórica"
    case refeed = "Recarga de carbohidratos"
    case flexible = "Flexible"
}

public struct PlanDay: Identifiable, Sendable {
    public var id: Int { weekday }
    /// 1 = domingo … 7 = sábado (como `Calendar.component(.weekday)`).
    public let weekday: Int
    public let title: String
    public let training: TrainingKind
    public let routine: [String]
    public let fasting: Bool
    public let nutrition: NutritionFocus
    public let groceries: [String]
}

/// Plantilla híbrida fuerza + running del documento de ecosistema.
public enum WeeklyPlan {
    public static let days: [PlanDay] = [
        PlanDay(weekday: 2, title: "Fuerza · Torso", training: .strength,
                routine: ["Press banca", "Remo con barra", "Press militar", "Dominadas", "Curl bíceps", "Extensión tríceps polea"],
                fasting: true, nutrition: .highProtein,
                groceries: ["Pechuga de pollo", "Queso fresco batido 0%", "Huevos L"]),
        PlanDay(weekday: 3, title: "Rodaje suave", training: .run, routine: [],
                fasting: true, nutrition: .mediumCarbs,
                groceries: ["Arroz basmati", "Plátano", "Copos de avena integrales"]),
        PlanDay(weekday: 4, title: "Fuerza · Pierna", training: .strength,
                routine: ["Sentadilla", "Peso muerto rumano", "Prensa", "Curl femoral", "Hip thrust", "Gemelos de pie"],
                fasting: false, nutrition: .normal,
                groceries: ["Salmón fresco", "Patatas", "Brócoli congelado"]),
        PlanDay(weekday: 5, title: "Descanso activo · Movilidad", training: .mobility, routine: [],
                fasting: true, nutrition: .normal,
                groceries: ["Almendras al natural", "Nueces al natural", "Yogur griego light"]),
        PlanDay(weekday: 6, title: "Fuerza · Full body", training: .strength,
                routine: ["Peso muerto", "Press inclinado mancuernas", "Jalón al pecho", "Zancadas", "Elevaciones laterales", "Plancha"],
                fasting: false, nutrition: .highProtein,
                groceries: ["Pollo desmechado", "Claras de huevo líquidas"]),
        PlanDay(weekday: 7, title: "Series · Calidad", training: .run, routine: [],
                fasting: false, nutrition: .refeed,
                groceries: ["Pasta integral", "Crema de cacahuete 100%"]),
        PlanDay(weekday: 1, title: "Descanso · Batch cooking", training: .rest, routine: [],
                fasting: true, nutrition: .flexible,
                groceries: ["Atún al natural en lata", "Tortitas de arroz integral", "Aguacate", "Aceite de oliva virgen extra"]),
    ]

    public static func day(for date: Date, calendar: Calendar = .current) -> PlanDay {
        let weekday = calendar.component(.weekday, from: date)
        return days.first { $0.weekday == weekday }!
    }

    /// Lista de la compra de toda la semana, sin duplicados, agrupada por pasillo.
    public static var weeklyGroceries: [(Aisle, [String])] {
        var seen = Set<String>()
        let items = days.flatMap(\.groceries).filter { seen.insert($0).inserted }
        let grouped = Dictionary(grouping: items, by: Aisle.categorize)
        return Aisle.allCases.compactMap { aisle in grouped[aisle].map { (aisle, $0) } }
    }
}
