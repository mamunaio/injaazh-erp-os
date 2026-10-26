import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/leadGenStore';
import { requireApiAuth, requireApiWriteAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireApiAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireApiWriteAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const updated = await updateSettings(body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
