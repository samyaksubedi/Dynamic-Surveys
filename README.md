# Dynamic Surveys

Dynamic Surveys is a full-stack survey platform. Authenticated creators design adaptive surveys in a drag-and-drop workspace, anonymous visitors can restore drafts through an opaque browser cookie, and submitted-only analytics keep the resulting signal clear.

## Implemented frontend

- React 19 + TypeScript application compiled by Vite/Vinext
- Editorial, responsive landing page and creator authentication flows
- Protected creator workspace with survey cards, availability controls, public-link copying, and deletion
- Drag-and-drop and keyboard-accessible question reordering with dependency-order protection
- Full editors for text, single-select, multi-select, and rating questions
- Stable question/option IDs, conditional-logic editing, and a read-only schema state after submissions
- Anonymous public survey form with conditional rendering, browser draft restoration, quiet autosave, required-answer feedback, closed-survey state, and completion state
- Submitted-only analytics with text responses, option distributions, and rating summaries
- Creator account and active-session management

## Implemented backend

- Creator registration, email verification, login, refresh, logout, current-user, and session-management APIs
- Bearer access tokens and database-backed, hashed refresh tokens in an `HttpOnly` cookie
- Creator-owned survey CRUD with JSONB question definitions
- Stable UUID question and option identity across reordering
- `text`, `singleSelect`, `multiSelect`, and `rating` questions
- Ordered, single-condition visibility rules with dependency, type, option, ordering, self-reference, and cycle validation
- Separate anonymous respondent sessions in a secure opaque cookie
- Idempotent draft upserts and immutable final submissions
- Schema locking after the first submitted response
- Submitted-only analytics for all four question types
- Redis-backed IP submission-attempt limiting
- BullMQ email producer/worker infrastructure
- PostgreSQL/Redis Docker development services, committed Prisma migration, unit tests, and integration/API tests

## Stack and structure

Frontend: React 19, TypeScript, Vite 8, Vinext, dnd-kit, Lucide icons, and custom CSS. Backend: Node.js ESM, Express 5, PostgreSQL, Prisma 6, Redis/ioredis, Zod 4, BullMQ, bcrypt, JWT, Helmet, Vitest, and Supertest.

```text
Dynamic-Surveys/
├── client/
│   ├── app/                        # landing, auth, workspace, builder, public, analytics routes
│   ├── components/                 # product UI and client-side feature components
│   ├── lib/                        # API client, domain types, visibility/order helpers
│   └── public/                     # public assets and social preview
├── docker/postgres/init/           # dedicated test DB initialization
├── docker-compose.yml
├── .env.example
└── server/
    ├── prisma/                     # schema and committed migrations
    ├── src/
    │   ├── configs/                # validated env, Redis, mail, logging
    │   ├── db/                     # Prisma client and DB health check
    │   ├── jobs/email/             # BullMQ queue, producer, worker
    │   ├── middlewares/            # auth, validation, errors, rate limit
    │   ├── modules/
    │   │   ├── auth/
    │   │   ├── surveys/
    │   │   ├── respondent-sessions/
    │   │   ├── responses/
    │   │   └── analytics/
    │   ├── app.ts                  # importable Express construction
    │   └── server.ts               # dependency checks/listen/shutdown
    └── tests/                      # isolated unit and integration suites
```

The organization follows the PhotoDey reference: versioned routers call thin controllers, services own business rules, repositories encapsulate routine persistence, Zod validates at the boundary, and a central `ApiError`/`ApiResponse` contract provides consistent JSON.

## Local setup

Requirements: Node.js 22.13+ and Docker with Compose. Start the infrastructure and API first:

```bash
docker compose up -d
cd server
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

Then start the frontend in another terminal:

```bash
cd client
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:5173`. The frontend defaults to `http://localhost:3000` for the API and includes credentials on every request so the refresh and anonymous respondent cookies work.

The default Compose ports are PostgreSQL `5434` and Redis `6380`, avoiding PhotoDey's ports. Compose creates both `dynamic_surveys_dev` and the dedicated `dynamic_surveys_test` database on a new volume. Check the real services with:

```bash
docker compose ps
docker compose exec postgres pg_isready -U dynamic_surveys -d dynamic_surveys_dev
docker compose exec postgres psql -U dynamic_surveys -d dynamic_surveys_dev -c "SELECT 1"
docker compose exec redis redis-cli --no-auth-warning -a dynamic_surveys_redis_dev PING
```

