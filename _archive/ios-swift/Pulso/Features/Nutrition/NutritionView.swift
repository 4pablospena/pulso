import SwiftUI
import SwiftData
import PulsoCore

struct NutritionView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.modelContext) private var context
    @Query private var foods: [FoodEntry]
    @State private var addingTo: MealSlot?
    @State private var addedToList: String?

    init() {
        let start = Calendar.current.startOfDay(for: .now)
        _foods = Query(filter: #Predicate<FoodEntry> { $0.date >= start }, sort: \.date)
    }

    private var eaten: Macros { foods.map(\.macros).reduce(.zero, +) }

    var body: some View {
        NavigationStack {
            List {
                Section { summary }
                    .listRowBackground(Theme.card)

                Section { FastingCard().listRowInsets(EdgeInsets()) }
                    .listRowBackground(Color.clear)

                ForEach(MealSlot.allCases) { slot in
                    Section {
                        ForEach(foods.filter { $0.slot == slot }) { entry in
                            FoodRow(entry: entry)
                                .swipeActions(edge: .trailing) {
                                    Button(role: .destructive) { model.delete(entry, in: context) } label: {
                                        Label("Borrar", systemImage: "trash")
                                    }
                                }
                                .swipeActions(edge: .leading) {
                                    Button {
                                        context.addToShopping([entry.name])
                                        addedToList = entry.name
                                    } label: { Label("A la compra", systemImage: "cart.badge.plus") }
                                        .tint(Theme.exercise)
                                }
                        }
                        Button { addingTo = slot } label: {
                            Label("Añadir", systemImage: "plus.circle.fill").foregroundStyle(Theme.exercise)
                        }
                    } header: {
                        let kcal = foods.filter { $0.slot == slot }.reduce(0) { $0 + $1.kcal }
                        HStack {
                            Label(slot.rawValue, systemImage: slot.symbol)
                            Spacer()
                            if kcal > 0 { Text("\(Int(kcal)) kcal") }
                        }
                        .font(.rounded(15, .semibold))
                    }
                    .listRowBackground(Theme.card)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Nutrición")
            .sheet(item: $addingTo) { AddFoodView(slot: $0) }
            .overlay(alignment: .bottom) {
                if let name = addedToList {
                    Text("“\(name)” añadido a la compra")
                        .font(.rounded(15, .semibold)).padding().background(.ultraThinMaterial, in: Capsule())
                        .padding(.bottom, 12)
                        .task { try? await Task.sleep(for: .seconds(2)); addedToList = nil }
                }
            }
        }
    }

    private var summary: some View {
        let target = model.target
        let remaining = target - eaten
        return VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline) {
                Metric(label: "Restantes", value: "\(Int(max(remaining.kcal, 0)))", unit: "kcal", color: Theme.move)
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Objetivo \(Int(target.kcal))").font(.rounded(13, .semibold))
                    Text("+\(Int(model.health.today.activeKcal)) kcal de actividad")
                        .font(.rounded(13, .medium)).foregroundStyle(Theme.stand)
                }
            }
            MacroBar(label: "Proteína", value: eaten.protein, target: target.protein, color: Theme.exercise)
            MacroBar(label: "Carbohidratos", value: eaten.carbs, target: target.carbs, color: Theme.strength)
            MacroBar(label: "Grasas", value: eaten.fat, target: target.fat, color: Theme.move)
            Text("Enfoque de hoy: \(model.plan.nutrition.rawValue)")
                .font(.footnote).foregroundStyle(Theme.secondaryText)
        }
        .padding(.vertical, 6)
    }
}

private struct FoodRow: View {
    let entry: FoodEntry

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(entry.name).font(.rounded(16, .semibold))
                    if entry.sourceRaw == FoodSource.photo.rawValue { Image(systemName: "camera.fill").font(.caption) }
                    if entry.sourceRaw == FoodSource.barcode.rawValue { Image(systemName: "barcode").font(.caption) }
                }
                Text("\(Int(entry.grams)) g · P \(Int(entry.protein)) · C \(Int(entry.carbs)) · G \(Int(entry.fat))")
                    .font(.footnote).foregroundStyle(Theme.secondaryText)
            }
            Spacer()
            Text("\(Int(entry.kcal))").font(.rounded(17)).foregroundStyle(Theme.move)
        }
    }
}
