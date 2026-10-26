import { NextResponse } from 'next/server';
import { getClients, createClient } from '@/lib/leadGenStore';
import { createNotification } from '@/lib/notificationService';
import { requireApiAuth, requireApiWriteAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireApiAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiWriteAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const newClient = await createClient(body);

    try {
      await createNotification(
        'lead',
        `New client onboarded: ${newClient.name} ($${newClient.monthlyRetainer || 0}/mo)`,
        '/lead-gen/clients'
      );
    } catch (e) {
      console.error('Failed to create client notification:', e);
    }

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
