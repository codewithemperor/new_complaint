# Complaint Management & Ticketing System

A government complaint-management and ticketing system with a multi-tier civil-service approval workflow (Officer → Director/HOD → Permanent Secretary → Commissioner), email-only notifications, and an Admin Department acting as the central triage hub. Ticket IDs follow `KWMOC-YYYY-NNNNNN`.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router) + **HeroUI v3** + Tailwind CSS v4 + **Serwist** PWA |
| Backend | NestJS + **Prisma 7** (driver adapter) + PostgreSQL |
| Email | Nodemailer via `@nestjs-modules/mailer` (Mailtrap/Ethereal dev) |
| Storage | Local `./uploads` (dev) / **Cloudinary** (prod) — behind a `StorageService` port |
| Auth (staff) | JWT in httpOnly cookie; bcrypt hashing |
| Auth (citizens) | Guest + per-ticket signed tracking token |

See [`planning/`](./planning/README.md) for the full design — the source of truth for every milestone.

## Project layout

```
complaint_ticketing_system/
├── planning/     # design docs (read first)
├── frontend/     # Next.js + HeroUI v3 + PWA
└── backend/      # NestJS + Prisma + PostgreSQL
```

`frontend/` and `backend/` are independent projects with their own `package.json`.

## Quick start (development)

### 1. Backend
```bash
cd backend
cp .env.example .env             # fill in DATABASE_URL, JWT_SECRET, SMTP creds
npx prisma generate
npx prisma migrate dev           # create + apply migrations
npm run seed                     # idempotent seed
npm run start:dev                # http://localhost:4000, Swagger at /api
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env.local       # NEXT_PUBLIC_API_URL
npm run dev                      # http://localhost:3000
```

## Database

- **Dev:** local PostgreSQL. Create the DB once:
  ```bash
  psql -U postgres -c "CREATE DATABASE kwmoc_complaints"
  ```
- **Prod:** Neon/Supabase — set `DATABASE_URL` to the pooled connection string.

Use `prisma migrate dev` locally and `prisma migrate deploy` in CI/prod. Do not use `prisma db push` for schema evolution.

## Default seed credentials

Seeded in `backend/prisma/seed.ts` — all passwords are `Password123!` (change in any real deployment):

| Email | Role |
|---|---|
| `superadmin@kwmoc.gov.ng` | SUPER_ADMIN |
| `admin@kwmoc.gov.ng` | ADMIN_OFFICER |
| `intake@kwmoc.gov.ng` | INTAKE_OFFICER |
| `ps@kwmoc.gov.ng` | PERMANENT_SECRETARY |
| `commissioner@kwmoc.gov.ng` | COMMISSIONER |
| `auditor@kwmoc.gov.ng` | AUDITOR |
| `officer.<dept>@kwmoc.gov.ng` | SCHEDULE_OFFICER (per department) |
| `hod.<dept>@kwmoc.gov.ng` | DIRECTOR (per department) |

## Status

See the status line at the top of each `planning/milestone-*.md` doc.
