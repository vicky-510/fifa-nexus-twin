# StadiumPulse — Frontend

Angular 21 single-page app for the StadiumPulse crisis-simulation console. See the
[root README](../README.md) for the full project overview, architecture diagram,
and deployment details.

## Structure

```
src/app/
├── core/          # Auth guard, HTTP interceptor, API/auth/reference/simulation services
├── state/         # Signal-based stores (simulation.store, stadium.store)
├── features/
│   ├── auth/              # Access-code login + guest entry
│   ├── stadium-selector/  # Venue picker (interactive map)
│   ├── global-overview/   # Tournament-wide status board
│   ├── dashboard/         # Ops console: scenario deck, live terminal, agency panels,
│   │                      # PA broadcast, signage preview, QR dispatch, crisis timeline
│   └── staff-mobile/      # Public QR-scanned staff directive card
└── shared/        # Accessibility toggle, change-access-code dialog, focus-trap utility
```

Key conventions: standalone components, `inject()` for DI, built-in `@if`/`@for`
control flow, Signal-based state (no NgRx), Tailwind CSS, zoneless change detection.

## Commands

```bash
npm start        # dev server on http://localhost:4200 (expects the backend on :3000)
npm run build    # production build to dist/ (all feature routes lazy-loaded)
npm test         # Karma + Jasmine, headless Chrome — run with --watch=false for CI mode
npm run lint     # angular-eslint (TypeScript + template accessibility rules)
```

The dev build points at `http://localhost:3000` (see `src/environments/environment.ts`);
production builds swap in `environment.prod.ts` via file replacement.
