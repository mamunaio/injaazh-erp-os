import { NextResponse } from 'next/server';
import { updateProspect, deleteProspect } from '@/lib/leadGenStore';
import { createNotification } from '@/lib/notificationService';
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
    const updated = await updateProspect(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    if (body.status === 'Won') {
      try {
        await createNotification(
          'payment',
          `🎉 Deal Won! ${updated.company} converted to active client`,
          '/lead-gen/clients'
        );
      } catch (e) {
        console.error('Failed to create deal won notification:', e);
      }
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
    const deleted = await deleteProspect(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
