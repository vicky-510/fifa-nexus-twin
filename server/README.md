# StadiumPulse — Backend

Node.js/Express REST API for the StadiumPulse crisis-simulation console. See the
[root README](../README.md) for the full project overview and the
[API reference](../docs/API.md) for every endpoint.

## Structure

```
server.js            # Bootstrap: run migrations, then listen
src/
├── app.js           # Express app: helmet, gzip, CORS, routes, error handler
├── config/          # env validation (fail-fast) + pg pool
├── routes/          # auth / reference / simulation route definitions
├── controllers/     # request/response handling
├── services/        # auth (signed tokens), gemini (AI calls), simulation logic
├── middleware/      # auth, requireFullAccess (guest gating), rate limiter,
│                    # scenario whitelist, sanitized error handler
├── models/          # parameterized-query data access (simulations, app_config)
├── migrations/      # idempotent SQL, auto-run on boot, first-boot seeding
├── data/            # 16 stadiums, match schedule, crisis scenario catalog
└── tests/           # Jest + Supertest suites (DB and rate limiter mocked)
```

## Commands

```bash
npm start        # run (requires .env — see .env.example)
npm run dev      # run with auto-restart on file changes
npm test         # Jest + Supertest
npm run lint     # ESLint
```

Configuration is documented in [.env.example](./.env.example); the server exits at
boot with a descriptive error if a required variable is missing.
