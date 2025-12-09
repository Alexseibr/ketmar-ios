import Swinject
import UIKit

// swiftlint:disable force_unwrapping
final class ViewsAssembly: Assembly {

    func assemble(container: Container) {

        container.register(RouterProtocol.self) { (_, rootController: UINavigationController) in
            Router(rootController: rootController)
        }
    }
}
