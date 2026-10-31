const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '..', 'public', 'assets', 'logo.png');
const favPath = path.join(__dirname, '..', 'public', 'fav.png');

const logoB64 = fs.readFileSync(logoPath).toString('base64');
const favB64 = fs.readFileSync(favPath).toString('base64');

const output = `/**
 * Official Injaazh Brand Logos as Data URLs
 * Embedded as Base64 to guarantee 100% synchronous, zero-CORS rendering in html2canvas / jsPDF exports.
 */

export const INJAAZH_LOGO_BASE64 = 'data:image/png;base64,${logoB64}';

export const INJAAZH_EMBLEM_BASE64 = 'data:image/png;base64,${favB64}';
`;

fs.writeFileSync(path.join(__dirname, '..', 'lib', 'brandLogo.ts'), output);
console.log('Successfully written lib/brandLogo.ts');
