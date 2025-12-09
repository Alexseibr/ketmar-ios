//
//  ConfigurationResponse.swift
//  KetmarMarket
//
//  Created by Daniil Yarmolyuk on 9.12.25.
//

import Foundation

// MARK: - Configuration Response

struct ConfigurationResponse: Codable {
    let success: Bool
    let data: ConfigurationData
}

struct ConfigurationData: Codable {
    let version: VersionInfo
    let network: NetworkInfo
    let features: Features
}

// MARK: - Version Info

struct VersionInfo: Codable {
    let current: String
    let min: String
    let needsUpdate: Bool
    let forceUpdate: Bool
    let updateMessage: String?
}

// MARK: - Network Info

struct NetworkInfo: Codable {
    let baseUrls: [BaseURL]
    let healthCheckPath: String
    let timeout: Int
    let retryCount: Int
    
    /// Возвращает primary baseURL в active статусе
    var primaryActiveBaseURL: String? {
        return baseUrls
            .first { $0.type == "production" && $0.id == "primary" && $0.status == "active" }?
            .url
    }
}

struct BaseURL: Codable {
    let id: String
    let url: String
    let priority: Int
    let type: String
    let status: String
}

// MARK: - Features

struct Features: Codable {
    let chatEnabled: Bool
    let pushNotifications: Bool
    let sellerCabinet: Bool
    let darkMode: Bool
    let biometricAuth: Bool
    
    enum CodingKeys: String, CodingKey {
        case chatEnabled = "chat_enabled"
        case pushNotifications = "push_notifications"
        case sellerCabinet = "seller_cabinet"
        case darkMode = "dark_mode"
        case biometricAuth = "biometric_auth"
    }
}
