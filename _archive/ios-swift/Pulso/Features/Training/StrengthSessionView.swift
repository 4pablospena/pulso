import SwiftUI
import SwiftData
import PulsoCore

struct StrengthSessionView: View {
    @Bindable var session: StrengthSession
    @Environment(AppModel.self) private var model
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @State private var picking = false
    @State private var restEnds: Date?
    @State private var finishing = false

    var body: some View {
        NavigationStack {
            List {
                Section { header }.listRowBackground(Theme.card)

                ForEach(session.orderedExercises) { exercise in
                    Section {
                        ForEach(exercise.orderedSets) { set in
                            SetRow(set: set, index: set.order + 1) { completed in
                                if completed { restEnds = .now.addingTimeInterval(90) }
                            }
                        }
                        .onDelete { offsets in
                            offsets.map { exercise.orderedSets[$0] }.forEach(context.delete)
                        }
                        Button("Añadir serie", systemImage: "plus") { addSet(to: exercise) }
                            .foregroundStyle(Theme.strength)
                    } header: {
                        ExerciseHeader(exercise: exercise)
                    }
                    .listRowBackground(Theme.card)
                }

                Button { picking = true } label: {
                    Label("Añadir ejercicio", systemImage: "plus.circle.fill").font(.rounded(17, .semibold))
                }
                .foregroundStyle(Theme.strength)
                .listRowBackground(Theme.card)
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle(session.title)
            .inlineTitle()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Descartar", role: .destructive) {
                        context.delete(session)
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Terminar") {
                        finishing = true
                        Task {
                            await model.finish(session)
                            dismiss()
                        }
                    }
                    .disabled(session.completedSets.isEmpty || finishing)
                }
            }
            .safeAreaInset(edge: .bottom) { restBanner }
            .sheet(isPresented: $picking) { ExercisePicker { def in
                model.addExercise(def, order: session.exercises.count, to: session, in: context)
            } }
        }
    }

    private var header: some View {
        TimelineView(.periodic(from: .now, by: 1)) { _ in
            HStack(spacing: 24) {
                Metric(label: "Duración", value: RunFormat.duration(session.duration), color: Theme.strength)
                Metric(label: "Volumen", value: "\(Int(session.volume))", unit: "kg")
                Metric(label: "Series", value: "\(session.completedSets.count)")
            }
        }
    }

    @ViewBuilder private var restBanner: some View {
        if let restEnds, restEnds > .now {
            TimelineView(.periodic(from: .now, by: 1)) { ctx in
                let left = max(0, restEnds.timeIntervalSince(ctx.date))
                HStack {
                    Image(systemName: "timer")
                    Text("Descanso \(RunFormat.duration(left))").monospacedDigit()
                    Spacer()
                    Button("+30 s") { self.restEnds = restEnds.addingTimeInterval(30) }
                    Button("Saltar") { self.restEnds = nil }
                }
                .font(.rounded(16, .semibold))
                .padding()
                .background(Theme.cardRaised, in: RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal)
                .onChange(of: left == 0) { _, done in if done { self.restEnds = nil } }
            }
        }
    }

    private func addSet(to exercise: PerformedExercise) {
        let last = exercise.orderedSets.last
        let set = SetEntry(order: exercise.sets.count, reps: last?.reps ?? 10, weightKg: last?.weightKg ?? 20)
        set.exercise = exercise
        context.insert(set)
    }
}

private struct ExerciseHeader: View {
    let exercise: PerformedExercise

    var body: some View {
        let best = StrengthMath.bestOneRepMax(exercise.completedSets)
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(exercise.name).font(.rounded(17)).foregroundStyle(.white)
                Text(exercise.muscle.rawValue).font(.rounded(12, .semibold)).foregroundStyle(Theme.strength)
            }
            Spacer()
            if best > 0 { Text("1RM ≈ \(Int(best)) kg").font(.rounded(13, .semibold)).foregroundStyle(Theme.exercise) }
        }
        .textCase(nil)
    }
}

private struct SetRow: View {
    @Bindable var set: SetEntry
    let index: Int
    var onToggle: (Bool) -> Void

    var body: some View {
        HStack(spacing: 12) {
            Text("\(index)").font(.rounded(15)).foregroundStyle(Theme.secondaryText).frame(width: 20)
            field(value: $set.weightKg, unit: "kg")
            field(value: Binding(get: { Double(set.reps) }, set: { set.reps = Int($0) }), unit: "reps")
            Menu {
                Button("Sin RPE") { set.rpe = nil }
                ForEach([6.0, 7, 7.5, 8, 8.5, 9, 9.5, 10], id: \.self) { v in
                    Button("RPE \(v.formatted())") { set.rpe = v }
                }
            } label: {
                Text(set.rpe.map { "@\($0.formatted())" } ?? "RPE")
                    .font(.rounded(14, .semibold)).foregroundStyle(set.rpe == nil ? Theme.secondaryText : Theme.strength)
                    .frame(width: 48)
            }
            Spacer()
            Button {
                set.done.toggle()
                onToggle(set.done)
            } label: {
                Image(systemName: set.done ? "checkmark.circle.fill" : "circle")
                    .font(.title2).foregroundStyle(set.done ? Theme.exercise : Theme.secondaryText)
            }
            .buttonStyle(.plain)
        }
        .opacity(set.done ? 0.75 : 1)
    }

    private func field(value: Binding<Double>, unit: String) -> some View {
        HStack(spacing: 2) {
            TextField("0", value: value, format: .number)
                .numericKeyboard()
                .multilineTextAlignment(.trailing)
                .font(.rounded(17))
                .frame(width: 52)
            Text(unit).font(.rounded(12, .semibold)).foregroundStyle(Theme.secondaryText)
        }
    }
}

private struct ExercisePicker: View {
    var onPick: (ExerciseDefinition) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var search = ""

    var body: some View {
        NavigationStack {
            List {
                ForEach(MuscleGroup.allCases, id: \.self) { group in
                    let items = ExerciseCatalog.all.filter {
                        $0.muscle == group && (search.isEmpty || $0.name.localizedCaseInsensitiveContains(search))
                    }
                    if !items.isEmpty {
                        Section(group.rawValue) {
                            ForEach(items) { def in
                                Button(def.name) { onPick(def); dismiss() }.foregroundStyle(.white)
                            }
                        }
                        .listRowBackground(Theme.card)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .searchable(text: $search)
            .navigationTitle("Ejercicios")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cerrar") { dismiss() } } }
        }
    }
}
