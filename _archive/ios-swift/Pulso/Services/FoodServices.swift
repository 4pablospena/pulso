import Foundation
import PulsoCore

struct FoodCandidate: Identifiable, Equatable, Codable {
    var id = UUID()
    var name: String
    var grams: Double
    /// Valores para la ración indicada en `grams`.
    var macros: MacrosDTO

    struct MacrosDTO: Equatable, Codable {
        var kcal: Double
        var protein: Double
        var carbs: Double
        var fat: Double
        var value: Macros { Macros(kcal: kcal, protein: protein, carbs: carbs, fat: fat) }
    }

    func scaled(to newGrams: Double) -> FoodCandidate {
        guard grams > 0 else { return self }
        let f = newGrams / grams
        return FoodCandidate(id: id, name: name, grams: newGrams,
                             macros: .init(kcal: (macros.kcal * f).rounded(), protein: (macros.protein * f).rounded(),
                                           carbs: (macros.carbs * f).rounded(), fat: (macros.fat * f).rounded()))
    }
}

/// Búsqueda por código de barras en Open Food Facts (base abierta, incluye productos Hacendado).
enum OpenFoodFacts {
    private struct Response: Decodable {
        let status: Int
        let product: Product?
    }

    private struct Product: Decodable {
        let product_name: String?
        let brands: String?
        let serving_quantity: Double?
        let nutriments: [String: Double]?

        enum CodingKeys: String, CodingKey { case product_name, brands, serving_quantity, nutriments }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            product_name = try? c.decode(String.self, forKey: .product_name)
            brands = try? c.decode(String.self, forKey: .brands)
            serving_quantity = (try? c.decode(Double.self, forKey: .serving_quantity))
                ?? (try? c.decode(String.self, forKey: .serving_quantity)).flatMap(Double.init)
            // Los nutrientes mezclan números y textos: nos quedamos solo con los números.
            let raw = try? c.decode([String: LossyDouble].self, forKey: .nutriments)
            nutriments = raw?.compactMapValues(\.value)
        }
    }

    private struct LossyDouble: Decodable {
        let value: Double?
        init(from decoder: Decoder) throws {
            let c = try decoder.singleValueContainer()
            value = (try? c.decode(Double.self)) ?? (try? c.decode(String.self)).flatMap(Double.init)
        }
    }

    static func product(barcode: String) async throws -> FoodCandidate? {
        let url = URL(string: "https://world.openfoodfacts.org/api/v2/product/\(barcode).json?fields=product_name,brands,serving_quantity,nutriments")!
        var req = URLRequest(url: url)
        req.setValue("Pulso/1.0 (iOS)", forHTTPHeaderField: "User-Agent")
        let (data, _) = try await URLSession.shared.data(for: req)
        let response = try JSONDecoder().decode(Response.self, from: data)
        guard response.status == 1, let p = response.product, let n = p.nutriments else { return nil }

        let per100 = FoodCandidate(
            name: [p.product_name, p.brands].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "),
            grams: 100,
            macros: .init(kcal: n["energy-kcal_100g"] ?? (n["energy_100g"] ?? 0) / 4.184,
                          protein: n["proteins_100g"] ?? 0,
                          carbs: n["carbohydrates_100g"] ?? 0,
                          fat: n["fat_100g"] ?? 0))
        return per100.scaled(to: p.serving_quantity ?? 100)
    }
}

/// Reconocimiento de platos por foto con Claude (visión + salida JSON con esquema).
enum MealVision {
    static let apiKeyKey = "anthropic.apiKey"
    static var apiKey: String? { Keychain.string(for: apiKeyKey) }

    enum VisionError: LocalizedError {
        case missingKey, refused, http(Int, String), empty
        var errorDescription: String? {
            switch self {
            case .missingKey: "Añade tu clave de la API de Anthropic en Ajustes para usar la cámara inteligente."
            case .refused: "No se pudo analizar esta imagen."
            case let .http(code, body): "Error \(code): \(body)"
            case .empty: "No se detectaron alimentos."
            }
        }
    }

    private static let schema: [String: Any] = [
        "type": "object",
        "properties": [
            "items": [
                "type": "array",
                "items": [
                    "type": "object",
                    "properties": [
                        "name": ["type": "string"],
                        "grams": ["type": "number"],
                        "kcal": ["type": "number"],
                        "protein": ["type": "number"],
                        "carbs": ["type": "number"],
                        "fat": ["type": "number"],
                    ],
                    "required": ["name", "grams", "kcal", "protein", "carbs", "fat"],
                    "additionalProperties": false,
                ],
            ],
        ],
        "required": ["items"],
        "additionalProperties": false,
    ]

    static func analyze(jpeg: Data) async throws -> [FoodCandidate] {
        guard let key = apiKey, !key.isEmpty else { throw VisionError.missingKey }

        let body: [String: Any] = [
            "model": "claude-opus-5-5",
            "max_tokens": 8000,
            "fallbacks": "default",
            "output_config": [
                "effort": "low",
                "format": ["type": "json_schema", "schema": schema],
            ],
            "messages": [[
                "role": "user",
                "content": [
                    ["type": "image", "source": ["type": "base64", "media_type": "image/jpeg",
                                                 "data": jpeg.base64EncodedString()]],
                    ["type": "text", "text": """
                        Identifica cada alimento del plato de la foto y estima la ración en gramos \
                        y sus kcal, proteína, carbohidratos y grasa para esa ración. Usa nombres en \
                        español. Si hay un envase de marca (p. ej. Hacendado), usa sus valores típicos.
                        """],
                ],
            ]],
        ]

        var req = URLRequest(url: URL(string: "https://api.anthropic.com/v1/messages")!)
        req.httpMethod = "POST"
        req.timeoutInterval = 120
        req.setValue(key, forHTTPHeaderField: "x-api-key")
        req.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        req.setValue("server-side-fallback-2026-07-01", forHTTPHeaderField: "anthropic-beta")
        req.setValue("application/json", forHTTPHeaderField: "content-type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: req)
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard code == 200 else { throw VisionError.http(code, String(data: data, encoding: .utf8) ?? "") }

        struct Message: Decodable {
            struct Block: Decodable { let type: String; let text: String? }
            let stop_reason: String?
            let content: [Block]
        }
        let message = try JSONDecoder().decode(Message.self, from: data)
        if message.stop_reason == "refusal" { throw VisionError.refused }
        guard let text = message.content.last(where: { $0.type == "text" })?.text else { throw VisionError.empty }

        struct Result: Decodable {
            struct Item: Decodable { let name: String; let grams, kcal, protein, carbs, fat: Double }
            let items: [Item]
        }
        let items = try JSONDecoder().decode(Result.self, from: Data(text.utf8)).items
        guard !items.isEmpty else { throw VisionError.empty }
        return items.map {
            FoodCandidate(name: $0.name, grams: $0.grams,
                          macros: .init(kcal: $0.kcal, protein: $0.protein, carbs: $0.carbs, fat: $0.fat))
        }
    }
}
