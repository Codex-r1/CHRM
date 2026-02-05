import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export type EmailType = 
  | 'welcome' 
  | 'account_claim'
  | 'event_registration' 
  | 'merchandise_order' 
  | 'payment_confirmation' 
  | 'password_reset'

interface SendEmailParams {
  to: string
  type: EmailType
  data: {
    name: string
    [key: string]: any
  }
}

export async function sendEmail({ to, type, data }: SendEmailParams) {
  try {
    const from = getFromEmail(type)
    const subject = getSubject(type, data)
    const html = getHtmlContent(type, data)

    console.log(`📧 Sending ${type} email to ${to}`);

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    console.log('✅ Email sent successfully:', result);
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Email sending error:', error)
    return { success: false, error }
  }
}

function getFromEmail(type: EmailType): string {
  // Use env variable or fallback to verified email
  const domain = process.env.RESEND_FROM_EMAIL || 'noreply@chrmaa.org';
  const emails = {
    welcome: `CHRMAA <${domain}>`,
    account_claim: `CHRMAA <${domain}>`,
    event_registration: `CHRMAA Events <${domain}>`,
    merchandise_order: `CHRMAA Merchandise <${domain}>`,
    payment_confirmation: `CHRMAA Payments <${domain}>`,
    password_reset: `CHRMAA Security <${domain}>`,
  }
  return emails[type] || `CHRMAA <${domain}>`
}

function getSubject(type: EmailType, data: any): string {
  const subjects = {
    welcome: `Welcome to CHRMAA, ${data.name}!`,
    account_claim: 'Claim Your CHRMAA Account',
    event_registration: `Event Registration Confirmed - ${data.event_name}`,
    merchandise_order: 'Merchandise Order Confirmation',
    payment_confirmation: `Payment Confirmation - ${data.type}`,
    password_reset: 'Password Reset Request',
  }
  return subjects[type] || 'Message from CHRMAA'
}

