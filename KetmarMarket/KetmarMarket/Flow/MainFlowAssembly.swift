import Swinject
import UIKit

// swiftlint:disable force_unwrapping
final class MainFlowAssembly: Assembly {

    func assemble(container: Container) {

        // MARK: - LaunchScreen
        
        container.register(LaunchScreenViewModel.self) { resolver in
            LaunchScreenViewModel(
                configurationService: resolver.resolve(ConfigurationService.self)!,
                networkService: resolver.resolve(Networking.self)!,
                applicationSettings: resolver.resolve(ApplicationSettings.self)!
            )
        }
        
        container.register(LaunchScreenViewController.self) { (resolver, delegate: LaunchScreenViewControllerDelegate) in
            LaunchScreenViewController(
                viewModel: resolver.resolve(LaunchScreenViewModel.self)!,
                delegate: delegate
            )
        }

        // MARK: - WebView
        
        container.register(WebViewViewModel.self) { resolver in
            WebViewViewModel(
                applicationSettings: resolver.resolve(ApplicationSettings.self)!,
                deviceRegistrationService: resolver.resolve(DeviceRegistrationService.self)!
            )
        }
        
        container.register(WebViewViewController.self) { (resolver, delegate: WebViewViewControllerDelegate) in
            WebViewViewController(
                viewModel: resolver.resolve(WebViewViewModel.self)!,
                delegate: delegate
            )
        }
    }
}
