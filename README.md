# Field Service App

Subscription software for field service businesses (appliance repair, HVAC, plumbing, handyman).
Each business signs up, gets its own walled-off account, invites its team, and runs its jobs here.
Customers of those businesses will get a client portal.

## What's built

- **Business accounts:** self sign-up creates a business with a 14-day trial and its owner.
- **Login:** email and password, server-side sessions in the database (httpOnly cookie; only a hash of the token is stored).
- **Team:** invite links for technicians and office admins, role changes, removal. A business always keeps at least one owner.
- **Roles:** owner and office admin manage settings and team; technicians see their own area only.
- **Business settings:** branding and invoice details, trade modules.
- **Platform admin** (`/admin`): every subscribing business, its status and trial. Only emails in `PLATFORM_ADMIN_EMAILS` can open it.

Every business query is scoped by company id. `src/lib/accounts.test.ts` checks that one business can't reach another's data.

## Roadmap

1. ~~Business accounts, sign-up, team login~~
2. Clients, quotes, jobs and scheduling, technician view, invoices
3. Client portal (customer login by email link, approve quotes, pay)
4. Subscription billing with Stripe, plan limits, admin controls
5. Each business's own customer payments (Stripe Connect)

## Run locally

Needs Node 22+.

```bash
npm install
npm run dev
```

With no `DATABASE_URL`, the app uses an embedded Postgres (PGlite) in `.data/` and migrates it on start.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Unit tests (in-memory database) |
| `npm run typecheck` | Route types + TypeScript |
| `npm run lint` | ESLint |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |

## Deploy (Netlify)

1. Import this repo in Netlify.
2. Add a Postgres database (Netlify DB, or any Postgres with `DATABASE_URL`).
3. Set `PLATFORM_ADMIN_EMAILS` to your own email and `NEXT_PUBLIC_APP_NAME` to the product name.
4. Deploy. The build applies database migrations before building.

See `.env.example` for every setting.
