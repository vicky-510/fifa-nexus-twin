# StadiumPulse — Implementation Plan

StadiumPulse is a GenAI-powered crisis simulation and command dashboard built for World Cup 2026 stadium operators. This document outlines the proposed architecture and execution steps.

## User Review Required

> [!IMPORTANT]
> **Access Code & Tokens**: Access is guarded by a shared `ACCESS_CODE` environment variable. To avoid adding external packages like `jsonwebtoken`, we will use Node.js's built-in `crypto` module to generate and verify cryptographically signed, short-lived tokens (2-hour expiration).
> **Database Seeding**: On application startup, `runMigrations.js` will verify the existence of the `simulations` table. If it's empty, we will seed it with 3-4 high-quality mock records so that the dashboard loads with visual context immediately.
> **Node & Angular Versions**: Node v22.23.1 is currently installed on the host. We will specify `engines.node = "24.x"` in `package.json` for LTS compliance, but ensure the codebase is compatible with both Node 22 and 24. We will initialize the frontend using Angular 21 CLI in non-interactive mode.
> **Database Host Port**: For serverless deployments (such as Render or Railway connecting to Supabase), we will set up PostgreSQL Pool handling using standard env vars, pointing to Supabase transaction pooler port `6543`.

## Proposed Changes

---

### Backend Components (`/server`)

We will configure a Node.js 24 LTS application using Express, Cors, dotenv, pg, @google/genai, and express-rate-limit.

#### [NEW] [package.json](file:///e:/fifa-nexus-twin/server/package.json)
Contains project metadata, engines constraint (`"node": "24.x"`), and dependencies: `express`, `cors`, `dotenv`, `pg`, `@google/genai`, `express-rate-limit`.

#### [NEW] [env.js](file:///e:/fifa-nexus-twin/server/src/config/env.js)
Validates that required environment variables are present and fails fast with descriptive errors if they are not:
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `ACCESS_CODE`
- `PORT` (optional, default `3000`)
- `MOCK_MODE` (optional, default `false`)

#### [NEW] [db.js](file:///e:/fifa-nexus-twin/server/src/config/db.js)
Exports a `pg.Pool` instance configured with the `DATABASE_URL` and SSL `ssl: { rejectUnauthorized: false }`.

