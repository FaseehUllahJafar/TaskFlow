# TaskFlow

A multi-tenant project management app with Kanban boards, real-time collaboration and per-workspace roles.

## Features

- Multi-tenant workspaces with per-workspace roles (admin, member, client) and email invitations
- Kanban boards with drag and drop of tasks between columns
- Live board and task updates over Socket.io
- Tasks with priority, due dates, completion, comments, per-workspace labels, assignees and attachments (Cloudinary)
- Dashboard with live counts and recent projects across your workspaces
- In-app notifications, pushed live, for assignments and comments
- Read-only client portal for sharing project progress without an account
- Email and password auth with email verification and password reset, plus optional Google sign in
- Short-lived access tokens with rotating refresh tokens in an httpOnly cookie. Replaying a used refresh token revokes the whole token family.

## Tech stack

- **API:** Node.js 20, TypeScript, Express, Drizzle ORM on PostgreSQL, Redis, Socket.io, Passport, Winston
- **Client:** React 18, Vite, Redux Toolkit, React Router 6, Tailwind CSS, react-beautiful-dnd
- **Tooling:** Vitest, ESLint, Docker, GitHub Actions

## Quick start (Docker)

```bash
cp .env.example .env          # set JWT_ACCESS_SECRET, e.g. openssl rand -hex 32
docker compose up --build
```

- Web: http://localhost:8080
- API health: http://localhost:5000/health

Migrations run automatically when the API container starts. The web container serves the built client and proxies
`/api` and `/socket.io` to the API, so everything is same-origin.

Without SMTP credentials the API still starts, but verification and reset emails are only logged as failures. To try
the app locally without a mail server, mark the account as verified in the database:

```bash
docker compose exec postgres psql -U postgres -d taskflow_db -c "update users set is_verified = true"
```

## Local development

Prerequisites: Node.js 20+, Docker (for PostgreSQL and Redis).

```bash
# Database and cache
cd server
docker compose up -d

# API on http://localhost:5000
cp .env.example .env          # set JWT_ACCESS_SECRET (16+ characters)
npm ci
npm run db:migrate
npm run dev

# Client on http://localhost:5173 (new terminal)
cd client
cp .env.example .env
npm ci
npm run dev
```

## Configuration

Server environment variables (`server/.env`, see `server/.env.example`):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | yes | At least 16 characters |
| `FRONTEND_URL` | yes | Public URL of the client. Used in email links and the OAuth redirect |
| `REDIS_URL` | no | Defaults to `redis://localhost:6379` |
| `PORT` | no | Defaults to 5000 |
| `CORS_ORIGIN` | no | Comma separated list of allowed origins |
| `JWT_ACCESS_EXPIRATION` | no | Defaults to `15m` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | no | Google sign in is disabled when unset |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | no | Needed for attachments |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | no | Needed for verification, reset and invite emails |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` | no | API rate limit per IP, defaults to 1000 requests per 15 minutes |
| `AUTH_RATE_LIMIT_MAX` | no | Failed login, register and reset attempts per IP per 15 minutes, defaults to 10 |
| `LOG_LEVEL`, `LOG_TO_FILE` | no | Logs go to stdout. Set `LOG_TO_FILE=true` to also write `logs/` |

The API refuses to start if a required variable is missing or invalid.

Client build variables: `VITE_API_BASE_URL` (default `http://localhost:5000/api/v1`) and `VITE_WS_URL` (default
`http://localhost:5000`, empty means same origin).

## Scripts

| Where | Command | What it does |
| --- | --- | --- |
| `server/` | `npm run dev` | API with reload |
| `server/` | `npm run build` / `npm start` | Compile to `dist/` and run it |
| `server/` | `npm run typecheck`, `npm run lint`, `npm test` | Checks |
| `server/` | `npm run db:generate` | Generate a migration after changing `src/db/schema.ts` |
| `server/` | `npm run db:migrate` | Apply pending migrations |
| `client/` | `npm run dev`, `npm run build` | Dev server and production build |
| `client/` | `npm run typecheck`, `npm run lint` | Checks |

## API overview

All routes live under `/api/v1` and need a bearer token unless noted.

| Area | Routes |
| --- | --- |
| Auth (public) | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password/:token`, `GET /auth/verify-email/:token`, `GET /auth/google` |
| Account | `GET /auth/me`, `PATCH /auth/profile`, `PATCH /auth/password`, `DELETE /auth/account`, `POST /auth/logout` |
| Workspaces | `/workspaces`, `/workspaces/:id`, `/:id/members`, `/:id/invite`, `/accept-invite/:token` |
| Projects | `/projects/workspaces/:workspaceId`, `/projects/:id`, `/projects/:id/generate-client-link`, `GET /projects/portal/:clientToken` (public) |
| Board | `/columns/projects/:projectId`, `/columns/:id`, `/tasks/columns/:columnId`, `/tasks/projects/:projectId`, `/tasks/:id`, `/tasks/:id/move` |
| Task details | `/tasks/:id/assignees`, `/tasks/:id/labels`, `/comments/tasks/:taskId`, `/attachments/tasks/:taskId` |
| Labels | `GET` and `POST /labels/workspaces/:workspaceId` |
| Dashboard | `GET /dashboard` |
| Notifications | `/notifications`, `/notifications/unread-count`, `/notifications/:id/read`, `/notifications/read-all` |

Request bodies are validated against zod schemas and unknown fields are dropped, and user data embedded in
responses (members, assignees, comment authors) only ever contains `id`, `fullName`, `email` and `avatarUrl`.

Real-time events are published to `project:<id>`, `task:<id>` and `user:<id>` rooms. Sockets authenticate with the access
token and must be members of the workspace to join a project or task room.

## Project structure

```
client/                 React + Vite frontend (served by nginx in Docker)
  src/features/         auth, workspaces, board, tasks, notifications, dashboard, client-portal
  src/hooks/            typed Redux hooks and socket hooks
  src/lib/              axios and socket clients
server/                 Express API
  src/features/         one folder per module: routes, service, schema
  src/db/               Drizzle schema and SQL migrations
  src/socket/           Socket.io setup and event publishing
  src/middleware/       auth, validation, rate limiting, errors
docker-compose.yml      full stack: postgres, redis, api, web
```

## Deployment notes

- Put the API behind a TLS terminating proxy. In production the API trusts the first proxy for client IPs and sets
  secure cookies, so serve it over HTTPS.
- Keep the client and API on the same site (as the bundled nginx does), because the refresh cookie is `SameSite=Strict`.
- Set a strong `JWT_ACCESS_SECRET` and change the default database password in `.env`.
- Attachments need the `CLOUDINARY_*` variables. Without them uploads return 503 and everything else keeps working.
- Rate limit counters are kept in memory per API instance. If you run several instances, put a shared limit in front (for example at the reverse proxy).

## License

MIT, see [LICENSE](LICENSE).
