import { NextResponse } from 'next/server';
import {
  DEMO_BRANCHES,
  DEMO_STAFF,
  DEMO_BUSINESS,
  updateBranchHours,
} from '@bespoke/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    business: DEMO_BUSINESS,
    branches: DEMO_BRANCHES,
    staff: DEMO_STAFF,
    postalEmailStatus: {
      provider: 'Postal (Self-Hosted Open-Source)',
      serverHost: 'postal.bespokebookings.co.uk',
      fromEmail: 'bookings@crownandblade.example',
      replyTo: 'bookings@crownandblade.example',
      dkimStatus: 'verified',
      spfStatus: 'verified',
      mxStatus: 'verified',
      outgoingStatus: 'operational',
      monthlyFee: '£0.00 (Self-Hosted Free Tier)',
    },
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { branchSlug, day, hours } = body;

    if (!branchSlug || !day || !hours) {
      return NextResponse.json(
        { success: false, error: 'branchSlug, day, and hours are required.' },
        { status: 400 }
      );
    }

    const updated = updateBranchHours(branchSlug, day, hours);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update branch hours.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      branchSlug,
      day,
      hours,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update settings.' },
      { status: 500 }
    );
  }
}
