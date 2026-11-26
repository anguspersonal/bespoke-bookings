# ADR 0001: Initial Architecture and Core Technology Stack

* **Status:** Accepted
* **Date:** 2026-10-10
* **Deciders:** Technical Lead / Founder

---

## 1. Context and Problem Statement

Independent barbers frequently rely on platforms like Fresha, Booksy, or Treatwell for booking management. However, these platforms introduce substantial trade-offs:
1. **Aggressive Marketplace Fees:** Up to 20% commission on direct referrals or new customers who book through their network.
2. **Customer Redirects:** Customers are redirected away from the barber's own website to a third-party marketplace where competitor shops are promoted.
3. **Feature Bloat:** High complexity and overhead tailored for large multi-chair chain salons rather than independent shop owners.

Independent barbers with existing websites built on platforms like WordPress or Squarespace expressed the desire for an alternative booking system that lives on their own site, charges a flat subscription fee, and doesn't take a cut of their client transactions.

### Core Architectural Challenge
**Minimise ongoing SaaS fees, maximise open-source self-hosting and operational flexibility, and keep baseline operational costs as low as possible** while maintaining enterprise reliability.

---

## 2. Decision Drivers

* **Rock-Bottom Operating Costs:** Avoid accumulating per-email, per-seat, and per-build SaaS fees (Resend, Postmark, proprietary CI/CD platforms).
* **Multi-Tenant Custom Domain Email:** Ability to send booking confirmations from customer-owned domains (`tim@timsbarbers.co.uk`) with DKIM/SPF verification without forcing barbers to buy Google Workspace.
* **Open Source & Self-Hosting First:** Retain ownership and portability of core infrastructure components.
* **Unified GCP Infrastructure:** Use GCP-native services where free tiers and serverless scaling keep costs near zero (Cloud Run, Cloud Build, GCIP, Cloud SQL).
* **Concurrency Safety:** Deterministic prevention of overlapping appointment slots at the database boundary.

---

## 3. Technology Decisions

### Decision 1: Next.js + TypeScript (Frontend, Bespoke Websites, Routing & SEO)
* **Role:** Powers bespoke barber websites, public booking flows, embeddable booking widget, and staff admin dashboard.
* **Rationale:** Unified TypeScript full-stack model with Server-Side Rendering (SSR) for local SEO. Middleware enables dynamic tenant routing across custom subdomains and domains.
* **Cost Impact:** £0 licensing; runs inside standard container images.

### Decision 2: Google Cloud Run (Containerized Services & Shared Booking API)
* **Role:** Runs the websites and shared booking API as fully containerised serverless services.
* **Rationale:** Cloud Run scales to zero when there is no incoming traffic. You pay only for exact CPU/memory consumed during request processing (2 million requests/month free).
* **Cost Impact:** Near £0/month during initial MVP and early barber rollout.

### Decision 3: Cloud SQL + PostgreSQL (Relational Data Layer)
* **Role:** Stores relational data for businesses, branches, staff, services, and appointments.
* **Rationale:** PostgreSQL 16 provides ACID transactions and `btree_gist` exclusion constraints for concurrency-safe booking slots.
* **Cost Impact:** Scaled down to a small shared instance for low monthly cost.

### Decision 4: Google Cloud Build (GCP Native CI/CD Pipeline)
* **Role:** Automates test execution, container builds, and zero-downtime Cloud Run deployments. Replaces external CI/CD subscriptions.
* **Rationale:** Cloud Build is 100% native to GCP. It uses native Cloud IAM service accounts with zero secret rotation.
* **Cost Impact:** 120 build-minutes free every single day (well within solo developer needs).

### Decision 5: Google Cloud Identity Platform (GCIP) for Staff & Admin Login
* **Role:** Identity management for shop owners, staff barbers, and platform administrators.
* **Rationale:** Enterprise customer identity with native GCP console integration and optional multi-tenant user pools. Public booking remains friction-free with no customer login required.
* **Cost Impact:** 50,000 monthly active users (MAUs) completely free.

### Decision 6: Postal (Open-Source Self-Hosted Transactional Email Engine)
* **Role:** Transactional email delivery and automated multi-tenant DKIM domain verification. Replaces Resend and Postmark.
* **Rationale:** Postal is a full-featured, open-source mail delivery platform. Through its REST API:
  1. Default sending uses `From: "Shop Name" <bookings@bespokebookings.co.uk>` with `Reply-To: barber@...` (zero DNS configuration for standard barbers).
  2. Pro-tier barbers can white-label their own domain (`bookings@timsbarbers.co.uk`) by adding DKIM/SPF DNS records generated automatically by Postal's API, without requiring Google Workspace.
* **Cost Impact:** Eliminates recurring SaaS email fees (e.g. $20–$50/mo on Postmark/Resend).

### Decision 7: Low-Fee Billing Strategy
* **Role:** Subscription collection and deposit handling.
* **Rationale:** Avoid heavy payment cuts. For early beta barbers, utilize direct BACS invoicing / standing orders (0% transaction fees). For automated recurring billing, transition to GoCardless (1% + 20p capped direct debit) or Stripe Billing only when volume justifies it.
* **Cost Impact:** Maximum margin retained (>95%).

---

## 4. Consequences & Implications

### Positive Consequences
* **Ultra-Low Cost Baseline:** The entire platform can run for < £15–£25/month across infrastructure, with generous free tiers absorbing initial growth.
* **High Gross Margins:** At £7.99/barber, 10 barbers generate ~£80/month against £20 hosting costs (>75% gross margin), scaling to >90% margin at 50 barbers.
* **Complete Independence:** No dependence on third-party transactional email providers or proprietary deployment platforms.

### Risks and Mitigations
* **Self-Hosted Mail Deliverability (Postal):**
  * *Risk:* Mail servers require proper reverse DNS (rDNS/PTR), clean IP reputation, and DKIM/DMARC alignment to avoid spam folders.
  * *Mitigation:* Provision a dedicated static IP with clean reputation and strict rDNS configuration for Postal, and monitor DMARC aggregate reports.
