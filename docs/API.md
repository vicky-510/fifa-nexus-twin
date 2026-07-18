# StadiumPulse API Reference

Base URL: `https://fifa-nexus-twin.onrender.com/api` (or `http://localhost:3000/api` locally).

All endpoints accept and return JSON. Authenticated endpoints expect
`Authorization: Bearer <token>`, where the token comes from one of the two
login endpoints below. Responses are gzip-compressed (except SSE streams).

## Access tiers

| Tier | Obtained via | Can do |
|---|---|---|
| `guest` | `POST /auth/guest` (no credentials) | Read-only: reference data + simulation history |
| `ops_staff` | `POST /auth/verify` (access code) | Everything: trigger, escalate, predict, timeline notes, code rotation |

Write routes are gated by `requireFullAccess` middleware and return `403` for guests.
Tokens are signed with the current access code and expire after 2 hours; rotating the
code invalidates every outstanding session.

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/verify` | none | Exchange `{ code }` for `{ token, role: "ops_staff" }`. `401` on a wrong code. |
| POST | `/auth/guest` | none | Issue a read-only `{ token, role: "guest" }` — no code required. |
| POST | `/auth/change-code` | ops_staff | Rotate the shared code: `{ currentCode, newCode }` (min 6 chars). Invalidates all sessions. |

## Reference data (any valid token)

| Method | Path | Description |
|---|---|---|
| GET | `/stadiums` | All 16 stadiums with risk profiles; `status`/`color` derived from the live clock. |
| GET | `/stadiums/:id` | One stadium, or `404`. |
| GET | `/matches` | Full match schedule; each match's `completed`/`live`/`upcoming` status derived from the real date. |
| GET | `/matches/:stadiumId` | Matches at one stadium. |
| GET | `/scenarios` | The full 12-scenario crisis catalog. |
| GET | `/scenarios/:stadiumId` | Only the scenarios relevant to that stadium's risk profile. |

## Simulation

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/simulation-trigger` | ops_staff | Run a scenario synchronously: `{ scenario, stadiumId }` → `201` with the stored record. Scenario names are whitelisted (`400` otherwise); rate-limited. |
| POST | `/simulation-trigger/stream` | ops_staff | Same, but streams the AI response token-by-token over Server-Sent Events, then persists. |
| POST | `/simulation-trigger/escalate` | ops_staff | Escalate an existing run to its scenario's next severity: `{ simulationId }` → `201` with the linked record. |
| POST | `/simulation-trigger/predict` | ops_staff | Pre-crisis risk forecast for a stadium: `{ stadiumId }` → `{ risks, reasoning }`. |
| POST | `/simulation/:id/timeline` | ops_staff | Append `{ type, message }` to a run's crisis timeline. |
| GET | `/simulation-history` | any token | Recent runs, newest first. Optional `scenario`, `stadiumId`, `limit` (default 50, capped at 200) query params. |
| GET | `/simulation/:id/public` | **none** | Public lookup used by QR-scanned ground-staff cards — returns only the fields needed to render a role-specific directive. |

## Error shape

Every error responds with `{ "error": "<human-readable message>" }` and an appropriate
status (`400` validation, `401` unauthenticated, `403` guest on a write route, `404` not
found, `429` rate-limited, `500` sanitized internal error — stack traces are never sent).
