//
//  DeviceRegistrationNetworkService.swift
//  KetmarMarket
//
//  Created by Daniil Yarmolyuk on 8.12.25.
//

import Foundation

private enum DeviceRegistrationRequest {
    static let registration = "/api/mobile/v1/devices/register"
}

final class DeviceRegistrationNetworkService {

    private let networkService: Networking

    // MARK: - Initialization

    init(networkService: Networking) {
        self.networkService = networkService
    }

    // MARK: - Register Device

    func register(data: DeviceRegistrationData) async throws {
        var parameters: Parameters = [
            "deviceId": data.deviceID,
            "platform": data.platform,
            "pushToken": data.pushToken,
            "appVersion": data.appVersion,
            "osVersion": data.osVersion,
            "deviceModel": data.deviceModel
        ]
        
        if let geoLat = data.geoLat, let geoLon = data.geoLon {
            parameters["geo"] = [
                "lat": geoLat,
                "lng": geoLon
            ]
        }
        
        let apiParameters = ApiRequestParameters(
            urlPostfix: DeviceRegistrationRequest.registration,
            method: .post,
            authorization: .bearerType(data.authToken),
            parameters: parameters
        )

        return try await networkService.requestWithEmptyResponse(apiParameters)
    }
}
