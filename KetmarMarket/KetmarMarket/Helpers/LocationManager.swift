//
//  LocationManager.swift
//  KetmarMarket
//
//  Created by Daniil Yarmolyuk on 8.12.25.
//

import Foundation
import CoreLocation

class LocationManager: NSObject {
    
    private let manager = CLLocationManager()
    
    var currentLocation: CLLocation? {
        return manager.location
    }
    
    var authorizationStatus: CLAuthorizationStatus {
        return manager.authorizationStatus
    }
    
    var isAuthorized: Bool {
        switch manager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            return true
        case .notDetermined, .restricted, .denied:
            return false
        @unknown default:
            return false
        }
    }
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }
    
    /// Запросить разрешение на использование геолокации (when in use)
    func requestLocationPermission() {
        let status = manager.authorizationStatus
        
        switch status {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            print("Location access denied or restricted")
        case .authorizedWhenInUse, .authorizedAlways:
            print("Location already authorized")
        @unknown default:
            break
        }
    }
    
    /// Начать получение обновлений геолокации
    func startUpdatingLocation() {
        guard isAuthorized else {
            print("Location not authorized, requesting permission")
            requestLocationPermission()
            return
        }
        
        manager.startUpdatingLocation()
    }
    
    /// Остановить получение обновлений геолокации
    func stopUpdatingLocation() {
        manager.stopUpdatingLocation()
    }
    
    /// Запросить текущую локацию один раз
    func requestLocation() {
        guard isAuthorized else {
            print("Location not authorized, requesting permission")
            requestLocationPermission()
            return
        }
        
        manager.requestLocation()
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationManager: CLLocationManagerDelegate {
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        print("Location updated: \(location.coordinate.latitude), \(location.coordinate.longitude)")
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location manager failed with error: \(error.localizedDescription)")
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        print("Location authorization changed: \(status.rawValue)")
        
        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            print("Location access granted")
        case .denied, .restricted:
            print("Location access denied or restricted")
        case .notDetermined:
            print("Location authorization not determined")
        @unknown default:
            break
        }
    }
}
