# Production Deployment Guide: KIYO TOPUP Platform

This guide documents the enterprise deployment of the KIYO TOPUP platform on an **Ubuntu VPS**, **Vercel**, **Cloudflare**, and **Docker Compose**.

---

## 1. Production Architecture Overview

```
[Cloudflare DNS / SSL] 
       ├──> Vercel (Customer & Admin React SPA Frontend)
       └──> Ubuntu VPS / Docker Compose (Nginx Proxy + Node Backend + Redis + MongoDB)
```

---

## 2. Docker Compose One-Command Deployment

On your Ubuntu VPS (Host with Docker & Docker Compose installed):

```bash
git clone https://github.com/kiyotopup/kiyo-topup-platform.git
cd kiyo-topup-platform
cp .env.example .env

# Launch production stack with Nginx reverse proxy
docker-compose up -d --build
```

---

## 3. Nginx Reverse Proxy Setup (Direct Host Deployment)

If deploying using PM2 directly on Ubuntu VPS:

```nginx
server {
    listen 80;
    server_name api.kiyotopup.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Webhook Security Checklist

- Ensure `ABA_PAYWAY_API_KEY` and `BAKONG_API_TOKEN` are set in production `.env`.
- Ensure Nginx SSL certificates (Let's Encrypt / Cloudflare SSL) are active for HTTPS endpoints.
- Webhook Callback URLs to configure:
  - ABA PayWay Callback: `https://api.kiyotopup.com/api/v1/webhooks/aba-payway`
  - Bakong KHQR Callback: `https://api.kiyotopup.com/api/v1/webhooks/bakong-khqr`
  - G2Bulk Provider Callback: `https://api.kiyotopup.com/api/v1/webhooks/g2bulk`
