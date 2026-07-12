import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { CampaignLead } from '@/models/CampaignLead';
import { executeAutomatedOutreach, executeCampaignSequence } from '@/app/actions/outreachAutomationActions';

// This endpoint should be triggered securely (e.g., via Vercel Cron or a secret token)
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

    // 1. Process Campaign Sequences
    const activeCampaignLeads = await CampaignLead.find({
      status: 'Active',
      nextActionDate: { $lte: new Date() }
    });

    for (const campaignLead of activeCampaignLeads) {
      await executeCampaignSequence(campaignLead._id.toString());
      await new Promise(r => setTimeout(r, 2000));
    }

    // 2. Process Scheduled/Queued Outreach
    const newLeads = await Lead.find({
      outreach_status: 'Queued',
      outreach_scheduled_for: { $lte: new Date() },
      source: { $ne: 'CSV Upload (Campaign)' }
    });

    for (const lead of newLeads) {
      await executeAutomatedOutreach(lead._id.toString(), false);
      await new Promise(r => setTimeout(r, 2000));
    }

    // 3. Process Legacy Follow-ups
    const followUpLeads = await Lead.find({
      outreach_status: 'Email Sent',
      is_replied: false,
      follow_up_count: { $lt: 3 }, // Max 3 follow-ups
      nextFollowUpDate: { $lte: new Date() },
      source: { $ne: 'CSV Upload (Campaign)' }
    });

    for (const lead of followUpLeads) {
      await executeAutomatedOutreach(lead._id.toString(), true);
      await new Promise(r => setTimeout(r, 2000));
    }

    return NextResponse.json({ 
      success: true, 
      processedCampaigns: activeCampaignLeads.length,
      processedLegacyInitial: newLeads.length, 
      processedLegacyFollowUps: followUpLeads.length 
    });
  } catch (error: any) {
    console.error('Process Outreach Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
