import { NextResponse } from 'next/server';
import { getTimeLogs, createTimeLog } from '@/lib/leadGenStore';

export async function GET() {
  try {
    const logs = await getTimeLogs();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newLog = await createTimeLog(body);
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
