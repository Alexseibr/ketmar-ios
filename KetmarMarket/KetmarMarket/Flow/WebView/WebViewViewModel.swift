import Foundation

class WebViewViewModel {

    lazy var baseURL: URL? = URL(string: applicationSettings.baseURL ?? ENV.defaultBaseURL)

    private let applicationSettings: ApplicationSettings
    private let deviceRegistrationService: DeviceRegistrationService

    init(
        applicationSettings: ApplicationSettings,
        deviceRegistrationService: DeviceRegistrationService
    ) {
        self.applicationSettings = applicationSettings
        self.deviceRegistrationService = deviceRegistrationService
    }

    func handleAuthToken(_ authToken: String?) {
        deviceRegistrationService.updateAuthToken(authToken)
    }
}
