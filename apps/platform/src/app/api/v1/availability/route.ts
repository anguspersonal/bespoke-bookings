import { NextResponse } from 'next/server';
import { getAvailableSlotsForDate, DEMO_SERVICES } from '@bespoke/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch') || 'soho';
  const serviceId = searchParams.get('serviceId') || 'svc-team-leader';
  const staffId = searchParams.get('staffId') || 'staff-any';

  // Default to today or provided YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const date = searchParams.get('date') || today;

  const service = DEMO_SERVICES.find((s) => s.id === serviceId) || DEMO_SERVICES[0];
  const duration = service.durationMinutes;

  const slots = getAvailableSlotsForDate(branch, date, staffId, duration);

  return NextResponse.json({
    branch,
    date,
    serviceId,
    staffId,
    slots,
  });
}
