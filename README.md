# KETMAR Market - iOS Application

Native iOS приложение для маркетплейса KETMAR Market.

## Структура проекта

```
ketmar-ios/
├── KetmarMarket/     # Основной код приложения (SwiftUI)
├── Fastlane/         # Автоматизация сборки и деплоя
└── docs/             # API документация
```

## Начало работы

1. Откройте `KetmarMarket/` в Xcode
2. Настройте Bundle ID: `by.ketmar.market`
3. Запустите на симуляторе или устройстве

## API Endpoints

| Окружение | URL |
|-----------|-----|
| Development | `https://miniapp-alexseibr.replit.app/api` |
| Production | `https://ketmar.by/api` |

## Документация

- [iOS Developer Guide](docs/iOS_DEVELOPER_GUIDE.md) — API endpoints и Swift модели
- [GitHub Setup](docs/GITHUB_IOS_SETUP.md) — CI/CD настройка

## Требования

- iOS 15.0+
- Xcode 15+
- Swift 5.9+

## Контакты

Telegram: @KetmarM_bot