If an existing named volume predates the test-database init script, create the test database manually or recreate only this project's development volume if its contents are disposable.

### Environment

Copy either root `.env.example` or `server/.env.example` to `server/.env`. Replace `ACCESS_TOKEN_SECRET` in every non-local environment. Production must use TLS URLs, `NODE_ENV=production`, an explicit `COOKIE_DOMAIN` when needed, and a `TRUST_PROXY` value matching the actual proxy topology. Never blindly set trust proxy for an unknown chain.

Email is deliberately disabled locally. To use the worker, set `EMAIL_DELIVERY_ENABLED=true` and all SMTP values, then run:

```bash
pnpm worker:email
```

Registration queues verification mail only when delivery is enabled. The worker retries failed jobs three times with exponential backoff and has signal-aware shutdown.

The client supports these public variables:

```text
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:5173
```

For deployment, both values must use real HTTPS origins. The API's `CLIENT_URL`, CORS, cookie security, and optional cookie domain must be configured for that frontend origin.

## Database and migrations

The committed initial migration creates:

- `User` → many `UserSession` and `Survey` rows (cascade on user deletion)
- `Survey` → many `Response` rows (cascade on survey deletion)
- `RespondentSession` → many `Response` rows (cascade on session deletion)
- `Response` with `UNIQUE(surveyId, respondentSessionId)` and a `DRAFT | SUBMITTED` status

Survey definitions and answers use PostgreSQL JSONB. Stable creator/survey/session/response data stays relational, indexed, and foreign-key constrained.

```bash
pnpm prisma:format
pnpm prisma:validate
pnpm prisma:generate
pnpm prisma:migrate
```

For tests, apply the same committed migration with `DATABASE_URL=$TEST_DATABASE_URL pnpm prisma:migrate`. Tests include a hard safety check and refuse to clean a database whose URL does not contain `dynamic_surveys_test`.

## API response contract

Success:

```json
{ "success": true, "statusCode": 200, "message": "...", "data": {} }
```

Error:

```json
{ "success": false, "statusCode": 400, "message": "...", "errors": [] }
```

### Routes

| Method     | Route                                           | Access                      | Purpose                                       |
| ---------- | ----------------------------------------------- | --------------------------- | --------------------------------------------- |
| GET        | `/health`                                       | Public                      | Process health                                |
| POST       | `/api/v1/auth/sign-up`                          | Public                      | Register creator                              |
| GET        | `/api/v1/auth/verify/:token`                    | Public                      | Verify email                                  |
| POST       | `/api/v1/auth/resend-verification`              | Public                      | Queue new verification                        |
| POST       | `/api/v1/auth/sign-in`                          | Public                      | Login and set refresh cookie                  |
| POST       | `/api/v1/auth/refresh`                          | Refresh cookie              | New access token                              |
| POST       | `/api/v1/auth/logout`                           | Creator                     | Revoke current session                        |
| POST       | `/api/v1/auth/logout-all`                       | Creator                     | Revoke all sessions                           |
| GET        | `/api/v1/auth/me`                               | Creator                     | Current creator                               |
| GET        | `/api/v1/auth/sessions`                         | Creator                     | Creator device sessions                       |
| POST/GET   | `/api/v1/surveys`                               | Creator                     | Create/list owned surveys                     |
| GET/DELETE | `/api/v1/surveys/:surveyId`                     | Owner                       | Fetch/delete owned survey                     |
| PATCH      | `/api/v1/surveys/:surveyId/metadata`            | Owner                       | Edit title/description                        |
| PUT        | `/api/v1/surveys/:surveyId/schema`              | Owner                       | Replace validated structure before submission |
| PATCH      | `/api/v1/surveys/:surveyId/accepting-responses` | Owner                       | Close/reopen responses                        |
| GET        | `/api/v1/surveys/:surveyId/analytics`           | Owner                       | Submitted-only analytics                      |
| GET        | `/api/v1/public/surveys/:surveyId`              | Anonymous cookie            | Public definition/status                      |
| GET/PUT    | `/api/v1/public/surveys/:surveyId/response`     | Anonymous cookie            | Restore/save draft                            |
| POST       | `/api/v1/public/surveys/:surveyId/submissions`  | Anonymous cookie + IP limit | Submit once                                   |

Creator routes deliberately return `404` for a survey owned by someone else, preventing ownership enumeration. There is no global-admin bypass.

## JSON formats and conditional logic

Question array position is display order. Reordering moves objects only; IDs and references must remain unchanged.

