import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/leadGenStore';
import { requireApiWriteAuth, apiForbiddenResponse } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1. Disable seed endpoint completely in production environments
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Database seed endpoint is permanently disabled in production environments.' },
        { status: 403 }
      );
    }

    // 2. Enforce authentication and write permissions (blocks unauthenticated & demo viewers)
    const auth = await requireApiWriteAuth(req);
    if ('errorResponse' in auth) return auth.errorResponse;

    // 3. Restrict destructive wiping operations strictly to admin / owner accounts
    if (auth.user.role !== 'admin' && auth.user.role !== 'owner') {
      return apiForbiddenResponse('Administrative privileges required. Only owner or admin accounts can reset and seed database.');
    }

    // 4. Require explicit confirmation payload to prevent accidental wipe from ordinary requests
    const body = await req.json().catch(() => ({}));
    if (!body?.confirmWipe || body.confirmationPhrase !== 'CONFIRM_SEED_RESET') {
      return NextResponse.json(
        {
          success: false,
          error: 'Destructive operation rejected: Missing explicit confirmation. Payload must include confirmWipe: true and confirmationPhrase: "CONFIRM_SEED_RESET".',
        },
        { status: 400 }
      );
    }

    const result = await seedDatabase(body.forceMongoSync ?? true);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
