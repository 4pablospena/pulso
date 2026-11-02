import SwiftUI
import PhotosUI
import PulsoCore

struct AddFoodView: View {
    enum Mode: String, CaseIterable { case photo = "Foto", barcode = "Código", quick = "Rápido" }

    let slot: MealSlot
    @Environment(AppModel.self) private var model
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var mode: Mode = .photo
    @State private var candidates: [FoodCandidate] = []
    @State private var busy = false
    @State private var error: String?
    @State private var photo: PhotosPickerItem?
    @State private var showCamera = false
    @State private var showScanner = false
    @State private var barcode = ""
    @State private var source: FoodSource = .manual

    var body: some View {
        NavigationStack {
            List {
                Picker("Modo", selection: $mode) {
                    ForEach(Mode.allCases, id: \.self) { Text($0.rawValue) }
                }
                .pickerStyle(.segmented)
                .listRowBackground(Color.clear)

                switch mode {
                case .photo: photoSection
                case .barcode: barcodeSection
                case .quick: quickSection
                }

                if busy {
                    HStack { ProgressView(); Text("Analizando…").foregroundStyle(Theme.secondaryText) }
                        .listRowBackground(Theme.card)
                }
                if let error {
                    Text(error).foregroundStyle(Theme.move).listRowBackground(Theme.card)
                }
                if !candidates.isEmpty { reviewSection }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Añadir a \(slot.rawValue)")
            .inlineTitle()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cerrar") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") {
                        for c in candidates { model.log(c, slot: slot, source: source, in: context) }
                        dismiss()
                    }
                    .disabled(candidates.isEmpty)
                }
            }
            .onChange(of: photo) { _, item in
                guard let item else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self) { await analyze(data) }
                }
            }
            #if os(iOS)
            .fullScreenCover(isPresented: $showCamera) {
                CameraPicker { data in Task { await analyze(data) } }.ignoresSafeArea()
            }
            .sheet(isPresented: $showScanner) {
                BarcodeScannerView { code in
                    showScanner = false
                    barcode = code
                    Task { await lookup(code) }
                }
                .ignoresSafeArea()
            }
            #endif
        }
    }

    // MARK: Secciones

    private var photoSection: some View {
        Section {
            #if os(iOS)
            Button { showCamera = true } label: {
                Label("Hacer foto del plato", systemImage: "camera.fill")
            }
            #endif
            PhotosPicker(selection: $photo, matching: .images) {
                Label("Elegir de Fotos", systemImage: "photo.on.rectangle")
            }
        } footer: {
            Text("La cámara inteligente identifica cada alimento y estima ración y macros. Puedes ajustar los gramos antes de guardar.")
        }
        .listRowBackground(Theme.card)
    }

    private var barcodeSection: some View {
        Section {
            #if os(iOS)
            Button { showScanner = true } label: { Label("Escanear código de barras", systemImage: "barcode.viewfinder") }
            #endif
            HStack {
                TextField("Código EAN", text: $barcode).numericKeyboard()
                Button("Buscar") { Task { await lookup(barcode) } }.disabled(barcode.isEmpty)
            }
        } footer: {
            Text("Datos de Open Food Facts, con miles de productos Hacendado.")
        }
        .listRowBackground(Theme.card)
    }

    private var quickSection: some View {
        Section("Básicos Mercadona") {
            ForEach(QuickFoods.all) { food in
                Button {
                    source = .manual
                    candidates.append(food)
                } label: {
                    HStack {
                        Text(food.name).foregroundStyle(.white)
                        Spacer()
                        Text("\(Int(food.grams)) g · \(Int(food.macros.kcal)) kcal").foregroundStyle(Theme.secondaryText)
                    }
                }
            }
        }
        .listRowBackground(Theme.card)
    }

    private var reviewSection: some View {
        Section("Revisar") {
            ForEach($candidates) { $c in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        TextField("Alimento", text: $c.name).font(.rounded(16, .semibold))
                        Text("\(Int(c.macros.kcal)) kcal").foregroundStyle(Theme.move)
                    }
                    Stepper(value: Binding(get: { c.grams }, set: { c = c.scaled(to: $0) }), in: 5...2000, step: 10) {
                        Text("\(Int(c.grams)) g · P \(Int(c.macros.protein)) C \(Int(c.macros.carbs)) G \(Int(c.macros.fat))")
                            .font(.footnote).foregroundStyle(Theme.secondaryText)
                    }
                }
            }
            .onDelete { candidates.remove(atOffsets: $0) }
        }
        .listRowBackground(Theme.card)
    }

    // MARK: Acciones

    private func analyze(_ jpeg: Data) async {
        busy = true; error = nil
        defer { busy = false }
        do {
            candidates = try await MealVision.analyze(jpeg: jpeg)
            source = .photo
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func lookup(_ code: String) async {
        busy = true; error = nil
        defer { busy = false }
        do {
            if let food = try await OpenFoodFacts.product(barcode: code) {
                candidates = [food]
                source = .barcode
            } else {
                error = "Producto no encontrado. Prueba con la foto o el modo rápido."
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

/// Raciones típicas del mapeo de ingredientes clave (valores orientativos Hacendado).
enum QuickFoods {
    static let all: [FoodCandidate] = [
        food("Queso fresco batido 0%", 250, 115, 20, 9, 0.5),
        food("Pechuga de pollo a la plancha", 150, 165, 35, 0, 2.5),
        food("Huevos L (2 uds)", 120, 170, 15, 1, 12),
        food("Claras de huevo líquidas", 200, 100, 22, 1.5, 0.4),
        food("Copos de avena integrales", 50, 186, 7, 30, 3.5),
        food("Arroz basmati cocido", 200, 260, 5, 57, 0.6),
        food("Plátano", 120, 107, 1.3, 24, 0.4),
        food("Atún al natural (lata)", 56, 60, 14, 0, 0.5),
        food("Salmón fresco", 150, 300, 30, 0, 20),
        food("Crema de cacahuete 100%", 20, 120, 5, 3, 10),
        food("Yogur griego light", 125, 75, 7, 5, 3),
        food("Pasta integral cocida", 200, 300, 12, 58, 2),
        food("Almendras al natural", 30, 180, 6.5, 2.5, 15.5),
        food("Aceite de oliva virgen extra", 10, 90, 0, 0, 10),
    ]

    private static func food(_ name: String, _ g: Double, _ kcal: Double, _ p: Double, _ c: Double, _ f: Double) -> FoodCandidate {
        FoodCandidate(name: name, grams: g, macros: .init(kcal: kcal, protein: p, carbs: c, fat: f))
    }
}
