# node-prisma-auth-starter

![Node](https://img.shields.io/badge/node-20+-green)
![Next.js](https://img.shields.io/badge/next.js-14+-black)
![Prisma](https://img.shields.io/badge/prisma-7.4-blue)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.0.2-blue)

Full‑stack authentication starter kit with Node.js, Express, PostgreSQL, Prisma ORM and Next.js.
Includes JWT auth with HTTP‑only cookies, register/login/logout, protected routes, forgot/reset password with secure tokens, and transactional emails via SMTP (Mailtrap).

---

## Features

- 🔐 JWT authentication with HTTP‑only cookies
- 👤 User registration & login with validation
- 🚪 Logout and protected routes middleware
- 🔁 Forgot password & secure reset flow (hashed tokens + expiry)
- 📧 Transactional emails via Nodemailer + Mailtrap:
  - Welcome email on registration
  - Password reset link email
  - (Optional) admin/event notification emails
- 🗄️ PostgreSQL database with Prisma ORM & migrations
- 🐳 Local Postgres instance via Docker
- 🧱 Clean project structure (backend + Next.js frontend with App Router)

---

## Requirements
- Node.js 20
- npm
- Docker Desktop (for the `node_prisma_auth_postgres` container)
- Mailtrap account (free) for testing emails

---

## Tech stack

### Backend
- Node.js + Express (REST API)
- Prisma ORM 7.4.x
- PostgreSQL 16 (Docker)
- @prisma/adapter-pg + pg
- JWT with HTTP‑only cookies
- Password hashing: bcryptjs
- Nodemailer + Mailtrap (SMTP) for emails

### Frontend
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS (UI)
- Auth‑aware middleware for public/protected pages
- Pages: /login, /register, /forgot-password, /reset-password, /dashboard

---

### Dependencies (package.json)
```json
"dependencies": {
  "@neondatabase/serverless": "^1.0.2",
  "@prisma/adapter-neon": "^7.4.2",
  "@prisma/adapter-pg": "^7.4.2",
  "bcryptjs": "^3.0.3",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.6",
  "crypto": "^1.0.1",
  "dotenv": "^17.3.1",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "nodemailer": "^6.x",
  "pg": "^8.20.0",
  "ws": "^8.19.0"
},
"devDependencies": {
  "@prisma/client": "7.4.2",
  "nodemon": "^3.1.14",
  "prisma": "7.4.2"
}
```

---

## Database (Docker + Postgres)

The Postgres DB runs in a Docker container called `node_prisma_auth_postgres`.
Create it once with:
```bash
docker run --name node_prisma_auth_postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=node_prisma_auth \
  -p 5432:5432 \
  -d postgres:16
```

Each time before starting the server:
```bash
docker start node_prisma_auth_postgres
docker ps   # optional, to verify it's running
```

Control:
```bash
docker ps  
```

---

## Environment variables

Create a `.env` file in the backend root:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/node_prisma_auth"
NODE_ENV="development"

JWT_SECRET="your-long-random-secret"
JWT_EXPIRE_IN="7d"

# Auth demo specific
CREATOR_ID="your_creator_id"

# Mailtrap SMTP (Email Sandbox)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
MAIL_FROM="Movie Watchlist Auth <no-reply@node_prisma_auth.dev>"
ADMIN_EMAIL="you@example.com"

# Frontend base URL
FRONTEND_URL=http://localhost:3000
```

---

## Backend structure

- `prisma.config.ts`         – Prisma 7 config (datasource, adapters)
- `prisma/schema.prisma`     – Prisma schema (User, Movie, WatchlistItems, etc.)
- `src/config/db.js`         – Prisma client + DB connection
- `src/utils/generateToken.js`  – JWT generation + cookie
- `src/utils/generateReset.js`  – password reset token generator
- `src/utils/emailService.js`   – Nodemailer + templates (welcome, reset, admin logs)
- `src/controllers/authController.js` – register, login, logout, forgot/reset password
- `src/routes/authRoutes.js`   – `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`
- `index.js` / `src/server.js` – Express server bootstrap

---

## Frontend structure (Next.js App Router)

- `app/page.tsx`                 – landing
- `app/(auth)/login/page.tsx`    – login form (JWT cookie, modals)
- `app/(auth)/register/page.tsx` – register form + success modal
- `app/(auth)/forgot-password/page.tsx` – forgot password form
- `app/(auth)/reset-password/page.tsx`  – reset password form (token from query)
- `app/dashboard/page.tsx`       – protected dashboard
- `app/middleware.ts`            – public/protected route handling based on `jwt` cookie
- `app/components/AuthModal.tsx` – shared success/error modal (Framer Motion)

---

## Prisma & database setup

### Generate Prisma client:

```bash
npm install
npx prisma generate
```

### Run initial migration:
```bash
npx prisma migrate dev --name init
```

### Run further schema changes as needed:
```bash
npx prisma migrate dev --name add_password_reset_fields
```

---

## Running the app

### 1. Start Postgres (Docker)
```bash
docker start node_prisma_auth_postgres
```

### 2. Start the backend (Express API)
```bash
cd node_prisma_auth
npm install
npm run dev
# server on http://localhost:5001
```

### 3. Start the frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# app on http://localhost:3000
```

---

## How authentication works

- Users register with name, email and password.
- Passwords are hashed using `bcryptjs` before being stored in PostgreSQL.
- On login, the API returns a JWT and sets it in an HTTP‑only cookie (`jwt`).
- Next.js middleware checks the presence of `jwt` to protect routes like `/dashboard`.
- Forgot/reset password:
  - A secure random token is generated and hashed.
  - The hash + expiry are stored on the user record.
  - A reset link is emailed to the user (`/reset-password?token=...`).
  - The frontend posts the new password + token to `/auth/reset-password`.

---

## 📜 License

MIT License © 2026 Gabriele A. Tambellini
See the [LICENSE](LICENSE) file for details.