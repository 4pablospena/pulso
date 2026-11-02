import SwiftUI
import AuthenticationServices
import PulsoCore

struct SettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @Environment(\.webAuthenticationSession) private var webAuth
    @State private var apiKey = MealVision.apiKey ?? ""
    @State private var connecting = false

    var body: some View {
        @Bindable var settings = model.settings
        NavigationStack {
            Form {
                Section("Perfil") {
                    Picker("Sexo", selection: $settings.profile.sex) {
                        Text("Hombre").tag(Sex.male)
                        Text("Mujer").tag(Sex.female)
                    }
                    Stepper("Edad: \(settings.profile.age)", value: $settings.profile.age, in: 14...90)
                    numberRow("Altura", value: $settings.profile.heightCm, unit: "cm")
                    numberRow("Peso", value: $settings.profile.weightKg, unit: "kg")
                    Picker("Objetivo", selection: $settings.profile.goal) {
                        ForEach(Goal.allCases, id: \.self) { Text($0.label) }
                    }
                    LabeledContent("Basal estimado", value: "\(Int(settings.profile.bmr)) kcal")
                }

                Section("Ayuno e hidratación") {
                    Picker("Protocolo", selection: $settings.fastingProtocol) {
                        ForEach(FastingProtocol.allCases) { Text($0.rawValue).tag($0) }
                    }
                    Stepper("Agua: \(String(format: "%.1f", settings.waterGoalMl / 1000)) L",
                            value: $settings.waterGoalMl, in: 1000...5000, step: 250)
                }

                Section {
                    LabeledContent("Apple Salud") {
                        Text(model.health.isAvailable ? (model.health.authorized ? "Conectado" : "Pendiente") : "No disponible")
                            .foregroundStyle(model.health.authorized ? Theme.exercise : Theme.secondaryText)
                    }
                    Button("Revisar permisos de Salud") { Task { await model.health.requestAuthorization() } }
                } header: {
                    Text("Apple Salud · Fitness · Watch")
                } footer: {
                    Text("Pulso lee entrenos, energía activa, pasos y anillos del Apple Watch, y escribe comidas, agua y sesiones de fuerza.")
                }

                Section {
                    if model.strava.isConnected {
                        LabeledContent("Atleta", value: [model.strava.athlete?.firstname, model.strava.athlete?.lastname]
                            .compactMap { $0 }.joined(separator: " "))
                        Toggle("Subir sesiones de fuerza", isOn: $settings.autoUploadToStrava)
                        Button("Desconectar", role: .destructive) { Task { await model.strava.disconnect() } }
                    } else {
                        Button {
                            Task { await connectStrava() }
                        } label: {
                            Label(connecting ? "Conectando…" : "Conectar con Strava", systemImage: "link")
                                .foregroundStyle(Theme.run)
                        }
                        .disabled(!model.strava.isConfigured || connecting)
                        if !model.strava.isConfigured {
                            Text("Configura STRAVA_CLIENT_ID y STRAVA_CLIENT_SECRET en Config/Secrets.xcconfig.")
                                .font(.footnote).foregroundStyle(Theme.secondaryText)
                        }
                    }
                } header: {
                    Text("Strava")
                }

                Section {
                    SecureField("sk-ant-…", text: $apiKey)
                        .onSubmit { Keychain.set(apiKey.isEmpty ? nil : apiKey, for: MealVision.apiKeyKey) }
                } header: {
                    Text("Cámara inteligente (Claude)")
                } footer: {
                    Text("Se guarda en el Llavero del dispositivo y solo se usa para analizar fotos de comidas.")
                }
            }
            .navigationTitle("Ajustes")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("OK") {
                        Keychain.set(apiKey.isEmpty ? nil : apiKey, for: MealVision.apiKeyKey)
                        dismiss()
                    }
                }
            }
        }
    }

    private func numberRow(_ label: String, value: Binding<Double>, unit: String) -> some View {
        LabeledContent(label) {
            HStack(spacing: 4) {
                TextField(label, value: value, format: .number)
                    .numericKeyboard().multilineTextAlignment(.trailing)
                Text(unit).foregroundStyle(Theme.secondaryText)
            }
        }
    }

    private func connectStrava() async {
        connecting = true
        defer { connecting = false }
        do {
            let callback = try await webAuth.authenticate(using: model.strava.authorizeURL,
                                                          callbackURLScheme: StravaService.callbackScheme)
            try await model.strava.handleCallback(callback)
        } catch let error as ASWebAuthenticationSessionError where error.code == .canceledLogin {
            return
        } catch {
            model.lastError = error.localizedDescription
        }
    }
}
