import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EmailAccount } from '@/models/EmailAccount';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
    }
    if (searchParams.get('token') !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Reset sentToday to 0 for all accounts
    const result = await EmailAccount.updateMany({}, {
      $set: { sentToday: 0, lastResetDate: new Date() }
    });

    return NextResponse.json({ success: true, message: `Reset limits for ${result.modifiedCount} accounts.` });
  } catch (error: any) {
    console.error('Reset Limits Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
