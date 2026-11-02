import SwiftUI

/// Paleta inspirada en Fitness de Apple: fondo negro, tarjetas grafito y anillos saturados.
enum Theme {
    static let background = Color.black
    static let card = Color(hex: 0x1C1C1E)
    static let cardRaised = Color(hex: 0x2C2C2E)
    static let secondaryText = Color(hex: 0x8E8E93)

    static let move = Color(hex: 0xFA114F)      // ingesta / kcal
    static let exercise = Color(hex: 0xA6FF00)  // proteína
    static let stand = Color(hex: 0x00F0FF)     // actividad
    static let fasting = Color(hex: 0xBF5AF2)
    static let water = Color(hex: 0x0A84FF)
    static let run = Color(hex: 0xFC4C02)       // naranja Strava
    static let strength = Color(hex: 0xFFD60A)
}

extension Color {
    init(hex: UInt32) {
        self.init(.sRGB,
                  red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255)
    }
}

extension Font {
    static func rounded(_ size: CGFloat, _ weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
}

extension View {
    /// Teclado numérico en iOS; sin efecto en otras plataformas.
    func numericKeyboard() -> some View {
        #if os(iOS)
        keyboardType(.decimalPad)
        #else
        self
        #endif
    }

    func inlineTitle() -> some View {
        #if os(iOS)
        navigationBarTitleDisplayMode(.inline)
        #else
        self
        #endif
    }
}
