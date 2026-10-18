import { NextResponse } from 'next/server';
import { updateTimeLog, deleteTimeLog } from '@/lib/leadGenStore';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateTimeLog(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Time log not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteTimeLog(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Time log not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
