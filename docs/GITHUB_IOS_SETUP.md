# Настройка GitHub окружения для iOS разработки

## Быстрый старт (5 минут)

### 1. Создайте репозиторий

1. Откройте https://github.com/new
2. **Repository name**: `ketmar-ios`
3. **Visibility**: Private
4. Нажмите **Create repository**

---

### 2. Настройте окружения

1. Откройте созданный репозиторий
2. **Settings** → **Environments** → **New environment**

#### Окружение: `ios-dev`

Нажмите **New environment**, введите `ios-dev`, нажмите **Configure environment**

**Environment variables** (Add variable):

| Name | Value |
|------|-------|
| `API_BASE_URL` | `https://miniapp-alexseibr.replit.app/api` |
| `ENVIRONMENT` | `development` |

#### Окружение: `ios-prod`

Повторите для `ios-prod`:

| Name | Value |
|------|-------|
| `API_BASE_URL` | `https://ketmar.by/api` |
| `ENVIRONMENT` | `production` |

---

### 3. Добавьте секреты Apple (для обоих окружений)

В каждом окружении → **Environment secrets** → **Add secret**:

| Secret Name | Описание |
|-------------|----------|
| `APPLE_API_KEY_ID` | ID ключа из App Store Connect |
| `APPLE_API_KEY_ISSUER` | Issuer ID из App Store Connect |
| `APPLE_API_KEY_P8` | Содержимое .p8 файла (base64) |
| `APP_STORE_CONNECT_TEAM_ID` | Team ID |
| `MATCH_PASSWORD` | Пароль для Fastlane Match |

**Где найти Apple credentials:**
1. https://appstoreconnect.apple.com → Users and Access → Keys
2. Нажмите "+" чтобы создать новый ключ
3. Выберите роль "App Manager" или "Admin"
4. Скачайте .p8 файл (доступен ТОЛЬКО один раз!)
5. Скопируйте Key ID и Issuer ID

---

### 4. Добавьте разработчика

1. **Settings** → **Collaborators** → **Add people**
2. Введите GitHub username
3. Выберите роль:
   - **Write** — может пушить код
   - **Maintain** — + доступ к настройкам

---

### 5. Защита ветки main

1. **Settings** → **Branches** → **Add branch protection rule**
2. Branch name pattern: `main`
3. Включите:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: `1`
   - ✅ Require status checks to pass

---

## GitHub Actions для CI/CD

Создайте файл `.github/workflows/ios-ci.yml` в репозитории:

```yaml
name: iOS CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    environment: ios-dev
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_15.0.app
      
      - name: Cache DerivedData
        uses: actions/cache@v4
        with:
          path: ~/Library/Developer/Xcode/DerivedData
          key: ${{ runner.os }}-deriveddata-${{ hashFiles('**/*.xcodeproj/project.pbxproj') }}
      
      - name: Install dependencies
        run: |
          gem install bundler
          bundle install
      
      - name: Run tests
        run: bundle exec fastlane scan
        env:
          API_BASE_URL: ${{ vars.API_BASE_URL }}
  
  deploy-testflight:
    needs: build
    runs-on: macos-latest
    environment: ios-prod
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install dependencies
        run: |
          gem install bundler
          bundle install
      
      - name: Deploy to TestFlight
        run: bundle exec fastlane beta
        env:
          API_BASE_URL: ${{ vars.API_BASE_URL }}
          APP_STORE_CONNECT_API_KEY_ID: ${{ secrets.APPLE_API_KEY_ID }}
          APP_STORE_CONNECT_API_KEY_ISSUER: ${{ secrets.APPLE_API_KEY_ISSUER }}
          APP_STORE_CONNECT_API_KEY_CONTENT: ${{ secrets.APPLE_API_KEY_P8 }}
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
```

---

## Структура iOS проекта

Рекомендуемая структура для репозитория `ketmar-ios`:

```
ketmar-ios/
├── KetmarMarket/
│   ├── App/
│   │   ├── KetmarMarketApp.swift
│   │   └── AppDelegate.swift
│   ├── Features/
│   │   ├── Auth/
│   │   ├── Feed/
│   │   ├── Search/
│   │   ├── Favorites/
│   │   ├── Chat/
│   │   └── Profile/
│   ├── Core/
│   │   ├── API/
│   │   │   ├── KetmarAPIClient.swift
│   │   │   └── Endpoints.swift
│   │   ├── Models/
│   │   └── Extensions/
│   ├── Resources/
│   │   └── Assets.xcassets/
│   └── Info.plist
├── KetmarMarketTests/
├── Fastlane/
│   ├── Fastfile
│   ├── Appfile
│   └── Matchfile
├── Gemfile
├── .github/
│   └── workflows/
│       └── ios-ci.yml
└── README.md
```

---

## Fastfile пример

```ruby
# Fastlane/Fastfile

default_platform(:ios)

platform :ios do
  desc "Run tests"
  lane :scan do
    run_tests(
      scheme: "KetmarMarket",
      device: "iPhone 15",
      clean: true
    )
  end

  desc "Deploy to TestFlight"
  lane :beta do
    setup_ci
    
    api_key = app_store_connect_api_key(
      key_id: ENV["APP_STORE_CONNECT_API_KEY_ID"],
      issuer_id: ENV["APP_STORE_CONNECT_API_KEY_ISSUER"],
      key_content: ENV["APP_STORE_CONNECT_API_KEY_CONTENT"]
    )
    
    match(type: "appstore", readonly: true)
    
    increment_build_number(
      build_number: ENV["GITHUB_RUN_NUMBER"]
    )
    
    build_app(
      scheme: "KetmarMarket",
      export_method: "app-store"
    )
    
    upload_to_testflight(
      api_key: api_key,
      skip_waiting_for_build_processing: true
    )
  end
end
```

---

## Чеклист для iOS разработчика

- [ ] Получить доступ к репозиторию `ketmar-ios`
- [ ] Склонировать репозиторий
- [ ] Настроить Xcode проект
- [ ] Добавить API Base URL в конфигурацию
- [ ] Реализовать авторизацию (Telegram / SMS)
- [ ] Реализовать основные экраны:
  - [ ] Лента объявлений
  - [ ] Поиск
  - [ ] Детали объявления
  - [ ] Избранное
  - [ ] Профиль
  - [ ] Чат
- [ ] Настроить Push Notifications
- [ ] Протестировать на устройстве
- [ ] Отправить в TestFlight

---

## Полезные ссылки

- [iOS Developer Guide](./iOS_DEVELOPER_GUIDE.md) — полная API документация
- [App Store Connect](https://appstoreconnect.apple.com)
- [Fastlane Docs](https://docs.fastlane.tools)
- [GitHub Actions для iOS](https://docs.github.com/en/actions/deployment/deploying-xcode-applications)
