import Foundation

/// Cliente de la API v3 de Strava con OAuth móvil.
/// Requiere una app en https://www.strava.com/settings/api con
/// "Authorization Callback Domain" = localhost.
@MainActor @Observable final class StravaService {
    struct Athlete: Codable, Equatable {
        let id: Int
        let firstname: String?
        let lastname: String?
        let profile: String?
    }

    struct Activity: Codable, Identifiable, Equatable {
        let id: Int
        let name: String
        let distance: Double
        let moving_time: Int
        let elapsed_time: Int
        let total_elevation_gain: Double
        let sport_type: String
        let start_date: Date
        let average_heartrate: Double?
        let max_heartrate: Double?
        let suffer_score: Double?

        var isRun: Bool { ["Run", "TrailRun", "VirtualRun"].contains(sport_type) }
    }

    private struct Token: Codable {
        let access_token: String
        let refresh_token: String
        let expires_at: TimeInterval
        let athlete: Athlete?
    }

    enum StravaError: LocalizedError {
        case notConfigured, notConnected, http(Int, String)
        var errorDescription: String? {
            switch self {
            case .notConfigured: "Falta STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET en Config/Secrets.xcconfig."
            case .notConnected: "Conecta tu cuenta de Strava en Ajustes."
            case let .http(code, body): "Strava respondió \(code): \(body)"
            }
        }
    }

    static let redirectURI = "pulso://localhost"
    static let callbackScheme = "pulso"
    private static let tokenKey = "strava.token"
    private let api = URL(string: "https://www.strava.com/api/v3")!

    private var token: Token? {
        didSet { Keychain.set(token.flatMap { try? JSONEncoder().encode($0) }, for: Self.tokenKey) }
    }
    private(set) var athlete: Athlete?
    private(set) var activities: [Activity] = []
    var isConnected: Bool { token != nil }
    var isConfigured: Bool { !AppConfig.stravaClientID.isEmpty && !AppConfig.stravaClientSecret.isEmpty }

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    init() {
        token = Keychain.data(for: Self.tokenKey).flatMap { try? JSONDecoder().decode(Token.self, from: $0) }
        athlete = token?.athlete
    }

    // MARK: OAuth

    var authorizeURL: URL {
        var c = URLComponents(string: "https://www.strava.com/oauth/mobile/authorize")!
        c.queryItems = [
            .init(name: "client_id", value: AppConfig.stravaClientID),
            .init(name: "redirect_uri", value: Self.redirectURI),
            .init(name: "response_type", value: "code"),
            .init(name: "approval_prompt", value: "auto"),
            .init(name: "scope", value: "read,activity:read_all,activity:write"),
        ]
        return c.url!
    }

    /// Completa el login con la URL de retorno `pulso://localhost?code=…`.
    func handleCallback(_ url: URL) async throws {
        guard let code = URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?.first(where: { $0.name == "code" })?.value else { return }
        try await exchange(["grant_type": "authorization_code", "code": code])
        athlete = token?.athlete
        try await loadActivities()
    }

    func disconnect() async {
        if let access = token?.access_token {
            var req = URLRequest(url: URL(string: "https://www.strava.com/oauth/deauthorize")!)
            req.httpMethod = "POST"
            req.setValue("Bearer \(access)", forHTTPHeaderField: "Authorization")
            _ = try? await URLSession.shared.data(for: req)
        }
        token = nil
        athlete = nil
        activities = []
    }

    // El client_secret viaja desde el dispositivo: válido para uso personal.
    // Para publicar la app, mueve este intercambio a un backend propio.
    private func exchange(_ params: [String: String]) async throws {
        guard isConfigured else { throw StravaError.notConfigured }
        var req = URLRequest(url: URL(string: "https://www.strava.com/oauth/token")!)
        req.httpMethod = "POST"
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        req.httpBody = form(params.merging([
            "client_id": AppConfig.stravaClientID,
            "client_secret": AppConfig.stravaClientSecret,
        ]) { a, _ in a })
        let (data, response) = try await URLSession.shared.data(for: req)
        try check(response, data)
        let fresh = try JSONDecoder().decode(Token.self, from: data)
        token = Token(access_token: fresh.access_token, refresh_token: fresh.refresh_token,
                      expires_at: fresh.expires_at, athlete: fresh.athlete ?? token?.athlete)
    }

    private func validAccessToken() async throws -> String {
        guard let current = token else { throw StravaError.notConnected }
        if current.expires_at - 60 > Date.now.timeIntervalSince1970 { return current.access_token }
        try await exchange(["grant_type": "refresh_token", "refresh_token": current.refresh_token])
        return token!.access_token
    }

    // MARK: API

    func loadActivities(perPage: Int = 30) async throws {
        var c = URLComponents(url: api.appending(path: "athlete/activities"), resolvingAgainstBaseURL: false)!
        c.queryItems = [.init(name: "per_page", value: String(perPage))]
        var req = URLRequest(url: c.url!)
        req.setValue("Bearer \(try await validAccessToken())", forHTTPHeaderField: "Authorization")
        let (data, response) = try await URLSession.shared.data(for: req)
        try check(response, data)
        activities = try decoder.decode([Activity].self, from: data)
    }

    /// Publica una sesión de fuerza como actividad manual "WeightTraining".
    func uploadStrength(title: String, start: Date, duration: TimeInterval, description: String) async throws -> Int {
        var req = URLRequest(url: api.appending(path: "activities"))
        req.httpMethod = "POST"
        req.setValue("Bearer \(try await validAccessToken())", forHTTPHeaderField: "Authorization")
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        let local = ISO8601DateFormatter()
        local.timeZone = .current
        local.formatOptions = [.withFullDate, .withTime, .withColonSeparatorInTime, .withDashSeparatorInDate]
        req.httpBody = form([
            "name": title,
            "sport_type": "WeightTraining",
            "start_date_local": local.string(from: start),
            "elapsed_time": String(Int(duration)),
            "description": description,
        ])
        let (data, response) = try await URLSession.shared.data(for: req)
        try check(response, data)
        struct Created: Decodable { let id: Int }
        let id = try decoder.decode(Created.self, from: data).id
        try? await loadActivities()
        return id
    }

    private func check(_ response: URLResponse, _ data: Data) throws {
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(code) else {
            throw StravaError.http(code, String(data: data, encoding: .utf8) ?? "")
        }
    }

    private func form(_ params: [String: String]) -> Data {
        var c = URLComponents()
        c.queryItems = params.map { URLQueryItem(name: $0.key, value: $0.value) }
        // URLComponents no escapa "+", que en form-urlencoded significa espacio.
        return Data((c.percentEncodedQuery ?? "").replacingOccurrences(of: "+", with: "%2B").utf8)
    }
}
