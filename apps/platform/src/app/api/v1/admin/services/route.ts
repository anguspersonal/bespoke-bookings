import { NextResponse } from 'next/server';
import { DEMO_SERVICES, updateServicePricing } from '@bespoke/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    services: DEMO_SERVICES,
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, priceInPence, durationMinutes, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Service ID is required.' }, { status: 400 });
    }

    const updated = updateServicePricing(id, { priceInPence, durationMinutes, isActive });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Service not found.' }, { status: 404 });
    }

    const service = DEMO_SERVICES.find((s) => s.id === id);

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update service.' },
      { status: 500 }
    );
  }
}
