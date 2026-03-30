# 🛍️ Fashion Shop API

A full-featured e-commerce backend built with **TypeScript, Express, and SQLite**.

## ✨ Features

- **Authentication & Authorization**: JWT-based auth with role-based access (admin/customer)
- **Product Management**: CRUD, categories, brands, variants (size/color/stock), images
- **Shopping Cart**: Guest & user carts, auto session management
- **Checkout**: Guest checkout, address management, order creation
- **Payments**: Momo & VNPay integration (sandbox ready)
- **Coupons**: Percentage/fixed discounts, usage limits, validation
- **Reviews & Wishlist**: Verified purchases, rating system
- **Admin Dashboard**: Stats, sales reports, inventory, product performance
- **File Uploads**: Image processing with Sharp (auto thumbnails)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone <repo>
cd fashion-shop
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your settings (at least JWT_SECRET)
```

### Database Setup

```bash
# Seed initial data
npm run build
npx ts-node src/seed.ts
```

### Development

```bash
npm run dev
# Server starts at http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

## 📊 API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api` | API info |
| GET | `/api/categories` | List categories |
| GET | `/api/categories/:id` | Get category |
| GET | `/api/brands` | List brands |
| GET | `/api/brands/:id` | Get brand |
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/:id` | Get product |
| GET | `/api/products/:id/variants` | Get product variants |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Current user (with token) |
| POST | `/api/cart/session` | Create cart session |
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/items` | Add to cart |
| PUT | `/api/cart/items/:id` | Update cart item |
| DELETE | `/api/cart/items/:id` | Remove from cart |
| POST | `/api/orders` | Create order (guest/user) |
| GET | `/api/orders/:order_number` | Get order by number |
| POST | `/api/coupons/validate` | Validate coupon |
| GET | `/api/wishlist` | List wishlist (with token) |
| POST | `/api/wishlist` | Add to wishlist (with token) |
| DELETE | `/api/wishlist/:productId` | Remove from wishlist |

### Authenticated (requires Bearer token)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/products/:id/images` | admin/seller | Upload product images |
| DELETE | `/api/upload/products/:id/images/:imageId` | admin/seller | Delete image |
| PUT | `/api/upload/products/:id/images/:imageId/set-primary` | admin/seller | Set primary |
| POST | `/api/addresses` | user | Create address |
| GET | `/api/addresses` | user | List addresses |
| PUT | `/api/addresses/:id` | user | Update address |
| DELETE | `/api/addresses/:id` | user | Delete address |
| PUT | `/api/addresses/:id/set-default` | user | Set default |
| GET | `/api/orders` | user | List user orders |
| GET | `/api/orders/:id` | user | Get order details |
| PUT | `/api/orders/:id/cancel` | user | Cancel order |
| POST | `/api/coupons/:id/apply` | user | Apply coupon to order |
| POST | `/api/reviews` | user | Create review |
| PUT | `/api/reviews/:id` | user | Update review |

