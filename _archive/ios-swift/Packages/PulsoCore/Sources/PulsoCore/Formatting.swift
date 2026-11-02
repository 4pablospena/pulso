import Foundation

public enum RunFormat {
    /// Ritmo en min/km, p. ej. "5:12 /km".
    public static func pace(meters: Double, seconds: TimeInterval) -> String {
        guard meters > 0, seconds > 0 else { return "–" }
        let secPerKm = (seconds / (meters / 1000)).rounded()
        return String(format: "%d:%02d /km", Int(secPerKm) / 60, Int(secPerKm) % 60)
    }

    public static func distance(_ meters: Double) -> String {
        String(format: "%.2f km", meters / 1000)
    }

    public static func duration(_ seconds: TimeInterval) -> String {
        let s = Int(seconds.rounded())
        return s >= 3600
            ? String(format: "%d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60)
            : String(format: "%d:%02d", s / 60, s % 60)
    }
}

public enum HeartRateZones {
    /// Zona 1…5 sobre la FC máxima (220 − edad si no hay dato mejor).
    public static func zone(bpm: Double, maxHR: Double) -> Int {
        let pct = bpm / maxHR
        switch pct {
        case ..<0.6: return 1
        case ..<0.7: return 2
        case ..<0.8: return 3
        case ..<0.9: return 4
        default: return 5
        }
    }
}
