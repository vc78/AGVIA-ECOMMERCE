# AGVIA — Women's Wear Boutique Platform
## Comprehensive Technical & Architecture Documentation

---

## 1. Executive Summary

**AGVIA** is a full-stack, enterprise-grade e-commerce application designed specifically for premium women's fashion, ethnic wear, contemporary silhouettes, festive apparel, and occasion bridal collections. The system is engineered to handle high-throughput seasonal traffic, offering seamless customer ordering, automated coupon/promotions enforcement, reliable payment gateways (Razorpay and Cash on Delivery), real-time order tracking, an administrative ERP suite, and a built-in privacy-conscious **Website Analytics Engine**.

### Key Objectives Achieved
- **Clean Customer Journey**: Fast catalog discovery, rich visual presentation, transparent pricing, dynamic offers, real-time cart synchronization, and single-page checkout.
- **Cart Isolation & Security**: Per-user cart isolation preventing data leakage between shared devices, with automatic guest-to-user cart migration upon authentication.
- **Resilient Financial Transactions**: Server-side HMAC-SHA256 signature verification for Razorpay, atomic database stock reservation, and clear post-delivery COD reconciliations.
- **Real-Time Website Analytics**: Native event tracking for live visitors, total sessions, bounce rate, top pages, referrer sources, device breakdowns, and hourly traffic histograms.
- **Real-Time Administrative Suite**: Live order monitoring, multi-attribute customer tracking, instant coupon activation/deactivation toggles, and inventory threshold alerts.
- **Production Architecture**: React 18 + Vite deployed on **Vercel**, Java 21 Spring Boot 3.5.3 deployed on **Render**, and managed MySQL 8.0 on **Aiven Cloud**.

---

## 2. Architecture & Technology Stack

### High-Level System Architecture

