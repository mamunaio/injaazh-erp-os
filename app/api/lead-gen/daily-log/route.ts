import { NextResponse } from 'next/server';
import { getDailyLogs, createDailyLog } from '@/lib/leadGenStore';
import { requireApiAuth, requireApiWriteAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireApiAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const logs = await getDailyLogs();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiWriteAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const newLog = await createDailyLog(body);
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
