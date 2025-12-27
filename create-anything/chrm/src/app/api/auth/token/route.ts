export const dynamic = 'force-dynamic'; // Add this at the top
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Convert NextRequest cookies to object format
    const cookieObject: Record<string, string> = {};
    request.cookies.getAll().forEach((cookie) => {
      cookieObject[cookie.name] = cookie.value;
    });

    // Get the token using next-auth/jwt
    const token = await getToken({ 
      req: {
        headers: Object.fromEntries(request.headers.entries()),
        cookies: cookieObject,
      } as any,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return the token and user info
    return NextResponse.json({
      jwt: token, // The actual JWT token
      user: {
        id: token.sub,
        email: token.email,
        name: token.name,
        // Add any other claims you need
        ...token,
      },
    });

  } catch (error) {
    console.error('Token endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to get token' },
      { status: 500 }
    );
  }
}