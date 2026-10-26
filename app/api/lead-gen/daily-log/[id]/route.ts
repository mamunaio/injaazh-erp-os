import { NextResponse } from 'next/server';
import { updateDailyLog, deleteDailyLog } from '@/lib/leadGenStore';
import { requireApiWriteAuth } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiWriteAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;
    const body = await req.json();
    const updated = await updateDailyLog(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Daily log not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiWriteAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = await params;
    const deleted = await deleteDailyLog(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Daily log not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
