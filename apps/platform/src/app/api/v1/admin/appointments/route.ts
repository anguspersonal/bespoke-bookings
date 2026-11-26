import { NextResponse } from 'next/server';
import {
  getStoredAppointments,
  updateAppointmentStatus,
  reassignAppointmentBarber,
  createAdminAppointment,
  getDashboardMetrics,
} from '@bespoke/database';
import type { AppointmentStatus } from '@bespoke/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchSlug = searchParams.get('branch') || undefined;
    const dateStr = searchParams.get('date') || undefined;
    const staffId = searchParams.get('staff') || undefined;
    const status = (searchParams.get('status') as AppointmentStatus | 'all') || undefined;
    const search = searchParams.get('search') || undefined;

    const appointments = getStoredAppointments({
      branchSlug,
      dateStr,
      staffId,
      status,
      search,
    });

    const metrics = getDashboardMetrics(branchSlug);

    return NextResponse.json({
      success: true,
      appointments,
      metrics,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.serviceId || !body.staffId || !body.startsAt || !body.customerName || !body.customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing required walk-in appointment fields.' },
        { status: 400 }
      );
    }

    const appointment = createAdminAppointment({
      branchSlug: body.branchSlug || 'soho',
      serviceId: body.serviceId,
      staffId: body.staffId,
      isAnyBarber: Boolean(body.isAnyBarber),
      startsAt: body.startsAt,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      notes: body.notes,
    });

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to create manual appointment' },
      { status: 409 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, staffId } = body;

    if (!id || (!status && !staffId)) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID and at least one field to update (status or staffId) are required.' },
        { status: 400 }
      );
    }

    if (staffId) {
      try {
        reassignAppointmentBarber(id, staffId);
      } catch (reassignErr: unknown) {
        return NextResponse.json(
          { success: false, error: reassignErr instanceof Error ? reassignErr.message : 'Failed to reassign barber.' },
          { status: 409 }
        );
      }
    }

    if (status) {
      const updated = updateAppointmentStatus(id, status as AppointmentStatus);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Appointment not found.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      id,
      status,
      staffId,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update appointment' },
      { status: 500 }
    );
  }
}
