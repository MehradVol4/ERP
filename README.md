<div align="center">

# 🏬 ERP

**A small inventory & sales management system for a shop or trading business.**

Products and stock · suppliers and customers · purchases and sales · live reports — with stock kept in sync automatically and every change written to an audit log.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![Strapi](https://img.shields.io/badge/Strapi-5-4945ff?logo=strapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-compose-2496ed?logo=docker&logoColor=white)

</div>

---

Recording a sale lowers stock, recording a purchase raises it, and every change is
written to a stock-movement ledger that the low-stock and profit views are built on.

The project is a monorepo split into two apps:

- **`backend/`** – a [Strapi 5](https://strapi.io) API (SQLite by default, Postgres/MySQL supported).
- **`frontend/`** – a [Next.js](https://nextjs.org) dashboard (App Router, React 19).

## ✨ Features

- **Dashboard** – revenue, profit, orders and customer totals, with a revenue
  chart and low-stock warnings.
- **Products & categories** – price, cost, stock, reorder level, barcode,
  supplier and image.
- **Suppliers & customers** – full CRUD, with customers linked to their sales.
- **Purchases** – record received goods; stock and product cost are updated.
- **Sales** – create, edit and print invoices; pick a saved customer or type a
  walk-in name.
- **Stock movements** – a read-only ledger of every stock change and its source.
- **Low stock** – see everything at or below its reorder level and raise a
  pre-filled purchase to the supplier in one click.
- **Reports** – today / week / month sales, and a profit report showing which
  products earn the most and sell best.
- **Settings** – currency and low-stock threshold.
- **Auth** – email/password sign up and login (NextAuth + Strapi sessions).

## 🧱 Tech stack

| | |
|---|---|
| Frontend | Next.js, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Table, Recharts, react-hook-form + Zod, NextAuth |
| Backend | Strapi 5, TypeScript, SQLite (Postgres/MySQL supported via env) |
| Infra | Docker + Docker Compose (Postgres for production) |

## 🚀 Quick start with Docker (recommended)

The fastest way to run the whole stack — Postgres, backend and frontend — with one command.

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin).

```bash
cp .env.example .env
```

Fill in the secrets in `.env`. Generate each one with:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

Then bring everything up:

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Strapi API | http://localhost:1337 |
| Strapi admin | http://localhost:1337/admin |

On first run, open the Strapi admin to create the admin account, then register a
user in the frontend and sign in. Uploaded media and the Postgres database persist
in named volumes across rebuilds.

> This compose file builds production images (`strapi start` / `next start`), so
> code changes need a rebuild. For hot-reload development, use the manual setup below.

## 🛠️ Manual setup (local development)

Clone the repo, then set up the two apps. Start the backend first.

**Requirements:** Node.js 20 or newer (Strapi supports `>=20 <=26`) and npm.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in the secrets in `.env` (any random strings for local development):

```
HOST=0.0.0.0
PORT=1337
APP_KEYS="key1,key2"
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
JWT_SECRET=...
ENCRYPTION_KEY=...
```

Run it:

```bash
npm run dev
```

The API runs at `http://localhost:1337`. The first time you open
`http://localhost:1337/admin` you'll create the Strapi admin account.

Permissions for the `authenticated` role are granted automatically on boot, so
the API endpoints work as soon as a user logs in — there's no need to configure
roles by hand.

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXTAUTH_SECRET=<a random string>
NEXTAUTH_URL=http://localhost:3000
```

Run it:

```bash
npm run dev
```

Open `http://localhost:3000`, register an account and sign in.

## 📜 Scripts

Backend (`backend/`):

| Command | Description |
|---|---|
| `npm run dev` | Start Strapi in development (auto-reload) |
| `npm run build` | Build the admin panel |
| `npm run start` | Run the built app |

Frontend (`frontend/`):

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## 🔗 How it fits together

The frontend talks to Strapi over its REST API and authenticates with a
users-permissions JWT (managed by NextAuth). Sales and purchases carry line
items; a document-service middleware on the backend
(`backend/src/utils/stock-sync.ts`) adjusts product stock on every change and
records a `stock-movement` row, which is what the Stock Movements ledger and the
low-stock and profit views are built on.

## 📁 Project structure

```
ERP/
├── backend/              Strapi API
│   ├── src/
│   │   ├── api/          content types (product, sale, purchase, supplier,
│   │   │                 customer, category, stock-movement)
│   │   └── utils/        stock sync helpers
│   └── Dockerfile
├── frontend/             Next.js dashboard
│   ├── app/dashboard/    pages (products, sales, purchases, reports, ...)
│   ├── components/       shared UI
│   ├── lib/              API client, stats and report helpers
│   └── Dockerfile
├── docker-compose.yml    Postgres + backend + frontend
└── .env.example          compose environment template
```

## 📝 Notes

- **Database.** SQLite is used by default in manual setup and lives at
  `backend/.tmp/data.db`. The Docker Compose stack uses Postgres instead. To use
  Postgres or MySQL manually, set the `DATABASE_*` variables (see
  `backend/config/database.ts`).
- **Settings.** Currency and the low-stock threshold are per-browser display
  settings stored in `localStorage`, configurable under **Settings**.
- **Secrets.** Never commit real `.env` files — only the `.env.example`
  templates are tracked.
