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