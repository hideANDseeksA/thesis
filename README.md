# SmartBarangay: A Web Unified E-Governance System

A full-stack web application for managing barangay (local government unit) operations, including resident records, certificate issuance, health monitoring, blotter reports, and more.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT, Google OAuth |
| File Storage | Supabase Storage |
| Real-time | Socket.IO |
| Email | Nodemailer |

---

## Project Structure

```
/
├── backend/     # Express + TypeScript REST API
└── frontend/    # React + Vite SPA
```

---

## Backend (`/backend`)

Built with **Express.js** and **TypeScript**. Follows a layered architecture: routes → controllers → helpers/utils, with Prisma as the ORM layer.

```
backend/
├── prisma/
│   ├── migrations/          # Chronological DB migration history
│   ├── schema.prisma        # Database schema & models
│   └── function.sql         # Custom PostgreSQL functions
├── src/
│   ├── controllers/         # Request handlers (one per feature domain)
│   ├── helper/              # Shared utility helpers (dates, mail, sockets, etc.)
│   ├── jobs/                # Scheduled background jobs (e.g. pregnancy monitoring)
│   ├── middleware/          # Auth, RBAC, encryption, rate limiting, validation
│   ├── routes/              # Express route definitions (maps to controllers)
│   ├── service/             # Business logic services (notifications, pregnancy)
│   ├── socket/              # Socket.IO setup and event handlers
│   ├── supabase/            # Supabase bucket configuration
│   ├── utils/               # Utilities: JWT, hashing, crypto, CSV, certificates
│   ├── validators/          # Input validation schemas
│   ├── prisma.ts            # Prisma client singleton
│   └── server.ts            # App entry point
├── .env.example
├── Dockerfile
└── tsconfig.json
```

### Key Modules

**Controllers** handle HTTP requests for each feature domain:

- `auth.controller.ts` — Login, signup, token refresh, Google OAuth
- `residents.controller.ts` — CRUD for resident profiles
- `certificates.controller.ts` — Certificate issuance and management
- `blotter.controller.ts` — Blotter (incident) record management
- `complaints.controller.ts` — Resident complaint handling
- `health_records.controller.ts` — Health record management
- `pregnancy_monitoring.controller.ts` — Maternal health tracking
- `analytics.controller.ts` — Dashboard statistics and reports
- `document.controller.ts` — Document upload/management
- `notification.controller.ts` — In-app notification management
- `transaction.controller.ts` — Certificate transaction history
- `system_setting.controller.ts` — Barangay-level system configuration
- `purok.controller.ts` — Purok (sub-village) management

**Middleware** enforces cross-cutting concerns:

- `auth.middleware.ts` — JWT token verification
- `rbac.middleware.ts` / `rbac.ts` — Role-based access control
- `encrypt.middleware.ts` / `decrypt.middleware.ts` — Payload encryption
- `rate-limit.ts` — API rate limiting
- `validate.middleware.ts` — Request body validation
- `upload.ts` — Multer file upload configuration
- `residentIdGenerator.ts` — Auto-generates unique resident IDs

**Utils** contain reusable logic:

- `certificates/` — PDF certificate generation
- `jwt.util.ts` — Token creation and verification
- `hash.util.ts` — Password hashing
- `crypto.util.ts` — Data encryption
- `supabaseUpload/Update/Delete.util.ts` — Supabase storage operations
- `csvMapper.ts` — Bulk resident import via CSV
- `bulkResidentIdGenerator.ts` — Batch ID generation

---

## Frontend (`/frontend`)

Built with **React** (Vite), **Tailwind CSS**, and **shadcn/ui** components. Organized by feature with a shared component library under `src/components/ui/`.

```
frontend/
├── public/                  # Static assets and PWA service worker
├── src/
│   ├── api/                 # Axios API call modules per domain
│   ├── assets/              # Images and audio files
│   ├── auth/                # Auth context and session management
│   ├── components/
│   │   ├── admin/           # Admin-specific components (settings, forms)
│   │   ├── auth/            # Login, signup, password reset, verification
│   │   ├── blotter/         # Blotter form and table
│   │   ├── certificates/    # Certificate issuance, appointments, history
│   │   ├── client/          # Resident-facing components
│   │   ├── documents/       # Document upload and viewing
│   │   ├── forms/           # Dynamic and certificate form generators
│   │   ├── health/          # Health record form and display
│   │   ├── home/            # Dashboard home views
│   │   ├── pregnancy/       # Pregnancy monitoring components
│   │   ├── resident-managements/ # Resident list, archive, BDAC
│   │   └── ui/              # shadcn/ui component library (buttons, tables, dialogs, etc.)
│   ├── context/             # React context providers (notifications, search, theme)
│   ├── errors/              # Error pages (401, 403, 404, 500, maintenance)
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # Page layout wrappers
│   ├── lib/                 # Axios instance, JWT helpers, utility functions
│   ├── pages/               # Top-level pages organized by role
│   │   ├── auth/            # Auth pages (login, signup, forgot password)
│   │   ├── healthworker/    # Health worker-specific pages
│   │   ├── residents/       # Resident portal pages
│   │   └── staff/           # Staff/admin pages
│   ├── routes/              # App router and protected route wrapper
│   └── utils/               # Toast, SweetAlert, socket, local storage helpers
├── index.html
└── vite.config.js
```

### Role-Based Views

The application supports multiple user roles, each with its own set of pages:

| Role | Pages Location | Access |
|---|---|---|
| Admin / Staff | `pages/staff/` | Residents, certificates, blotter, complaints, documents |
| Health Worker | `pages/healthworker/` | Health records, pregnancy monitoring |
| Resident | `pages/residents/` | Profile, document requests, transaction history |

### Key Patterns

- **Protected Routes** — `routes/ProtectedRoute.jsx` wraps role-restricted pages
- **Auth Context** — `auth/AuthContext.jsx` manages session state globally
- **System Settings Hook** — `hooks/SystemSettingsProvider.jsx` provides barangay-wide config
- **Socket.IO** — `utils/socket.js` initializes the real-time connection for notifications
- **Dynamic Certificate Forms** — `components/forms/DynamicCertificateForm.jsx` renders forms from backend-defined templates

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL
- Supabase project (for file storage)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your environment variables

npm install
npx prisma migrate deploy
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL to your backend URL

npm install
npm run dev
```

---

## Environment Variables

### Backend (`.env`)

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_KEY=
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

---

## Database Migrations

Migrations are managed with Prisma and stored in `backend/prisma/migrations/`. To create a new migration:

```bash
cd backend
npx prisma migrate dev --name describe_your_change
```

---

## Features Overview

- **Resident Management** — Register, update, archive, and search residents; bulk CSV import
- **Certificate Issuance** — Generate barangay clearance, indigency, residency, and custom certificates
- **Blotter Records** — Log and track incident/blotter reports
- **Complaint Management** — Accept and resolve resident complaints
- **Health Records** — Maintain per-resident health history
- **Pregnancy Monitoring** — Track maternal visits with automated job scheduling
- **Document Requests** — Online document request and approval workflow
- **Analytics Dashboard** — Population, certificate, and barangay statistics
- **Real-time Notifications** — Socket.IO-powered in-app alerts
- **Role-Based Access Control** — Admin, Staff, Health Worker, and Resident roles
- **RBI Form** — Record of Barangay Inhabitants form generation