function getHtmlContent(type: EmailType, data: any): string {
  const templates: Record<EmailType, string> = {
    welcome: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #2B4C73 0%, #1a365d 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .button { display: inline-block; background: #2B4C73; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #2B4C73; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Welcome to CHRMAA!</h1>
            </div>
            <div class="content">
              <h2 style="color: #2B4C73;">Dear ${data.name},</h2>
              <p style="font-size: 16px;">We're thrilled to have you as a member of the CHRMAA Alumni Association! Your registration has been successfully completed.</p>
              
              <div class="info-box">
                <p style="margin: 0; font-weight: bold; color: #2B4C73;">Your Membership Details:</p>
                <p style="margin: 5px 0;"><strong>Membership Number:</strong> ${data.membership_number}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email || "" }</p>
                <p style="margin: 5px 0; color: #16a34a;"><strong>Status:</strong> Active</p>
              </div>
              
              <p><strong>What's next?</strong></p>
              <ul style="line-height: 1.8;">
                <li>Access your member dashboard</li>
                <li>Register for upcoming events</li>
                <li>Shop for CHRMAA merchandise</li>
                <li>Connect with fellow alumni</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">Login to Your Dashboard</a>
              </div>
              
              <div class="footer">
                <p style="margin: 5px 0;"><strong>Need help?</strong> Contact us at support@chrmaa.org</p>
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} CHRMAA Alumni Association. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    
    account_claim: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #2B4C73 0%, #1a365d 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .button { display: inline-block; background: #2B4C73; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #2B4C73; margin: 20px 0; }
            .warning-box { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
            .link-box { background: #f0f0f0; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 13px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Claim Your CHRMAA Account</h1>
            </div>
            <div class="content">
              <h2 style="color: #2B4C73;">Dear ${data.name},</h2>
              <p>You're receiving this email because you requested to claim your CHRMAA Alumni Association account.</p>
              
              <div class="info-box">
                <p style="margin: 0; font-weight: bold; color: #2B4C73;">Your Account Details:</p>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${data.name}</p>
                <p style="margin: 5px 0;"><strong>Membership Number:</strong> ${data.membership_number}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email || 'Your registered email'}</p>
              </div>
              
              <p><strong>To set your password and access your account, click the button below:</strong></p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.reset_url}" class="button">Set Your Password</a>
              </div>
              
              <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
              <div class="link-box">${data.reset_url}</div>
              
              <div class="warning-box">
                <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ Important:</p>
                <p style="margin: 5px 0 0 0; color: #92400e;">This link will expire in 24 hours. After setting your password, you can login at ${process.env.NEXT_PUBLIC_APP_URL}/login</p>
              </div>
              
              <div class="footer">
                <p style="margin: 5px 0;">If you didn't request this, please ignore this email or contact support@chrmaa.org</p>
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} CHRMAA Alumni Association. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    
    event_registration: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .button { display: inline-block; background: #16a34a; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .event-details { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; color: #374151; }
            .detail-value { color: #6b7280; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">✓ Event Registration Confirmed!</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px;"><strong>Dear ${data.name},</strong></p>
              <p>Your registration for <strong>"${data.event_name}"</strong> has been successfully confirmed!</p>
              
              <div class="event-details">
                <h3 style="margin-top: 0; color: #16a34a;">Event Details</h3>
                <div class="detail-row">
                  <span class="detail-label">📅 Date:</span>
                  <span class="detail-value">${data.event_date}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📍 Location:</span>
                  <span class="detail-value">${data.event_location}</span>
                </div>
                ${data.event_time ? `
                <div class="detail-row">
                  <span class="detail-label">🕐 Time:</span>
                  <span class="detail-value">${data.event_time}</span>
                </div>
                ` : ''}
              </div>
              
              <p><strong>What to bring:</strong></p>
              <ul>
                <li>This confirmation email (digital or printed)</li>
                <li>Your CHRMAA membership card (if applicable)</li>
                <li>Valid ID</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/member/events" class="button">View Your Events</a>
              </div>
              
              <div class="footer">
                <p style="margin: 5px 0;">Questions? Contact us at events@chrmaa.org</p>
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} CHRMAA Alumni Association</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    
    merchandise_order: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .button { display: inline-block; background: #7c3aed; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .order-summary { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🛍️ Order Confirmed!</h1>
            </div>
            <div class="content">
              <p><strong>Dear ${data.name},</strong></p>
              <p>Thank you for your merchandise order! Your order has been received and is being processed.</p>
              
              <div class="order-summary">
                <h3 style="margin-top: 0; color: #7c3aed;">Order Summary</h3>
                <p><strong>Order Total:</strong> Ksh ${data.total_amount}</p>
                <p><strong>Shipping Address:</strong><br>${data.shipping_address}</p>
                <p style="color: #16a34a; font-weight: bold;">Status: Processing</p>
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ol>
                <li>Your order is being prepared</li>
                <li>You'll receive a tracking number when shipped</li>
                <li>Delivery within 3-5 business days</li>
              </ol>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/member/orders" class="button">Track Your Order</a>
              </div>
              
              <div class="footer">
                <p style="margin: 5px 0;">Questions? Contact us at merch@chrmaa.org</p>
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} CHRMAA Alumni Association</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    
    payment_confirmation: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .payment-details { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">✓ Payment Confirmed!</h1>
            </div>
            <div class="content">
              <p><strong>Dear ${data.name},</strong></p>
              <p>Your payment has been successfully received and confirmed.</p>
              
              <div class="payment-details">
                <h3 style="margin-top: 0; color: #16a34a;">Payment Details</h3>
                <p><strong>Amount:</strong> Ksh ${data.amount}</p>
                <p><strong>Payment Type:</strong> ${data.type}</p>
                <p><strong>Reference:</strong> ${data.reference}</p>
                <p><strong>M-PESA Receipt:</strong> ${data.receipt}</p>
                <p style="color: #16a34a; font-weight: bold;">✓ Status: Confirmed</p>
              </div>
              
              ${data.alert_note ? `
              <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;"><strong>Admin Note:</strong> ${data.alert_note}</p>
              </div>
              ` : ''}
              
              <div class="footer">
                <p style="margin: 5px 0;">Keep this email for your records</p>
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} CHRMAA Alumni Association</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    
    password_reset: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .button { display: inline-block; background: #dc2626; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .warning-box { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p><strong>Dear ${data.name},</strong></p>
              <p>We received a request to reset your password. Click the link below to set a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.reset_url}" class="button">Reset Password</a>
              </div>
              
              <div class="warning-box">
                <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ Security Notice:</p>
                <p style="margin: 5px 0 0 0; color: #92400e;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
              
              <p style="font-size: 14px; color: #666;"><strong>This link expires in 24 hours.</strong></p>
              
              <div class="footer">
                <p style="margin: 5px 0;">Need help? Contact support@chrmaa.org</p>
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} CHRMAA Alumni Association</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  return templates[type] || `<p>Thank you for your message.</p>`
}