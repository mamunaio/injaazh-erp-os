import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync, mkdirSync } from 'fs';
import crypto from 'crypto';
import { requireApiWriteAuth } from '@/lib/auth';

// 10MB default size limit (configurable via environment variable)
const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10);

// Explicit allowlist of extensions and MIME categories
const ALLOWED_EXTENSIONS = new Set([
  // Images (safe raster formats)
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  // Documents / Invoices / Spreadsheets / Archives
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip'
]);

// Explicit blocklist of executable or active content extensions (defense-in-depth)
const DANGEROUS_EXTENSIONS = new Set([
  'html', 'htm', 'xhtml', 'svg', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx',
  'php', 'phtml', 'php3', 'php4', 'php5', 'phps', 'exe', 'bat', 'cmd',
  'sh', 'bash', 'ps1', 'vbs', 'py', 'jar', 'war', 'jsp', 'asp', 'aspx',
  'cgi', 'pl', 'htaccess'
]);

/**
 * Validates file signature (magic bytes) to ensure file content matches the declared extension.
 */
function validateFileSignature(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;

  switch (ext) {
    case 'png':
      // 89 50 4E 47 0D 0A 1A 0A
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );

    case 'jpg':
    case 'jpeg':
      // FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case 'gif':
      // GIF87a or GIF89a: 47 49 46 38 [37|39] 61
      return (
        buffer.length >= 6 &&
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38 &&
        (buffer[4] === 0x37 || buffer[4] === 0x39) &&
        buffer[5] === 0x61
      );

    case 'webp':
      // RIFF....WEBP (bytes 0-3: 52 49 46 46, bytes 8-11: 57 45 42 50)
      return (
        buffer.length >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      );

    case 'pdf':
      // %PDF (25 50 44 46)
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );

    case 'zip':
    case 'docx':
    case 'xlsx':
      // PK.. (50 4B 03 04 or 50 4B 05 06)
      return (
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        ((buffer[2] === 0x03 && buffer[3] === 0x04) ||
          (buffer[2] === 0x05 && buffer[3] === 0x06))
      );

    case 'doc':
    case 'xls':
      // OLE compound file header: D0 CF 11 E0 A1 B1 1A E1
      return (
        buffer.length >= 8 &&
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0 &&
        buffer[4] === 0xa1 &&
        buffer[5] === 0xb1 &&
        buffer[6] === 0x1a &&
        buffer[7] === 0xe1
      );

    case 'csv':
    case 'txt': {
      // Must be plain text: reject null bytes anywhere in the buffer
      if (buffer.includes(0x00)) return false;

      // Validate complete text content within upload size limit and ensure strict UTF-8 validity
      try {
        const decoder = new TextDecoder('utf-8', { fatal: true });
        const fullContent = decoder.decode(buffer);
        const hasExecutableTags = /<script[\s>]|<\?php|<!DOCTYPE\s+html|<html[\s>]|<svg[\s>]|<iframe[\s>]|<object[\s>]|<embed[\s>]|onload\s*=|onerror\s*=|javascript:|eval\s*\(/i.test(
          fullContent
        );
        return !hasExecutableTags;
      } catch {
        // Reject malformed or invalid UTF-8 byte sequences
        return false;
      }
    }

    default:
      return false;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Enforce authentication and write authorization before inspecting file body
    const auth = await requireApiWriteAuth(request);
    if ('errorResponse' in auth) {
      return auth.errorResponse;
    }

    // 2. Safely parse multipart formData with error handling for malformed requests
    let data: FormData;
    try {
      data = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed multipart form data request' },
        { status: 400 }
      );
    }

    const file = data.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: 'No file found or invalid upload payload' },
        { status: 400 }
      );
    }

    // 3. Enforce upload size limit (default 10MB)
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the maximum allowed limit of ${Math.round(
            MAX_UPLOAD_SIZE / (1024 * 1024)
          )}MB`,
        },
        { status: 413 }
      );
    }

    // 4. Validate filename and extension
    const rawFileName = (file as any).name || 'upload.bin';
    const ext = extname(rawFileName).toLowerCase().replace(/^\./, '');

    if (!ext || DANGEROUS_EXTENSIONS.has(ext) || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported or prohibited file extension: .${ext || 'unknown'}`,
        },
        { status: 400 }
      );
    }

    // 5. Read file buffer and validate content signature (magic bytes)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateFileSignature(buffer, ext)) {
      return NextResponse.json(
        {
          success: false,
          error: 'File signature verification failed: content does not match allowed format',
        },
        { status: 400 }
      );
    }

    // 6. Safe filename generation and directory path traversal prevention
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const randomSuffix = crypto.randomBytes(16).toString('hex');
    const sanitizedBase = basename(rawFileName, '.' + ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);

    const safeFilename = `${Date.now()}-${randomSuffix}-${sanitizedBase}.${ext}`;
    const targetPath = join(uploadDir, safeFilename);

    // Verify resolved path does not traverse out of uploadDir
    if (!targetPath.startsWith(uploadDir)) {
      return NextResponse.json(
        { success: false, error: 'Illegal path traversal detected' },
        { status: 400 }
      );
    }

    await writeFile(targetPath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeFilename}`,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
