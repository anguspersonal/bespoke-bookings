# AGENTS.md — AI Coding Assistant Guidelines

Welcome to **Bespoke Bookings**. This document serves as the primary system brief, architectural compass, and technical constraint manual for any AI coding agents working in this codebase.

---

## 1. Project Mission & Core Constraints

### The Problem
Independent barbers are penalized by marketplace platforms (like Fresha) that charge up to 20% commission on direct bookings, redirect clients away from barbers' websites, and impose platform lock-in.

### The Solution
A lightweight, embeddable booking engine that sits directly **inside** the barber's existing website (e.g., WordPress, Squarespace, Webflow) or runs on a branded bespoke subdomain. Barbers retain 100% customer ownership and pay a flat monthly SaaS subscription with **zero commission**.

### Non-Negotiable Engineering Philosophy
* **Minimise third-party SaaS fees:** No monthly subscriptions to Resend, Postmark, Vercel, or proprietary CI/CD engines.
* **Maximise open-source & self-hosting:** Retain total infrastructure independence.
* **Leverage GCP Free Tiers:** Cloud Run (scales to 0, 2M free requests/mo), Cloud Build (120 free build-mins/day), Cloud Identity Platform (50,000 free MAUs).
* **Rock-Solid Scheduling:** Prevent double bookings at the **database layer**, not with in-memory application checks.

---

## 2. Approved Technology Stack

| Layer | Approved Technology | Prohibited Alternatives |
|---|---|---|
| **Frontend & APIs** | **Next.js (App Router) + TypeScript** | No Pages router, no Remix, no PHP |
| **Container Compute** | **Google Cloud Run** | No Vercel, no AWS Lambda |
| **Relational Database** | **Google Cloud SQL + PostgreSQL 16** | No Supabase, no MongoDB, no DynamoDB |
| **Identity & Auth** | **Google Cloud Identity Platform (GCIP)** | No Firebase Auth console/branding, no Auth0, no Clerk |
| **Email Delivery** | **Postal (Open-Source Self-Hosted)** | No Resend, no Postmark, no SendGrid |
| **CI / CD** | **Google Cloud Build** | No GitHub Actions paid tiers, no CircleCI |
| **Billing** | **Direct BACS / GoCardless / Stripe** | Prioritize low-fee direct debit / bank transfer |
| **Embed Strategy** | **Vanilla JS loader + Isolated Iframe** | No raw DOM injection (prevents host CSS clashes) |

---

## 3. Repository Architecture (Monorepo)

The repository is managed via **pnpm workspaces** and **Turborepo**:

```text
bespoke-bookings/
├── apps/
│   ├── platform/           # The core Cloud Run service:
│   │                       #   - (booking)/embed/[slug] (The embeddable iframe view)
│   │                       #   - (admin)/admin          (The barber's dashboard)
│   │                       #   - api/v1/*               (Shared booking API)
│   ├── widget/             # Standalone vanilla JS embed loader (widget.js)
│   └── demo-shop/          # Fictional demo storefront (Crown & Blade Barbers)
├── packages/
│   ├── database/           # Cloud SQL PostgreSQL schema, queries, migrations
│   ├── email/              # Postal API client & React Email templates
│   ├── auth/               # Google Cloud Identity Platform (GCIP) verification
│   ├── types/              # Shared TypeScript interfaces & DTOs
│   └── ui/                 # Shared UI design system (Tailwind CSS)
├── docs/                   # Architectural specs, vision, and ADRs
└── cloudbuild.yaml         # GCP Cloud Build CI/CD pipeline
```

---

## 4. Key Engineering Invariants

### 1. Concurrency & Double-Booking Safety
* Appointments **must** be protected against double bookings using PostgreSQL exclusion constraints (`btree_gist` extension with `tsrange`).
* Never trust client clocks or in-memory arrays for slot availability.

### 2. Multi-Tenancy Boundary
* Every business record belongs to a `business_id` (tenant).
* The **embed booking flow** (`/embed/[slug]`) is unauthenticated and must **never** expose customer lists, revenue stats, or internal notes.
* The **admin dashboard** (`/admin`) is protected via GCIP session tokens verified with `@google-cloud/identity-platform` / Google Auth Library.

### 3. Embed Widget Isolation
* Barber websites (built with WordPress, Squarespace, Webflow, etc.) contain aggressive CSS resets and third-party scripts.
* The booking widget must **always** render inside an `iframe`. The host page only embeds `<div id="bespoke-booking"></div>` and `<script src=".../widget.js"></script>`.
* Use `window.postMessage` exclusively for dynamic height resizing and analytics callbacks.

### 4. Custom Domain Email (Postal)
* Barbers do **not** need Google Workspace accounts to send from `bookings@their-domain.co.uk`.
* Postal dynamically generates DKIM/SPF DNS records that the barber pastes into their domain registrar.
* When custom domains are not configured, fallback gracefully to `From: bookings@bespokebookings.co.uk` with `Reply-To: barber@personal-inbox.com`.

---

## 5. Coding & Workflow Standards

* **Package Management:** Always use `pnpm` (`pnpm install`, `pnpm --filter <app> add <dep>`). Never use `npm` or `yarn`.
* **TypeScript:** Strict mode enabled across all apps and packages. Avoid `any` types.
* **Style:** Modern Tailwind CSS with consistent utility classes.
* **Git Commits:** Conventional Commits (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
