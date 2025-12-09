import Swinject
import UIKit

// swiftlint:disable force_unwrapping
final class ServicesAssembly: Assembly {

    func assemble(container: Container) {
        container.register(ApplicationSettings.self) { _ in
            ApplicationSettings()
        }.inObjectScope(.container)
        
        container.register(KeychainManager.self) { _ in
            KeychainManager()
        }.inObjectScope(.container)
        
        container.register(LocationManager.self) { _ in
            LocationManager()
        }.inObjectScope(.container)

        container.register(Networking.self) { _ in
            let applicationSettings = container.resolve(ApplicationSettings.self)!
            return NetworkService(baseURL: applicationSettings.baseURL ?? ENV.defaultBaseURL)
        }.inObjectScope(.container)

        container.register(ConfigurationNetworkService.self) { resolver in
            ConfigurationNetworkService(
                networkService: resolver.resolve(Networking.self)!
            )
        }.inObjectScope(.weak)
        
        container.register(ConfigurationService.self) { resolver in
            ConfigurationService(
                locationManager: resolver.resolve(LocationManager.self)!,
                configurationNetworkService: resolver.resolve(ConfigurationNetworkService.self)!
            )
        }.inObjectScope(.weak)

        container.register(DeviceRegistrationNetworkService.self) { resolver in
            DeviceRegistrationNetworkService(
                networkService: resolver.resolve(Networking.self)!
            )
        }.inObjectScope(.weak)
        
        container.register(DeviceRegistrationService.self) { resolver in
            DeviceRegistrationService(
                locationManager: resolver.resolve(LocationManager.self)!,
                keychainManager: resolver.resolve(KeychainManager.self)!,
                deviceRegistrationNetworkService: resolver.resolve(DeviceRegistrationNetworkService.self)!
            )
        }.inObjectScope(.weak)
    }
}
