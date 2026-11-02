import SwiftUI
import SwiftData
import PulsoCore

/// Lista por pasillos con salto directo al buscador de la tienda online de Mercadona.
struct ShoppingView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.openURL) private var openURL
    @Query(sort: \ShoppingItem.addedAt) private var items: [ShoppingItem]
    @State private var newItem = ""
    @State private var shopping = false
    @FocusState private var focused: Bool

    private var pending: [ShoppingItem] { items.filter { !$0.checked } }
    private var done: [ShoppingItem] { items.filter(\.checked) }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        TextField("Añadir producto…", text: $newItem)
                            .focused($focused)
                            .onSubmit(add)
                        if !newItem.isEmpty {
                            Text(Aisle.categorize(newItem).rawValue).font(.caption).foregroundStyle(Theme.secondaryText)
                        }
                    }
                    if items.isEmpty {
                        Button("Cargar compra de la semana", systemImage: "calendar.badge.plus") {
                            context.addToShopping(WeeklyPlan.weeklyGroceries.flatMap(\.1))
                        }
                        .foregroundStyle(Theme.exercise)
                    }
                }
                .listRowBackground(Theme.card)

                ForEach(Aisle.allCases) { aisle in
                    let rows = pending.filter { $0.aisle == aisle }
                    if !rows.isEmpty {
                        Section {
                            ForEach(rows) { item in row(item) }
                        } header: {
                            Label(aisle.rawValue, systemImage: aisle.symbol).font(.rounded(15, .semibold))
                        }
                        .listRowBackground(Theme.card)
                    }
                }

                if !done.isEmpty {
                    Section {
                        ForEach(done) { item in row(item) }
                        Button("Vaciar comprados", role: .destructive) { done.forEach(context.delete) }
                    } header: {
                        Text("En el carro (\(done.count))")
                    }
                    .listRowBackground(Theme.card)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Compra")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Menu {
                        Button("Añadir compra de la semana", systemImage: "calendar.badge.plus") {
                            context.addToShopping(WeeklyPlan.weeklyGroceries.flatMap(\.1))
                        }
                        Button("Pedir en Mercadona online", systemImage: "bag") { shopping = true }
                        ShareLink(item: shareText) { Label("Compartir lista", systemImage: "square.and.arrow.up") }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $shopping) { MercadonaCheckout(items: pending) }
        }
    }

    private func row(_ item: ShoppingItem) -> some View {
        HStack {
            Button {
                withAnimation { item.checked.toggle() }
            } label: {
                Image(systemName: item.checked ? "checkmark.circle.fill" : "circle")
                    .font(.title3).foregroundStyle(item.checked ? Theme.exercise : Theme.secondaryText)
            }
            .buttonStyle(.plain)
            Text(item.name).strikethrough(item.checked).foregroundStyle(item.checked ? Theme.secondaryText : .white)
            Spacer()
            if !item.checked, let url = MercadonaLink.search(item.name) {
                Button { openURL(url) } label: { Image(systemName: "magnifyingglass") }
                    .buttonStyle(.plain).foregroundStyle(Theme.secondaryText)
            }
        }
        .swipeActions { Button("Borrar", role: .destructive) { context.delete(item) } }
    }

    private func add() {
        let name = newItem.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        context.addToShopping([name])
        newItem = ""
        focused = true
    }

    private var shareText: String {
        Aisle.allCases.compactMap { aisle -> String? in
            let rows = pending.filter { $0.aisle == aisle }
            guard !rows.isEmpty else { return nil }
            return "\(aisle.rawValue)\n" + rows.map { "☐ \($0.name)" }.joined(separator: "\n")
        }.joined(separator: "\n\n")
    }
}

/// Recorre la lista producto a producto abriendo la búsqueda de Mercadona para añadir a la cesta.
private struct MercadonaCheckout: View {
    let items: [ShoppingItem]
    @Environment(\.openURL) private var openURL
    @Environment(\.dismiss) private var dismiss
    @State private var sent = Set<PersistentIdentifier>()

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(items) { item in
                        Button {
                            if let url = MercadonaLink.search(item.name) { openURL(url) }
                            sent.insert(item.persistentModelID)
                        } label: {
                            HStack {
                                Image(systemName: sent.contains(item.persistentModelID) ? "checkmark.circle.fill" : "arrow.up.right.circle")
                                    .foregroundStyle(sent.contains(item.persistentModelID) ? Theme.exercise : Theme.run)
                                Text(item.name).foregroundStyle(.white)
                                Spacer()
                                Text(item.aisle.rawValue).font(.caption).foregroundStyle(Theme.secondaryText)
                            }
                        }
                    }
                } footer: {
                    Text("Mercadona no ofrece API pública: cada producto abre su buscador en tienda.mercadona.es para añadirlo a tu cesta.")
                }
                .listRowBackground(Theme.card)
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Pedido Mercadona")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Listo") { dismiss() } } }
        }
    }
}
