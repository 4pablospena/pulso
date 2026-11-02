import Foundation

/// Secciones en el orden habitual de recorrido de un Mercadona.
public enum Aisle: String, Codable, CaseIterable, Identifiable, Sendable {
    case produce = "Fruta y verdura"
    case bakery = "Panadería"
    case meat = "Carne"
    case fish = "Pescado"
    case deli = "Charcutería y quesos"
    case dairy = "Lácteos y huevos"
    case pantry = "Despensa"
    case canned = "Conservas"
    case nuts = "Frutos secos"
    case drinks = "Bebidas"
    case frozen = "Congelados"
    case home = "Hogar e higiene"
    case other = "Otros"

    public var id: String { rawValue }

    public var symbol: String {
        switch self {
        case .produce: "carrot.fill"
        case .bakery: "birthday.cake.fill"
        case .meat: "fork.knife"
        case .fish: "fish.fill"
        case .deli: "takeoutbag.and.cup.and.straw.fill"
        case .dairy: "drop.fill"
        case .pantry: "basket.fill"
        case .canned: "cylinder.fill"
        case .nuts: "leaf.fill"
        case .drinks: "waterbottle.fill"
        case .frozen: "snowflake"
        case .home: "house.fill"
        case .other: "cart.fill"
        }
    }

    // Se evalúa en orden: las reglas más específicas primero
    // ("brócoli congelado" → congelados, "atún al natural" → conservas).
    private static let rules: [(Aisle, [String])] = [
        (.frozen, ["congelad", "helado"]),
        (.canned, ["lata", "conserva", "atún", "atun", "garbanzo cocido", "tomate triturado"]),
        (.nuts, ["almendra", "nuez", "nueces", "anacardo", "pistacho", "frutos secos", "crema de cacahuete", "cacahuete"]),
        (.dairy, ["batido 0%", "queso batido", "queso fresco", "yogur", "leche", "kéfir", "kefir", "huevo", "claras", "skyr", "requesón"]),
        (.deli, ["jamón", "jamon", "pavo filetead", "queso", "fiambre", "pollo desmechado"]),
        (.meat, ["pollo", "pechuga", "ternera", "cerdo", "lomo", "pavo", "carne picada", "hamburguesa"]),
        (.fish, ["salmón", "salmon", "merluza", "bacalao", "gamba", "dorada", "lubina", "pescado"]),
        (.produce, ["plátano", "platano", "manzana", "brócoli", "brocoli", "patata", "aguacate", "tomate", "lechuga",
                    "espinaca", "cebolla", "pimiento", "fresa", "arándano", "naranja", "limón", "calabacín", "zanahoria"]),
        (.bakery, ["pan ", "pan de", "barra", "tortitas"]),
        (.pantry, ["arroz", "avena", "pasta", "aceite", "aove", "harina", "legumbre", "lenteja", "quinoa", "miel", "café"]),
        (.drinks, ["agua", "bebida", "zumo", "refresco", "café soluble"]),
        (.home, ["detergente", "papel", "gel", "champú", "lavavajillas"]),
    ]

    public static func categorize(_ name: String) -> Aisle {
        let key = " " + name.lowercased() + " "
        for (aisle, words) in rules where words.contains(where: key.contains) {
            return aisle
        }
        return .other
    }
}

public enum MercadonaLink {
    /// Búsqueda en la tienda online de Mercadona (no hay API pública para añadir al carrito).
    public static func search(_ term: String) -> URL? {
        var components = URLComponents(string: "https://tienda.mercadona.es/search-results")
        components?.queryItems = [URLQueryItem(name: "query", value: term)]
        return components?.url
    }
}
