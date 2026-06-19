import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { executeAutomatedOutreach } from '@/app/actions/outreachAutomationActions';

// This endpoint should be triggered securely (e.g., via Vercel Cron or a secret token)
export async function GET(request: Request) {
  try {
    // Basic security check (in production, use a secure header from the cron provider)
    const { searchParams } = new URL(request.url);
    // TEMPORARY: Disabled for testing
    // if (searchParams.get('token') !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await connectDB();

    // 1. Process Initial Outreach (Leads that are New and scheduled for today or earlier)
    const newLeads = await Lead.find({
      outreach_status: 'New',
      outreach_scheduled_for: { $lte: new Date() }
    });

    for (const lead of newLeads) {
      // Execute the outreach and wait to avoid rate limits
      await executeAutomatedOutreach(lead._id.toString(), false);
      // Wait a bit between sends to look human
      await new Promise(r => setTimeout(r, 2000));
    }

    // 2. Process Follow-ups (Leads that are Contacted, not replied, and nextFollowUpDate is today or earlier)
    const followUpLeads = await Lead.find({
      outreach_status: 'Contacted',
      is_replied: false,
      follow_up_count: { $lt: 3 }, // Max 3 follow-ups
      nextFollowUpDate: { $lte: new Date() }
    });

    for (const lead of followUpLeads) {
      await executeAutomatedOutreach(lead._id.toString(), true);
      await new Promise(r => setTimeout(r, 2000));
    }

    return NextResponse.json({ 
      success: true, 
      processedInitial: newLeads.length, 
      processedFollowUps: followUpLeads.length 
    });
  } catch (error: any) {
    console.error('Process Outreach Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
