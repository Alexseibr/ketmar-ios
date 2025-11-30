# KETMAR Market

## Overview
KETMAR Market is a Telegram-based marketplace for buying and selling goods, featuring seasonal promotions and robust product categorization. It aims to provide a comprehensive and intuitive e-commerce experience within Telegram through a REST API, Telegram bot, React admin panel, and React Telegram MiniApp. The project focuses on efficient advertisement management, engaging UIs with 3D icons, real-time chat, and leveraging Telegram's mobile-first reach to establish a user-friendly platform.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The Telegram MiniApp features a fixed layout with a scrollable content area, sticky header, and fixed bottom tabs. It's mobile-first, using "radius-first" navigation, elderly-friendly sizing, and accessibility features. Custom Neon UI Kit is used for a Matrix/Cyberpunk aesthetic in analytics. Key components like `ScreenLayout` and `Keyboard-Aware BottomTabs` ensure a smooth user experience. A 5-step Ad Creation Wizard simplifies item listing. Ad cards display essential information, and category icons are 3D WebP images with lazy loading. The Admin Panel uses a tabbed interface.

### Technical Implementations
The backend uses Node.js with Express.js for RESTful APIs and Telegram bot logic, secured by JWT. MongoDB Atlas with Mongoose stores data. Nominatim OSM handles geocoding, supporting geo-search and radius-based queries. The Telegram bot is built with Telegraf. Both the Admin Panel and MiniApp are React applications (TypeScript, Vite), supporting Telegram Login, one-time links, and SMS authentication. The MiniApp is also web-responsive. Image optimization includes lazy loading, skeleton shimmers, responsive images, and a server-side media proxy with WebP conversion. Performance is optimized via code splitting, data prefetching, Gzip, and ETags. A dedicated REST API serves native mobile apps, and a Mobile Push Notifications System uses FCM/APNs with Telegram as a fallback, supporting geo-targeting.

### System Design Choices
The system employs a modular backend. Order data is denormalized, and all photo access is via a secure server-side proxy. A "radius-first" architecture drives ad listings. Core features include a Fast Market Scoring System, AI-powered Farmer Tips, deferred ad publishing, Price Comparison, Favorites with notifications, and Ad History Tracking. Category management offers Auto-Suggestion, an Evolution System, and Dynamic Visibility. A Smart Search System provides fuzzy matching and category suggestions. Local Trends Analytics and a Hot Search System track demand. A Scope Toggle allows "local" vs. "country" ad listings. Specialized Farmer Category System and Farmer Cabinet Dashboard support agricultural products, including a three-tier Farmer Monetization System and a Seasonal Fairs System. The Media Upload System manages files, and the Ad Lifecycle System handles expiration. Search Alerts and Demand Notification systems provide user notifications. An AI Layer unifies text generation, personalized recommendations, and content moderation. A Geo-Intelligence Map System offers real-time geo-analytics. A Multi-Platform Authentication System uses unified JWT. A Seller Stores System provides dedicated storefronts with analytics (Store PRO Analytics) and a Campaign Analytics System. A Unified Shop Cabinet offers a role-aware seller interface. Advanced AI features include MEGA-ANALYTICS 10.0, MEGA-PROMPT 14.0 Digital Twin, MEGA-PROMPT 13.0 AI Dynamic Pricing, MEGA-PROMPT 15.0 Seller's Digital Twin, and MEGA-PROMPT 17.0 AI Recommendations. A Rating & Anti-Fraud System tracks user interactions. An Admin Panel manages sellers, farmers, moderation, and analytics. A Free Giveaway System provides a dedicated section for free items with a simplified posting flow and specific subcategories, indicated by `isFreeGiveaway: true`.

## External Dependencies

### Database Services
- **MongoDB Atlas**: Cloud-hosted NoSQL database.

### Third-Party APIs
- **Telegram Bot API**: For Telegram bot interactions.
- **Nominatim OSM**: For geocoding services.
- **Firebase Cloud Messaging (FCM)**: For Android push notifications.
- **Apple Push Notification service (APNs)**: For iOS push notifications.

### Cloud Services
- **Google Cloud Storage**: For photo uploads and storage.

## Multiple Seller Roles System

### Overview
A seller can have multiple roles simultaneously (e.g., BLOGGER + ARTISAN). The system supports role combinations with merged features and capabilities.

### Supported Roles
- **SHOP**: Regular retail store
- **FARMER**: Agricultural producer
- **BLOGGER**: Author brand / content creator
- **ARTISAN**: Handmade crafts maker

### Model Structure (SellerProfile)
- `role`: Primary role (string) - backward compatible
- `roles`: Array of roles - supports multiple roles
- `primaryRoleIndex`: Index of primary role in roles array

### API Endpoints
- `POST /api/seller-profile/my/roles` - Add a role
- `DELETE /api/seller-profile/my/roles/:role` - Remove a role
- `PUT /api/seller-profile/my/roles/primary` - Set primary role

### Frontend Integration
- ShopCabinetPage displays all roles as clickable badges in header
- Tabs/features/fairs are per-role (not merged) - based on currently selected role
- Role switching updates tabs, features, and triggers data reload
- Single-role helpers used: `getTabsForRole(shopRole)`, `getFairsForRole(shopRole)`
- `shopRoles` array only used for badge display and checking `hasMultipleRoles`

### Backend Query Pattern
```javascript
// Support both single role and multiple roles
$or: [
  { role: 'BLOGGER' },
  { roles: 'BLOGGER' },
]
```

### Key Files
- `models/SellerProfile.js` - Schema with roles array
- `api/routes/seller-profile.js` - Role management endpoints
- `miniapp/src/config/businessConfig.ts` - Multi-role utility functions
- `miniapp/src/pages/ShopCabinetPage.tsx` - UI for multiple roles

