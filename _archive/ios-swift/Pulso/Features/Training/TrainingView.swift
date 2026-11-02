import SwiftUI
import SwiftData
import Charts
import PulsoCore

struct TrainingView: View {
    enum Segment: String, CaseIterable { case strength = "Fuerza", run = "Running" }

    @Environment(AppModel.self) private var model
    @Environment(\.modelContext) private var context
    @State private var segment: Segment = .strength
    @State private var activeSession: StrengthSession?
    @Query(filter: #Predicate<StrengthSession> { $0.end != nil }, sort: \.start, order: .reverse)
    private var sessions: [StrengthSession]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    Picker("", selection: $segment) {
                        ForEach(Segment.allCases, id: \.self) { Text($0.rawValue) }
                    }
                    .pickerStyle(.segmented)

                    switch segment {
                    case .strength: strength
                    case .run: RunsSection()
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
            }
            .background(Theme.background)
            .navigationTitle("Entreno")
            .fullScreenCoverCompat(item: $activeSession) { StrengthSessionView(session: $0) }
        }
    }

    @ViewBuilder private var strength: some View {
        PrimaryButton(title: "Entreno libre", symbol: "plus", color: Theme.strength) {
            activeSession = model.startSession(for: nil, in: context)
        }

        Card(title: "Semana", symbol: "calendar", tint: Theme.strength) {
            ForEach(WeeklyPlan.days.filter { $0.training == .strength }) { day in
                Button {
                    activeSession = model.startSession(for: day, in: context)
                } label: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(day.title).font(.rounded(16, .semibold))
                            Text(day.routine.prefix(3).joined(separator: " · ") + "…")
                                .font(.footnote).foregroundStyle(Theme.secondaryText)
                        }
                        Spacer()
                        Image(systemName: "play.circle.fill").font(.title2).foregroundStyle(Theme.strength)
                    }
                }
                .buttonStyle(.plain)
            }
        }

        if !sessions.isEmpty {
            VolumeByMuscleCard(sessions: sessions)
            OneRepMaxCard(sessions: sessions)
            Card(title: "Historial", symbol: "clock.arrow.circlepath") {
                ForEach(sessions.prefix(10)) { s in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(s.title).font(.rounded(16, .semibold))
                            Text(s.start.formatted(date: .abbreviated, time: .shortened) + " · " + RunFormat.duration(s.duration))
                                .font(.footnote).foregroundStyle(Theme.secondaryText)
                        }
                        Spacer()
                        VStack(alignment: .trailing) {
                            Text("\(Int(s.volume)) kg").font(.rounded(16))
                            HStack(spacing: 4) {
                                if s.savedToHealth { Image(systemName: "heart.fill").foregroundStyle(Theme.move) }
                                if s.stravaActivityID != nil { Image(systemName: "arrow.up.forward.circle.fill").foregroundStyle(Theme.run) }
                            }
                            .font(.caption)
                        }
                    }
                }
            }
        }
    }
}

private struct VolumeByMuscleCard: View {
    let sessions: [StrengthSession]

    var body: some View {
        let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: .now)!
        let exercises = sessions.filter { $0.start >= weekAgo }.flatMap(\.exercises)
        let volume = Dictionary(grouping: exercises, by: \.muscle)
            .mapValues { StrengthMath.volume($0.flatMap(\.completedSets)) }
            .filter { $0.value > 0 }
            .sorted { $0.value > $1.value }

        return Card(title: "Volumen 7 días por grupo", symbol: "chart.bar.fill", tint: Theme.strength) {
            if volume.isEmpty {
                Text("Sin series esta semana").foregroundStyle(Theme.secondaryText)
            } else {
                Chart(volume, id: \.key) { item in
                    BarMark(x: .value("kg", item.value), y: .value("Grupo", item.key.rawValue))
                        .foregroundStyle(Theme.strength.gradient)
                        .cornerRadius(4)
                }
                .chartXAxis(.hidden)
                .frame(height: CGFloat(volume.count) * 28)
            }
        }
    }
}

private struct OneRepMaxCard: View {
    let sessions: [StrengthSession]
    @State private var exercise = "Press banca"

