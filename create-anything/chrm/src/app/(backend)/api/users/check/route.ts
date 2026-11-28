// app/api/users/check/route.ts
export const dynamic = "force-dynamic";
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

    if (email.length > 254) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('User check error:', error);
      return NextResponse.json(
        { error: 'Failed to check user' },
        { status: 500 }
      );
    }

    // Only a yes/no: never return ids or account status to anonymous callers.
    return NextResponse.json({ exists: !!profile });

  } catch (error) {
    console.error('User check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}