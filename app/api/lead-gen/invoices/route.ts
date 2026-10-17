import { NextResponse } from 'next/server';
import { getInvoices, createInvoice } from '@/lib/leadGenStore';
import { createNotification } from '@/app/actions/notificationActions';

export async function GET() {
  try {
    const invoices = await getInvoices();
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newInvoice = await createInvoice(body);
    
    try {
      await createNotification(
        'payment',
        `New invoice generated: #${newInvoice.invoiceNumber || 'INV'} for $${newInvoice.amount || 0}`,
        '/lead-gen/financials'
      );
    } catch (e) {
      console.error('Failed to create invoice notification:', e);
    }

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
