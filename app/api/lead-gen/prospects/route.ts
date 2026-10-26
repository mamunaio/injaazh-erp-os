import { NextResponse } from 'next/server';
import { getProspects, createProspect } from '@/lib/leadGenStore';
import { createNotification } from '@/lib/notificationService';
import { requireApiAuth, requireApiWriteAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireApiAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const prospects = await getProspects();
    return NextResponse.json(prospects);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiWriteAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const newProspect = await createProspect(body);

    // Create notification with link
    try {
      await createNotification(
        'lead',
        `New prospect added: ${newProspect.company || 'HVAC Lead'}${newProspect.city ? ` (${newProspect.city})` : ''}`,
        '/lead-gen/prospects'
      );
    } catch (e) {
      console.error('Failed to create lead notification:', e);
    }

    return NextResponse.json(newProspect, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
