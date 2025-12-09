//
//  ConfigurationService.swift
//  KetmarMarket
//
//  Created by Daniil Yarmolyuk on 9.12.25.
//

import CoreLocation
import Foundation
import UIKit

class ConfigurationService {

    private let locationManager: LocationManager
    private let configurationNetworkService: ConfigurationNetworkService
    
    init(
        locationManager: LocationManager,
        configurationNetworkService: ConfigurationNetworkService
    ) {
        self.locationManager = locationManager
        self.configurationNetworkService = configurationNetworkService
    }
    
    func fetchConfiguration() async throws -> ConfigurationResponse? {
        // Запросить актуальную локацию перед получением конфига
        if locationManager.isAuthorized {
            locationManager.requestLocation()
        }
        
        let platform = "ios"
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let location = locationManager.currentLocation
        let lat = location?.coordinate.latitude
        let lng = location?.coordinate.longitude

        return try await configurationNetworkService.getConfiguration(
            platform: platform,
            version: version,
            lat: lat,
            lng: lng
        )
    }
}
