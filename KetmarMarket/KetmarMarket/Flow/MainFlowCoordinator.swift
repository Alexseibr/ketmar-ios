import Swinject
import UIKit

class MainFlowCoordinator: Coordinator {

    private let assemblerManager: AssemblerManager
    private let router: RouterProtocol
    private let applicationSettings: ApplicationSettings

    init(
        assemblerManager: AssemblerManager,
        router: RouterProtocol,
        window: UIWindow
    ) {
        self.assemblerManager = assemblerManager
        self.router = router
        self.applicationSettings = assemblerManager.resolver.resolve(ApplicationSettings.self)!

        if !window.isKeyWindow {
            window.rootViewController = router.rootController
            window.overrideUserInterfaceStyle = .light
            window.makeKeyAndVisible()
        }
    }

    override func start() {
        if applicationSettings.baseURL == nil {
            showLaunchScreen()
        } else {
            showWebView()
        }
    }

    func handleDeepLink(_ url: URL) {
        guard canHandleDeepLink(url) else { return }

        guard let webViewController = router.child(WebViewViewController.self) else { return }
        webViewController.loadURL(url)
    }
}

private extension MainFlowCoordinator {

    func showLaunchScreen() {
        let launchScreenViewController = launchScreenViewController()
        router.setRootModule(launchScreenViewController, transitionOptions: [.withNavBar(hidden: true), .withoutAnimation])
    }

    func showWebView() {
        let webViewViewController = webViewViewController()
        router.setRootModule(webViewViewController, transitionOptions: [.withNavBar(hidden: true), .withoutAnimation])
    }
}

private extension MainFlowCoordinator {

    func launchScreenViewController() -> UIViewController {
        assemblerManager.resolver.resolve(LaunchScreenViewController.self, argument: self as LaunchScreenViewControllerDelegate)!
    }

    func webViewViewController() -> UIViewController {
        assemblerManager.resolver.resolve(WebViewViewController.self, argument: self as WebViewViewControllerDelegate)!
    }
}

private extension MainFlowCoordinator {

    func canHandleDeepLink(_ url: URL) -> Bool {
        let baseURLString = applicationSettings.baseURL ?? ENV.defaultBaseURL
        guard let baseURL = URL(string: baseURLString) else { return false }
        return url.host == baseURL.host
    }
}


// MARK: - LaunchScreenViewControllerDelegate

extension MainFlowCoordinator: LaunchScreenViewControllerDelegate {

    func launchScreenDidFinish() {
        showWebView()
    }
}

// MARK: - WebViewViewControllerDelegate

extension MainFlowCoordinator: WebViewViewControllerDelegate { }
