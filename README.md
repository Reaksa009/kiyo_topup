# KIYO TOPUP - Enterprise Online Game Top-Up Platform

KIYO TOPUP is a complete, enterprise-grade, secure, and scalable online game top-up platform built for instant 5-second automated top-ups in Cambodia.

---

## Technical Features & Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui primitives + Framer Motion + Recharts + React i18next (English & Khmer KM).
- **Backend**: Node.js 22+ + Express.js + TypeScript + REST API (`/api/v1`) + Socket.IO (real-time payment status broadcasts).
- **Database & Queue**: MongoDB Atlas (Mongoose schemas) + Redis (rate limiting, idempotency locks) + BullMQ (asynchronous top-up fulfillment queue).
- **Payment Integration**:
  - **ABA PayWay**: PayWay checkout, HMAC SHA-256 / MD5 signature hashing & verification.
  - **Bakong KHQR**: EMVCo compliant KHQR string generator, CRC16 calculation, open API MD5 verification.
  - **Server Price Enforcement**: Prices computed strictly on server from DB; client payloads are never trusted.
- **Provider Automated Top-Up Adapter**:
  - **G2Bulk API** integration with balance check, product catalog lookup, order placement, and full request/response audit logging.
- **Telegram Bot**: Instant alerts for new orders, payment confirmation, provider completion/failure.

---

## Local Development Quickstart

1. **Install Dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `backend/.env`.

3. **Run Backend (with Auto-Seeder)**:
   ```bash
   cd backend
   npm run dev
   ```
   *Seeds default games (Mobile Legends, Free Fire, PUBG Mobile, Valorant, Honor of Kings, CoD Mobile, Blood Strike, Delta Force), admin account (`admin@kiyotopup.com` / `AdminKiyoTopUp2026!`), categories, and packages.*

4. **Run Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

5. **Run Tests**:
   ```bash
   cd backend
   npm test
   ```

6. **Sync the live G2Bulk catalog**:
   ```bash
   cd backend
   npm run sync-catalog
   ```
   The sync imports PUBG Mobile, Valorant, Free Fire, Mobile Legends, Mobile Legends Global, and the other configured games. It keeps event/pass products, labels bestseller and normal packages, and selects the cheapest product for duplicate denominations. Mobile Legends packages are shared across regular and Global servers when only one regional product exists.
