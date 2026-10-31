const puppeteer = require('puppeteer-core');
const mongoose = require('mongoose');
const { SignJWT } = require('jose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve(__dirname, '../public/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAudit() {
  console.log('1. Connecting to database to generate authenticated test session...');
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await mongoose.connection.db.collection('users').findOne({ email: 'mamun@injaazh.com' });
  if (!user) {
    console.error('Test user mamun@injaazh.com not found!');
    process.exit(1);
  }

  const sessionId = 'audit-session-' + Date.now();
  await mongoose.connection.db.collection('sessions').insertOne({
    userId: user._id,
    sessionId,
    device: 'Desktop',
    browser: 'Chrome',
    os: 'Windows',
    ip: '127.0.0.1',
    isValid: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new SignJWT({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    sessionId,
    tokenVersion: user.tokenVersion || 0,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  console.log('2. Authenticated token created. Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050 });

  await page.setCookie({
    name: 'user_token',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
  });

  const results = [];

  const auditRoute = async (name, url, screenshotName, extraSteps) => {
    console.log(`\n--- Auditing: ${name} (${url}) ---`);
    const pageErrors = [];
    const onPageError = (err) => pageErrors.push(err.message);
    page.on('pageerror', onPageError);

    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      const status = resp ? resp.status() : 0;
      const title = await page.title();
      const currentUrl = page.url();

      if (extraSteps) {
        await extraSteps(page);
      }

      const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      const pass = status === 200 && pageErrors.length === 0;
      results.push({ name, url, currentUrl, status, pageErrors, pass, screenshot: screenshotName });
      console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} - Status: ${status}, Title: "${title}", Errors: ${pageErrors.length}`);
    } catch (err) {
      results.push({ name, url, status: 'ERROR', error: err.message, pass: false });
      console.error(`[FAIL] ${name} encountered error:`, err.message);
    } finally {
      page.off('pageerror', onPageError);
    }
  };

  // 1. Audit /proposals
  await auditRoute('Proposals Hub', 'http://localhost:3000/proposals', 'audit-01-proposals.png');

  // 2. Audit /requirements
  await auditRoute('Requirements Hub', 'http://localhost:3000/requirements', 'audit-02-requirements.png');

  // 3. Audit /requirements/[id]/edit
  await auditRoute(
    'Requirements Edit Form',
    'http://localhost:3000/requirements/6ae5d565e35aee041e565466/edit',
    'audit-03-requirement-builder.png'
  );

  // 4. Audit /seo Hub
  await auditRoute('SEO Management Hub', 'http://localhost:3000/seo', 'audit-04-seo-hub.png');

  // 5. Audit /seo/hector-rivera-photography/manage Workspace
  await auditRoute(
    'SEO Workspace & Tasks',
    'http://localhost:3000/seo/hector-rivera-photography/manage',
    'audit-05-seo-workspace.png'
  );

  // 6. Audit Keyword Mapping Tab
  await auditRoute(
    'SEO Keyword Mapping Tab',
    'http://localhost:3000/seo/hector-rivera-photography/manage',
    'audit-06-seo-keyword-mapping.png',
    async (p) => {
      const keywordTabBtn = await p.$('button::-p-text(Keyword Mapping)');
      if (keywordTabBtn) {
        await keywordTabBtn.click();
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  );

  // 7. Audit Legacy Redirect
  console.log('\n--- Auditing: Legacy ObjectId Redirect ---');
  try {
    const legacyResp = await page.goto('http://localhost:3000/seo/6ae5ee82714305c51d08e935/manage', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await new Promise((r) => setTimeout(r, 1500));
    const redirectedUrl = page.url();
    const isRedirected = redirectedUrl.includes('/seo/hector-rivera-photography/manage');
    results.push({
      name: 'Legacy ObjectId 307 Redirect',
      url: 'http://localhost:3000/seo/6ae5ee82714305c51d08e935/manage',
      currentUrl: redirectedUrl,
      pass: isRedirected,
    });
    console.log(`[${isRedirected ? 'PASS' : 'FAIL'}] Legacy redirect resolved to: ${redirectedUrl}`);
  } catch (err) {
    results.push({ name: 'Legacy ObjectId Redirect', pass: false, error: err.message });
    console.error('[FAIL] Legacy redirect error:', err.message);
  }

  await browser.close();
  await mongoose.disconnect();

  console.log('\n=========================================');
  console.log('AUDIT RESULTS SUMMARY:');
  console.log('=========================================');
  console.table(results.map(r => ({ Name: r.name, Status: r.status || (r.pass ? 'PASS' : 'FAIL'), Pass: r.pass ? '✅' : '❌' })));
  
  fs.writeFileSync('public/screenshots/audit_results.json', JSON.stringify(results, null, 2));
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
