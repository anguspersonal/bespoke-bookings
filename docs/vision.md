# Product Vision & Commercial Strategy

## 1. Executive Summary

**Bespoke Bookings** is a purpose-built, embeddable booking platform designed for independent barbers and small boutique salons. It solves the primary friction points of established booking giants like Fresha: **high transaction and marketplace commissions, off-platform customer redirects, and feature bloat.**

Rather than trying to replicate an entire salon ERP with global marketplace discovery, Bespoke Bookings focuses on the core workflow independent barbers actually care about: a lightning-fast booking experience embedded directly on their existing website, total ownership of client relationships, and predictable, flat-rate pricing.

---

## 2. Problem Statement: The "Marketplace Tax"

Platforms like Fresha, Treatwell, and Booksy operate a two-sided marketplace model. While useful for new shops looking for cold discovery, they introduce significant friction for established, independent barbers:

1. **Marketplace Commissions:** Fresha charges up to a **20% commission** (minimum $6) on every new client booked through their network. Barbers frequently find their own organic marketing or direct referrals being intercepted by the marketplace.
2. **Customer Relationship Hijacking:** When a barber points their website or Instagram to a Fresha link, their customers are pulled into an ecosystem where nearby competing barbers are advertised to them.
3. **Loss of Website Value:** Barbers invest in bespoke websites (via agencies or platforms like WordPress, Squarespace, or Webflow) only to have the primary conversion point—the booking action—redirect visitors away to a third-party domain.
4. **Platform Bloat & Complexity:** Independent barbers with 1 to 4 chairs do not need enterprise multi-location inventory tracking, gift card exchanges, or complex commission payroll; they need reliable scheduling, no-show reduction, and easy customer records.

---

## 3. The Value Proposition

| Aspect | Fresha / Marketplaces | Bespoke Bookings |
|---|---|---|
| **Primary Goal** | Marketplace network effects & client discovery | Empowering the barber's independent brand |
| **Booking Location** | Off-site redirect to marketplace domain / app | **Directly embedded** on the barber's existing website |
| **Commissions** | 20% one-off fee on new clients + processing fees | **0% commission** on all appointments |
| **Customer Ownership** | Fresha controls user account and cross-promotes competitors | Barber owns 100% of the customer database and communications |
| **Pricing** | Monthly fee + variable commissions + processing cuts | Transparent, flat monthly SaaS subscription |
| **Integration** | Heavy link-outs or redirects | Drop-in JavaScript widget or branded subdomain |

---

## 4. Target Customer Profile (ICP)

* **Primary Persona:** The Established Independent Barber
  * Operates 1–3 chairs or rents a private chair.
  * Already has a steady book of repeat business, local foot traffic, or strong word-of-mouth / Instagram marketing.
  * Owns or operates a custom business website (e.g., built with WordPress, Squarespace, or Webflow).
  * Frustrated by marketplace fees and wants customers to remain on their site throughout the checkout experience.
* **Secondary Persona:** Solo Stylists & Tattoo/Aesthetic Studios with loyal recurring clients seeking simplified scheduling.

---

## 5. Commercial & Pricing Model

To maintain attractive economics for a solo developer or micro-SaaS business while making switching an obvious financial decision for the barber, pricing is based on flat tiers with zero per-booking commissions:

### Proposed Tiers
* **Standard Plan (£7.99 / month):**
  * Embeddable booking widget on existing website.
  * Hosted booking URL (`shopname.bespokebookings.co.uk`).
  * Unlimited appointments and client history.
  * Standard email confirmations and automated reminder notifications.
  * Calendar management (breaks, holidays, working hours).
* **Pro Plan (£14.99 / month):**
  * Everything in Standard.
  * Custom domain mapping (`book.tonysbarbers.co.uk`).
  * Advanced branding controls (custom CSS accents, dark/light modes).
  * Client notes and formula/haircut preference history.
  * Priority support.
* **Optional Add-Ons (Usage-based):**
  * Transactional SMS reminder bundles (cost-pass-through + small margin).
  * Stripe-powered online deposits or card holds to eliminate no-shows.

### Micro-SaaS Unit Economics
* 40 paying barbers @ £25 avg = **£1,000 MRR** (£12k ARR)
* 100 paying barbers @ £7.99 = **£799 MRR** (~£9.6k ARR)
* 500 paying barbers @ £7.99 = **£3,995 MRR** (~£48k ARR)
* Low operational overhead: Serverless compute, shared PostgreSQL instance, negligible hosting footprint.

---

## 6. Phased Product Roadmap

### Phase 1: MVP (Proof of Concept with Anchor Barber)
* **Barber Admin:** Setup services (duration, price), business hours, breaks, and manual appointment booking.
* **Embeddable Widget:** Lightweight script injecting an isolated iframe into the host site (tested against standalone demo websites).
* **Booking Engine:** Concurrency-safe slot calculations to prevent double bookings.
* **Client Communications:** Automated confirmation and cancellation emails.
* **Tenancy:** Multi-tenant database foundation with PostgreSQL RLS.

### Phase 2: Commercialization & Self-Service
* Automated onboarding flow for new barbers.
* Stripe billing integration for SaaS subscription lifecycle (trial, active, past due, canceled).
* Hosted subdomain landing pages (`subdomain.bespokebookings.co.uk`).
* Basic customer database with past visit logs.

### Phase 3: Retention & Growth Features
* Optional Stripe integration for booking deposits / cancellation penalty holds.
* SMS reminder integration via Twilio or local SMS gateway.
* Automated smart rebooking ("Due for a cut" prompt every 3–4 weeks for regulars).
* Waitlist auto-fill for last-minute cancellations.
