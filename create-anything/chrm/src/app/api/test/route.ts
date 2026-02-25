import { NextResponse } from 'next/server';
import { sendEmail } from '@/app/lib/email/service';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Test welcome email
    const result = await sendEmail({
      to: email,
      type: 'welcome',
      data: {
        name: 'Test User',
        membership_number: '100999',
        email: email
      }
    });

    return NextResponse.json({ 
      success: true, 
      result,
      config: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
      }
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      error: error.message,
      details: error
    }, { status: 500 });
  }
}
