# CineBook Ticket Booking System

CineBook is a full-stack cinema ticket booking application with a Next.js frontend, an Express and TypeScript backend, PostgreSQL, Prisma, Google OAuth, cookie-based JWT authentication, real-time seat updates, and a responsive admin console.

## Features

- Customer movie browsing, showtime discovery, seat selection, checkout, bookings, payments, and account pages.
- Admin dashboards for movies, theaters, screens, shows, bookings, and transaction telemetry.
- Google-only Passport OAuth in addition to email/password registration and login.
- HTTP-only JWT authentication cookies.
- Role-based authorization for admin endpoints.
- PostgreSQL persistence through Prisma and `@prisma/adapter-pg`.
- Real-time booking and seat status events through Socket.IO.
- Zod request validation.
- Standardized backend responses through `ApiResponse` and centralized failures through `ApiError`.
- Backend Prettier formatting and TypeScript checks.
- GitHub Actions checks for backend formatting/type safety and frontend type safety/builds.

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- TanStack React Query
- Zustand
- Radix UI
- Lucide icons
- Biome for frontend formatting and linting

### Backend

- Node.js 22+
- Express 5
- TypeScript
- Prisma 7
- PostgreSQL
- Passport and `passport-google-oauth20`
- JSON Web Tokens
- Socket.IO
- Zod
- Prettier

## Project Structure

```text
ticket-booking-system/
├── .github/workflows/ci-cd.yml   # GitHub Actions checks
├── backend/                       # Express API and Prisma schema
│   ├── config/                    # Prisma, Passport, and Socket.IO setup
│   ├── generated/prisma/          # Generated Prisma client; do not edit manually
│   ├── middlewares/               # Auth, validation, and error middleware
│   ├── modules/                   # Auth, movies, shows, theaters, bookings, payments
│   ├── prisma/schema.prisma       # Database schema
│   ├── scripts/                   # TypeScript seed utilities
│   ├── types/                     # Shared backend domain and request types
│   └── utils/                     # ApiError, ApiResponse, asyncHandler, token blacklist
└── frontend/                      # Next.js application
		├── app/                       # Customer, admin, auth, and route pages
		├── components/                # Shared UI and providers
		├── lib/api/                   # API clients and React Query hooks
		└── lib/store/                 # Client-side state
```

## Prerequisites

Install the following before starting:

- Node.js 22 or newer
- pnpm 11 or newer
- A PostgreSQL database
- Google OAuth credentials if Google login is required

Check versions:

```bash
node --version
pnpm --version
```

## Installation

Install each package independently:

```bash
cd backend
pnpm install

cd ../frontend
pnpm install
```

The backend and frontend are separate pnpm packages. Run commands from the package directory they belong to.

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
PORT=5000
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="24h"
FRONTEND_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/callback/google"
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

### Environment variable notes

- `DATABASE_URL` is the only database connection variable used by Prisma and the backend adapter.
- Do not commit `backend/.env` or `frontend/.env.local`.
- `JWT_SECRET` must be different and securely generated in production.
- `FRONTEND_URL` is used after Google OAuth succeeds.
- The Google callback URL must exactly match the authorized redirect URI in Google Cloud Console.
- The backend defaults to port `5000`; the frontend defaults to port `3000`.

For production, set the variables in the hosting dashboards rather than using
the local `.env` values.

Backend on Render:

```env
FRONTEND_URL=https://cine-book-steel.vercel.app
GOOGLE_CALLBACK_URL=https://cinebook-i8er.onrender.com/api/auth/callback/google
```

Frontend on Vercel:

```env
NEXT_PUBLIC_API_URL=https://cinebook-i8er.onrender.com/api
```

`FRONTEND_URL` must use `https://` and exactly match the browser origin. After
changing Render variables, redeploy or restart the backend. After changing
Vercel variables, create a new deployment because Next.js embeds
`NEXT_PUBLIC_*` values at build time.

## Database and Prisma

The Prisma schema is located at `backend/prisma/schema.prisma`. Prisma reads the database URL from `DATABASE_URL` through `backend/prisma.config.ts` and `backend/config/prisma.ts`.

Validate the schema:

```bash
cd backend
pnpm prisma:validate
```

Generate the Prisma client after schema changes:

```bash
pnpm prisma:generate
```

Push the schema to a development database:

```bash
pnpm prisma:push
```

Create and apply a migration during development:

```bash
pnpm prisma:migrate
```

Open Prisma Studio:

```bash
pnpm prisma:studio
```

Use `prisma:reset` only when you intentionally want to reset the development database. It can destroy data.