### Admin Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/admin/create` | Create admin user |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| POST | `/api/brands` | Create brand |
| PUT | `/api/brands/:id` | Update brand |
| DELETE | `/api/brands/:id` | Delete brand |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/products/:id/variants` | Create variant |
| PUT | `/api/products/:id/variants/:variantId` | Update variant |
| GET | `/api/admin/dashboard/stats` | Dashboard stats |
| GET | `/api/admin/dashboard/recent-orders` | Recent orders |
| GET | `/api/admin/dashboard/sales-report?start_date=&end_date=&group_by=` | Sales report |
| GET | `/api/admin/dashboard/product-performance` | Product metrics |
| GET | `/api/admin/dashboard/inventory` | Inventory status |
| GET/POST/PUT/DELETE | `/api/coupons` | Coupon management |
| GET | `/api/admin/users` | List users (if implemented) |
| PUT | `/api/admin/users/:id/role` | Update user role |

## 💳 Payment Integration

### Momo

1. Register at [Momo Developer Portal](https://test-payment.momo.vn)
2. Get `partnerCode`, `accessKey`, `secretKey`
3. Configure `.env`:
   ```
   MOMO_PARTNER_CODE=your_code
   MOMO_ACCESS_KEY=your_key
   MOMO_SECRET_KEY=your_secret
   MOMO_REDIRECT_URL=http://your-frontend.com/checkout/success
   MOMO_IPN_URL=http://your-backend.com/api/payment/momo/ipn
   ```
4. Create payment:
   ```http
   POST /api/payment/momo/create
   Authorization: Bearer <admin_token>
   Body: { "order_id": "order_id", "amount": 100000 }
   ```

### VNPay

1. Register at [VNPay Sandbox](https://sandbox.vnpayment.vn)
2. Get `tmnCode`, `hashSecret`
3. Configure `.env`:
   ```
   VNPAY_TMN_CODE=your_tmn
   VNPAY_HASH_SECRET=your_secret
   VNPAY_URL=https://sandbox.vnpayment.vn
   VNPAY_RETURN_URL=http://your-frontend.com/checkout/success
   VNPAY_IPN_URL=http://your-backend.com/api/payment/vnpay/ipn
   ```
4. Create payment similar to Momo.

## 🗄️ Database Schema

### Core Tables

- **users** - Authentication
- **addresses** - Shipping addresses
- **categories** - Hierarchical categories
- **brands** - Brand info
- **products** - Product details
- **product_variants** - Size/color/stock
- **product_images** - Image URLs
- **cart_sessions** - Cart sessions (guest/user)
- **cart_items** - Cart contents
- **orders** - Order master
- **order_items** - Order line items
- **coupons** - Discount codes
- **order_coupons** - Coupon usage
- **reviews** - Product reviews
- **wishlists** - User wishlists

All tables have proper foreign keys and indexes.

## 🔐 Security

- Helmet security headers
- CORS with whitelist
- JWT authentication
- Role-based authorization
- Input validation with express-validator
- SQL injection prevention (prepared statements)

## 📁 Project Structure

```
src/
├── app.ts                   # Express app setup
├── server.ts                # Production server
├── config/
│   └── database.ts          # SQLite connection + schema
├── controllers/             # Route handlers
├── routes/                  # API routes
├── middleware/              # Auth, upload, error handling
├── types/                   # TypeScript interfaces
└── seed.ts                  # Database seeder
```

## 🧪 Testing

This project includes comprehensive test suites covering authentication, products, cart/checkout, coupons, and admin dashboard using Jest and Supertest.

### Run Tests Locally

```bash
# Install all dependencies (including dev)
npm ci

# Run all tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run tests in CI mode (with coverage, verbose)
npm run test:ci

# Lint code
npm run lint
```

### What's Tested

- **Auth**: Register, login, protected routes
- **Products**: CRUD, listing, filtering, sorting, variants
- **Cart & Checkout**: Cart session, item management, order creation, validation
- **Coupons**: CRUD, validation (percentage/fixed, limits, min order), apply to order
- **Dashboard**: Stats, sales report, product performance, inventory, recent orders

### Test Database

Tests use a separate SQLite database (`data/fashion_shop_test.db`). The database is automatically reset for each test suite and seeded with minimal data. No manual cleanup required.

### Coverage

Current coverage: **~40%** (statements) and growing. We have >90% API endpoint coverage with 70+ tests across all major features.

Coverage reports are generated in `coverage/` directory. Open `coverage/lcov-report/index.html` in browser to view detailed report.

### CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR:

1. **Lint** (ESLint)
2. **Test** (Jest) with coverage threshold ≥70%
3. **Security scan** (npm audit)
4. **Build check** (TypeScript compile)

Coverage reports are uploaded to Codecov (if configured).

## 📝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes
4. Submit PR

## 📄 License

MIT

---

Built with ❤️ using OpenClaw
