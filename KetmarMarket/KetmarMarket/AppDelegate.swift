import Swinject
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    private lazy var assemblerManager = AssemblerManager.shared
    private lazy var deviceRegistrationService = assemblerManager.resolver.resolve(DeviceRegistrationService.self)!

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Remote Notifications
        UIApplication.shared.registerForRemoteNotifications()

        let notificationCenter = UNUserNotificationCenter.current()
        notificationCenter.delegate = self
        notificationCenter.requestAuthorization(options: [.badge, .alert, .sound]) { enabled, _ in
            print("Authorization for push notifications \(enabled)")
        }

        return true
    }

    // MARK: UISceneSession Lifecycle

    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        UISceneConfiguration(name: "Phone", sessionRole: connectingSceneSession.role)
    }

    // MARK: - RemoteNotifications

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        deviceRegistrationService.faildToRegisterForRemoteNotifications(error)
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let remoteToken = deviceToken.reduce("") { $0 + String(format: "%02X", $1) }
        deviceRegistrationService.updateRemoteToken(remoteToken)
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // TODO: @yada - проверить отображение
        print("Will present remote notification")
        completionHandler([.banner, .list])
    }
}

