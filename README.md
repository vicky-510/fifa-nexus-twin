# StadiumPulse — FIFA Nexus Twin

![Test](https://github.com/vicky-510/fifa-nexus-twin/actions/workflows/test.yml/badge.svg)

A GenAI-powered crisis simulation and command dashboard for FIFA World Cup 2026 venue operations staff.

**Live backend:** https://fifa-nexus-twin.onrender.com

## Chosen Vertical

**Smart Event & Venue Operations Assistant.** StadiumPulse is built for the persona of a **Stadium Operations Command Center staff member** during a live World Cup 2026 match — someone who needs to detect, simulate, and coordinate a multi-agency response to a crisis unfolding in real time (crowd surges, weather events, transit gridlock, structural incidents) across any of the tournament's 16 real stadiums in the US, Mexico, and Canada.

## Approach and Logic

The core problem: when a crisis event begins at a stadium, an ops team needs an **instant, coordinated, multi-department response plan** — not a slow committee decision. StadiumPulse acts as that response assistant:

1. **Context grounding** — every one of the 16 real World Cup stadiums has embedded static risk-profile data (altitude, seismic zone, extreme heat, hurricane exposure, transit chokepoints, etc.), and every crisis scenario is scoped to only the stadiums where it's realistically relevant (e.g. `stormInundation` won't trigger at a domed, inland stadium).
2. **Dynamic decision generation** — when an operator triggers a scenario, the backend calls Google's Gemini model (`gemini-2.5-flash`) with the stadium's real risk profile and the scenario context, and asks it to return a structured response plan across simultaneous operational lanes: navigation/crowd routing, security and crowd control, accessibility guidance, transport updates, sustainability/energy actions, and multilingual public-address scripts (EN/ES/FR).
3. **Escalation logic** — each scenario has a defined escalation path (e.g. `exitSurge → crowdCrush`) so operators can simulate a worsening situation and see how the AI-generated response changes as severity increases.
4. **Live operational feed** — responses stream back over Server-Sent Events into a real-time "command terminal" UI, so the dashboard feels like an actual live ops console rather than a static form submission.

This is "logical decision making based on user context" applied literally: the AI's output is conditioned on which physical stadium, which crisis type, and which severity/escalation state the operator is in — not a generic chatbot response.

## How the Solution Works

**Architecture:** Angular 21 (frontend) + Node/Express (backend) + PostgreSQL (Supabase-hosted), talking to Google's Gemini API.

- **Backend (`server/`)** — Express REST API with route/controller/service layering:
  - `auth` — a lightweight, dependency-free access-code gate using Node's built-in `crypto` for signed session tokens (no external JWT library)
  - `reference` — serves the 16 stadiums, match schedule, and crisis scenario catalog
  - `simulation` — triggers a Gemini-backed crisis response (sync or streaming), stores results in Postgres, supports escalation and history lookup
  - Rate-limited endpoints, scenario whitelisting, and idempotent DB migrations that seed sample data only on first boot
- **Frontend (`client/`)** — standalone Angular components with Signal-based state stores (`simulation.store.ts`, `stadium.store.ts`):
  - Interactive SVG stadium schematic showing live routing/flood/gridlock overlays
  - A "cyberpunk terminal" console rendering the AI's streamed JSON response live
  - Scenario control deck, agency response panels, PA broadcast/signage preview, QR dispatch for field staff, and a mobile staff-facing card view
  - Accessibility toggle for high-contrast mode and adjustable text scale

**Testing:** 23 backend tests (Jest + Supertest) and 245 frontend tests (Karma/Jasmine) covering auth, all API endpoints, guards, interceptors, state stores, and every UI component.

**Deployment:** Backend on Render (connected to a Supabase Postgres instance), with a GitHub Actions workflow that redeploys automatically on every push to `main` that touches `server/`.

## Assumptions Made

- Match schedule, stadium risk profiles, and tournament dates are illustrative/researched data for demo purposes, not official FIFA data feeds.
- A single shared access code (rather than per-user accounts/roles) is sufficient to represent "authenticated ops staff" for this demo — real deployment would need per-user identity and role-based access.
- `MOCK_MODE` is available to demo the full UI/response flow without live Gemini API calls, for reviewers without an API key or to conserve quota.
- The crisis scenarios and their agency response categories (navigation, security, accessibility, transport, sustainability) are modeled on publicly documented stadium emergency-operations practices, not a specific real FIFA Emergency Action Plan document.

## Local Setup

```bash
# Backend
cd server
npm install
# create a .env with DATABASE_URL, GEMINI_API_KEY, ACCESS_CODE
npm start

# Frontend
cd client
npm install
ng serve
```
