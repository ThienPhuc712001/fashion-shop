# Fashion Shop - Frontend

Next.js 15 frontend for Fashion Shop e-commerce platform.

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect)
- **HTTP Client**: Axios with interceptors

## 📦 Installation

```bash
# Install dependencies (from fashion-shop root)
npm install

# Copy environment file
cp .env.local.example .env.local
# Edit .env.local if needed (default backend: http://localhost:3001)
```

## 🏃‍♂️ Development

```bash
# Run frontend only
npm run dev:frontend
# Frontend: http://localhost:3000
# Backend should be running on http://localhost:3001

# Build frontend
npm run build:frontend

# Start frontend (production)
npm run start:frontend
```

## 🌐 Proxy Configuration

Next.js proxies all `/api/*` requests to the backend server at `http://localhost:3001` via rewrites in `next.config.js`. This allows the frontend to call backend APIs without CORS issues.

## 📁 Structure

```
fashion-shop/
├── app/
│   ├── (page routes)
│   │   ├── page.tsx              # Home
│   │   ├── layout.tsx            # Root layout (customer)
│   │   ├── loading.tsx           # Global loading
│   │   ├── error.tsx             # Global error boundary
│   │   ├── not-found.tsx         # 404 page
│   │   ├── products/
│   │   │   ├── page.tsx          # Product listing
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Product detail
│   │   ├── cart/
│   │   │   └── page.tsx          # Shopping cart
│   │   ├── checkout/
│   │   │   └── page.tsx          # Checkout flow
│   │   ├── login/
│   │   │   └── page.tsx          # Login
│   │   ├── register/
│   │   │   └── page.tsx          # Register
│   ├── admin/
│   │   ├── page.tsx              # Admin dashboard
│   │   └── layout.tsx            # Admin layout (sidebar)
│   └── order/
│       └── [orderNumber]/
│           └── success/
│               └── page.tsx      # Order success
├── components/
│   ├── ui/                       # Shadcn UI components (button, card, input, ...)
│   ├── layout/                   # Header, Footer
│   ├── products/                 # ProductCard
│   └── admin/                    # DashboardStats, RecentOrders, AdminSidebar
├── lib/
│   ├── api.ts                    # Axios client + types
│   └── utils.ts                  # Helper functions (cn, formatPrice)
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

## 🔧 Configuration

### Tailwind CSS

Custom color palette using CSS variables for theme support (light/dark). The design uses a zinc/slate base with amber/rose accents suitable for fashion e-commerce.

### API Client (`lib/api.ts`)

- Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001/api`)
- Automatically adds JWT token from localStorage
- Interceptor handles 401 redirects to login

### Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API base URL (default: `http://localhost:3001`)

## 🎨 Design System

- **Primary**: Amber/Orange for CTAs
- **Neutral**: Zinc/Slate grayscale for backgrounds and text
- **Typography**: Inter font
- **Radius**: 0.5rem (8px)

## ✅ Features

- ✅ Responsive design (mobile-first)
- ✅ Dark mode support (via next-themes)
- ✅ Loading states and error handling
- ✅ Form validation
- ✅ Image optimization with Next.js Image
- ✅ Server-side rendering (SSR) and static generation
- ✅ Type-safe API client with TypeScript interfaces

## 📝 TODO / Future Work

- [ ] Add internationalization (i18n) for multi-language
- [ ] Implement cart state context for real-time updates
- [ ] Add product filtering by price range, rating
- [ ] Create user profile page
- [ ] Add address management
- [ ] Implement payment gateway redirects (Momo/VNPay)
- [ ] Write unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Integrate analytics

## 📄 License

MIT

---

Built with ❤️ using OpenClaw
