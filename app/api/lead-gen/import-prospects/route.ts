import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createProspect } from '@/lib/leadGenStore';
import { ProspectStatus, ReplyTag } from '@/types/leadGen';
import { requireApiWriteAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await requireApiWriteAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const firstSheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[firstSheetName];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    let addedCount = 0;
    for (const row of rows) {
      const company = row['Company'] || row['company'] || row['Name'] || '';
      const email = row['Business Email'] || row['businessEmail'] || row['Email'] || row['email'] || '';

      if (company && email) {
        await createProspect({
          company: String(company),
          city: String(row['City'] || row['city'] || ''),
          state: String(row['State'] || row['state'] || ''),
          website: String(row['Website'] || row['website'] || ''),
          businessEmail: String(email),
          emailVerified: (row['Email Verified'] || row['emailVerified'] || 'Pending') as 'Yes' | 'No' | 'Pending',
          mapsRank: String(row['Maps Rank'] || row['mapsRank'] || ''),
          reviewCount: Number(row['Review Count'] || row['reviewCount']) || 0,
          rating: Number(row['Rating'] || row['rating']) || 0,
          gap: String(row['Profile Gap'] || row['gap'] || ''),
          status: (row['Status'] || row['status'] || 'New') as ProspectStatus,
          replyTag: (row['Reply Tag'] || row['replyTag'] || 'None') as ReplyTag,
          lastContact: String(row['Last Contact'] || row['lastContact'] || ''),
          nextFollowUp: String(row['Next Follow-Up'] || row['nextFollowUp'] || ''),
          notes: String(row['Notes'] || row['notes'] || 'Imported from spreadsheet'),
        });
        addedCount++;
      }
    }

    return NextResponse.json({ success: true, count: addedCount });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
