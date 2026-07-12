import { NextResponse } from 'next/server';
import { checkAllInboxes } from '@/app/services/imapListener';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
    }
    if (searchParams.get('token') !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await checkAllInboxes();

    return NextResponse.json({ success: true, message: 'Inbox check complete' });
  } catch (error: any) {
    console.error('Check Replies Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