```json
{
  "questions": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "type": "singleSelect",
      "label": "Do you use Node.js?",
      "required": true,
      "options": [
        { "id": "11111111-1111-4111-8111-111111111112", "label": "Yes" },
        { "id": "11111111-1111-4111-8111-111111111113", "label": "No" }
      ]
    },
    {
      "id": "22222222-2222-4222-8222-222222222222",
      "type": "text",
      "label": "What are you building?",
      "required": true,
      "maxLength": 1000,
      "condition": {
        "sourceQuestionId": "11111111-1111-4111-8111-111111111111",
        "operator": "equals",
        "value": "11111111-1111-4111-8111-111111111112"
      }
    }
  ]
}
```

`equals` supports text, single-select option IDs, and ratings. `includes` supports multi-select option IDs. The controller must precede the dependent question. Unknown/self/circular/type-incompatible references and reorderings that break dependency order are rejected.

Answers are keyed only by stable question IDs:

```json
{
  "11111111-1111-4111-8111-111111111111": "11111111-1111-4111-8111-111111111112",
  "22222222-2222-4222-8222-222222222222": "A survey API"
}
```

Drafts may omit required answers, but every present answer is fully validated. This implementation rejects answers for currently hidden questions rather than silently storing them. Final submission requires every visible required answer, ignores hidden questions for requiredness, and rejects unknown IDs, forged options, invalid types, duplicate multi-select values, and ratings outside integer `1..5`.

When `acceptingResponses=false`, public reads and existing draft restoration remain available; draft writes and submission return `403`. Reopening resumes the same cookie session. Submitted responses are immutable and duplicate submission returns `409`.

## Analytics

Only `SUBMITTED` rows count. Text returns non-empty answer lists; selects return every current option including zero counts; multi-select increments every selected option; rating returns count plus average or `null`. The analytics service is isolated so in-memory assignment-scale calculation can later become SQL aggregation or precomputation.

## Testing and quality commands

Backend:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test
pnpm build
```

Frontend:

```bash
cd client
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Unit tests cover the discriminated definition, ID uniqueness, conditional integrity, ordering/cycles, dynamic draft/final answer rules, ratings/options/types, analytics, and the Redis limiter command path. Integration tests cover authentication, ownership, CRUD, anonymous cookie reuse, draft upsert/restoration, close/reopen rules, validation, immutable submission, schema locking, analytics draft exclusion, cascades, and real Redis limiting.

## Security decisions

- Passwords use bcrypt cost 12; refresh, verification, and respondent tokens are cryptographically random and stored only as SHA-256 hashes.
- Access tokens are short-lived. Both refresh and respondent tokens use `HttpOnly` cookies, `Secure` plus `SameSite=None` in production and `SameSite=Lax` locally.
- CORS permits the configured client origin with credentials. Helmet, a 100 KB JSON limit, strict Zod parsing, central malformed-JSON handling, and deliberate proxy configuration are enabled.
- IP is only a Redis spam-control signal, never respondent identity. Database uniqueness remains the duplicate-session guarantee.
- Public responses never reveal cookie tokens, respondent-session IDs, creator data, or internal response relationships.

## Decisions, assumptions, limitations, and trade-offs

1. JSONB makes dynamic schemas, rendering, and question reordering simple, but PostgreSQL cannot enforce every nested rule as naturally as normalized question tables.
2. Zod and backend domain validation are therefore authoritative; stored definitions are also parsed when read.
3. JSONB analytics are more complex than normalized relational aggregation. Current analytics are intentionally computed in the isolated service for assignment-scale data.
4. Schema editing is locked after the first submitted response instead of implementing survey versioning. Metadata and availability remain editable.
5. Anonymous cookie sessions support draft restoration but do not represent verified identity.
6. Clearing cookies, using incognito, or switching browsers can create another anonymous session and lose access to the previous draft.
7. IP rate limiting reduces spam but cannot guarantee one human response. Shared networks can share a limit and distributed attackers can rotate IPs.
8. Analytics are computed only from submitted responses; drafts never affect totals or insights.
9. The design is intentionally scoped for a 12–24-hour assignment while keeping domain boundaries replaceable and scalable.

Additional limitations: one condition per question, fixed ratings from 1–5, no survey version history, and no verified respondent identity. A deployed frontend also requires a publicly deployed PostgreSQL/Redis-backed API; a static frontend deployment cannot reach the local Docker services. Password-reset routes were not present in PhotoDey's implemented router and are not invented here; its implemented email-verification/session architecture was adapted directly.
