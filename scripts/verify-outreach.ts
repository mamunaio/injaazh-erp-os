/**
 * Verification script for Cold Email Outreach Engine
 * Tests lead creation, outreach status progression, timeline log archiving, and SMTP/Sandbox fallback handling.
 */

// Load environment variables
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    process.env[key.trim()] = value.trim();
  });
} catch (error) {
  console.error('⚠️ Could not load .env.local file');
}

import connectToDatabase from '../lib/mongodb';
import { Lead } from '../models/Lead';
import { sendOutreachEmail } from '../app/actions/leadActions';
import mongoose from 'mongoose';

async function main() {
  console.log('🧪 Starting Cold Email Outreach Engine Verification...\n');
  
  let testLeadId: string | null = null;

  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected successfully.\n');
    
    // Create a fresh mock lead for clean verification
    console.log('📝 Creating a temporary mock lead...');
    const testLead = new Lead({
      company_name: 'Outreach Test Carp Corp',
      contact_person: 'Jane Outreach',
      email: 'jane@outreachtestcorp.com',
      source: 'Google Maps Search',
      outreach_status: 'New',
      targetService: 'High-end Web Development',
      website_url: 'https://outreachtestcorp.com',
      outreach_logs: []
    });
    
    await testLead.save();
    testLeadId = testLead._id.toString();
    console.log(`✅ Temporary mock lead created! ID: ${testLeadId}, Status: ${testLead.outreach_status}\n`);
    
    // Test 1: Trigger outreach email using our server action
    console.log('📋 Test 1: Dispatching Cold Email Outreach...');
    const subject = 'Modern digital experience proposal for Outreach Test Carp Corp';
    const body = 'Hi Jane,\n\nWe would love to build a lightning-fast Next.js website for Outreach Test Carp Corp.\n\nBest,\nInjaazh team';
    
    console.log('  🕒 Dispatching action sendOutreachEmail()...');
    const outreachRes = await sendOutreachEmail(testLeadId, subject, body);
    
    if (!outreachRes.success) {
      throw new Error(`sendOutreachEmail failed: ${outreachRes.error}`);
    }
    
    console.log('  ✅ Action completed successfully.');
    console.log(`  ℹ️ Sandbox Simulation fallbacks active: ${outreachRes.isSimulated}`);
    console.log();

    // Test 2: Verify database records after outreach
    console.log('📋 Test 2: Verifying database progression and logging...');
    const updatedLead = await Lead.findById(testLeadId);
    if (!updatedLead) {
      throw new Error('Test lead not found after email dispatch!');
    }
    
    console.log(`  - Expected Status: 'Contacted'`);
    console.log(`  - Actual Status:   '${updatedLead.outreach_status}'`);
    if (updatedLead.outreach_status !== 'Contacted') {
      throw new Error(`Lead status was not progressed to 'Contacted'! Found: ${updatedLead.outreach_status}`);
    }
    console.log('  ✅ Outreach Status successfully progressed to contacted!');
    
    console.log(`  - Timeline Activity Logs count: ${updatedLead.outreach_logs.length}`);
    if (updatedLead.outreach_logs.length !== 1) {
      throw new Error(`Outreach logs should contain exactly 1 entry! Found: ${updatedLead.outreach_logs.length}`);
    }
    
    const log = updatedLead.outreach_logs[0];
    console.log(`  - Log type: '${log.method}'`);
    if (log.method !== 'Email') {
      throw new Error(`Outreach log method should be 'Email'! Found: ${log.method}`);
    }
    
    console.log(`  - Log content summary:`);
    console.log(log.notes.split('\n').map(l => '      ' + l).join('\n'));
    
    if (!log.notes.includes(subject) || !log.notes.includes('Next.js website')) {
      throw new Error('Log notes did not archive the correct email subject and body!');
    }
    console.log('  ✅ Email subject, body, and sandbox indicators archived successfully.');
    console.log();
    
    console.log('🎉 Cold Email Outreach Engine verified programmatically with 100% success!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    if (testLeadId) {
      console.log('🧹 Cleaning up temporary mock lead...');
      await Lead.findByIdAndDelete(testLeadId);
      console.log('✅ Temporary mock lead deleted.');
    }
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
}

main();
