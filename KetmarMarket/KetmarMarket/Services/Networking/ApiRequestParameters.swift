//
//  ApiRequestParameters.swift
//  KetmarMarket
//
//  Created by Daniil Yarmolyuk on 8.12.25.
//

import Foundation

typealias Parameters = [String: Any]

struct ApiRequestParameters {
    let urlPostfix: String
    let method: HTTPMethod
    let authorization: Authorization
    let parameters: Parameters?
    let headers: [String: String]?
    
    init(
        urlPostfix: String,
        method: HTTPMethod,
        authorization: Authorization = .none,
        parameters: Parameters? = nil,
        headers: [String: String]? = nil
    ) {
        self.urlPostfix = urlPostfix
        self.method = method
        self.authorization = authorization
        self.parameters = parameters
        self.headers = headers
    }
}
