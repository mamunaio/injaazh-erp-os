import { NextResponse } from 'next/server';

export const maxDuration = 60; // Max duration for Vercel Hobby

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
    }
    
    // Check either Bearer token or query param
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://' + request.headers.get('host');

    // List of crons to execute
    const crons = [
      '/api/cron/process-outreach',
      '/api/cron/send-warmup',
      '/api/cron/receive-warmup',
      '/api/cron/check-replies'
    ];

    // Execute them concurrently and wait for them to finish
    const results = await Promise.allSettled(crons.map(path => 
      fetch(`${baseUrl}${path}?token=${process.env.CRON_SECRET}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
      })
    ));

    return NextResponse.json({ 
      success: true, 
      message: 'Master cron triggered successfully',
      results: results.map(r => r.status)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
