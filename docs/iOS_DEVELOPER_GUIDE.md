# KETMAR Market - Руководство для iOS разработчика

## Содержание
1. [Окружения](#окружения)
2. [Настройка GitHub](#настройка-github)
3. [Аутентификация](#аутентификация)
4. [API Endpoints](#api-endpoints)
5. [Модели данных](#модели-данных)
6. [Примеры кода Swift](#примеры-кода-swift)

---

## Окружения

### Production (Прод)
```
Base URL: https://ketmar.by/api
```

### Development (Разработка)
```
Base URL: https://miniapp-alexseibr.replit.app/api
```

---

## Настройка GitHub

### Шаг 1: Создание репозитория

1. Зайдите на [GitHub](https://github.com) → **New repository**
2. Название: `ketmar-ios`
3. Тип: **Private**
4. Нажмите **Create repository**

### Шаг 2: Создание окружений (Environments)

1. Откройте репозиторий `ketmar-ios`
2. Перейдите в **Settings** → **Environments**
3. Нажмите **New environment**

Создайте два окружения:

#### Окружение `ios-dev`
| Переменная | Значение |
|------------|----------|
| `API_BASE_URL` | `https://miniapp-alexseibr.replit.app/api` |
| `ENVIRONMENT` | `development` |

#### Окружение `ios-prod`
| Переменная | Значение |
|------------|----------|
| `API_BASE_URL` | `https://ketmar.by/api` |
| `ENVIRONMENT` | `production` |

### Шаг 3: Секреты для Apple (в каждом окружении)

| Секрет | Описание | Где взять |
|--------|----------|-----------|
| `APPLE_API_KEY_ID` | ID ключа App Store Connect | App Store Connect → Users and Access → Keys |
| `APPLE_API_KEY_ISSUER` | Issuer ID | App Store Connect → Users and Access → Keys |
| `APPLE_API_KEY_P8` | Содержимое .p8 файла | Скачивается при создании ключа (одноразово!) |
| `APP_STORE_CONNECT_TEAM_ID` | ID команды | App Store Connect → Users and Access |
| `MATCH_PASSWORD` | Пароль для Fastlane Match | Создаёте сами |
| `FIREBASE_PLIST` | GoogleService-Info.plist (base64) | Firebase Console |

### Шаг 4: Добавление разработчика

1. **Settings** → **Collaborators** → **Add people**
2. Введите GitHub username iOS-разработчика
3. Роль: **Write** (или **Maintain** для доступа к настройкам)

### Шаг 5: Защита веток

1. **Settings** → **Branches** → **Add branch protection rule**
2. Branch name pattern: `main`
3. Включите:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging

---

## Аутентификация

### JWT Token Flow

Все защищённые endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <JWT_TOKEN>
```

### Telegram Login (основной способ)

```http
POST /api/auth/telegram
Content-Type: application/json

{
  "initData": "<Telegram WebApp initData string>"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "_id": "...",
    "telegramId": 123456789,
    "username": "user123",
    "firstName": "Иван",
    "lastName": "Иванов",
    "phone": "+375291234567"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### SMS Login (альтернативный)

#### Запрос кода
```http
POST /api/phone-auth/request
Content-Type: application/json

{
  "phone": "+375291234567"
}
```

#### Проверка кода
```http
POST /api/phone-auth/verify
Content-Type: application/json

{
  "phone": "+375291234567",
  "code": "123456"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <expired_token>
```

### Получение профиля
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## API Endpoints

### Объявления (Ads)

#### Получить ленту объявлений
```http
GET /api/ads
Query params:
  - limit: number (default: 20, max: 100)
  - page: number (default: 1)
  - lat: number (широта пользователя)
  - lng: number (долгота пользователя)
  - radiusKm: number (радиус поиска, км)
  - categorySlug: string
  - sort: "newest" | "cheapest" | "expensive" | "popular" | "smart" | "distance"
```

#### Получить детали объявления
```http
GET /api/ads/:id
```

#### Создать объявление
```http
POST /api/ads
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Название товара",
  "description": "Описание",
  "price": 100,
  "currency": "BYN",
  "categorySlug": "elektronika",
  "subcategorySlug": "telefony",
  "photos": ["https://..."],
  "location": {
    "city": "Минск",
    "address": "ул. Примерная, 1",
    "geo": {
      "type": "Point",
      "coordinates": [27.5615, 53.9045]
    }
  }
}
```

### Поиск

#### Текстовый поиск
```http
GET /api/search/search
Query params:
  - q: string (поисковый запрос)
  - categorySlug: string
  - lat: number
  - lng: number
  - radiusKm: number
  - priceMin: number
  - priceMax: number
  - sort: string
  - limit: number
  - page: number
```

#### Горячие запросы
```http
GET /api/search/hot
Query params:
  - lat: number
  - lng: number
  - limit: number (default: 10)
```

### Категории

#### Дерево категорий
```http
GET /api/categories
Query params:
  - all: boolean (включить скрытые)
```

#### Автоподсказки категорий
```http
POST /api/categories/suggest
Content-Type: application/json

{
  "title": "iPhone 15 Pro Max",
  "description": "Новый телефон Apple"
}
```

### Избранное

#### Мои избранные
```http
GET /api/favorites/my
Authorization: Bearer <token>
```

#### Добавить в избранное
```http
POST /api/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "adId": "...",
  "notifyOnPriceChange": true,
  "notifyOnStatusChange": true
}
```

#### Переключить избранное
```http
POST /api/favorites/toggle
Authorization: Bearer <token>
Content-Type: application/json

{
  "adId": "..."
}
```

#### Удалить из избранного
```http
DELETE /api/favorites/:adId
Authorization: Bearer <token>
```

### Заказы

#### Создать заказ
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "buyerName": "Иван",
  "buyerPhone": "+375291234567",
  "items": [
    { "adId": "...", "quantity": 2 }
  ],
  "comment": "Доставка утром"
}
```

#### Мои заказы
```http
GET /api/orders/my
Authorization: Bearer <token>
```

### Чат

#### Начать чат
```http
POST /api/chat/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "adId": "...",
  "sellerId": "..."
}
```

#### Получить сообщения
```http
GET /api/chat/:conversationId/messages
Authorization: Bearer <token>
Query params:
  - limit: number
  - before: string (cursor)
```

#### Отправить сообщение
```http
POST /api/chat/:conversationId/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Привет! Товар ещё доступен?",
  "attachments": []
}
```

### Уведомления

#### Получить уведомления
```http
GET /api/notifications
Query params:
  - telegramId: number
```

#### Прочитать уведомление
```http
POST /api/notifications/:id/read
```

### Загрузка файлов

#### Получить pre-signed URL для загрузки
```http
POST /api/uploads/presign
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "photo.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "uploadUrl": "https://storage.googleapis.com/...",
  "publicUrl": "https://ketmar.by/media/..."
}
```

### Главная страница

#### Конфигурация домашней страницы
```http
GET /api/home-config
Query params:
  - lat: number
  - lng: number
  - zone: "village" | "suburb" | "city_center" (опционально)
```

### Геолокация

#### Локальный спрос
```http
GET /api/local-demand
Query params:
  - lat: number
  - lng: number
  - radiusKm: number
  - limit: number
```

### Рекомендации

#### Персональная лента
```http
GET /api/recommendations/feed
Authorization: Bearer <token>
Query params:
  - lat: number
  - lng: number
  - limit: number
```

#### Похожие объявления
```http
GET /api/recommendations/similar/:adId
Query params:
  - limit: number
```

---

## Модели данных

### User
```swift
struct User: Codable {
    let id: String
    let telegramId: Int
    let username: String?
    let firstName: String?
    let lastName: String?
    let phone: String?
    let phoneVerified: Bool?
    let role: String?
    let avatar: String?
    let createdAt: Date?
    let lastActiveAt: Date?
}
```

### Ad
```swift
struct Ad: Codable {
    let id: String
    let title: String
    let description: String?
    let price: Double?
    let currency: String
    let photos: [String]?
    let categorySlug: String?
    let subcategorySlug: String?
    let location: AdLocation?
    let sellerTelegramId: Int
    let sellerName: String?
    let sellerAvatar: String?
    let status: String
    let views: Int?
    let favoritesCount: Int?
    let createdAt: Date
    let distanceKm: Double?
    let isFreeGiveaway: Bool?
}

struct AdLocation: Codable {
    let city: String?
    let address: String?
    let geo: GeoPoint?
}

struct GeoPoint: Codable {
    let type: String
    let coordinates: [Double] // [lng, lat]
}
```

### Category
```swift
struct Category: Codable {
    let slug: String
    let name: String
    let icon: String?
    let icon3d: String?
    let level: Int
    let isLeaf: Bool
    let parentSlug: String?
    let subcategories: [Category]?
}
```

### Favorite
```swift
struct Favorite: Codable {
    let adId: String
    let ad: Ad?
    let createdAt: Date
    let notifyOnPriceChange: Bool
    let notifyOnStatusChange: Bool
}
```

### Order
```swift
struct Order: Codable {
    let id: String
    let buyerTelegramId: Int
    let buyerName: String?
    let buyerPhone: String?
    let items: [OrderItem]
    let totalPrice: Double
    let status: String
    let comment: String?
    let createdAt: Date
}

struct OrderItem: Codable {
    let adId: String
    let title: String
    let quantity: Int
    let price: Double
    let currency: String
}
```

---

## Примеры кода Swift

### API Client

```swift
import Foundation

class KetmarAPIClient {
    static let shared = KetmarAPIClient()
    
    #if DEBUG
    private let baseURL = "https://miniapp-alexseibr.replit.app/api"
    #else
    private let baseURL = "https://ketmar.by/api"
    #endif
    
    private var authToken: String?
    
    func setAuthToken(_ token: String) {
        self.authToken = token
    }
    
    func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Encodable? = nil
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(T.self, from: data)
    }
}

enum APIError: Error {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError
}
```

### Использование

```swift
// Получить объявления
struct AdsResponse: Decodable {
    let items: [Ad]
    let total: Int
}

func fetchAds(lat: Double, lng: Double) async throws -> [Ad] {
    let response: AdsResponse = try await KetmarAPIClient.shared.request(
        endpoint: "/ads?lat=\(lat)&lng=\(lng)&limit=20"
    )
    return response.items
}

// Добавить в избранное
struct ToggleFavoriteRequest: Encodable {
    let adId: String
}

struct ToggleFavoriteResponse: Decodable {
    let isFavorite: Bool
}

func toggleFavorite(adId: String) async throws -> Bool {
    let response: ToggleFavoriteResponse = try await KetmarAPIClient.shared.request(
        endpoint: "/favorites/toggle",
        method: "POST",
        body: ToggleFavoriteRequest(adId: adId)
    )
    return response.isFavorite
}
```

---

## Push Notifications

### Регистрация устройства
```http
POST /api/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "platform": "ios",
  "pushToken": "<APNs device token>",
  "deviceId": "<unique device identifier>",
  "appVersion": "1.0.0",
  "osVersion": "17.0",
  "location": {
    "lat": 53.9045,
    "lng": 27.5615
  }
}
```

### Типы уведомлений
- `favorite_price_change` - Изменение цены в избранном
- `favorite_status_change` - Изменение статуса в избранном
- `new_message` - Новое сообщение в чате
- `order_status` - Изменение статуса заказа
- `new_ad_in_alert` - Новое объявление по подписке

---

## Полезные ссылки

- **GitHub репозиторий**: https://github.com/Alexseibr/miniapp
- **Production**: https://ketmar.by
- **Development API**: https://miniapp-alexseibr.replit.app/api
- **Telegram Bot**: @KetmarM_bot

---

## Контакты

При возникновении вопросов обращайтесь к backend-команде через Telegram.
