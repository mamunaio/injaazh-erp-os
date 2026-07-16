import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EmailCampaignLog } from '@/models/EmailCampaignLog';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const logId = searchParams.get('logId');
  const url = searchParams.get('url');

  if (!logId || !type) {
    return new NextResponse('Invalid tracking request', { status: 400 });
  }

  try {
    await connectDB();
    const log = await EmailCampaignLog.findById(logId);

    if (log) {
      if (type === 'open') {
        if (!log.openedAt) {
          log.openedAt = new Date();
          await log.save();
        }
        
        // Return a 1x1 transparent GIF
        const pixel = Buffer.from(
          'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          'base64'
        );
        return new NextResponse(pixel, {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }

      if (type === 'click') {
        log.clicks = (log.clicks || 0) + 1;
        if (!log.openedAt) {
          log.openedAt = new Date();
        }
        await log.save();
        
        if (url) {
          return NextResponse.redirect(new URL(url));
        }
        return new NextResponse('Invalid URL', { status: 400 });
      }
    } else {
      // If log not found, still redirect or return pixel so the user doesn't see a broken link
      if (type === 'open') {
        const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        return new NextResponse(pixel, { headers: { 'Content-Type': 'image/gif' } });
      }
      if (type === 'click' && url) {
        return NextResponse.redirect(new URL(url));
      }
    }
  } catch (error) {
    console.error('Tracking Error:', error);
  }

  return new NextResponse('Tracking failed', { status: 500 });
}
