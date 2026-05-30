import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Try to validate with DB if available
    try {
      await connectToDatabase();
      const user = await User.findOne({ email: normalizedEmail }).select('+password');
      
      if (user && user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          // Generate a simple mock token
          const mockToken = `injaazh_jwt_token_${user._id}_${Date.now()}`;
          return NextResponse.json(
            {
              success: true,
              data: {
                token: mockToken,
                user: {
                  id: user._id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  image: user.image || null,
                }
              }
            },
            { headers: CORS_HEADERS }
          );
        }
      }
    } catch (dbError) {
      console.warn('DB authentication fallback triggered:', dbError);
    }

    // 2. Dummy credentials fallback for testing (admin@injaazh.com / admin123)
    if (normalizedEmail === 'admin@injaazh.com' && password === 'admin123') {
      const mockToken = `injaazh_jwt_token_dummy_admin_${Date.now()}`;
      return NextResponse.json(
        {
          success: true,
          data: {
            token: mockToken,
            user: {
              id: 'dummy_admin_id',
              name: 'Injaazh Admin',
              email: 'admin@injaazh.com',
              role: 'admin',
              image: null
            }
          }
        },
        { headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('Mobile Auth API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
