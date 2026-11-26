import { NextResponse } from 'next/server';
import { DEMO_BUSINESS } from '@bespoke/database';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Match demo tenant slug or branch slugs (soho / shoreditch)
  if (slug === 'crown-and-blade' || slug === 'soho' || slug === 'shoreditch' || slug === 'demo') {
    return NextResponse.json({
      success: true,
      business: DEMO_BUSINESS,
    });
  }

  return NextResponse.json(
    { success: false, error: 'Business not found' },
    { status: 404 }
  );
}
