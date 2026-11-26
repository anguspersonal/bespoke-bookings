export type AppointmentStatus =
  | 'confirmed'
  | 'pending_payment'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export type StaffRole = 'owner' | 'manager' | 'barber';

export interface BranchDTO {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  phone: string;
  openingHours: Record<string, { open: string; close: string; closed?: boolean }>;
}

export interface StaffDTO {
  id: string;
  businessId: string;
  branchIds: string[];
  fullName: string;
  role: StaffRole;
  avatarUrl?: string;
  bio?: string;
}

export interface ServiceDTO {
  id: string;
  businessId: string;
  name: string;
  subTitle?: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceInPence: number;
  category?: 'Hair' | 'Beard' | 'Packages' | 'Grooming';
  imageUrl?: string;
  isActive: boolean;
}

export interface BusinessConfig {
  id: string;
  name: string;
  slug: string;
  customDomain?: string;
  branches: BranchDTO[];
  services: ServiceDTO[];
  staff: StaffDTO[];
  themeSettings?: {
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    darkTheme?: boolean;
  };
}

export interface TimeSlot {
  startsAt: string; // ISO 8601 string
  endsAt: string;   // ISO 8601 string
  timeString: string; // e.g. "14:30"
  staffId: string;
  staffName: string;
  available: boolean;
}

export interface CreateBookingRequest {
  businessSlug: string;
  branchSlug: string;
  serviceId: string;
  staffId: string;
  isAnyBarber?: boolean;
  startsAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  discountApplied?: 'STUDENT_10' | 'NHS_10' | null;
}

export interface BookingConfirmationDTO {
  id: string;
  referenceCode: string;
  businessName: string;
  branchName: string;
  branchAddress: string;
  serviceName: string;
  staffName: string;
  isAnyBarber?: boolean;
  startsAt: string;
  endsAt: string;
  priceInPence: number;
  finalPriceInPence: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: AppointmentStatus;
  createdAt: string;
}

