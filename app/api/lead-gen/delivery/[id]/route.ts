import { NextResponse } from 'next/server';
import { updateDeliveryItem } from '@/lib/leadGenStore';

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
