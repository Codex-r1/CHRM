// app/api/users/check/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, status, is_active')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('User check error:', error);
      return NextResponse.json(
        { error: 'Failed to check user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!profile,
      user: profile || null
    });

  } catch (error) {
    console.error('User check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}