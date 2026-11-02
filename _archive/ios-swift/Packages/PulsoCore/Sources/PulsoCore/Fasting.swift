import Foundation

public enum FastingProtocol: String, Codable, CaseIterable, Identifiable, Sendable {
    case p16_8 = "16:8"
    case p18_6 = "18:6"
    case p20_4 = "20:4"
    case omad = "OMAD"

    public var id: String { rawValue }

    public var fastingHours: Double {
        switch self {
        case .p16_8: 16
        case .p18_6: 18
        case .p20_4: 20
        case .omad: 23
        }
    }

    public var eatingHours: Double { 24 - fastingHours }
}

public struct FastingStatus: Equatable, Sendable {
    public enum Phase: Equatable, Sendable { case fasting, eating }

    public var phase: Phase
    /// 0…1 dentro de la fase actual.
    public var progress: Double
    public var remaining: TimeInterval
    public var phaseEnd: Date
}

public enum FastingClock {
    /// Estado de un ayuno que empezó en `start`. Al terminar el ayuno se abre la
    /// ventana de ingesta; al cerrarla, el ciclo vuelve a empezar.
    public static func status(start: Date, protocol p: FastingProtocol, now: Date = .now) -> FastingStatus {
        let fast = p.fastingHours * 3600
        let eat = p.eatingHours * 3600
        let cycle = fast + eat
        let elapsed = max(0, now.timeIntervalSince(start)).truncatingRemainder(dividingBy: cycle)
        let cycleStart = now.addingTimeInterval(-elapsed)

        if elapsed < fast {
            return FastingStatus(phase: .fasting, progress: elapsed / fast,
                                 remaining: fast - elapsed, phaseEnd: cycleStart.addingTimeInterval(fast))
        }
        let inEating = elapsed - fast
        return FastingStatus(phase: .eating, progress: inEating / eat,
                             remaining: eat - inEating, phaseEnd: cycleStart.addingTimeInterval(cycle))
    }
}
