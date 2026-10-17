import { NextResponse } from 'next/server';
import { getDeliveryCalendar, createDeliveryItem } from '@/lib/leadGenStore';

export async function GET() {
  try {
    const calendar = await getDeliveryCalendar();
    return NextResponse.json(calendar);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newItem = await createDeliveryItem(body);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