    var body: some View {
        let names = Array(Set(sessions.flatMap(\.exercises).map(\.name))).sorted()
        let points = sessions.compactMap { s -> (Date, Double)? in
            let sets = s.exercises.filter { $0.name == exercise }.flatMap(\.completedSets)
            let best = StrengthMath.bestOneRepMax(sets)
            return best > 0 ? (s.start, best) : nil
        }.sorted { $0.0 < $1.0 }

        return Card(title: "1RM estimado", symbol: "chart.line.uptrend.xyaxis", tint: Theme.exercise) {
            Picker("Ejercicio", selection: $exercise) {
                ForEach(names, id: \.self) { Text($0) }
            }
            .onAppear { if !names.contains(exercise), let first = names.first { exercise = first } }

            if let last = points.last {
                Metric(label: "Actual", value: "\(Int(last.1))", unit: "kg", color: Theme.exercise)
            }
            Chart(points, id: \.0) { p in
                LineMark(x: .value("Fecha", p.0), y: .value("1RM", p.1))
                    .foregroundStyle(Theme.exercise)
                    .interpolationMethod(.catmullRom)
                PointMark(x: .value("Fecha", p.0), y: .value("1RM", p.1))
                    .foregroundStyle(Theme.exercise)
            }
            .frame(height: 140)
        }
    }
}

private struct RunsSection: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let strava = model.strava
        if strava.isConnected {
            let runs = strava.activities.filter(\.isRun)
            weekSummary(distance: runs.filter(isThisWeek).reduce(0) { $0 + $1.distance },
                        time: runs.filter(isThisWeek).reduce(0) { $0 + Double($1.moving_time) })
            ForEach(runs) { run in StravaRunCard(run: run, age: model.settings.profile.age) }
            if runs.isEmpty { Text("Sin carreras recientes en Strava").foregroundStyle(Theme.secondaryText) }
        } else {
            let runs = model.health.workouts.filter { $0.kind == .run }
            Card(title: "Conecta Strava", symbol: "link", tint: Theme.run) {
                Text("Mientras tanto mostramos las carreras de Salud (Apple Watch, Garmin, Coros…).")
                    .font(.footnote).foregroundStyle(Theme.secondaryText)
            }
            ForEach(runs) { w in
                Card(title: w.start.formatted(date: .abbreviated, time: .shortened), symbol: "figure.run", tint: Theme.run) {
                    HStack(spacing: 20) {
                        Metric(label: "Distancia", value: RunFormat.distance(w.distanceMeters))
                        Metric(label: "Ritmo", value: RunFormat.pace(meters: w.distanceMeters, seconds: w.duration), color: Theme.run)
                        if let hr = w.avgHeartRate { Metric(label: "FC", value: "\(Int(hr))", unit: "ppm", color: Theme.move) }
                    }
                }
            }
        }
    }

    private func isThisWeek(_ a: StravaService.Activity) -> Bool {
        Calendar.current.isDate(a.start_date, equalTo: .now, toGranularity: .weekOfYear)
    }

    private func weekSummary(distance: Double, time: Double) -> some View {
        Card(title: "Esta semana", symbol: "flame.fill", tint: Theme.run) {
            HStack(spacing: 24) {
                Metric(label: "Distancia", value: RunFormat.distance(distance), color: Theme.run)
                Metric(label: "Tiempo", value: RunFormat.duration(time))
            }
        }
    }
}

private struct StravaRunCard: View {
    let run: StravaService.Activity
    let age: Int

    var body: some View {
        Card(title: run.name, symbol: "figure.run", tint: Theme.run) {
            HStack(spacing: 18) {
                Metric(label: "Distancia", value: RunFormat.distance(run.distance))
                Metric(label: "Ritmo", value: RunFormat.pace(meters: run.distance, seconds: Double(run.moving_time)), color: Theme.run)
                Metric(label: "Desnivel", value: "\(Int(run.total_elevation_gain))", unit: "m")
            }
            if let hr = run.average_heartrate {
                let zone = HeartRateZones.zone(bpm: hr, maxHR: Double(220 - age))
                HStack {
                    Label("\(Int(hr)) ppm medio", systemImage: "heart.fill").foregroundStyle(Theme.move)
                    Spacer()
                    Text("Zona \(zone)").font(.rounded(13, .bold)).padding(.horizontal, 10).padding(.vertical, 4)
                        .background(zoneColor(zone).opacity(0.25), in: Capsule()).foregroundStyle(zoneColor(zone))
                }
                .font(.rounded(14, .medium))
            }
            HStack {
                Text(run.start_date.formatted(date: .abbreviated, time: .shortened))
                Spacer()
                Link("Ver en Strava", destination: URL(string: "https://www.strava.com/activities/\(run.id)")!)
                    .foregroundStyle(Theme.run)
            }
            .font(.footnote).foregroundStyle(Theme.secondaryText)
        }
    }

    private func zoneColor(_ z: Int) -> Color {
        [Theme.stand, Theme.exercise, Theme.strength, Theme.run, Theme.move][max(0, min(z - 1, 4))]
    }
}
