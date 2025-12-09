//
//  ConfigurationNetworkService.swift
//  KetmarMarket
//
//  Created by Daniil Yarmolyuk on 9.12.25.
//

import Foundation

private enum ConfigurationRequest {
    static let config = "/api/mobile/config"
}

final class ConfigurationNetworkService {

    private let networkService: Networking

    // MARK: - Initialization

    init(networkService: Networking) {
        self.networkService = networkService
    }

    // MARK: - Get Configuration

    func getConfiguration(
        platform: String,
        version: String,
        lat: Double?,
        lng: Double?
    ) async throws -> ConfigurationResponse {
        var parameters: Parameters = [
            "platform": platform,
            "version": version
        ]
        
        if let lat = lat, let lng = lng {
            parameters["lat"] = lat
            parameters["lng"] = lng
        }
        
        let apiParameters = ApiRequestParameters(
            urlPostfix: ConfigurationRequest.config,
            method: .get,
            authorization: .none,
            parameters: parameters
        )

        return try await networkService.request(apiParameters)
    }
}
