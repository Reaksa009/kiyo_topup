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
   This command performs a transaction-protected full replacement for every configured game. It visibly locks package and checkout APIs, removes all old/manual/hidden packages, imports the latest provider catalog in batches, chooses the lowest-cost supplier for each normalized package key, validates every stored field, and commits only when the database exactly matches the prepared catalog. Any error rolls the transaction back and releases the lock. Mobile Legends and Mobile Legends Global are normalized into one cheapest shared catalog.
