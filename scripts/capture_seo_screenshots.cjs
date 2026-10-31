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

async function run() {
  console.log('Connecting to database to generate authenticated token...');
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await mongoose.connection.db.collection('users').findOne({ email: 'mamun@injaazh.com' });
  const sessionId = 'test-seo-screenshot-' + Date.now();
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

  console.log('Token created successfully. Launching Chrome...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050'],
    defaultViewport: { width: 1600, height: 1050 },
  });

  const page = await browser.newPage();

  // Set the auth cookie
  await page.setCookie({
    name: 'user_token',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
  });

  try {
    // 1. Screenshot Main SEO Hub (/seo)
    console.log('Navigating to /seo...');
    await page.goto('http://localhost:3000/seo', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('h1', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000)); // wait for animations
    const hubPath = path.join(SCREENSHOT_DIR, '01-seo-hub.png');
    await page.screenshot({ path: hubPath, fullPage: false });
    console.log('Saved:', hubPath);

    // 2. Screenshot Project Workspace (/seo/hector-rivera-photography/manage)
    console.log('Navigating to workspace: /seo/hector-rivera-photography/manage...');
    await page.goto('http://localhost:3000/seo/hector-rivera-photography/manage', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('table', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));
    const workspacePath = path.join(SCREENSHOT_DIR, '02-seo-workspace.png');
    await page.screenshot({ path: workspacePath, fullPage: false });
    console.log('Saved:', workspacePath);

    // 3. Screenshot Task Status Dropdown Open
    console.log('Opening Status dropdown on a task...');
    // Click on the status button inside the first table row
    const statusBtn = await page.$('table tbody tr:first-child td:nth-child(3) button');
    if (statusBtn) {
      await statusBtn.click();
      await new Promise((r) => setTimeout(r, 600)); // wait for dropdown animation
      const dropdownPath = path.join(SCREENSHOT_DIR, '03-seo-status-dropdown-open.png');
      await page.screenshot({ path: dropdownPath, fullPage: false });
      console.log('Saved:', dropdownPath);
      // Close dropdown by pressing Escape
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 300));
    }

    // 4. Screenshot Edit Task Modal with Open Dropdown
    console.log('Opening Edit Task modal...');
    const editBtn = await page.$('table tbody tr:first-child td:last-child button:first-child');
    if (editBtn) {
      await editBtn.click();
      await new Promise((r) => setTimeout(r, 800)); // wait for modal animation
      
      // Click on Work Type dropdown inside the modal
      const modalDropdowns = await page.$$('form button[aria-haspopup="listbox"]');
      if (modalDropdowns.length > 2) {
        // 0 is Priority, 1 is Status, 2 is Work Type
        await modalDropdowns[2].click();
        await new Promise((r) => setTimeout(r, 500));
      }

      const modalPath = path.join(SCREENSHOT_DIR, '04-seo-edit-task-modal.png');
      await page.screenshot({ path: modalPath, fullPage: false });
      console.log('Saved:', modalPath);

      // Close modal by clicking X button
      await page.evaluate(() => {
        const closeBtn = document.querySelector('div.fixed.inset-0 button');
        if (closeBtn) closeBtn.click();
      });
      await new Promise((r) => setTimeout(r, 800));
    }

    // 5. Screenshot Keyword Mapping Tab
    console.log('Switching to Keyword Mapping tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const kwBtn = btns.find((b) => b.innerText.includes('Keyword Mapping'));
      if (kwBtn) kwBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    const keywordTabPath = path.join(SCREENSHOT_DIR, '05-seo-keyword-mapping-tab.png');
    await page.screenshot({ path: keywordTabPath, fullPage: false });
    console.log('Saved:', keywordTabPath);

    // 6. Screenshot Add Keyword Modal
    console.log('Opening Add Keyword modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find((b) => b.innerText.includes('+ Add Keyword'));
      if (addBtn) addBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Open Search Intent dropdown in the keyword modal
    await page.evaluate(() => {
      const dropdowns = Array.from(document.querySelectorAll('form button[aria-haspopup="listbox"]'));
      if (dropdowns.length > 1) {
        dropdowns[1].click();
      }
    });
    await new Promise((r) => setTimeout(r, 500));

    const keywordModalPath = path.join(SCREENSHOT_DIR, '06-seo-keyword-modal-dropdown.png');
    await page.screenshot({ path: keywordModalPath, fullPage: false });
    console.log('Saved:', keywordModalPath);

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    await mongoose.disconnect();
    console.log('All screenshots completed successfully!');
  }
}

run();
