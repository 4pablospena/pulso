import SwiftUI

struct Ring: View {
    var progress: Double
    var color: Color
    var lineWidth: CGFloat = 18

    var body: some View {
        ZStack {
            Circle().stroke(color.opacity(0.2), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: min(progress, 1))
                .stroke(color.gradient, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
            // Segunda vuelta cuando se supera el objetivo, como en Fitness.
            if progress > 1 {
                Circle()
                    .trim(from: 0, to: min(progress - 1, 1))
                    .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .shadow(color: .black.opacity(0.5), radius: 3)
            }
        }
        .animation(.spring(duration: 0.8), value: progress)
    }
}

struct TripleRings: View {
    var outer: Double
    var middle: Double
    var inner: Double
    var size: CGFloat = 150

    var body: some View {
        let w = size * 0.12
        ZStack {
            Ring(progress: outer, color: Theme.move, lineWidth: w)
            Ring(progress: middle, color: Theme.exercise, lineWidth: w)
                .padding(w + 3)
            Ring(progress: inner, color: Theme.stand, lineWidth: w)
                .padding((w + 3) * 2)
        }
        .frame(width: size, height: size)
    }
}

struct Card<Content: View>: View {
    var title: String?
    var symbol: String?
    var tint: Color = .white
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let title {
                Label(title, systemImage: symbol ?? "circle.fill")
                    .font(.rounded(15, .semibold))
                    .foregroundStyle(tint)
            }
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

struct Metric: View {
    var label: String
    var value: String
    var unit: String = ""
    var color: Color = .white

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.rounded(13, .semibold)).foregroundStyle(Theme.secondaryText)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value).font(.rounded(26)).foregroundStyle(color).contentTransition(.numericText())
                if !unit.isEmpty {
                    Text(unit.uppercased()).font(.rounded(13, .bold)).foregroundStyle(color)
                }
            }
        }
    }
}

struct MacroBar: View {
    var label: String
    var value: Double
    var target: Double
    var color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label).font(.rounded(13, .semibold))
                Spacer()
                Text("\(Int(value)) / \(Int(target)) g").font(.rounded(13, .medium)).foregroundStyle(Theme.secondaryText)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(color.opacity(0.2))
                    Capsule().fill(color.gradient)
                        .frame(width: geo.size.width * min(value / max(target, 1), 1))
                }
            }
            .frame(height: 8)
        }
    }
}

struct PrimaryButton: View {
    var title: String
    var symbol: String
    var color: Color
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: symbol)
                .font(.rounded(17, .semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(color, in: Capsule())
                .foregroundStyle(.black)
        }
        .buttonStyle(.plain)
    }
}
