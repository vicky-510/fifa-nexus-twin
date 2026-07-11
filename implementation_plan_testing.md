# Implementation Plan - Frontend & Backend Testing Setup

Set up and configure unit and integration testing across the stack:
1. **Frontend (Angular)**: Set up and configure Karma and Jasmine, migrate existing tests from Vitest imports to Jasmine globals, and ensure `ng test` executes via Karma.
2. **Backend (Express)**: Configure Jest, write mock-based unit and integration tests for authentication and simulation endpoints (using `supertest` and mocking Postgres).

## User Review Required

> [!IMPORTANT]
> - **Frontend Test Runner**: Angular 21 defaults to `@angular/build:unit-test`. We will switch this to `@angular-devkit/build-angular:karma` to run Karma and Jasmine as requested.
> - **Postgres Mocking**: Backend tests will mock the database layer (`pg` pool) to ensure tests can run in any environment (including CI) without requiring a live Postgres instance.

## Proposed Changes

### Frontend (Angular)

#### [MODIFY] [package.json](file:///e:/fifa-nexus-twin/client/package.json)
- Add required devDependencies for Karma & Jasmine:
  - `karma`
  - `jasmine-core`
  - `@types/jasmine`
  - `karma-jasmine`
  - `karma-chrome-launcher`
  - `karma-jasmine-html-reporter`
- Remove `vitest` and `jsdom` if no longer needed.

#### [MODIFY] [angular.json](file:///e:/fifa-nexus-twin/client/angular.json)
- Modify the `test` architect block to use `@angular-devkit/build-angular:karma` builder instead of `@angular/build:unit-test`.
- Specify `"karmaConfig": "karma.conf.js"`.

#### [NEW] [karma.conf.js](file:///e:/fifa-nexus-twin/client/karma.conf.js)
- Create a standard configuration for Karma, configuring the Chrome launcher and Jasmine framework.

#### [MODIFY] [tsconfig.spec.json](file:///e:/fifa-nexus-twin/client/tsconfig.spec.json)
- Ensure the types array contains `"jasmine"` instead of `"vitest"`.

#### [MODIFY] [auth.service.spec.ts](file:///e:/fifa-nexus-twin/client/src/app/core/services/auth.service.spec.ts)
- Remove `import { describe, beforeEach, it, expect, afterEach } from 'vitest';`.
- Rely on Jasmine globals.

---

### Backend (Express)

#### [NEW] [jest.config.js](file:///e:/fifa-nexus-twin/server/jest.config.js)
- Create standard Jest configuration for the Node backend environment.

#### [NEW] [auth.test.js](file:///e:/fifa-nexus-twin/server/src/tests/auth.test.js)
- Write integration tests for the authorization gateway:
  - Verification of access code.
  - Verification of rate limiter and invalid access codes.

#### [NEW] [simulation.test.js](file:///e:/fifa-nexus-twin/server/src/tests/simulation.test.js)
- Write integration/unit tests for the simulation routes:
  - Verification of simulation logs retrieval.
  - Mocking the `@google/genai` client and postgres database connection pool to verify the simulation trigger responses.

## Verification Plan

### Automated Tests
- **Frontend**: Run `npm run test -- --watch=false` in the `client/` folder to verify all Jasmine unit tests pass in headless Chrome.
- **Backend**: Run `npm run test` in the `server/` folder to run all Jest tests.
