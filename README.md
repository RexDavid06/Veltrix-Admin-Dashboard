# Veltrix Admin

A standalone admin dashboard for the Veltrix demo trading platform. It is a
**separate project** from the customer frontend (`Veltrix-Frontend/`) and talks
to the same Django backend (`Veltrix-Backend/`) over its REST API — never to the
database directly.

## Features

- **Overview** — platform statistics: users, verification coverage, transaction
  volume, demo cash, support load; recent transactions and open conversations.
- **Users** — searchable, filterable, paginated user list; account detail with
  positions and recent transactions; safe activate/deactivate and
  verify/unverify actions.
- **Transactions** — full platform transaction history with search, side/status
  filters and date range. Read-only by design.
- **Support** — conversation inbox (powered by the existing customer chat
  endpoints): read threads, reply, assign to yourself, resolve/reopen.
- **Instruments** — all instruments including hidden ones; show/hide clients'
  access to a symbol. Prices are not editable (they drive order execution).
- **Audit trail** — every admin mutation is recorded server-side in the shared
  `AuditLog` table and displayed here.

## Security model

The frontend is untrusted. Every `/api/admin/` endpoint is protected on the
server by the `IsPlatformAdmin` permission (active account that is staff or has
the `admin` role) and returns 401/403 otherwise — route guards in this app are
UX only. Responses never include password hashes or other credentials, admin
mutations are validated server-side (e.g. you cannot deactivate your own
account or the last superuser), and sensitive actions are written to the audit
trail in the same database transaction as the change itself.

## Local development

Prerequisites: Node 18+, and the Veltrix backend running locally.

```bash
# 1. Start the backend (from Veltrix-Backend/)
python3 manage.py runserver 0.0.0.0:3000

# 2. Start the admin frontend (from Veltrix-Admin/)
npm install
npm run dev        # serves on http://localhost:5174
```

In dev, `/api` and `/health` requests are proxied by Vite to the backend, so no
CORS setup is needed (port 5174 is already in the backend's default CORS
allow-list for non-proxy setups).

Sign in with an account that has `role=admin` or `is_staff=True` (for example
one created via the backend's `ensure_superuser` command).

## Environment variables

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | build/runtime | *(empty)* | Backend origin, e.g. `https://veltrix-backend.onrender.com`. Empty means same-origin (use the dev proxy or serve behind the same domain). |
| `VITE_BACKEND_PROXY_TARGET` | dev only | `http://127.0.0.1:3000` | Where the Vite dev proxy forwards `/api` and `/health`. |

Copy `.env.example` to `.env` to customize. `VITE_*` variables are embedded at
build time — never put secrets in them.

## Production build & deployment

```bash
npm run build      # outputs static assets to dist/
npm run preview    # locally preview the production build
```

The app is a fully static SPA. Host `dist/` on any static host (Render static
site, Netlify, Vercel, nginx, S3+CloudFront…):

1. Set `VITE_API_BASE_URL=https://<your-backend-host>` at build time.
2. Deploy the `dist/` folder.
3. Add the deployed site's origin to the backend's `CORS_ALLOWED_ORIGINS`
   environment variable (e.g. `https://veltrix-admin.onrender.com`).

### Deploying on Render

The repo ships with a `render.yaml` blueprint (Render → **New → Blueprint** and
point it at this repo, or New → Static Site). It defines:

- Build command `npm ci && npm run build`, publish directory `dist`
- SPA fallback rewrite (`/* → /index.html`) so refreshing a route like
  `/users` doesn't 404
- Security headers and immutable cache for hashed `/assets/*` files
- `VITE_API_BASE_URL` build env var (edit it in `render.yaml` if your backend
  lives at a different origin)

After the first deploy, add the site's URL (e.g. `https://veltrix-admin.onrender.com`)
to the backend's `CORS_ALLOWED_ORIGINS`.

Deploy the admin frontend on a **different origin** than the customer frontend
so customer traffic never carries admin tokens.

## API surface used

| Endpoint | Used for |
| --- | --- |
| `POST /api/auth/token/`, `POST /api/auth/token/refresh/`, `POST /api/auth/logout/` | JWT login, silent refresh, sign out |
| `GET /api/profile/` | display the signed-in admin |
| `GET /api/admin/stats/` | overview statistics |
| `GET /api/admin/users/`, `GET|PATCH /api/admin/users/<id>/` | user management |
| `GET /api/admin/transactions/` | transaction history |
| `GET /api/admin/instruments/`, `PATCH /api/admin/instruments/<id>/` | instrument visibility |
| `GET /api/admin/audit/` | audit trail |
| `GET /api/conversations/`, `GET|POST /api/conversations/<id>/…` | support inbox (existing customer chat API, staff sees all) |
