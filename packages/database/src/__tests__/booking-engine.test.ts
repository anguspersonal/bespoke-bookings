import { describe, expect, it } from 'vitest';
import {
  DEMO_BRANCHES,
  DEMO_BUSINESS,
  DEMO_SERVICES,
  DEMO_STAFF,
  POSTGRES_SCHEMA_SQL,
  createConfirmedBooking,
  getAvailableSlotsForDate,
  getStoredAppointments,
  hasOverlappingAppointment,
} from '../index';

describe('seed & schema invariants', () => {
  it('defines canonical Crown & Blade Barbers demo entities', () => {
    expect(DEMO_BUSINESS.slug).toBe('crown-and-blade');
    expect(DEMO_BUSINESS.customDomain).toBe('crownandblade.example');
    expect(DEMO_BRANCHES.map((b) => b.slug)).toEqual(['soho', 'shoreditch']);
    expect(DEMO_STAFF.length).toBeGreaterThanOrEqual(4);
    expect(DEMO_SERVICES.length).toBeGreaterThanOrEqual(5);
  });

  it('ensures every seeded appointment references valid branchId, staffId, and serviceId', () => {
    const branchIds = new Set(DEMO_BRANCHES.map((b) => b.id));
    const staffIds = new Set(DEMO_STAFF.map((s) => s.id));
    const serviceIds = new Set(DEMO_SERVICES.map((s) => s.id));
    const seeded = getStoredAppointments();

    expect(seeded.length).toBeGreaterThan(0);

    for (const appt of seeded) {
      expect(branchIds.has(appt.branchId), `invalid branchId ${appt.branchId}`).toBe(true);
      expect(staffIds.has(appt.staffId), `invalid staffId ${appt.staffId}`).toBe(true);
      expect(serviceIds.has(appt.serviceId), `invalid serviceId ${appt.serviceId}`).toBe(true);
      expect(new Date(appt.endsAt).getTime()).toBeGreaterThan(new Date(appt.startsAt).getTime());
    }
  });

  it('enforces database-level double-booking prevention via btree_gist EXCLUDE USING gist', () => {
    expect(POSTGRES_SCHEMA_SQL).toContain('CREATE EXTENSION IF NOT EXISTS btree_gist');
    expect(POSTGRES_SCHEMA_SQL).toContain('EXCLUDE USING gist');
    expect(POSTGRES_SCHEMA_SQL).toContain('tsrange(starts_at, ends_at');
  });
});

describe('availability slot calculation', () => {
  it('returns bookable slots on weekdays for Soho and zero slots on weekends', () => {
    // 2027-06-07 is a Monday; 2027-06-12 is a Saturday
    const weekdaySlots = getAvailableSlotsForDate('soho', '2027-06-07', 'staff-arthur-001', 30);
    const weekendSlots = getAvailableSlotsForDate('soho', '2027-06-12', 'staff-arthur-001', 30);

    expect(weekdaySlots.length).toBeGreaterThan(0);
    expect(weekdaySlots[0].timeString).toBe('09:00');
    expect(weekendSlots).toEqual([]);
  });

  it('returns bookable weekend slots for Shoreditch', () => {
    const saturdaySlots = getAvailableSlotsForDate('shoreditch', '2027-06-12', 'staff-marcus-002', 30);
    expect(saturdaySlots.length).toBeGreaterThan(0);
    expect(saturdaySlots[0].timeString).toBe('10:00');
  });
});

describe('booking creation & double-booking rejection', () => {
  it('creates a confirmed booking, applies 10% student discount, and rejects conflicting overlaps', () => {
    const dateStr = '2027-07-05'; // Monday far in the future to avoid seeded collisions
    const slots = getAvailableSlotsForDate('soho', dateStr, 'staff-arthur-001', 30);
    expect(slots.length).toBeGreaterThan(0);
    const chosen = slots[0];

    const confirmation = createConfirmedBooking({
      businessSlug: 'crown-and-blade',
      branchSlug: 'soho',
      serviceId: 'svc-team-leader',
      staffId: 'staff-arthur-001',
      startsAt: chosen.startsAt,
      customerName: 'Alex Morgan',
      customerEmail: 'alex.morgan@example.com',
      customerPhone: '07700 900111',
      discountApplied: 'STUDENT_10',
    });

    expect(confirmation.referenceCode).toMatch(/^CBB-\d{6}$/);
    expect(confirmation.status).toBe('confirmed');
    expect(confirmation.finalPriceInPence).toBe(Math.round(confirmation.priceInPence * 0.9));

    // Exact overlap for the same barber must be detected and rejected
    expect(
      hasOverlappingAppointment('staff-arthur-001', chosen.startsAt, confirmation.endsAt),
    ).toBe(true);

    expect(() =>
      createConfirmedBooking({
        businessSlug: 'crown-and-blade',
        branchSlug: 'soho',
        serviceId: 'svc-skin-fade',
        staffId: 'staff-arthur-001',
        startsAt: chosen.startsAt,
        customerName: 'Conflicting Client',
        customerEmail: 'conflict@example.com',
        customerPhone: '07700 900222',
      }),
    ).toThrow(/already booked/i);

    // Adjacent non-overlapping window starting at confirmation.endsAt is allowed
    expect(
      hasOverlappingAppointment(
        'staff-arthur-001',
        confirmation.endsAt,
        new Date(new Date(confirmation.endsAt).getTime() + 30 * 60_000).toISOString(),
      ),
    ).toBe(false);

    // Slot is now unavailable in recalculated availability
    const refreshed = getAvailableSlotsForDate('soho', dateStr, 'staff-arthur-001', 30);
    const bookedSlot = refreshed.find((s) => s.timeString === chosen.timeString);
    expect(bookedSlot?.available).toBe(false);

    // Different barber at the exact same time succeeds
    const otherBarberConfirmation = createConfirmedBooking({
      businessSlug: 'crown-and-blade',
      branchSlug: 'soho',
      serviceId: 'svc-team-leader',
      staffId: 'staff-marcus-002',
      startsAt: chosen.startsAt,
      customerName: 'Sam Taylor',
      customerEmail: 'sam.taylor@example.com',
      customerPhone: '07700 900333',
    });
    expect(otherBarberConfirmation.staffName).toBe('Marcus Vance');
  });
});
