import { NextResponse } from 'next/server';
import { getLeadGenFullState } from '@/lib/leadGenStore';

export async function GET() {
  try {
    const state = await getLeadGenFullState();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
