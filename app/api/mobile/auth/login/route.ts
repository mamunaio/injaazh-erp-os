import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { generateAuthToken, createDbSession } from '@/lib/auth';
import { getMobileCorsHeaders } from '@/lib/cors';

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getMobileCorsHeaders(req),
  });
}

export async function POST(req: Request) {
  const corsHeaders = getMobileCorsHeaders(req);
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Create DB Session and sign real 30-day JWT token
    const sessionId = await createDbSession(user._id.toString(), req);
    const token = await generateAuthToken(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId,
        tokenVersion: user.tokenVersion ?? 0,
      },
      true
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image || null,
          },
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Mobile Auth API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