```text
                                [ Web Browser / Mobile Client ]
                                               │
                                               ▼
                              ┌─────────────────────────────────┐
                              │  Vercel Edge Network / CDN      │
                              │  React 18 + Vite (SPA)          │
                              └────────────────┬────────────────┘
                                               │ HTTPS REST & Analytics Beacons
                                               ▼
                              ┌─────────────────────────────────┐
                              │  Render Web Service             │
                              │  Spring Boot 3.5.3 (Java 21)    │
                              └────────────────┬────────────────┘
                                               │
                      ┌────────────────────────┼────────────────────────┐
                      │                        │                        │
                      ▼                        ▼                        ▼
           ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
           │ Aiven Cloud MySQL 8 │  │ Razorpay Gateway    │  │ Gmail SMTP / Twilio │
           │ (defaultdb)         │  │ (Payments & Verif)  │  │ (Email & OTP Alert) │
           └─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### Technology Matrix

| Layer | Technologies & Libraries | Rationale |
|---|---|---|
| **Frontend Framework** | React 18.3.1, Vite 5.4.2 | High-performance build tooling, sub-second HMR, optimized production chunks |
| **State Management** | Redux Toolkit, Custom React Hooks | Predictable authentication state, isolated cart lifecycle, responsive UI |
| **Styling & UI** | TailwindCSS, Lucide React, Framer Motion | Modern boutique aesthetics, fluid micro-interactions, responsive grid |
| **HTTP Client** | Axios 1.7.4 | Request interceptors, JWT attachment, automatic exponential backoff retry for GETs |
| **Backend Framework** | Java 21, Spring Boot 3.5.3 | High-throughput virtual threads capability, modern LTS Java, robust dependency ecosystem |
| **Security & Auth** | Spring Security 6, JJWT (0.12.6), BCrypt | Stateless JWT authorization, role-based controls (`ROLE_USER`, `ROLE_ADMIN`), HSTS |
| **Persistence & ORM** | Spring Data JPA, Hibernate, MySQL 8 | Relational integrity, ACID transactional checkouts, optimized composite indexing |
| **Cloud Database** | Aiven MySQL Cloud (`defaultdb`) | High availability, automated backups, SSL encryption in transit |
| **Analytics Engine** | Native JPA aggregation queries | Low overhead, real-time ingestion, privacy-first session hashing |
| **API Documentation**| SpringDoc OpenAPI 3, Swagger UI | Interactive REST contract testing, standardized schema generation |
| **DevOps & Containers**| Docker, Docker Compose, Render Blueprint | Multi-stage minimal builds, reproducible local & staging environments |
| **CI / CD** | GitHub Actions | Automated Maven compiling, test validation, Vite builds, and Render deployment triggers |

---

## 3. Project Directory Structure

```text
AGVIA/
├── .github/
│   └── workflows/
│       └── ci.yml                      # GitHub Actions Continuous Integration pipeline
├── docker-compose.yml                  # Multi-container orchestration (MySQL, Backend, Frontend)
├── render.yaml                         # Infrastructure-as-code for Render deployment
├── vercel.json                         # Vercel SPA routing and security headers
├── .env.example                        # Template for containerized and cloud environment variables
├── package.json                        # Root monorepo orchestrator
├── README.md                           # Master repository documentation
├── docs/
│   ├── assests/agvia-logo.png          # High-resolution brand logo
│   └── AGVIA_PRODUCTION_ENGINEERING_MASTER_REPORT.md
│
├── AGVIA - BACKEND/                    # Spring Boot REST API
│   ├── pom.xml                         # Maven dependencies & build plugins
│   ├── Dockerfile                      # Multi-stage Maven -> JRE 21 Alpine container
│   └── src/main/
│       ├── java/com/ems/pragathisweets/
│       │   ├── PragathiSweetsApplication.java
│       │   ├── config/                 # SecurityConfig, CorsConfig, RequestCorrelationFilter, DataInitializer
│       │   ├── controller/             # AuthController, ProductController, CartController, OrderController, etc.
│       │   │   ├── admin/              # AdminUserController, AdminOrderController, AdminAnalyticsController
│       │   │   └── AnalyticsCollectorController.java
│       │   ├── dto/                    # Request/Response Data Transfer Objects & Analytics DTOs
│       │   ├── entity/                 # JPA Entities (User, Product, Order, OrderItem, Coupon, AnalyticsEvent)
│       │   ├── exception/              # GlobalExceptionHandler and domain exceptions
│       │   ├── mapper/                 # Entity-DTO mapping components
│       │   ├── repository/             # Spring Data JPA interfaces & native aggregation queries
│       │   ├── security/               # JwtService, JwtAuthenticationFilter, LoginRateLimiterFilter
│       │   └── service/                # Business logic, OrderService, AnalyticsService, RazorpayService
│       └── resources/
│           ├── application.properties  # Base configuration with environment overrides
│           └── application-prod.properties # Hardened production profile
│
└── AGVIA  - FRONTEND/                  # React + Vite Single Page Application
    ├── package.json                    # Frontend dependencies & build scripts
    ├── vite.config.js                  # Vite configuration & chunk optimization
    ├── tailwind.config.js              # Boutique design tokens & responsive breakpoints
    ├── index.html                      # Entry HTML with meta & SEO tags
    └── src/
        ├── App.jsx                     # Application router & route guards
        ├── main.jsx                    # React root with ErrorBoundary & Redux Provider
        ├── components/
        │   ├── admin/                  # AdminLayout, DataTable, MetricCards, AnalyticsCharts
        │   ├── common/                 # ErrorBoundary, ReliableImage, SkeletonLoaders
        │   └── customer/               # Navbar, Footer, ProductCard, OfferBanner, BottomNavigation
        ├── hooks/
        │   ├── useCart.js              # Per-user isolated cart hook with guest migration
        │   └── useAnalyticsTracker.js  # Automatic privacy-friendly page view beacon
        ├── pages/
        │   ├── admin/                  # Dashboard, Analytics, OrdersManagement, Customers, Inventory, Coupons
        │   └── customer/               # Home, Products, ProductDetails, Cart, Checkout, Orders, Profile
        ├── services/
        │   ├── api.js                  # Axios instance with timeout, retry, and auth interceptors
        │   ├── analyticsService.js     # Analytics API client
        │   ├── authService.js          # Authentication API calls
        │   ├── adminService.js         # Administrative operations
        │   ├── orderService.js         # Order creation & history APIs
        │   └── productService.js       # Catalog querying APIs
        └── store/                      # Redux store and authSlice
