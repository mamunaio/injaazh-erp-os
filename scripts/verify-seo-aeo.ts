/**
 * Verification script for Production-Ready SEO & AEO Tracker
 * Tests MongoDB seeding, database fetching, and real Google PageSpeed Insights API live audit.
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
import SeoProject from '../models/SeoProject';
import { getSeoProjects, auditSeoProject } from '../app/actions/seoActions';
import mongoose from 'mongoose';

async function main() {
  console.log('🧪 Starting SEO & AEO Tracker Production Verification...\n');
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected successfully.\n');
    
    // Clear old test projects if they exist to test clean seeding
    console.log('🧹 Cleaning old mock data to test pristine auto-seeding...');
    await SeoProject.deleteMany({ clientName: { $in: ['TechFlow SaaS', 'Nexus Global', 'Verve Agency'] } });
    console.log('✅ Old test data cleared.\n');
    
    // Test 1: getSeoProjects (should trigger seeding)
    console.log('📋 Test 1: getSeoProjects() Auto-seeding');
    const getRes = await getSeoProjects();
    if (!getRes.success) {
      throw new Error(`getSeoProjects failed: ${getRes.error}`);
    }
    console.log(`  ✅ Successfully retrieved ${getRes.data.length} projects.`);
    getRes.data.forEach((p: any) => {
      console.log(`    - [${p.id}] ${p.clientName} (${p.url})`);
      console.log(`      Lighthouse: Perf: ${p.lighthouse.performance}, Acc: ${p.lighthouse.accessibility}, BP: ${p.lighthouse.bestPractices}, SEO: ${p.lighthouse.seo}`);
      console.log(`      WebVitals: LCP: ${p.vitals.lcp.value}${p.vitals.lcp.unit} (${p.vitals.lcp.status})`);
    });
    console.log();
    
    // Test 2: auditSeoProject on TechFlow SaaS (https://techflow.io)
    const techFlow = getRes.data.find((p: any) => p.clientName === 'TechFlow SaaS');
    if (!techFlow) {
      throw new Error('Could not find seeded TechFlow SaaS project');
    }
    
    console.log(`📋 Test 2: auditSeoProject() Live PageSpeed Insights API call for: ${techFlow.url}`);
    console.log('  🕒 Running audit (may take up to 10 seconds for real PageSpeed API)...');
    
    const auditRes = await auditSeoProject(techFlow.id);
    if (!auditRes.success) {
      throw new Error(`auditSeoProject failed: ${auditRes.error}`);
    }
    const audited = auditRes.data;
    if (!audited) {
      throw new Error('auditSeoProject completed but returned no data');
    }
    console.log('  ✅ Live Audit Completed Successfully!');
    console.log(`    Client: ${audited.clientName}`);
    console.log(`    Audited URL: ${audited.url}`);
    console.log(`    Last Audited Timestamp: ${audited.lastAudited}`);
    console.log('    ----------------------------------------');
    console.log('    📊 Real Lighthouse Scores:');
    console.log(`      Performance:   ${audited.lighthouse.performance}`);
    console.log(`      Accessibility: ${audited.lighthouse.accessibility}`);
    console.log(`      Best Practices: ${audited.lighthouse.bestPractices}`);
    console.log(`      SEO Score:     ${audited.lighthouse.seo}`);
    console.log('    ----------------------------------------');
    console.log('    ⚡ Real Core Web Vitals:');
    console.log(`      LCP:           ${audited.vitals.lcp.value}${audited.vitals.lcp.unit} (${audited.vitals.lcp.status})`);
    console.log(`      CLS:           ${audited.vitals.cls.value} (${audited.vitals.cls.status})`);
    console.log(`      INP:           ${audited.vitals.inp.value}${audited.vitals.inp.unit} (${audited.vitals.inp.status})`);
    console.log('    ----------------------------------------');
    console.log('    🤖 Dynamic AEO Tracker Status:');
    console.log(`      ChatGPT Mentions: ${audited.aeo.chatgptMentions} (trend: ${audited.aeo.chatgptTrend} by ${audited.aeo.chatgptTrendValue})`);
    console.log(`      Perplexity Score: ${audited.aeo.perplexityScore}% (trend: ${audited.aeo.perplexityTrend} by ${audited.aeo.perplexityTrendValue}%)`);
    console.log();
    
    console.log('🎉 All production verification tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
    process.exit(0);
  }
}

main();
