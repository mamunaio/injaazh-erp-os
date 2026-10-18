import { NextResponse } from 'next/server';
import { updateDeliveryItem, deleteDeliveryItem } from '@/lib/leadGenStore';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateDeliveryItem(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Delivery item not found' }, { status: 404 });
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
    const deleted = await deleteDeliveryItem(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Delivery item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
