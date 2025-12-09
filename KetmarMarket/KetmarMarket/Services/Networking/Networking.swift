//
//  Networking.swift
//  KetmarMarket
//
//  Created by Daniil Yarmolyuk on 8.12.25.
//

import Foundation

protocol Networking {
    func setBaseURL(_ url: String)
    func request<T: Decodable>(_ parameters: ApiRequestParameters) async throws -> T
    func requestWithEmptyResponse(_ parameters: ApiRequestParameters) async throws
}

final class NetworkService: Networking {
    
    private var baseURL: String
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    init(
        baseURL: String,
        session: URLSession = .shared,
        decoder: JSONDecoder = JSONDecoder(),
        encoder: JSONEncoder = JSONEncoder()
    ) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = decoder
        self.encoder = encoder
    }
    
    // MARK: - Public Methods

    func setBaseURL(_ url: String) {
        baseURL = url
    }

    func request<T: Decodable>(_ parameters: ApiRequestParameters) async throws -> T {
        let request = try buildRequest(parameters)
        
        let (data, response) = try await session.data(for: request)
        
        try validateResponse(response, data: data)
        
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingError(error)
        }
    }
    
    func requestWithEmptyResponse(_ parameters: ApiRequestParameters) async throws {
        let request = try buildRequest(parameters)
        
        let (data, response) = try await session.data(for: request)
        
        try validateResponse(response, data: data)
    }
    
    // MARK: - Private Methods
    
    private func buildRequest(_ apiParameters: ApiRequestParameters) throws -> URLRequest {
        guard let url = URL(string: baseURL + apiParameters.urlPostfix) else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = apiParameters.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authorization header
        if let authValue = apiParameters.authorization.headerValue {
            request.setValue(authValue, forHTTPHeaderField: "Authorization")
        }
        
        // Add custom headers
        apiParameters.headers?.forEach { key, value in
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        // Add body for POST, PUT, PATCH
        if let parameters = apiParameters.parameters,
           [HTTPMethod.post, .put, .patch].contains(apiParameters.method) {
            do {
                request.httpBody = try JSONSerialization.data(withJSONObject: parameters, options: [])
            } catch {
                throw NetworkError.encodingError(error)
            }
        }
        
        return request
    }
    
    private func validateResponse(_ response: URLResponse, data: Data) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return
        case 401:
            throw NetworkError.unauthorized
        case 400...499:
            throw NetworkError.httpError(statusCode: httpResponse.statusCode, data: data)
        case 500...599:
            let message = String(data: data, encoding: .utf8) ?? "Unknown server error"
            throw NetworkError.serverError(message)
        default:
            throw NetworkError.httpError(statusCode: httpResponse.statusCode, data: data)
        }
    }
}