## Running Locally

Start the backend in one terminal:

```bash
cd backend
pnpm dev
```

Start the frontend in a second terminal:

```bash
cd frontend
pnpm dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend health endpoint: `http://localhost:5000/`
- Google login: `http://localhost:5000/api/auth/google`

## Backend Commands

Run from `backend/`:

| Command                | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `pnpm dev`             | Start the API with `tsx` watch mode             |
| `pnpm start`           | Start the API once                              |
| `pnpm typecheck`       | Run TypeScript without emitting files           |
| `pnpm format`          | Format backend files with Prettier              |
| `pnpm format:check`    | Check backend formatting without changing files |
| `pnpm prisma:generate` | Generate the Prisma client                      |
| `pnpm prisma:validate` | Validate the Prisma schema                      |
| `pnpm prisma:push`     | Push schema changes to the configured database  |
| `pnpm prisma:migrate`  | Create/apply a development migration            |
| `pnpm prisma:pull`     | Pull the database schema into Prisma            |
| `pnpm prisma:studio`   | Open Prisma Studio                              |
| `pnpm prisma:reset`    | Reset the configured development database       |

## Frontend Commands

Run from `frontend/`:

| Command                  | Purpose                              |
| ------------------------ | ------------------------------------ |
| `pnpm dev`               | Start the Next.js development server |
| `pnpm build`             | Create a production build            |
| `pnpm start`             | Start the production server          |
| `pnpm exec tsc --noEmit` | Run the frontend TypeScript check    |
| `pnpm lint`              | Run Biome checks                     |
| `pnpm format`            | Format frontend files with Biome     |

The current frontend contains existing Biome advisory violations. CI therefore gates the frontend on TypeScript and production build success while the separate `pnpm lint` command remains available for incremental cleanup.

## Authentication

### Email/password

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Successful login and registration set an HTTP-only `token` cookie. The frontend sends it automatically with `credentials: "include"`.

### Google OAuth

```text
GET /api/auth/google
GET /api/auth/callback/google
GET /api/auth/google/failure
```

Passport uses Google only. GitHub OAuth is not configured in the backend or frontend.

## API Modules

The backend exposes these route groups:

```text
/api/auth
/api/movies
/api/shows
/api/bookings
/api/payments
/api/theaters
```

Controllers use `asyncHandler` so rejected promises reach the centralized error middleware. Successful responses use the standard shape:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

The frontend API client unwraps `data` for existing page and hook consumers.

## Admin Access

Admin routes require:

1. A valid JWT cookie or bearer token.
2. A user whose database `role` is `admin`.

Admin pages are under `/admin` in the frontend. The admin shell includes responsive navigation for small screens.

## Real-Time Events

The backend uses Socket.IO to publish booking and seat changes. Events include:

- `admin_data_changed`
- `seat_status_changed`

The frontend realtime provider listens for changes and refreshes affected query data.

## CI/CD

GitHub Actions is configured in `.github/workflows/ci-cd.yml`.

On pushes and pull requests targeting `main` or `master`, it runs:

### Backend job

- Installs dependencies with the backend lockfile.
- Checks Prettier formatting.
- Runs the TypeScript compiler.

### Frontend job

- Installs dependencies with the frontend lockfile.
- Runs the TypeScript compiler.
- Creates a production Next.js build.

The workflow does not run Prisma migrations, connect to the database, or deploy to a hosting provider. A deployment job can be added once a target such as Vercel, Render, Railway, or another platform is selected.

## Troubleshooting

### `DATABASE_URL` errors

Confirm that `backend/.env` exists, contains a valid PostgreSQL URL, and is loaded from the backend directory. Restart the backend after changing environment variables.

### Google callback errors

Check that the Google Cloud Console redirect URI exactly matches:

```text
http://localhost:5000/api/auth/callback/google
```

Also verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`.

### CORS or cookie errors

Confirm the frontend is running on `http://localhost:3000`, `FRONTEND_URL` matches it, and requests include credentials. Production deployments must use HTTPS for secure cookies.

### Prisma client errors

Run:

```bash
cd backend
pnpm prisma:generate
pnpm typecheck
```

### Formatting

Backend:

```bash
cd backend
pnpm format
pnpm format:check
```

Frontend:

```bash
cd frontend
pnpm format
```

## Security Notes

- Keep all environment files out of version control.
- Never expose `DATABASE_URL`, `JWT_SECRET`, or Google client secrets to the frontend.
- Use a strong production JWT secret.
- Use HTTPS in production.
- Review authorization rules before exposing admin endpoints publicly.
- Do not run database reset commands against production.
