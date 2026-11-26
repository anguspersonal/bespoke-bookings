import type {
  BusinessConfig,
  BranchDTO,
  StaffDTO,
  ServiceDTO,
  TimeSlot,
  CreateBookingRequest,
  BookingConfirmationDTO,
  AppointmentStatus,
} from '@bespoke/types';

export const DEMO_BUSINESS: BusinessConfig = {
  id: 'biz-crown-blade-001',
  name: 'Crown & Blade Barbers',
  slug: 'crown-and-blade',
  customDomain: 'crownandblade.example',
  themeSettings: {
    primaryColor: '#0f0f11',
    accentColor: '#d6af71',
    logoUrl: '/crown-and-blade-logo.svg',
    darkTheme: true,
  },
  branches: [],
  services: [],
  staff: [],
};

export const DEMO_BRANCHES: BranchDTO[] = [
  {
    id: 'branch-soho-001',
    businessId: 'biz-crown-blade-001',
    name: 'Crown & Blade — Soho',
    slug: 'soho',
    addressLine1: '14 Brewer Lane, Soho',
    city: 'London',
    postalCode: 'W1F 0XX',
    phone: '020 7946 0101',
    openingHours: {
      monday: { open: '09:00', close: '19:00' },
      tuesday: { open: '09:00', close: '19:00' },
      wednesday: { open: '09:00', close: '19:00' },
      thursday: { open: '09:00', close: '19:00' },
      friday: { open: '09:00', close: '19:00' },
      saturday: { open: '10:00', close: '18:00', closed: true },
      sunday: { open: '10:00', close: '17:00', closed: true },
    },
  },
  {
    id: 'branch-shoreditch-002',
    businessId: 'biz-crown-blade-001',
    name: 'Crown & Blade — Shoreditch',
    slug: 'shoreditch',
    addressLine1: '88 Redchurch Mews, Shoreditch',
    city: 'London',
    postalCode: 'E2 7XX',
    phone: '020 7946 0202',
    openingHours: {
      monday: { open: '09:00', close: '19:00' },
      tuesday: { open: '09:00', close: '19:00' },
      wednesday: { open: '09:00', close: '19:00' },
      thursday: { open: '09:00', close: '19:00' },
      friday: { open: '09:00', close: '19:00' },
      saturday: { open: '10:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '17:00', closed: false },
    },
  },
];

export const DEMO_STAFF: StaffDTO[] = [
  {
    id: 'staff-any',
    businessId: 'biz-crown-blade-001',
    branchIds: ['branch-soho-001', 'branch-shoreditch-002'],
    fullName: 'Any Available Barber',
    role: 'barber',
    avatarUrl: '/crown-and-blade-icon.svg',
    bio: 'Choose first available barber for maximum flexibility',
  },
  {
    id: 'staff-arthur-001',
    businessId: 'biz-crown-blade-001',
    branchIds: ['branch-soho-001', 'branch-shoreditch-002'],
    fullName: 'Arthur Pendelton',
    role: 'owner',
    avatarUrl: '/avatars/arthur.svg',
    bio: 'Founder & Master Barber specializing in precision scissor craft and signature hot towel grooming.',
  },
  {
    id: 'staff-marcus-002',
    businessId: 'biz-crown-blade-001',
    branchIds: ['branch-soho-001', 'branch-shoreditch-002'],
    fullName: 'Marcus Vance',
    role: 'barber',
    avatarUrl: '/avatars/marcus.svg',
    bio: 'Senior Stylist known for precision skin fades, textured crops, and traditional wet shaving.',
  },
  {
    id: 'staff-liam-003',
    businessId: 'biz-crown-blade-001',
    branchIds: ['branch-soho-001', 'branch-shoreditch-002'],
    fullName: 'Liam Carter',
    role: 'barber',
    avatarUrl: '/avatars/liam.svg',
    bio: 'Master Barber with 12+ years experience in classic taper cuts, blade work, and beard styling.',
  },
  {
    id: 'staff-devon-004',
    businessId: 'biz-crown-blade-001',
    branchIds: ['branch-shoreditch-002', 'branch-soho-001'],
    fullName: 'Devon Brooks',
    role: 'barber',
    avatarUrl: '/avatars/devon.svg',
    bio: 'Stylist & Hot Towel Shave specialist known for meticulous skin fades and beard sculpts.',
  },
];

export const DEMO_SERVICES: ServiceDTO[] = [
  {
    id: 'svc-team-leader',
    businessId: 'biz-crown-blade-001',
    name: 'The Team Leader',
    subTitle: 'Hair Cut & Finish',
    description: 'Precision cut, luxury hot towel, traditional ear tidy, and razor neckline.',
    durationMinutes: 30,
    bufferMinutes: 0,
    priceInPence: 4200,
    category: 'Hair',
    imageUrl: '/services/haircut.svg',
    isActive: true,
  },
  {
    id: 'svc-skin-fade',
    businessId: 'biz-crown-blade-001',
    name: 'The Skin Fade',
    subTitle: 'Precision Razor Fade',
    description: 'Zero to skin fade finished with foil shaver and razor line, styled with matte paste.',
    durationMinutes: 40,
    bufferMinutes: 0,
    priceInPence: 4500,
    category: 'Hair',
    imageUrl: '/services/fade.svg',
    isActive: true,
  },
  {
    id: 'svc-artful-dodger',
    businessId: 'biz-crown-blade-001',
    name: 'The Artful Dodger',
    subTitle: 'Clipper Cut & Beard Trim',
    description: 'Clipper cut all over, beard shape up with hot towel treatment and soothing cooling balm.',
    durationMinutes: 35,
    bufferMinutes: 0,
    priceInPence: 5200,
    category: 'Packages',
    imageUrl: '/services/package.svg',
    isActive: true,
  },
  {
    id: 'svc-jack-of-all-trades',
    businessId: 'biz-crown-blade-001',
    name: 'The Jack of All Trade',
    subTitle: 'Skin Fade & Beard Trim',
    description: 'The signature combo: skin fade on top and sides, beard sculpted with hot towel finish.',
    durationMinutes: 50,
    bufferMinutes: 0,
    priceInPence: 6700,
    category: 'Packages',
    imageUrl: '/services/package.svg',
    isActive: true,
  },
  {
    id: 'svc-chief-executive',
    businessId: 'biz-crown-blade-001',
    name: 'The Chief Executive',
    subTitle: 'Full Signature Grooming VIP',
    description: 'The ultimate experience: hair cut, beard styling, double wash, hot towel, and relaxing massage.',
    durationMinutes: 45,
    bufferMinutes: 0,
    priceInPence: 6200,
    category: 'Packages',
    imageUrl: '/services/package.svg',
    isActive: true,
  },
  {
    id: 'svc-senior',
    businessId: 'biz-crown-blade-001',
    name: 'The Senior',
    subTitle: 'Beard Trim / Clean Shave',
    description: 'Authentic wet shave or razor beard sculpt with steam hot towel and cooling aftershave balm.',
    durationMinutes: 20,
    bufferMinutes: 0,
    priceInPence: 3500,
    category: 'Beard',
    imageUrl: '/services/beard.svg',
    isActive: true,
  },
  {
    id: 'svc-apprentice',
    businessId: 'biz-crown-blade-001',
    name: 'The Apprentice',
    subTitle: 'Clipper Cut All Over',
    description: 'One or two grade buzz cut with neckline tidy and rinse.',
    durationMinutes: 20,
    bufferMinutes: 0,
    priceInPence: 3500,
    category: 'Hair',
    imageUrl: '/services/fade.svg',
    isActive: true,
  },
  {
    id: 'svc-threading-wax',
    businessId: 'biz-crown-blade-001',
    name: 'Threading & Wax',
    subTitle: 'Eyebrow & Cheek Grooming',
    description: 'Traditional cotton thread eyebrow tidy and nose/ear waxing.',
    durationMinutes: 15,
    bufferMinutes: 0,
    priceInPence: 1500,
    category: 'Grooming',
    imageUrl: '/services/grooming.svg',
    isActive: true,
  },
];

// Attach branches, staff, services to business
DEMO_BUSINESS.branches = DEMO_BRANCHES;
DEMO_BUSINESS.staff = DEMO_STAFF;
DEMO_BUSINESS.services = DEMO_SERVICES;

// In-memory active appointments store simulating PostgreSQL exclusion constraint
export interface StoredAppointment {
  id: string;
  businessId: string;
  branchId: string;
  staffId: string;
  isAnyBarber: boolean;
  requestedStaffId?: string | null;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  status: AppointmentStatus;
  priceInPence: number;
  finalPriceInPence: number;
  discountApplied?: string | null;
  notes?: string;
  referenceCode: string;
  createdAt: string;
}

function createSeedTime(offsetDays: number, hours: number, minutes: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

const APPOINTMENTS_DB: StoredAppointment[] = [
  {
    id: 'appt-seed-1',
    businessId: 'biz-crown-blade-001',
    branchId: 'branch-soho-001',
    staffId: 'staff-arthur-001',
    isAnyBarber: false,
    requestedStaffId: 'staff-arthur-001',
    serviceId: 'svc-skin-fade',
    customerName: 'Marcus Sterling',
    customerEmail: 'marcus.sterling@example.com',
    customerPhone: '07700 900123',
    startsAt: createSeedTime(0, 10, 0),
    endsAt: createSeedTime(0, 10, 40),
    status: 'confirmed',
    priceInPence: 4500,
    finalPriceInPence: 4500,
    discountApplied: null,
    notes: 'Skin fade zero grade on sides, scissor trim on top.',
    referenceCode: 'CBB-582914',
    createdAt: createSeedTime(-1, 14, 20),
  },
  {
    id: 'appt-seed-2',
    businessId: 'biz-crown-blade-001',
    branchId: 'branch-soho-001',
    staffId: 'staff-marcus-002',
    isAnyBarber: true,
    requestedStaffId: null,
    serviceId: 'svc-senior',
    customerName: 'Oliver Taylor',
    customerEmail: 'oliver.taylor@example.com',
    customerPhone: '07700 900456',
    startsAt: createSeedTime(0, 11, 0),
    endsAt: createSeedTime(0, 11, 20),
    status: 'confirmed',
    priceInPence: 3500,
    finalPriceInPence: 3500,
    discountApplied: null,
    notes: 'Hot towel wet shave with cooling balm.',
    referenceCode: 'CBB-849102',
    createdAt: createSeedTime(-1, 16, 45),
  },
  {
    id: 'appt-seed-3',
    businessId: 'biz-crown-blade-001',
    branchId: 'branch-soho-001',
    staffId: 'staff-arthur-001',
    isAnyBarber: false,
    requestedStaffId: 'staff-arthur-001',
    serviceId: 'svc-chief-executive',
    customerName: 'Alexander Clark',
    customerEmail: 'alex.clark@example.com',
    customerPhone: '07700 900789',
    startsAt: createSeedTime(0, 11, 30),
    endsAt: createSeedTime(0, 12, 15),
    status: 'confirmed',
    priceInPence: 6200,
    finalPriceInPence: 5580,
    discountApplied: 'STUDENT_10',
    notes: 'Student ID verified. Full signature grooming experience.',
    referenceCode: 'CBB-319482',
    createdAt: createSeedTime(-2, 10, 15),
  },
  {
    id: 'appt-seed-4',
    businessId: 'biz-crown-blade-001',
    branchId: 'branch-shoreditch-002',
    staffId: 'staff-liam-003',
    isAnyBarber: false,
    requestedStaffId: 'staff-liam-003',
    serviceId: 'svc-jack-of-all-trades',
    customerName: 'David Hamilton',
    customerEmail: 'david.hamilton@example.com',
    customerPhone: '07700 900234',
    startsAt: createSeedTime(0, 13, 0),
    endsAt: createSeedTime(0, 13, 50),
    status: 'confirmed',
    priceInPence: 6700,
    finalPriceInPence: 6700,
    discountApplied: null,
    notes: 'Skin fade and beard sculpt with hot towel finish.',
    referenceCode: 'CBB-620184',
    createdAt: createSeedTime(-1, 11, 0),
  },
  {
    id: 'appt-seed-5',
    businessId: 'biz-crown-blade-001',
    branchId: 'branch-shoreditch-002',
    staffId: 'staff-devon-004',
    isAnyBarber: true,
    requestedStaffId: null,
    serviceId: 'svc-team-leader',
    customerName: 'Jack Davies',
    customerEmail: 'jack.davies@example.com',
    customerPhone: '07700 900567',
    startsAt: createSeedTime(0, 14, 15),
    endsAt: createSeedTime(0, 14, 45),
    status: 'confirmed',
    priceInPence: 4200,
    finalPriceInPence: 4200,
    discountApplied: null,
    notes: 'Any barber selected, allocated to Devon.',
    referenceCode: 'CBB-194820',
    createdAt: createSeedTime(0, 9, 10),
  },
  {
    id: 'appt-seed-6',
    businessId: 'biz-crown-blade-001',
    branchId: 'branch-soho-001',
    staffId: 'staff-marcus-002',
    isAnyBarber: false,
    requestedStaffId: 'staff-marcus-002',
    serviceId: 'svc-skin-fade',
    customerName: 'George Miller',
    customerEmail: 'george.m@example.com',
    customerPhone: '07700 900890',
    startsAt: createSeedTime(0, 15, 0),
    endsAt: createSeedTime(0, 15, 40),
    status: 'confirmed',
    priceInPence: 4500,
    finalPriceInPence: 4050,
    discountApplied: 'NHS_10',
    notes: 'NHS Cardholder discount applied. Marcus requested.',
    referenceCode: 'CBB-740192',
    createdAt: createSeedTime(-1, 18, 0),
  },
  {
    id: 'appt-seed-7',
    businessId: 'biz-crown-blade-001',
    branchId: 'branch-soho-001',
    staffId: 'staff-arthur-001',
    isAnyBarber: true,
    requestedStaffId: null,
    serviceId: 'svc-team-leader',
    customerName: 'Thomas Evans',
    customerEmail: 't.evans@example.com',
    customerPhone: '07700 900345',
    startsAt: createSeedTime(0, 16, 30),
    endsAt: createSeedTime(0, 17, 0),
    status: 'confirmed',
    priceInPence: 4200,
    finalPriceInPence: 4200,
    discountApplied: null,
    notes: 'Short back and sides. Customer selected Any Barber.',
    referenceCode: 'CBB-451920',
    createdAt: createSeedTime(-2, 14, 0),
  },
  {
    id: 'appt-seed-8',
    businessId: 'biz-crown-blade-001',
    branchId: 'branch-shoreditch-002',
    staffId: 'staff-liam-003',
    isAnyBarber: false,
    requestedStaffId: 'staff-liam-003',
    serviceId: 'svc-chief-executive',
    customerName: 'William Scott',
    customerEmail: 'william.scott@example.com',
    customerPhone: '07700 900678',
    startsAt: createSeedTime(1, 11, 0),
    endsAt: createSeedTime(1, 11, 45),
    status: 'confirmed',
    priceInPence: 6200,
    finalPriceInPence: 6200,
    discountApplied: null,
    notes: 'Pre-wedding haircut and signature beard sculpt.',
    referenceCode: 'CBB-982134',
    createdAt: createSeedTime(-1, 12, 0),
  },
  {
    id: 'appt-seed-9',
    businessId: 'biz-crown-blade-001',
    branchId: 'branch-soho-001',
    staffId: 'staff-arthur-001',
    isAnyBarber: false,
    requestedStaffId: 'staff-arthur-001',
    serviceId: 'svc-chief-executive',
    customerName: 'Henry Walsh',
    customerEmail: 'henry.walsh@example.com',
    customerPhone: '07700 900333',
    startsAt: createSeedTime(0, 13, 0),
    endsAt: createSeedTime(0, 13, 45),
    status: 'confirmed',
    priceInPence: 6200,
    finalPriceInPence: 6200,
    discountApplied: null,
    notes: 'Specifically requested Master Barber Arthur.',
    referenceCode: 'CBB-112233',
    createdAt: createSeedTime(-1, 15, 0),
  },
  {
    id: 'appt-seed-10',
    businessId: 'biz-crown-blade-001',
    branchId: 'branch-soho-001',
    staffId: 'staff-devon-004',
    isAnyBarber: true,
    requestedStaffId: null,
    serviceId: 'svc-artful-dodger',
    customerName: 'Daniel Bennett',
    customerEmail: 'daniel.b@example.com',
    customerPhone: '07700 900444',
    startsAt: createSeedTime(0, 14, 0),
    endsAt: createSeedTime(0, 14, 35),
    status: 'confirmed',
    priceInPence: 5200,
    finalPriceInPence: 5200,
    discountApplied: null,
    notes: 'Pool booking (Any Barber) - allocated to Devon.',
    referenceCode: 'CBB-445566',
    createdAt: createSeedTime(-1, 10, 0),
  },
];

/**
 * Validates the PostgreSQL tsrange exclusion constraint in application logic
 * before or during transaction execution.
 */
export function hasOverlappingAppointment(
  staffId: string,
  startsAtISO: string,
  endsAtISO: string
): boolean {
  if (staffId === 'staff-any') return false;

  const newStart = new Date(startsAtISO).getTime();
  const newEnd = new Date(endsAtISO).getTime();

  return APPOINTMENTS_DB.some((appt) => {
    if (appt.staffId !== staffId) return false;
    if (appt.status === 'cancelled') return false;

    const existingStart = new Date(appt.startsAt).getTime();
    const existingEnd = new Date(appt.endsAt).getTime();

    // Overlap condition: startsAt < existingEnd && endsAt > existingStart
    return newStart < existingEnd && newEnd > existingStart;
  });
}

/**
 * Generate bookable time slots for a branch, service and date
 */
export function getAvailableSlotsForDate(
  branchSlug: string,
  dateStr: string, // YYYY-MM-DD
  staffId: string = 'staff-any',
  serviceDurationMinutes: number = 30
): TimeSlot[] {
  const branch = DEMO_BRANCHES.find((b) => b.slug === branchSlug) || DEMO_BRANCHES[0];
  const dateObj = new Date(`${dateStr}T12:00:00Z`);
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = daysOfWeek[dateObj.getUTCDay()];
  const hours = branch.openingHours[dayName];

  if (!hours || hours.closed) {
    return [];
  }

  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);

  const openTimeInMinutes = openHour * 60 + openMin;
  const closeTimeInMinutes = closeHour * 60 + closeMin;

  const slots: TimeSlot[] = [];
  const stepMinutes = 20; // 20 minute intervals

  for (let current = openTimeInMinutes; current + serviceDurationMinutes <= closeTimeInMinutes; current += stepMinutes) {
    const slotHour = Math.floor(current / 60);
    const slotMin = current % 60;
    const timeString = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;

    const slotStartISO = `${dateStr}T${timeString}:00Z`;
    const endMinutes = current + serviceDurationMinutes;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const slotEndISO = `${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00Z`;

    const isBooked = hasOverlappingAppointment(staffId, slotStartISO, slotEndISO);

    slots.push({
      startsAt: slotStartISO,
      endsAt: slotEndISO,
      timeString,
      staffId,
      staffName: DEMO_STAFF.find((s) => s.id === staffId)?.fullName || 'Any Available Barber',
      available: !isBooked,
    });
  }

  return slots;
}

/**
 * Creates a confirmed appointment and guarantees double booking exclusion
 */
export function createConfirmedBooking(bookingReq: CreateBookingRequest): BookingConfirmationDTO {
  const branch = DEMO_BRANCHES.find((b) => b.slug === bookingReq.branchSlug) || DEMO_BRANCHES[0];
  const service = DEMO_SERVICES.find((s) => s.id === bookingReq.serviceId) || DEMO_SERVICES[0];

  const isAnyBarber = bookingReq.staffId === 'staff-any' || Boolean(bookingReq.isAnyBarber);

  // If staff is 'staff-any', randomly or sequentially assign available barber
  let assignedStaffId = bookingReq.staffId;
  if (assignedStaffId === 'staff-any') {
    const specificStaff = DEMO_STAFF.filter((s) => s.id !== 'staff-any');
    // Pick the first available barber who does not have a conflict
    const availableBarber = specificStaff.find(
      (staff) => !hasOverlappingAppointment(staff.id, bookingReq.startsAt, calculateEndTime(bookingReq.startsAt, service.durationMinutes))
    );
    assignedStaffId = availableBarber ? availableBarber.id : specificStaff[0].id;
  }

  const endsAt = calculateEndTime(bookingReq.startsAt, service.durationMinutes);

  // CONCURRENCY INVARIANT CHECK (mimicking PostgreSQL exclusion constraint):
  if (hasOverlappingAppointment(assignedStaffId, bookingReq.startsAt, endsAt)) {
    throw new Error('This time slot is already booked for this barber. Please select another time.');
  }

  const assignedStaff = DEMO_STAFF.find((s) => s.id === assignedStaffId) || DEMO_STAFF[1];

  let finalPrice = service.priceInPence;
  if (bookingReq.discountApplied === 'STUDENT_10' || bookingReq.discountApplied === 'NHS_10') {
    finalPrice = Math.round(service.priceInPence * 0.9);
  }

  const referenceCode = `CBB-${Math.floor(100000 + Math.random() * 900000)}`;
  const appointmentId = `appt-${Date.now()}`;

  const storedAppt: StoredAppointment = {
    id: appointmentId,
    businessId: DEMO_BUSINESS.id,
    branchId: branch.id,
    staffId: assignedStaff.id,
    isAnyBarber,
    requestedStaffId: isAnyBarber ? null : assignedStaff.id,
    serviceId: service.id,
    customerName: bookingReq.customerName,
    customerEmail: bookingReq.customerEmail,
    customerPhone: bookingReq.customerPhone,
    startsAt: bookingReq.startsAt,
    endsAt,
    status: 'confirmed',
    priceInPence: service.priceInPence,
    finalPriceInPence: finalPrice,
    discountApplied: bookingReq.discountApplied,
    notes: bookingReq.notes,
    referenceCode,
    createdAt: new Date().toISOString(),
  };

  APPOINTMENTS_DB.push(storedAppt);

  return {
    id: appointmentId,
    referenceCode,
    businessName: DEMO_BUSINESS.name,
    branchName: branch.name,
    branchAddress: `${branch.addressLine1}, ${branch.postalCode}`,
    serviceName: service.name,
    staffName: assignedStaff.fullName,
    isAnyBarber,
    startsAt: bookingReq.startsAt,
    endsAt,
    priceInPence: service.priceInPence,
    finalPriceInPence: finalPrice,
    customerName: bookingReq.customerName,
    customerEmail: bookingReq.customerEmail,
    customerPhone: bookingReq.customerPhone,
    status: 'confirmed',
    createdAt: storedAppt.createdAt,
  };
}

function calculateEndTime(startISO: string, durationMinutes: number): string {
  const d = new Date(startISO);
  d.setMinutes(d.getMinutes() + durationMinutes);
  return d.toISOString();
}

export type EnrichedStoredAppointment = StoredAppointment & {
  branchName: string;
  branchSlug: string;
  staffName: string;
  serviceName: string;
  durationMinutes: number;
};

/**
 * Query stored appointments with multi-criteria filtering for admin dashboard
 */
export function getStoredAppointments(filter?: {
  branchSlug?: string;
  dateStr?: string;
  staffId?: string;
  status?: AppointmentStatus | 'all';
  search?: string;
}): EnrichedStoredAppointment[] {
  let list = APPOINTMENTS_DB.slice();

  if (filter?.branchSlug && filter.branchSlug !== 'all') {
    const branch = DEMO_BRANCHES.find((b) => b.slug === filter.branchSlug);
    if (branch) {
      list = list.filter((a) => a.branchId === branch.id);
    }
  }

  if (filter?.staffId && filter.staffId !== 'all') {
    list = list.filter((a) => a.staffId === filter.staffId);
  }

  if (filter?.dateStr) {
    list = list.filter((a) => a.startsAt.startsWith(filter.dateStr!));
  }

  if (filter?.status && filter.status !== 'all') {
    list = list.filter((a) => a.status === filter.status);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.customerName.toLowerCase().includes(q) ||
        a.customerPhone.toLowerCase().includes(q) ||
        a.referenceCode.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q))
    );
  }

  // Chronological sort
  list.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return list.map((a) => {
    const branch = DEMO_BRANCHES.find((b) => b.id === a.branchId) || DEMO_BRANCHES[0];
    const staff = DEMO_STAFF.find((s) => s.id === a.staffId) || DEMO_STAFF[0];
    const service = DEMO_SERVICES.find((s) => s.id === a.serviceId) || DEMO_SERVICES[0];
    return {
      ...a,
      branchName: branch.name,
      branchSlug: branch.slug,
      staffName: staff.fullName,
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
    };
  });
}

