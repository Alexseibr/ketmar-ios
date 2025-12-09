import UIKit

public struct TransitionConfig {
    public var animate: Bool = true
    public var showNavBar: Bool?
    public var showTabBar: Bool?
    public var completion: (() -> Void)?

    public func with(options: [TransitionOption]) -> TransitionConfig {
        var newConfig = self
        options.forEach { option in
            switch option {
            case .withoutAnimation:
                newConfig.animate = false
            case let .withNavBar(hidden):
                newConfig.showNavBar = !hidden
            case let .withTabBar(hidden):
                newConfig.showTabBar = !hidden
            case let .withCompletion(completion):
                newConfig.completion = completion
            }
        }
        return newConfig
    }
}

public enum TransitionOption {
    case withoutAnimation
    case withNavBar(hidden: Bool)
    case withTabBar(hidden: Bool)
    case withCompletion(_ completion: () -> Void)
}

public protocol RouterProtocol: Presentable {
    var rootController: UINavigationController? { get }

    func present(_ module: Presentable?)
    func present(_ module: Presentable?, animated: Bool)

    func push(_ module: Presentable?, transitionOptions: [TransitionOption])

    func set(modules: [Presentable], animated: Bool)

    func popModule()
    func popToModule(_ module: Presentable?, animated: Bool)
    func popModule(animated: Bool)
    func popToModule<T: Presentable>(_: T.Type, animated: Bool, failHandler: (() -> Void)?)

    func dismissModule()
    func dismissModule(animated: Bool, completion: (() -> Void)?)
    func dismissModule(_ module: Presentable?)
    func dismissModule(_ module: Presentable?, animated: Bool, completion: (() -> Void)?)

    func setRootModule(_ module: Presentable?)
//    func setRootModule(_ module: Presentable?, hideBar: Bool)
//    func setRootModule(_ module: Presentable?, animated: Bool, hideBar: Bool)
    func setRootModule(_ module: Presentable?, transitionOptions: [TransitionOption])

    func replaceLast(_ module: Presentable?)
    func replaceLast(_ module: Presentable?, animated: Bool)
    func replaceLast(_ module: Presentable?, animated: Bool, hideBar: Bool)
    func popToRootModule(animated: Bool)

    func addAsChild(_ module: Presentable?)
    func add(_ submodule: Presentable?, asChildTo module: Presentable?)

    func contains<T>(_: T.Type) -> Bool
    func child<T>(_: T.Type) -> T?
}

public extension RouterProtocol {
    func present(_ module: Presentable?) {
        present(module, animated: true)
    }

    func push(_ module: Presentable?) {
        push(module, transitionOptions: [])
    }

    func set(modules: [Presentable]) {
        set(modules: modules, animated: true)
    }

    func dismissModule(_ module: Presentable?) {
        dismissModule(module, animated: true, completion: nil)
    }

    func dismissModule() {
        dismissModule(animated: true, completion: nil)
    }

    func popModule() {
        popModule(animated: true)
    }

    func popToModule(_ module: Presentable?) {
        popToModule(module, animated: true)
    }

    func popToModule<T: Presentable>(_: T.Type, animated: Bool) {
        popToModule(T.self, animated: animated, failHandler: nil)
    }

    func popToModule<T: Presentable>(_: T.Type, failHandler: (() -> Void)?) {
        popToModule(T.self, animated: true, failHandler: failHandler)
    }

    func popToModule<T: Presentable>(_: T.Type) {
        popToModule(T.self, animated: true, failHandler: nil)
    }

    func setRootModule(_ module: Presentable?) {
        setRootModule(module, transitionOptions: [])
    }

//    func setRootModule(_ module: Presentable?, hideBar: Bool) {
//        setRootModule(module, animated: true, hideBar: hideBar)
//    }
//
//    func setRootModule(_ module: Presentable?, animated: Bool) {
//        setRootModule(module, animated: animated, hideBar: false)
//    }

    func replaceLast(_ module: Presentable?) {
        replaceLast(module, animated: true, hideBar: false)
    }

    func replaceLast(_ module: Presentable?, animated: Bool) {
        replaceLast(module, animated: animated, hideBar: false)
    }
}
