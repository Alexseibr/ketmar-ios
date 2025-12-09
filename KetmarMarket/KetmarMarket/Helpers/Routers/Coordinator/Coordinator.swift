/// Abstract coordinator class
open class Coordinator: CoordinatorProtocol {
    public typealias DefaultFinishHandler = () -> Void
    public typealias BoolFinishHandler = (Bool) -> Void

    public var childCoordinators: [Coordinator] = []

    open func start() { }

    public func addDependency(_ coordinator: Coordinator) {
        for element in childCoordinators where element === coordinator {
            return
        }
        childCoordinators.append(coordinator)
    }

    public func removeDependency(_ coordinator: Coordinator?) {
        guard !childCoordinators.isEmpty, let coordinator else { return }

        for (index, element) in childCoordinators.reversed().enumerated() where element === coordinator {
            childCoordinators.remove(at: childCoordinators.count - index - 1)
            break
        }
    }

    public func removeDependency(of coordinatorType: (some Coordinator).Type) {
        guard !childCoordinators.isEmpty else { return }

        for (index, element) in childCoordinators.reversed().enumerated() where type(of: element) == coordinatorType {
            childCoordinators.remove(at: childCoordinators.count - index - 1)
            break
        }
    }

    public func removeAllDependencies() {
        childCoordinators.removeAll()
    }

    public init() { }

    #if DEBUG
        deinit {
            print("\(String(describing: type(of: self))) deinited")
        }
    #endif
}