```

---

## 4. Key Functional Modules

### 4.1 Customer Experience & Catalog Discovery
- **Hero & Curated Showcase**: Features seasonal hero banners, highlighted bestseller carousels, and quick-filter category chips without disruptive popups.
- **Product Details & Sizing**: Rich imagery with fallbacks, occasion tags, sizing selector (XS, S, M, L, XL, XXL), fabric details, and customer reviews.
- **Per-User Cart Lifecycle**:
  - Unauthenticated visitors store items under `agvia_cart_guest`.
  - When an authenticated customer logs in, their cart key switches to `agvia_cart_{userId}`.
  - Any items chosen while browsing anonymously are automatically merged into their account cart without losing selections.
  - Logging out immediately purges sensitive session states and clears guest bleed.
- **Responsive Mobile Navigation**:
  - Static bottom navigation bar fixed above device notch.
  - Direct profile sign-in / sign-out button in mobile drawer.

### 4.2 Order Checkout & Payment Processing
- **Server-Side Delivery Fee Engine**: Orders below ₹999 incur a standard delivery fee of ₹50; orders of ₹999 or higher qualify for free priority delivery.
- **Dynamic Coupon Validation**:
  - The client submits coupon codes to `POST /api/coupons/apply`.
  - The server verifies minimum spend, expiry date, usage limit, and active status before returning the precise discount amount.
- **Payment Method A — Razorpay (Card / UPI / NetBanking)**:
  1. Frontend calls `/api/payments/create-order`.
  2. Backend generates a Razorpay Order ID using official SDK credentials.
  3. Customer completes authentication inside Razorpay's checkout modal.
  4. Frontend sends signature back to `/api/payments/verify`.
  5. Backend recalculates HMAC-SHA256 using the server's private secret and transitions the order status to `CONFIRMED`.
- **Payment Method B — Cash on Delivery (COD)**:
  - Bypasses payment gateways initially; places order in `PENDING` payment status and `CONFIRMED` fulfillment status.
  - Upon physical delivery, delivery staff collects payment, and administrators update the order to `DELIVERED` with `paymentStatus = PAID`.

### 4.3 Website Analytics Engine
- **Client Tracker Hook (`useAnalyticsTracker.js`)**:
  - Tracks page views on route changes automatically using lightweight `navigator.sendBeacon` or non-blocking async POST.
  - Generates an anonymous, ephemeral session identifier stored in `sessionStorage` (no cross-site tracking cookies).
  - Captures device category (Desktop, Mobile, Tablet), browser, referrer URL, and duration.
- **Event Collector (`/api/analytics/collect`)**:
  - Public ingestion endpoint with rate limiting to prevent spam.
  - Persists events to the `analytics_events` table asynchronously without blocking main request threads.
- **Admin Analytics Dashboard (`/admin/analytics`)**:
  - **Live Pulse**: Real-time active users over the last 30 minutes.
  - **KPIs**: Total Pageviews, Unique Sessions, Avg Session Duration, Bounce Rate.
  - **Charts**: Hourly traffic histogram, Top 10 most visited pages, Traffic source attribution, Device distribution.

---

## 5. Security & Authentication Architecture

1. **Authentication & Password Security:**
   - Passwords hashed using `BCryptPasswordEncoder` (strength 10).
   - Passwords and OTP hashes are excluded from DTO serialization.
   - JWT tokens are signed using HMAC-SHA256 with 24-hour expiration (`JwtTokenProvider.java`).
2. **OTP Security (`MobileOtpAuthService.java`):**
   - Cryptographically random 6-digit generation via `SecureRandom`.
   - Stored as BCrypt hash; raw OTP is never persisted.
   - 5-minute hard expiration window.
   - Maximum 5 verification attempts per challenge.
   - 60-second resend cooldown.
3. **Authorization & RBAC (`SecurityConfig.java`):**
   - Public paths: `/api/products/**`, `/api/categories/**`, `/api/auth/**`, `/api/health`, `/api/analytics/collect`.
   - Customer paths: `/api/orders/**`, `/api/cart/**`, `/api/payments/**` (requires `ROLE_USER` or `ROLE_ADMIN`).
   - Admin paths: `/api/admin/**` (strictly requires `ROLE_ADMIN`).

---

## 6. Environment Setup & Deployment

### 6.1 Cloud Deployment Architecture
- **Frontend**: Hosted on [Vercel](https://vercel.com) connecting to the production Render backend via `VITE_API_URL`.
- **Backend**: Hosted on [Render](https://render.com) using the root `render.yaml` specification.
- **Database**: Managed MySQL 8.0 on [Aiven Cloud](https://aiven.io).

### 6.2 Local Development

1. **Start Backend**:
```powershell
cd "AGVIA - BACKEND"
mvn spring-boot:run
```
API available at `http://localhost:8080`.  
Swagger UI: `http://localhost:8080/swagger-ui.html`.

2. **Start Frontend**:
```powershell
cd "AGVIA  - FRONTEND"
npm install
npm run dev
```
Application UI available at `http://localhost:5173`.

---

## 7. Default Administrator Credentials

On first run, the system automatically initializes an administrative user:
- **Email**: `admin@agvia.com` (or configured via `DEFAULT_ADMIN_EMAIL`)
- **Password**: `agvia@123` (or configured via `DEFAULT_ADMIN_PASSWORD`)
- **Admin Portal URL**: `https://agvia-ecommerce.vercel.app/admin/login`

> [!IMPORTANT]
> Change the default admin password immediately in production via the administrative profile settings.
