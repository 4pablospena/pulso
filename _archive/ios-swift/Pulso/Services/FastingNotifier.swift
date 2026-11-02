import Foundation
import UserNotifications
import PulsoCore

/// Alertas locales de inicio y fin de la ventana de ingesta.
enum FastingNotifier {
    private static let ids = ["fast.end", "fast.start"]

    static func requestPermission() async {
        _ = try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
    }

    static func schedule(start: Date, protocol p: FastingProtocol) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ids)

        let status = FastingClock.status(start: start, protocol: p)
        let fastEnds: Date
        let eatingEnds: Date
        switch status.phase {
        case .fasting:
            fastEnds = status.phaseEnd
            eatingEnds = fastEnds.addingTimeInterval(p.eatingHours * 3600)
        case .eating:
            eatingEnds = status.phaseEnd
            fastEnds = eatingEnds.addingTimeInterval(p.fastingHours * 3600)
        }

        add(id: "fast.end", at: fastEnds, title: "¡Ayuno completado! 🎉",
            body: "Abre tu ventana de \(Int(p.eatingHours)) h. Empieza con agua y proteína.")
        add(id: "fast.start", at: eatingEnds, title: "Se cierra la ventana de ingesta",
            body: "Comienza tu ayuno \(p.rawValue). Te avisamos al terminar.")
    }

    static func cancel() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ids)
    }

    private static func add(id: String, at date: Date, title: String, body: String) {
        guard date > .now else { return }
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: date.timeIntervalSinceNow, repeats: false)
        UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
    }
}
