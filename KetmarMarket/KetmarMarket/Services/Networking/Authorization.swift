//
//  Authorization.swift
//  KetmarMarket
//
//  Created by Daniil Yarmolyuk on 8.12.25.
//

import Foundation

enum Authorization {
    case none
    case bearerType(String)
    case basic(username: String, password: String)
    
    var headerValue: String? {
        switch self {
        case .none:
            return nil
        case .bearerType(let token):
            return "Bearer \(token)"
        case .basic(let username, let password):
            let credentials = "\(username):\(password)"
            guard let data = credentials.data(using: .utf8) else { return nil }
            return "Basic \(data.base64EncodedString())"
        }
    }
}
