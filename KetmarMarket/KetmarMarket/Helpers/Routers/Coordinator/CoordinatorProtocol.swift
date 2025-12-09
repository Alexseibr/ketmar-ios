import UIKit

public protocol CoordinatorProtocol: AnyObject {
    func start()
    func open(url: String?)
    func open(url: URL)
}

public extension CoordinatorProtocol {
    func open(url: String?) {
        guard let urlStr = url,
              let url = URL(string: urlStr)
        else {
            assertionFailure("Invalid url string")
            return
        }
        open(url: url)
    }

    func open(url: URL) {
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
    }

    func openSettings() {
        open(url: UIApplication.openSettingsURLString)
    }
}
