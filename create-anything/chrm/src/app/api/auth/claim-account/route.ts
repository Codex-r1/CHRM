import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { membership_number, email } = body

    if (!membership_number || !email) {
      return NextResponse.json(
        { error: 'Membership number and email are required' },
        { status: 400 }
      )
    }

    // Find user by membership number and email
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('membership_number', membership_number.toUpperCase())
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No account found with these details' },
        { status: 404 }
      )
    }

    // Check if user already has password setup
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id)
    
    if (authUser.user?.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Account already claimed. Please login instead.' },
        { status: 400 }
      )
    }

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
    })

    if (resetError) {
      throw new Error('Failed to generate reset link')
    }

    // Send email with Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'CHRMAA <noreply@chrmaa.org>',
      to: user.email,
      subject: 'Claim Your CHRMAA Account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2B4C73 0%, #1a365d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #2B4C73; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>CHRMAA Account Claim</h1>
              </div>
              <div class="content">
                <h2>Welcome to CHRMAA!</h2>
                <p>You're receiving this email because you requested to claim your CHRMAA Alumni Association account.</p>
                
                <p><strong>Your Details:</strong></p>
                <ul>
                  <li>Name: ${user.full_name}</li>
                  <li>Membership Number: ${user.membership_number}</li>
                  <li>Email: ${user.email}</li>
                </ul>
                
                <p>To set your password and access your account, click the button below:</p>
                
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${resetData.properties?.action_link}" class="button">Set Your Password</a>
                </p>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all;">
                  ${resetData.properties?.action_link}
                </p>
                
                <p><strong>Important:</strong> This link will expire in 24 hours.</p>
                
                <div class="footer">
                  <p>© ${new Date().getFullYear()} CHRMAA Alumni Association. All rights reserved.</p>
                  <p>If you didn't request this, please ignore this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (emailError) {
      console.error('Email sending error:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password setup link sent to your email',
      emailSent: !!emailData
    })

  } catch (error: any) {
    console.error('Claim account error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to process claim request'
      },
      { status: 500 }
    )
  }
}