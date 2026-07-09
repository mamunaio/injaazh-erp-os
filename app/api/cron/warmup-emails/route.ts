import { NextResponse } from 'next/server';
import { executeWarmupBatch } from '@/app/actions/warmupActions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // In production, we should protect this route with a secret key
    // const { searchParams } = new URL(request.url);
    // if (searchParams.get('token') !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const result = await executeWarmupBatch();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      message: result.message || 'Warmup batch executed successfully.',
    });
  } catch (error: any) {
    console.error('Cron Warmup Emails Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
