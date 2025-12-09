//
//  ApplicationSettings.swift
//  KetmarMarket
//
//  Created by Daniil Yarmolyuk on 9.12.25.
//

import Foundation

class ApplicationSettings {
    
    private enum Keys {
        static let baseURL = "applicationSettings.baseURL"
    }
    
    private let userDefaults: UserDefaults
    
    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
    }
    
    // MARK: - Base URL
    
    var baseURL: String? {
        get {
            return userDefaults.string(forKey: Keys.baseURL)
        }
        set {
            if let newValue = newValue {
                userDefaults.set(newValue, forKey: Keys.baseURL)
            } else {
                userDefaults.removeObject(forKey: Keys.baseURL)
            }
        }
    }
}
