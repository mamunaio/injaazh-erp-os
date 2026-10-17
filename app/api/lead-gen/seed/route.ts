import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/leadGenStore';

export async function POST(req: Request) {
  try {
    const { forceMongoSync } = await req.json().catch(() => ({ forceMongoSync: true }));
    const result = await seedDatabase(forceMongoSync ?? true);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