/**
 * Update an appointment's status (e.g. confirmed -> completed / cancelled / no_show)
 */
export function updateAppointmentStatus(id: string, status: AppointmentStatus): boolean {
  const appt = APPOINTMENTS_DB.find((a) => a.id === id);
  if (!appt) return false;
  appt.status = status;
  return true;
}

/**
 * Reassign an appointment to a different barber (with overlap collision check)
 */
export function reassignAppointmentBarber(id: string, newStaffId: string): boolean {
  const appt = APPOINTMENTS_DB.find((a) => a.id === id);
  if (!appt) return false;
  if (appt.staffId === newStaffId) return true;

  const targetStaff = DEMO_STAFF.find((s) => s.id === newStaffId);
  if (!targetStaff) throw new Error('Target barber does not exist.');

  if (hasOverlappingAppointment(newStaffId, appt.startsAt, appt.endsAt)) {
    throw new Error(`Barber ${targetStaff.fullName} already has a booking during this timeslot.`);
  }

  appt.staffId = newStaffId;
  return true;
}

/**
 * Create a walk-in or manual telephone appointment via the admin dashboard
 */
export function createAdminAppointment(data: {
  branchSlug: string;
  serviceId: string;
  staffId: string;
  isAnyBarber?: boolean;
  startsAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}): EnrichedStoredAppointment {
  const branch = DEMO_BRANCHES.find((b) => b.slug === data.branchSlug) || DEMO_BRANCHES[0];
  const service = DEMO_SERVICES.find((s) => s.id === data.serviceId) || DEMO_SERVICES[0];
  const staff = DEMO_STAFF.find((s) => s.id === data.staffId) || DEMO_STAFF[1];

  const endsAt = calculateEndTime(data.startsAt, service.durationMinutes);

  // Check double-booking
  if (hasOverlappingAppointment(staff.id, data.startsAt, endsAt)) {
    throw new Error(`Barber ${staff.fullName} already has a booking during this timeslot.`);
  }

  const isAnyBarber = Boolean(data.isAnyBarber);
  const referenceCode = `CBB-${Math.floor(100000 + Math.random() * 900000)}`;
  const stored: StoredAppointment = {
    id: `appt-manual-${Date.now()}`,
    businessId: DEMO_BUSINESS.id,
    branchId: branch.id,
    staffId: staff.id,
    isAnyBarber,
    requestedStaffId: isAnyBarber ? null : staff.id,
    serviceId: service.id,
    customerName: data.customerName,
    customerEmail: data.customerEmail || 'walkin@crownandblade.example',
    customerPhone: data.customerPhone,
    startsAt: data.startsAt,
    endsAt,
    status: 'confirmed',
    priceInPence: service.priceInPence,
    finalPriceInPence: service.priceInPence,
    discountApplied: null,
    notes: data.notes || 'Walk-in / Telephone reservation booked by staff',
    referenceCode,
    createdAt: new Date().toISOString(),
  };

  APPOINTMENTS_DB.push(stored);

  return {
    ...stored,
    branchName: branch.name,
    branchSlug: branch.slug,
    staffName: staff.fullName,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
  };
}