## Zone-Adaptive HomePage

### Overview
The HomePage dynamically adapts its layout and content based on the user's geographic zone (village, suburb, or city_center). The GeoZoneClassifier analyzes user coordinates to determine their zone.

### Debug Mode for QA Testing
Use URL query parameter `?debugZone=village|suburb|city_center` to test zone-specific layouts without GPS.

**Test URLs:**
- `/?debugZone=village` - Village zone (larger elements, simpler UI)
- `/?debugZone=suburb` - Suburban zone (balanced layout)
- `/?debugZone=city_center` - City center zone (compact, refined elements)

### How Debug Mode Works
1. Frontend passes `zone` parameter to `/api/home/config`
2. API uses default Minsk coordinates when no real coords provided
3. Real content blocks are fetched, only zone metadata is overridden
4. Debug banner with zone switcher appears at top of page
5. Zone-specific CSS classes (`.zone-village`, `.zone-suburb`, `.zone-city_center`) applied

### API Endpoint
`GET /api/home/config?zone=village|suburb|city_center`
- Accepts `zone` parameter to force zone classification
- Works without lat/lng when zone is specified
- Returns real block content with forced zone metadata

### Zone-Specific UI Config
- **Village**: Large buttons, simple card style, no animations, 3-column category grid
- **Suburb**: Medium buttons, standard cards, animations enabled, 4-column grid  
- **City Center**: Small buttons, minimal cards, fast animations, 5-column grid

### Key Files
- `miniapp/src/pages/HomePage.tsx` - Debug mode logic and zone switching
- `miniapp/src/styles/global.css` - Zone-specific CSS variables
- `api/routes/home-config.js` - API with forceZone support
- `services/HomeDynamicEngine.js` - Zone classification and block generation
- `services/GeoZoneClassifier.js` - Geographic zone detection

## Category Grid System

### GradientCategoryGrid Component
Located at `miniapp/src/components/GradientCategoryGrid.tsx`, displays quick access category icons in a 4-column grid on the home page.

### Always Visible Categories
- **Фермеры** (farmer-market) - Green gradient, lettuce emoji
- **Выпечка** (vypechka) - Orange/yellow gradient, baguette emoji
- **Даром** (darom) - Pink gradient, gift emoji, HOT badge
- **Из рук в руки** (iz-ruk-v-ruki) - Purple gradient, 3D handshake image

### Dynamic Categories (shown based on ad count)
- **Услуги** (uslugi) - Indigo gradient, wrench emoji - services category
- **Техника** (elektronika), **Одежда** (odezhda), **Для дома** (dlya-doma), **Авто** (avto), etc.

### 3D Icons
Category icons can use either emoji or 3D images. Image-based icons are stored in `attached_assets/generated_images/` and imported in the component.

## Local Demand Feature

### Overview
Shows what people are searching for in the user's area, helping sellers create relevant ads.

### Components
- **Banner Card** on HomePage - "В вашем районе ищут" with indigo gradient
- **LocalDemandPage** (/local-demand) - Full list with radius selector and clickable chips
- **API** /api/local-demand - Returns filtered search queries with progressive radius expansion

### Stop-Words Filtering
Comprehensive STOP_WORDS array filters:
- Profanity and offensive content
- Drugs and prohibited substances
- Weapons and violence
- Adult content
- Stolen/counterfeit goods
- Service-related terms (электрик, сантехник, ремонт, услуги, etc.)

### Key Files
- `api/routes/local-demand.js` - API endpoint with filtering
- `miniapp/src/pages/LocalDemandPage.tsx` - Full demand list page
- `services/HomeDynamicEngine.js` - Banner card configuration

## Workers & Services Module (YouDo-style)

### Overview
Separate service module for finding contractors and posting service requests. Accessible via "Услуги и Мастера" banner on HomePage, NOT integrated into main ad search.

### Models
- **Worker** - Contractor profile with ratings, portfolio, service areas
- **WorkerOrder** - Service requests from customers
- **WorkerResponse** - Worker responses/bids on orders
- **WorkerCategory** - Service categories (plumber, electrician, etc.)
- **WorkerPortfolio** - Work examples for workers
- **WorkerReview** - Customer reviews

### API Endpoints
- `GET /api/workers` - List workers with geo-search
- `POST /api/workers/register` - Worker registration
- `GET /api/worker-orders` - List orders with geo-search ($geoWithin)
- `POST /api/worker-orders` - Create order (customerId optional)
- `GET /api/worker-orders/:id` - Order details with customer/worker info
- `GET /api/worker-orders/:id/responses` - Paginated responses with worker enrichment
- `POST /api/worker-responses` - Create response to order

### Frontend Pages
- `/services-workers` - ServicesWorkersPage (workers list, order tabs)
- `/worker-profile/:id` - WorkerProfilePage (worker details, portfolio)
- `/create-worker-order` - CreateWorkerOrderPage (order creation form)
- `/worker-order/:id` - WorkerOrderDetailPage (order with responses)

### Geo-Search Implementation
Uses `$geoWithin` with `$centerSphere` instead of `$nearSphere` to allow sorting:
```javascript
query['location.geo'] = {
  $geoWithin: {
    $centerSphere: [[lng, lat], radiusKm / 6378.1]
  }
};
```

### Key Files
- `models/Worker.js` - Worker schema with 2dsphere index
- `models/WorkerOrder.js` - Order schema with optional customerId
- `api/routes/worker-orders.js` - Order CRUD with geo-search
- `services/workers/WorkerMatchingService.js` - Intelligent matching
- `miniapp/src/pages/ServicesWorkersPage.tsx` - Main workers page