#### [NEW] [001_create_simulations_table.sql](file:///e:/fifa-nexus-twin/server/src/migrations/001_create_simulations_table.sql)
DDL containing:
```sql
CREATE TABLE IF NOT EXISTS simulations (
  id SERIAL PRIMARY KEY,
  scenario VARCHAR(50) NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### [NEW] [runMigrations.js](file:///e:/fifa-nexus-twin/server/src/migrations/runMigrations.js)
Reads and executes the SQL migrations. Additionally, checks if the table is empty and seeds 3-4 sample records: `exitSurge`, `stormInundation`, and `gridlockOutage`.

#### [NEW] [simulation.model.js](file:///e:/fifa-nexus-twin/server/src/models/simulation.model.js)
Encapsulates all database operations using parameterized queries (e.g. `$1`, `$2`), preventing SQL injection.

#### [NEW] [logger.js](file:///e:/fifa-nexus-twin/server/src/utils/logger.js)
Centralized logging utility for console output and debugging info.

#### [NEW] [auth.service.js](file:///e:/fifa-nexus-twin/server/src/services/auth.service.js)
Handles verification of the access code and issues short-lived, signed Base64 tokens using the Node.js `crypto` module.

#### [NEW] [gemini.service.js](file:///e:/fifa-nexus-twin/server/src/services/gemini.service.js)
Instantiates the Google Gen AI client. Orchestrates prompts to `gemini-2.5-flash` with a JSON Schema constraining structure. Includes a retry mechanism (1 retry) and fallback to a static `MOCK_MODE` schema on failure.

#### [NEW] [simulation.service.js](file:///e:/fifa-nexus-twin/server/src/services/simulation.service.js)
Orchestrates the simulation pipeline: triggers Gemini/Mock generation, saves the result to the DB, and format output.

#### [NEW] [auth.middleware.js](file:///e:/fifa-nexus-twin/server/src/middleware/auth.middleware.js)
Guards protected routes by verifying the presence and validity of the signed access token in the `Authorization` header.

#### [NEW] [rateLimiter.middleware.js](file:///e:/fifa-nexus-twin/server/src/middleware/rateLimiter.middleware.js)
Implements rate limiting (1 request per 5 seconds per IP) for trigger routes to avoid spam.

#### [NEW] [errorHandler.middleware.js](file:///e:/fifa-nexus-twin/server/src/middleware/errorHandler.middleware.js)
Logs detailed error stack traces server-side and responds with generic, clean client-facing error payloads.

#### [NEW] [validateScenario.middleware.js](file:///e:/fifa-nexus-twin/server/src/middleware/validateScenario.middleware.js)
Ensures requested scenarios are within the whitelist: `exitSurge`, `stormInundation`, `gridlockOutage`.

#### [NEW] [auth.routes.js](file:///e:/fifa-nexus-twin/server/src/routes/auth.routes.js)
Mounts the authorization route: `POST /api/auth/verify`.

#### [NEW] [simulation.routes.js](file:///e:/fifa-nexus-twin/server/src/routes/simulation.routes.js)
Mounts the main operational routes:
- `POST /api/simulation-trigger` (Synchronous generation)
- `POST /api/simulation-trigger/stream` (SSE chunked token-by-token generation)
- `GET /api/simulation-history` (Historical runs with optional `?scenario=` filter)

#### [NEW] [auth.controller.js](file:///e:/fifa-nexus-twin/server/src/controllers/auth.controller.js)
Maps request/response details for authorization operations.

#### [NEW] [simulation.controller.js](file:///e:/fifa-nexus-twin/server/src/controllers/simulation.controller.js)
Maps request/response details for simulations, handles SSE writing headers, and manages response streaming.

#### [NEW] [app.js](file:///e:/fifa-nexus-twin/server/src/app.js)
Initializes Express app, attaches JSON parser, configures strict CORS rules, and mounts controllers/routes.

#### [NEW] [server.js](file:///e:/fifa-nexus-twin/server/server.js)
Main application entry point. Triggers migrations first, then binds the HTTP listener.

---

### Frontend Components (`/client`)

We will initialize an Angular 21 client, add Tailwind CSS configuration, and build a beautiful, high-contrast dark cyberpunk UI dashboard.

#### [NEW] [package.json](file:///e:/fifa-nexus-twin/client/package.json)
Configured with Angular 21 packages, Tailwind CSS dependencies, and compilation settings.

#### [NEW] [tailwind.config.js](file:///e:/fifa-nexus-twin/client/tailwind.config.js)
Custom color palette for FIFA World Cup 2026 colors (cyberpunk golds, dynamic neon reds, and deep navy/slate backgrounds).

#### [NEW] [api.service.ts](file:///e:/fifa-nexus-twin/client/src/app/core/services/api.service.ts)
Wrapper service for HTTP calls to automatically include the in-memory access token.

#### [NEW] [auth.service.ts](file:///e:/fifa-nexus-twin/client/src/app/core/services/auth.service.ts)
Manages login verification states and stores access tokens solely in-memory (per user instructions).

#### [NEW] [simulation.service.ts](file:///e:/fifa-nexus-twin/client/src/app/core/services/simulation.service.ts)
Interacts with simulation and SSE streaming endpoints.

#### [NEW] [auth.guard.ts](file:///e:/fifa-nexus-twin/client/src/app/core/guards/auth.guard.ts)
Route guard that blocks unauthenticated navigation.

#### [NEW] [auth.interceptor.ts](file:///e:/fifa-nexus-twin/client/src/app/core/interceptors/auth.interceptor.ts)
Intercepts all outgoing HTTP requests to append the authorization header if available.

#### [NEW] [simulation.store.ts](file:///e:/fifa-nexus-twin/client/src/app/state/simulation.store.ts)
An Angular Signals store managing simulation states: `activeScenario`, `latestResult`, `isStreaming`, `streamBuffer`, and `historyList`.

#### [NEW] [accessibility-toggle.component.ts](file:///e:/fifa-nexus-twin/client/src/app/shared/components/accessibility-toggle/accessibility-toggle.component.ts)
Renders a persistent toggle controls for high-contrast viewing and larger font sizes.

#### [NEW] [access-code-entry.component.ts](file:///e:/fifa-nexus-twin/client/src/app/features/auth/access-code-entry/access-code-entry.component.ts)
Renders the login prompt demanding the shared passcode to enter.

#### [NEW] [dashboard.component.ts](file:///e:/fifa-nexus-twin/client/src/app/features/dashboard/dashboard.component.ts)
Main command center view. Embeds the 4 panels below in a premium layout.

#### [NEW] [nexus-canvas-map.component.ts](file:///e:/fifa-nexus-twin/client/src/app/features/dashboard/nexus-canvas-map/nexus-canvas-map.component.ts)
Interactive SVG/Canvas display showcasing the stadium layout (gates, transit hubs, green zones). Pulses, changes color, and overlays guides based on the active scenario guidance (e.g. exit surges highlight exit gates, flooding shows water lines).

#### [NEW] [scenario-control-deck.component.ts](file:///e:/fifa-nexus-twin/client/src/app/features/dashboard/scenario-control-deck/scenario-control-deck.component.ts)
Houses action buttons to trigger `exitSurge`, `stormInundation`, and `gridlockOutage` simulations.

#### [NEW] [cyberpunk-terminal.component.ts](file:///e:/fifa-nexus-twin/client/src/app/features/dashboard/cyberpunk-terminal/cyberpunk-terminal.component.ts)
A vintage retro terminal that displays the SSE JSON token stream live as it is generated, including multilingual scripts (EN, ES, FR) selectable via buttons.

#### [NEW] [ai-reasoning-strip.component.ts](file:///e:/fifa-nexus-twin/client/src/app/features/dashboard/ai-reasoning-strip/ai-reasoning-strip.component.ts)
Displays the operational recommendations and a prominent "Why this recommendation" rationale panel.

---

### Configuration & Root files

#### [NEW] [.gitignore](file:///e:/fifa-nexus-twin/.gitignore)
Ignores `.env`, `node_modules/`, `dist/`, `.angular/`, `.idea/` at the root.

---

## Verification Plan

### Automated Tests
- Run `npm run test` or direct scripts to check syntax correctness.
- We will test environment verification by running the server with missing environment variables to ensure it fails fast.

### Manual Verification
- Launch the backend using `npm start` or Node locally.
- Test endpoint behavior:
  - `POST /api/auth/verify` with incorrect and correct passcode.
  - `POST /api/simulation-trigger` using curl or browser.
  - Check database insertions directly in Supabase.
- Run frontend server using `npm start` and verify the responsive layout, accessibility triggers, high-contrast, scenario stream render, and tab switches for English/Spanish/French.
