import Foundation

enum WebViewScripts: String {
    case observeFetch
    case fetchLocalStorageAuthToken

    var script: String {
        switch self {
        case .observeFetch:
            """
            (function() {
                var originalFetch = window.fetch;
                window.fetch = function() {
                    var url = arguments[0];
                    window.webkit.messageHandlers.\(WebViewScripts.observeFetch.rawValue).postMessage({url: url});
                    return originalFetch.apply(this, arguments);
                };
            })();
            """

        case .fetchLocalStorageAuthToken:
            """
            (function() {
                return localStorage.getItem('ketmar_auth_token');
            })();
            """
        }
    }
}
