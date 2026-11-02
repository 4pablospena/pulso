import SwiftUI
import SwiftData
import PulsoCore

struct TodayView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.modelContext) private var context
    @Query private var foods: [FoodEntry]
    @Query private var water: [WaterEntry]
    @State private var showSettings = false
    @State private var activeSession: StrengthSession?

    init() {
        let start = Calendar.current.startOfDay(for: .now)
        _foods = Query(filter: #Predicate<FoodEntry> { $0.date >= start })
        _water = Query(filter: #Predicate<WaterEntry> { $0.date >= start })
    }

    private var eaten: Macros { foods.map(\.macros).reduce(.zero, +) }
    private var waterMl: Double { water.reduce(0) { $0 + $1.ml } }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    ringsCard
                    planCard
                    FastingCard()
                    waterCard
                    if let last = model.health.workouts.first { lastWorkoutCard(last) }
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
            }
            .background(Theme.background)
            .navigationTitle(Date.now.formatted(.dateTime.weekday(.wide).day().month(.wide)).capitalized)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showSettings = true } label: {
                        Image(systemName: "person.crop.circle.fill").font(.title2)
                    }
                }
            }
            .refreshable { await model.health.refresh() }
            .sheet(isPresented: $showSettings) { SettingsView() }
            .fullScreenCoverCompat(item: $activeSession) { StrengthSessionView(session: $0) }
        }
    }

    private var ringsCard: some View {
        let target = model.target
        let moveGoal = model.health.today.moveGoal ?? model.settings.moveGoalKcal
        return Card {
            HStack(spacing: 20) {
                TripleRings(outer: eaten.kcal / max(target.kcal, 1),
                            middle: eaten.protein / max(target.protein, 1),
                            inner: model.health.today.activeKcal / max(moveGoal, 1))
                VStack(alignment: .leading, spacing: 10) {
                    Metric(label: "Ingesta", value: "\(Int(eaten.kcal))/\(Int(target.kcal))", unit: "kcal", color: Theme.move)
                    Metric(label: "Proteína", value: "\(Int(eaten.protein))/\(Int(target.protein))", unit: "g", color: Theme.exercise)
                    Metric(label: "Activa", value: "\(Int(model.health.today.activeKcal))/\(Int(moveGoal))", unit: "kcal", color: Theme.stand)
                }
            }
            Divider().overlay(Theme.cardRaised)
            HStack {
                Text("Te quedan").foregroundStyle(Theme.secondaryText)
                Text("\(Int(max(target.kcal - eaten.kcal, 0))) kcal").bold()
                Spacer()
                Text("\(Int(model.health.today.steps)) pasos").foregroundStyle(Theme.secondaryText)
            }
            .font(.rounded(15, .medium))
        }
    }

    private var planCard: some View {
        let day = model.plan
        let color = day.training == .run ? Theme.run : day.training == .strength ? Theme.strength : Theme.stand
        return Card(title: "Plan de hoy", symbol: "calendar", tint: color) {
            Text(day.title).font(.rounded(24))
            Text(day.nutrition.rawValue + (day.fasting ? " · Ayuno \(model.settings.fastingProtocol.rawValue)" : ""))
                .font(.rounded(15, .medium)).foregroundStyle(Theme.secondaryText)
            switch day.training {
            case .strength:
                PrimaryButton(title: "Empezar entreno", symbol: "play.fill", color: Theme.strength) {
                    activeSession = model.startSession(for: day, in: context)
                }
            case .run:
                if let url = URL(string: "strava://") {
                    Link(destination: url) {
                        Label("Abrir Strava para grabar", systemImage: "figure.run")
                            .font(.rounded(17, .semibold)).frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(Theme.run, in: Capsule()).foregroundStyle(.black)
                    }
                }
                Text("O usa la app Entreno del Apple Watch: se sincroniza sola con Salud y Strava.")
                    .font(.footnote).foregroundStyle(Theme.secondaryText)
            case .mobility, .rest:
                EmptyView()
            }
        }
    }

    private var waterCard: some View {
        Card(title: "Hidratación", symbol: "drop.fill", tint: Theme.water) {
            HStack {
                Metric(label: "Hoy", value: String(format: "%.1f", waterMl / 1000), unit: "/ \(Int(model.settings.waterGoalMl / 1000)) L", color: Theme.water)
                Spacer()
                ForEach([250.0, 500.0], id: \.self) { ml in
                    Button("+\(Int(ml))") { model.logWater(ml: ml, in: context) }
                        .buttonStyle(.borderedProminent).tint(Theme.water.opacity(0.3))
                        .foregroundStyle(Theme.water)
                }
            }
            MacroBar(label: "", value: waterMl, target: model.settings.waterGoalMl, color: Theme.water)
                .labelsHidden()
        }
    }

    private func lastWorkoutCard(_ w: HealthKitService.Workout) -> some View {
        Card(title: "Último entreno", symbol: w.kind == .run ? "figure.run" : "dumbbell.fill",
             tint: w.kind == .run ? Theme.run : Theme.strength) {
            HStack(spacing: 24) {
                Metric(label: "Tiempo", value: RunFormat.duration(w.duration))
                Metric(label: "Activas", value: "\(Int(w.kcal))", unit: "kcal", color: Theme.move)
                if w.distanceMeters > 0 { Metric(label: "Distancia", value: RunFormat.distance(w.distanceMeters)) }
            }
            Text("\(w.source) · \(w.start.formatted(.relative(presentation: .named)))")
                .font(.footnote).foregroundStyle(Theme.secondaryText)
        }
    }
}

struct FastingCard: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        TimelineView(.periodic(from: .now, by: 30)) { _ in
            Card(title: "Ayuno \(model.settings.fastingProtocol.rawValue)", symbol: "timer", tint: Theme.fasting) {
                if let status = model.fasting {
                    HStack(spacing: 20) {
                        Ring(progress: status.progress, color: status.phase == .fasting ? Theme.fasting : Theme.exercise, lineWidth: 12)
                            .frame(width: 70, height: 70)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(status.phase == .fasting ? "Ayunando" : "Ventana de ingesta")
                                .font(.rounded(17, .semibold))
                            Text(RunFormat.duration(status.remaining) + " restantes")
                                .font(.rounded(28)).monospacedDigit()
                            Text("Hasta las \(status.phaseEnd.formatted(date: .omitted, time: .shortened))")
                                .font(.footnote).foregroundStyle(Theme.secondaryText)
                        }
                        Spacer()
                    }
                    Button("Terminar ayuno", role: .destructive) { model.stopFasting() }
                        .font(.rounded(15, .semibold))
                } else {
                    PrimaryButton(title: "Empezar ayuno", symbol: "moon.fill", color: Theme.fasting) {
                        model.startFasting()
                    }
                }
            }
        }
    }
}

extension View {
    /// Pantalla completa en iOS, hoja en macOS (solo para poder compilar en ambos).
    func fullScreenCoverCompat<Item: Identifiable, Content: View>(
        item: Binding<Item?>, @ViewBuilder content: @escaping (Item) -> Content
    ) -> some View {
        #if os(iOS)
        fullScreenCover(item: item, content: content)
        #else
        sheet(item: item, content: content)
        #endif
    }
}
