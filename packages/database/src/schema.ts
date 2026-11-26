// Relational Data Schema for Google Cloud SQL (PostgreSQL 16)
// Incorporates PostgreSQL exclusion constraints (btree_gist + tsrange) to enforce zero double-bookings

import type { AppointmentStatus, StaffRole } from '@bespoke/types';

export interface BusinessRecord {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  themeSettings: Record<string, unknown>;
  createdAt: Date;
}

export interface BranchRecord {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  addressLine1: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  openingHours: Record<string, { open: string; close: string; closed?: boolean }>;
  createdAt: Date;
}

export interface StaffRecord {
  id: string;
  businessId: string;
  gcipUid: string | null;
  fullName: string;
  email: string;
  role: StaffRole;
  avatarUrl: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface StaffBranchRecord {
  staffId: string;
  branchId: string;
}

export interface ServiceRecord {
  id: string;
  businessId: string;
  name: string;
  subTitle: string | null;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceInPence: number;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface AppointmentRecord {
  id: string;
  businessId: string;
  branchId: string;
  staffId: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  priceInPence: number;
  discountApplied: string | null;
  notes: string | null;
  createdAt: Date;
}

/**
 * PostgreSQL 16 DDL migration string with btree_gist exclusion constraint.
 * This guarantees that two overlapping appointments for the same barber at the same branch
 * will be rejected by the database engine at write time, eliminating race conditions.
 */
export const POSTGRES_SCHEMA_SQL = `
-- 1. Enable btree_gist extension for tsrange exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Businesses (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255),
  theme_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Branches
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  opening_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, slug)
);

-- 4. Staff
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  gcip_uid VARCHAR(128),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'barber',
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Staff Branch assignments (Many-to-Many)
CREATE TABLE IF NOT EXISTS staff_branches (
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, branch_id)
);

-- 6. Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sub_title VARCHAR(255),
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  price_in_pence INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Hair',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Appointments with strict concurrency exclusion constraint
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
  price_in_pence INTEGER NOT NULL,
  discount_applied VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- MANDATORY AGENTS.md INVARIANT:
  -- Exclusion constraint preventing overlapping appointments for the same barber
  EXCLUDE USING gist (
    staff_id WITH =,
    tsrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status IN ('confirmed', 'pending_payment'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_business_branch ON appointments (business_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments (starts_at);
`;
