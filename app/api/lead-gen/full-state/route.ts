import { NextResponse } from 'next/server';
import { getLeadGenFullState } from '@/lib/leadGenStore';
import { requireApiAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireApiAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const state = await getLeadGenFullState();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
