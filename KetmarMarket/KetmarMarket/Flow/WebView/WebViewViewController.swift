import SnapKit
import UIKit
import WebKit
import CoreLocation

class WebViewViewController: UIViewController {
    
    private let viewModel: WebViewViewModel
    private weak var delegate: WebViewViewControllerDelegate?

    private lazy var webView: WKWebView = {
        let contentController = WKUserContentController()
        
        // Fetch Observer Script
        let script = WKUserScript(
            source: WebViewScripts.observeFetch.script,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        contentController.addUserScript(script)
        contentController.add(self, name: WebViewScripts.observeFetch.rawValue)

        let config = WKWebViewConfiguration()
        config.userContentController = contentController

        let wv = WKWebView(frame: .zero, configuration: config)
        return wv
    }()

    init(
        viewModel: WebViewViewModel,
        delegate: WebViewViewControllerDelegate?
    ) {
        self.viewModel = viewModel
        self.delegate = delegate
        super.init(nibName: nil, bundle: nil)
    }
    
    @available(*, unavailable) required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func loadURL(_ url: URL) {
        let request = URLRequest(url: url)
        webView.load(request)
    }

    deinit {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: WebViewScripts.observeFetch.rawValue)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupView()
        setupConstraints()
        
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        loadBaseURL()
    }

    private func setupView() {
        view.backgroundColor = .white
        view.addSubview(webView)
    }

    private func setupConstraints() {
        webView.snp.makeConstraints { make in
            make.edges.equalTo(view.safeAreaLayoutGuide)
        }
    }

    private func loadBaseURL() {
        guard let url = viewModel.baseURL else {
            print("Failed to load base URL")
            return
        }

        let request = URLRequest(url: url)
        webView.load(request)
    }
}

extension WebViewViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        fetchLocalStorageData { [weak self] authToken in
            self?.viewModel.handleAuthToken(authToken)
        }
    }
}

// MARK: - WKScriptMessageHandler

extension WebViewViewController: WKScriptMessageHandler {

    enum ObservableURL: String {
        case smsLogin = "/api/auth/sms/login"
    }
    
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == WebViewScripts.observeFetch.rawValue else { return }

        guard let body = message.body as? [String: Any],
              let urlString = body["url"] as? String
        else { return }

        // В будущем это будет как canHandle() -> Bool
        guard urlString.contains(ObservableURL.smsLogin.rawValue) else { return }
        fetchLocalStorageData { [weak self] authToken in
            self?.viewModel.handleAuthToken(authToken)
        }
    }
}

// MARK: - WKUIDelegate

extension WebViewViewController: WKUIDelegate {
    func webView(
        _ webView: WKWebView,
        requestGeolocationPermissionFor origin: WKSecurityOrigin,
        initiatedByFrame frame: WKFrameInfo,
        decisionHandler: @escaping (WKPermissionDecision) -> Void
    ) {
        decisionHandler(.deny)
    }
}

// MARK: - Helpers

extension WebViewViewController {
    func fetchLocalStorageData(completion: @escaping (String?) -> Void) {
        webView.evaluateJavaScript(
            WebViewScripts.fetchLocalStorageAuthToken.script
        ) { (result, error) in
            completion(result as? String)
        }
    }
}