/**
 * Calculates high-level financial & booking metrics for the dashboard
 */
export function getDashboardMetrics(branchSlug?: string): {
  todayAppointmentsCount: number;
  todayRevenuePence: number;
  totalAppointmentsCount: number;
  totalRevenuePence: number;
  zeroCommissionSavedPence: number; // 20% marketplace fee avoided
  activeBarbersCount: number;
} {
  const todayStr = new Date().toISOString().split('T')[0];
  const appts = getStoredAppointments({ branchSlug: branchSlug === 'all' ? undefined : branchSlug });

  const todayAppts = appts.filter((a) => a.startsAt.startsWith(todayStr) && a.status !== 'cancelled');
  const validAppts = appts.filter((a) => a.status !== 'cancelled');

  const todayRevenuePence = todayAppts.reduce((sum, a) => sum + a.finalPriceInPence, 0);
  const totalRevenuePence = validAppts.reduce((sum, a) => sum + a.finalPriceInPence, 0);
  // Independent barbers lose 20% on Fresha. Here they save that entire 20%:
  const zeroCommissionSavedPence = Math.round(totalRevenuePence * 0.2);

  const activeBarbers = DEMO_STAFF.filter((s) => s.id !== 'staff-any').length;

  return {
    todayAppointmentsCount: todayAppts.length,
    todayRevenuePence,
    totalAppointmentsCount: validAppts.length,
    totalRevenuePence,
    zeroCommissionSavedPence,
    activeBarbersCount: activeBarbers,
  };
}

/**
 * Update service pricing, duration or active state
 */
export function updateServicePricing(
  serviceId: string,
  updates: { priceInPence?: number; durationMinutes?: number; isActive?: boolean }
): boolean {
  const svc = DEMO_SERVICES.find((s) => s.id === serviceId);
  if (!svc) return false;
  if (typeof updates.priceInPence === 'number') svc.priceInPence = updates.priceInPence;
  if (typeof updates.durationMinutes === 'number') svc.durationMinutes = updates.durationMinutes;
  if (typeof updates.isActive === 'boolean') svc.isActive = updates.isActive;
  return true;
}

/**
 * Update weekly operating hours for a branch
 */
export function updateBranchHours(
  branchSlug: string,
  day: string,
  hours: { open: string; close: string; closed?: boolean }
): boolean {
  const branch = DEMO_BRANCHES.find((b) => b.slug === branchSlug);
  if (!branch || !branch.openingHours[day]) return false;
  branch.openingHours[day] = { ...branch.openingHours[day], ...hours };
  return true;
}
