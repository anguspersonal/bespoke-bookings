import { NextResponse } from 'next/server';
import { createConfirmedBooking } from '@bespoke/database';
import type { CreateBookingRequest } from '@bespoke/types';

export async function POST(request: Request) {
  try {
    const body: CreateBookingRequest = await request.json();

    if (!body.serviceId || !body.startsAt || !body.customerName || !body.customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing required booking details (service, time, name, or phone).' },
        { status: 400 }
      );
    }

    const booking = createConfirmedBooking(body);

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error: unknown) {
    // Catch double-booking conflict error (analogous to PostgreSQL exclusion constraint violation)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to confirm booking. Time slot may have just been taken.',
      },
      { status: 409 }
    );
  }
}
