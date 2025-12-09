import Foundation
import Security

final class KeychainManager {
    
    // MARK: - Keys
    
    private enum Keys {
        static let deviceID = "by.ketmarmarket.deviceID"
        static let authToken = "by.ketmarmarket.authToken"
        static let pushToken = "by.ketmarmarket.pushToken"
    }
    
    // MARK: - Initialization

    init() {}

    // MARK: - Device ID

    func saveDeviceID(_ deviceID: String) throws {
        try save(deviceID, forKey: Keys.deviceID)
    }

    func getDeviceID() throws -> String? {
        return try getString(forKey: Keys.deviceID)
    }

    func deleteDeviceID() throws {
        try delete(forKey: Keys.deviceID)
    }

    // MARK: - Auth Token
    
    func saveAuthToken(_ token: String) throws {
        try save(token, forKey: Keys.authToken)
    }
    
    func getAuthToken() throws -> String? {
        return try getString(forKey: Keys.authToken)
    }
    
    func deleteAuthToken() throws {
        try delete(forKey: Keys.authToken)
    }
    
    // MARK: - Push Token
    
    func savePushToken(_ token: String) throws {
        try save(token, forKey: Keys.pushToken)
    }
    
    func getPushToken() throws -> String? {
        return try getString(forKey: Keys.pushToken)
    }

    func deletePushToken() throws {
        try delete(forKey: Keys.pushToken)
    }
}

// MARK: - Private Helpers

private extension KeychainManager {

    func save(_ value: String, forKey key: String) throws {
        guard let data = value.data(using: .utf8) else {
            throw KeychainError.encodingError
        }
        
        // Delete existing item if present
        try? delete(forKey: key)
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }
    
    func getString(forKey key: String) throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        if status == errSecItemNotFound {
            return nil
        }
        
        guard status == errSecSuccess else {
            throw KeychainError.readFailed(status)
        }
        
        guard let data = result as? Data,
              let string = String(data: data, encoding: .utf8) else {
            throw KeychainError.decodingError
        }
        
        return string
    }
    
    func delete(forKey key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }
    }
}

// MARK: - KeychainError

enum KeychainError: Error, LocalizedError {
    case encodingError
    case decodingError
    case saveFailed(OSStatus)
    case readFailed(OSStatus)
    case deleteFailed(OSStatus)
    
    var errorDescription: String? {
        switch self {
        case .encodingError:
            return "Failed to encode data for Keychain storage"
        case .decodingError:
            return "Failed to decode data from Keychain"
        case .saveFailed(let status):
            return "Failed to save to Keychain with status: \(status)"
        case .readFailed(let status):
            return "Failed to read from Keychain with status: \(status)"
        case .deleteFailed(let status):
            return "Failed to delete from Keychain with status: \(status)"
        }
    }
}
