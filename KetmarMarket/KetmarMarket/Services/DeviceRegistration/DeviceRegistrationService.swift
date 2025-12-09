//
//  DeviceRegistrationService.swift
//  KetmarMarket
//
//  Created by Daniil Yarmolyuk on 8.12.25.
//
import CoreLocation
import Foundation
import UIKit

struct DeviceRegistrationData {
    let deviceID: String
    let authToken: String
    let platform: String = "ios"
    let pushToken: String
    let geoLat: Double?
    let geoLon: Double?
    let appVersion: String
    let osVersion: String
    let deviceModel: String
}

class DeviceRegistrationService {

    var remoteToken: String?
    
    private let locationManager: LocationManager
    private let keychainManager: KeychainManager
    private let deviceRegistrationNetworkService: DeviceRegistrationNetworkService
    
    init(
        locationManager: LocationManager,
        keychainManager: KeychainManager,
        deviceRegistrationNetworkService: DeviceRegistrationNetworkService
    ) {
        self.locationManager = locationManager
        self.keychainManager = keychainManager
        self.deviceRegistrationNetworkService = deviceRegistrationNetworkService
    }

    func updateAuthToken(_ authToken: String?) {
        guard let authToken, isAuthTokenUpdated(authToken) else {
            print("Token is not updated or nil")
            return
        }

        Task {
            do {
                try keychainManager.saveAuthToken(authToken)
                print("Auth token saved/updated successfully")
            } catch {
                print("Failed to save auth token: \(error.localizedDescription)")
            }

            await sendDeviceTokenIfNeeded(force: true)
        }
    }

    func updateRemoteToken(_ remoteToken: String) {
        print("Did register for remote notifications with token \(remoteToken)")
        self.remoteToken = remoteToken

        Task {
            await sendDeviceTokenIfNeeded()
        }
    }

    func faildToRegisterForRemoteNotifications(_ error: Error) {
        print("Failed to register for remote notifications: \(error.localizedDescription)")
        self.remoteToken = nil
    }
}

private extension DeviceRegistrationService {

    func getDeviceID() throws -> String {
        if let existedDeviceID = try? keychainManager.getDeviceID() {
            return existedDeviceID
        }

        let newDeviceID = UUID().uuidString
        try keychainManager.saveDeviceID(newDeviceID)
        return newDeviceID
    }

    func isAuthTokenUpdated(_ newToken: String) -> Bool {
        guard let storedToken = try? keychainManager.getAuthToken() else { return true }
        return storedToken != newToken
    }

    func sendDeviceTokenIfNeeded(force: Bool = false) async {
        guard let authToken = try? keychainManager.getAuthToken() else {
            print("No auth token, skip device registration")
            return
        }
        
        guard let remoteToken = remoteToken else {
            print("No remote push token, skip device registration")
            return
        }

        if !force {
            let storedPushToken = try? keychainManager.getPushToken()
            let isPushTokenChanged = storedPushToken != remoteToken
            
            guard isPushTokenChanged else {
                print("Push token is up to date, no need to send")
                return
            }
        }
        
        guard let deviceID = try? getDeviceID() else {
            print("Failed to get device ID")
            return
        }
        
        let registrationData = prepareRegistrationData(
            deviceID: deviceID,
            authToken: authToken,
            pushToken: remoteToken
        )
        
        await registerDevice(with: registrationData)
    }
    
    func prepareRegistrationData(deviceID: String, authToken: String, pushToken: String) -> DeviceRegistrationData {
        // Запросить актуальную локацию
        if locationManager.isAuthorized {
            locationManager.requestLocation()
        }

        let geoLocation = locationManager.currentLocation
        let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let osVersion = UIDevice.current.systemVersion
        let deviceModel = DeviceModelHelper.getReadableDeviceModel()
        
        return DeviceRegistrationData(
            deviceID: deviceID,
            authToken: authToken,
            pushToken: pushToken,
            geoLat: geoLocation?.coordinate.latitude,
            geoLon: geoLocation?.coordinate.longitude,
            appVersion: appVersion,
            osVersion: osVersion,
            deviceModel: deviceModel
        )
    }
    
    func registerDevice(with data: DeviceRegistrationData) async {
        // TODO: @yada - проверить работоспособность, т.к. сейчас сервер блокирует регистрацию (401)
        do {
            try await deviceRegistrationNetworkService.register(data: data)
            print("Device registered successfully")

            // Сохраняем push token после успешной регистрации
            try? keychainManager.savePushToken(data.pushToken)
        } catch {
            print("Failed to register device: \(error.localizedDescription)")
        }
    }
}

