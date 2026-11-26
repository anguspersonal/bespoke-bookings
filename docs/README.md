# Bespoke Bookings Documentation

Welcome to the internal documentation and design repository for **Bespoke Bookings**. This directory houses the business strategy, system specifications, data architecture, and key decision records guiding the platform's development.

---

## Documentation Index

### 1. [Product Vision & Commercial Strategy](vision.md)
Detailed breakdown of the core problem, market positioning against Fresha, customer profile, pricing hypotheses, and phased MVP rollout plan.

* **Key Sections:**
  * Problem Statement: The "Marketplace Tax" & Redirect Friction
  * Ideal Customer Profile (Independent Barbers)
  * Strategic Differentiation
  * Commercial & Pricing Model
  * Phased Feature Roadmap

### 2. [System Architecture & Multi-Tenancy](architecture.md)
Comprehensive technical overview of how Bespoke Bookings delivers multi-tenant capability, isolated data security, embeddable widgets, and atomic appointment scheduling.

* **Key Sections:**
  * High-Level Component Flow & Architecture Diagram
  * Multi-Tenancy Model & PostgreSQL Row Level Security (RLS)
  * The Embeddable Widget Architecture (Host vs. Iframe Isolation)
  * Double-Booking Prevention & Concurrency Controls
  * Core Data Schema Overview
  * Deployment & Hosting Topology

### 3. [Architecture Decision Records (ADRs)](adrs/)
Formal records capturing major architectural, structural, and tooling choices made throughout the project lifecycle.

* **Active Records:**
  * [ADR-0001: Foundational Architecture and Core Technology Stack (2026-10-10)](adrs/20261010-InitialADR.md)

---

## Documentation Conventions

When contributing new documentation or records:
* Keep architecture documents up to date whenever the data model or public API contracts change.
* Create a new ADR in `docs/adrs/` for any irreversible or impactful technical decisions (e.g., changes in multi-tenancy model, new payment gateways, or runtime infrastructure changes). Use the `YYYYMMDD-Title.md` naming format.
