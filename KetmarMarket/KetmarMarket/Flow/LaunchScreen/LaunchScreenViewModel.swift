import Foundation

class LaunchScreenViewModel {

    private let configurationService: ConfigurationService
    private let networkService: Networking
    private let applicationSettings: ApplicationSettings

    init(
        configurationService: ConfigurationService,
        networkService: Networking,
        applicationSettings: ApplicationSettings
    ) {
        self.configurationService = configurationService
        self.networkService = networkService
        self.applicationSettings = applicationSettings
    }

    func performInitialization(completion: @escaping () -> Void) {
        Task {
            do {
                // Загружаем конфигурацию приложения
                let config = try await configurationService.fetchConfiguration()

                // Oбновляем базовый URL
                let baseURL = config?.data.network.primaryActiveBaseURL ?? ENV.defaultBaseURL
                if baseURL != applicationSettings.baseURL {
                    networkService.setBaseURL(baseURL)
                    applicationSettings.baseURL = baseURL
                }
            } catch {
                print("LaunchScreenViewModel - performInitialization error: \(error)")
            }

            await MainActor.run {
                completion()
            }
        }
    }
}
