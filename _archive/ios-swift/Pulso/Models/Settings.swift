import Foundation
import PulsoCore

/// Preferencias del usuario guardadas en UserDefaults.
@Observable final class UserSettings {
    private let defaults = UserDefaults.standard

    var profile: BodyProfile {
        didSet { save(profile, "profile") }
    }
    var fastingProtocol: FastingProtocol {
        didSet { defaults.set(fastingProtocol.rawValue, forKey: "fastingProtocol") }
    }
    /// Inicio del ciclo de ayuno actual; nil si el ayuno no está activo.
    var fastingStart: Date? {
        didSet { defaults.set(fastingStart, forKey: "fastingStart") }
    }
    var waterGoalMl: Double {
        didSet { defaults.set(waterGoalMl, forKey: "waterGoalMl") }
    }
    var moveGoalKcal: Double {
        didSet { defaults.set(moveGoalKcal, forKey: "moveGoalKcal") }
    }
    var autoUploadToStrava: Bool {
        didSet { defaults.set(autoUploadToStrava, forKey: "autoUploadToStrava") }
    }
    var onboarded: Bool {
        didSet { defaults.set(onboarded, forKey: "onboarded") }
    }

    init() {
        profile = (defaults.data(forKey: "profile")).flatMap { try? JSONDecoder().decode(BodyProfile.self, from: $0) } ?? .example
        fastingProtocol = defaults.string(forKey: "fastingProtocol").flatMap(FastingProtocol.init) ?? .p16_8
        fastingStart = defaults.object(forKey: "fastingStart") as? Date
        waterGoalMl = defaults.object(forKey: "waterGoalMl") as? Double ?? 2500
        moveGoalKcal = defaults.object(forKey: "moveGoalKcal") as? Double ?? 600
        autoUploadToStrava = defaults.object(forKey: "autoUploadToStrava") as? Bool ?? true
        onboarded = defaults.bool(forKey: "onboarded")
    }

    private func save<T: Encodable>(_ value: T, _ key: String) {
        defaults.set(try? JSONEncoder().encode(value), forKey: key)
    }
}
