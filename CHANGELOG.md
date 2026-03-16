# Changelog – Backend API project

All notable changes to this backend will be documented in this file.
Format inspired by Keep a Changelog.[web:217][web:224]

---

## [1.0.1] – 2026-03-06

### Added

- **Project setup**
  - Node.js backend with ES modules (`"type": "module"` in `package.json`).
  - Express server entrypoint (`index.js` + `src/server.js`).
  - Environment configuration with `dotenv` and `prisma.config.ts` using `DATABASE_URL`.

- **Database & ORM**
  - Prisma 7 + `@prisma/adapter-pg` integration with PostgreSQL (Docker Postgres):
    - `src/config/db.js`:
      - Creates a `pg.Pool` using `DATABASE_URL`.
      - Configures PrismaClient with the `PrismaPg` adapter.
      - `connectDB()` and `disconnectDB()` helpers with logging.
    - `prisma/schema.prisma` models:
      - `User`:
        - `id` (UUID, PK), `name`, `email` (unique), `password`, `createdAt`.
        - Relations: `movies` (created movies), `watchlistitems`.
      - `Movie`:
        - `id` (UUID, PK), `title`, `overview`, `releaseYear`, `genres` (string array), `runtime`, `posterUrl`, `createdBy`, `createdAt`.
        - Relation `creator` to `User` via `createdBy` (`MovieCreator`).
        - Relation `watchlistItems`.
      - `WatchlistItems`:
        - `id` (UUID, PK), `userId`, `movieId`, `status`, `rating`, `notes`, `createdAt`, `updatedAt`.
        - Relations to `User` and `Movie` with `onDelete: Cascade`.
      - `WatchlistStatus` enum:
        - `PLANNED`, `WATCHING`, `COMPLETED`, `DROPPED`.
  - Prisma seed script `prisma/seed.js`:
    - Uses `PrismaClient` to insert sample `Movie` records:
      - The Matrix, Interstellar, The Shawshank Redemption, The Dark Knight, Pulp Fiction.
    - Uses `CREATOR_ID` from env for `createdBy` foreign key.

- **HTTP server & middleware**
  - `src/server.js`:
    - Express app listening on port `5001`.
    - `cors` configured for `http://localhost:3000` with:
      - `methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]`
      - `allowedHeaders: ["Content-Type", "Authorization"]`
      - `credentials: true` (per inviare cookie httpOnly).
    - `cookie-parser` per leggere `req.cookies`.
    - Parsers: `express.json()` e `express.urlencoded()`.
    - Global error handling for `unhandledRejection`, `uncaughtException`, `SIGTERM` con `disconnectDB()`.

- **Authentication**
  - `src/utils/generateToken.js`:
    - `generateToken(userId, res)`:
      - Crea JWT con payload `{ id: userId }`.
      - Firma con `process.env.JWT_SECRET`.
      - `expiresIn: process.env.JWT_EXPIRES_IN || "7d"` (claim `exp` nel token).
      - Imposta cookie `jwt`:
        - `httpOnly: true`
        - `secure: process.env.NODE_ENV === "production"`
        - `sameSite: "strict"`
        - `maxAge: 7 giorni` (in millisecondi).
  - `src/controllers/authController.js`:
    - `register`:
      - Legge `name`, `email`, `password` dal body.
      - Controlla `User` esistente via Prisma (`findUnique` su `email`).
      - Se utente esiste → `400 { error: "User already exists with this email!" }`.
      - Hash password con `bcryptjs` (salt 10).
      - Crea nuovo `User` in DB.
      - Genera JWT e imposta cookie via `generateToken`.
      - Risponde `201` con:
        - `status: "success"`
        - `data.user` con `id`, `name`, `email`
        - `token` (anche nel body).
    - `login`:
      - Legge `email`, `password`.
      - Cerca utente per email.
      - Se non trovato → `401 { error: "Invalid email or password!" }`.
      - Confronta password con `bcrypt.compare`.
      - Se password errata → `401 { error: "Invalid password!" }`.
      - Genera JWT + cookie via `generateToken`.
      - Risponde `201` con:
        - `status: "success"`
        - `data.user` (`id`, `email`)
        - `token`.
    - `logout`:
      - Sovrascrive cookie `jwt` con stringa vuota e `expires: new Date(0)`.
      - Risponde `200` con:
        - `status: "success"`
        - `message: "Logged out successfully!"`.

- **Auth middleware & session expiry**
  - `src/middleware/authMiddleware.js`:
    - `requireAuth`:
      - Legge `const token = req.cookies?.jwt`.
      - Se `token` mancante → `401 { error: "Not authenticated" }`.
      - Verifica JWT con `jwt.verify(token, process.env.JWT_SECRET)`:
        - Se valido → imposta `req.userId = decoded.id` e chiama `next()`.
        - Se `err.name === "TokenExpiredError"` → `401 { error: "Session expired" }`.
        - Altri errori → `401 { error: "Invalid token" }`.
    - Pensato per essere usato sulle rotte protette (es. future `/movies` reali).

- **Routes**
  - `src/routes/authRoutes.js`:
    - `POST /auth/register` → `register`.
    - `POST /auth/login` → `login`.
    - `POST /auth/logout` → `logout`.
  - `src/routes/movieRoutes.js` (montate sotto `/movies`):
    - `GET /movies/`:
      - Endpoint di test → `{ message: "Backend API - GET req works!!!" }`.
    - `GET /movies/movies` (protetta con `requireAuth`):
      - Risponde con:
        - `message: "Hello Movies!"`
        - `userId: req.userId` (letto dal JWT valido).
    - `POST /movies/`, `PUT /movies/`, `DELETE /movies/`:
      - Endpoint di test con JSON che indica `httpMethod` e messaggio.

### Security / Auth flow

- Combinazione di **JWT expiration** e **cookie expiration**:
  - JWT:
    - Claim `exp` gestito da `expiresIn: "7d"` → dopo 7 giorni `jwt.verify` genera `TokenExpiredError`.
  - Cookie:
    - `maxAge` impostato a 7 giorni → passato quel tempo il browser smette di inviare il cookie `jwt`.
- Comportamento previsto:
  - Se cookie mancante → `Not authenticated` (401).
  - Se cookie presente ma token scaduto → `Session expired` (401).
  - Se token manipolato/non valido → `Invalid token` (401).
- Frontend Next.js usa `credentials: "include"` per inviare i cookie nelle richieste al backend.

### Tooling / Scripts

- `package.json`:
  - `"dev": "nodemon index.js"` – avvia il server in sviluppo con reload automatico.
  - `"prisma:generate": "prisma generate"` – genera il client Prisma in `src/generated/prisma`.
  - `"prisma:migrate": "prisma migrate dev"` – crea/applica migrazioni di sviluppo.

---

## TODO / Next

- Implementare rotte reali per:
  - `GET /movies` → lista film per l’utente loggato (usando `req.userId` + `WatchlistItems`).
  - `POST /movies` → aggiunta film alla watchlist.
  - `PATCH /movies/:id` → aggiornare `status`/`rating`/`notes`.
- Esporre un endpoint semplice per testare la scadenza sessione:
  - Client effettua chiamata dopo scadenza del token per scatenare `Session expired` e gestirla nel frontend.
