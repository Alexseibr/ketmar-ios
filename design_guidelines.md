# Design Guidelines: Telegram Marketplace Bot

## Design Approach

**System Selection**: Material Design 3 principles adapted for Telegram's ecosystem  
**Primary Interface**: Telegram Bot with inline keyboards and rich media  
**Secondary Interface**: Web admin panel for marketplace management

**Justification**: Material Design provides clear hierarchy and interaction patterns perfect for data-heavy marketplace content while maintaining mobile-first principles essential for Telegram users.

---

## Typography

**Primary Font**: System fonts (Telegram native)
- **Headings**: Bold, 16-18px for product titles
- **Body**: Regular, 14px for descriptions
- **Metadata**: Regular, 12px for prices, categories, timestamps
- **CTAs**: Medium weight, 14px for action buttons

---

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, and 8
- Card padding: `p-4`
- Section spacing: `gap-6` or `gap-8`
- Button spacing: `px-6 py-2`
- Grid gaps: `gap-4`

**Container Strategy**:
- Web admin: `max-w-7xl` for dashboards
- Product cards: `max-w-sm` for optimal preview
- Forms: `max-w-2xl` for comfortable input

---

## Telegram Bot Interface Design

### Message Composition
- **Product Cards**: Photo + Title + Price + Category + Description (truncated to 2 lines) + "View Details" inline button
- **List Views**: Compact format with thumbnail (100x100px), title, price in single row
- **Category Navigation**: Inline keyboard with 2 columns, max 6 categories per page
- **Search Results**: Grid of 2 columns on mobile with product thumbnails

### Inline Keyboards Layout
- **Primary Actions**: Full-width buttons (Add to Cart, Buy Now, Contact Seller)
- **Navigation**: 2-3 buttons per row (◀️ Back | 🏠 Home | ▶️ Next)
- **Filters**: Compact 2-column grid (📱 Electronics | 👕 Fashion | 🏠 Home | 🎮 Games)

### Rich Media Presentation
- **Product Images**: Always include high-quality photos, 1200x1200px optimal
- **Image Galleries**: Carousel format using Telegram's native media groups (max 10 images)
- **Thumbnails**: 300x300px for list views

---

## Web Admin Panel Design

### Dashboard Layout
**Hero Section**: Stats cards in 4-column grid (`grid-cols-4`)
- Total Products | Active Listings | Revenue | Pending Orders
- Icons from Heroicons (outline style)
- Large numbers (24px bold) with labels below (12px regular)

### Product Management
**Table View**: 
- Columns: Thumbnail | Title | Category | Price | Stock | Status | Actions
- Row height: `h-16` with centered content
- Sticky header with `shadow-sm`

**Product Creation Form**:
- Two-column layout (`grid-cols-2`) for desktop
- Single column on mobile
- Image upload zone: Large dropzone with preview grid below (4 columns)
- Fields: Title, Description (textarea), Price, Category (select), Stock, Images (multi-upload)

### Navigation
**Sidebar** (Desktop):
- Fixed left sidebar, `w-64`
- Vertical navigation with icons
- Sections: Dashboard, Products, Orders, Categories, Settings

**Top Bar** (Mobile):
- Hamburger menu
- Compact navigation drawer

---

## Component Library

### Cards
- **Product Card**: Rounded corners (`rounded-lg`), shadow on hover, image aspect ratio 1:1
- **Stat Card**: Subtle background, prominent number display, icon in top-right
- **Order Card**: Timeline-style with status indicators

### Buttons
- **Primary CTA**: Solid background, `rounded-md`, `px-6 py-3`
- **Secondary**: Outline style, same dimensions
- **Icon Buttons**: Square `w-10 h-10`, centered icon

### Forms
- **Input Fields**: Border style, `rounded-md`, `h-12`, focus ring on interaction
- **Dropdowns**: Custom styled select with chevron icon
- **File Upload**: Drag-and-drop zone with preview thumbnails below

### Data Display
- **Tables**: Striped rows for readability, `hover:bg-gray-50` on rows
- **Status Badges**: Rounded pills (`rounded-full px-3 py-1`) with color coding (green=active, yellow=pending, red=inactive)

---

## Images

### Web Admin Panel
**Dashboard Hero**: No large hero image - focus on functional stats dashboard
**Product Placeholders**: Include generic product category images when products lack photos
**Empty States**: Illustrative SVGs for empty product lists, orders (e.g., "No products yet - Add your first product")

### Telegram Bot
**All product listings MUST include photos** - use placeholder images if merchant hasn't uploaded
**Category Icons**: Emoji or simple icons for quick category recognition in inline keyboards

---

## Animations

**Minimal and Purposeful**:
- Smooth transitions on hover states (buttons, cards): 150ms ease
- Loading spinners for data fetching
- Slide-in for mobile navigation drawer
- No scroll-triggered animations

---

## Key Principles

1. **Mobile-First**: 90% of Telegram users are on mobile - optimize for thumb-friendly touch targets
2. **Fast Loading**: Compress images, lazy load product galleries
3. **Clear Hierarchy**: Price and product title always most prominent
4. **Trust Signals**: Display seller ratings, verified badges, secure payment indicators
5. **Efficient Navigation**: No more than 3 taps to reach any product from home