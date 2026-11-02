import SwiftUI
import SwiftData

@main
struct PulsoApp: App {
    @State private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .preferredColorScheme(.dark)
                .tint(Theme.exercise)
                .task { await model.bootstrap() }
                .onOpenURL { url in
                    // Fallback por si Strava devuelve el código fuera de la sesión web.
                    Task { try? await model.strava.handleCallback(url) }
                }
        }
        .modelContainer(for: PulsoSchema.models)
    }
}

struct RootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model
        TabView {
            Tab("Resumen", systemImage: "circle.circle.fill") { TodayView() }
            Tab("Nutrición", systemImage: "fork.knife") { NutritionView() }
            Tab("Entreno", systemImage: "figure.strengthtraining.traditional") { TrainingView() }
            Tab("Compra", systemImage: "cart.fill") { ShoppingView() }
        }
        .alert("Aviso", isPresented: Binding(get: { model.lastError != nil }, set: { if !$0 { model.lastError = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(model.lastError ?? "")
        }
    }
}
