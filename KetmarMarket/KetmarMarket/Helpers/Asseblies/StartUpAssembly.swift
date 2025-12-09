import Swinject
import UIKit

// swiftlint:disable force_unwrapping
final class StartUpAssembly: Assembly {

    func assemble(container: Container) {

        container.register(MainFlowCoordinator.self) { (resolver, window: UIWindow, assemblerManager: AssemblerManager) in
            MainFlowCoordinator(
                assemblerManager: assemblerManager,
                router: resolver.resolve(RouterProtocol.self, argument: UINavigationController())!,
                window: window
            )
        }.inObjectScope(.container)
    }
}
