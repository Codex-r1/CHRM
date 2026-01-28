import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export type EmailType = 'welcome' | 'event_registration' | 'merchandise_order' | 'payment_confirmation' | 'password_reset'

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

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}

function getFromEmail(type: EmailType): string {
  const emails = {
    welcome: 'CHRMAA <welcome@chrmaa.org>',
    event_registration: 'CHRMAA Events <events@chrmaa.org>',
    merchandise_order: 'CHRMAA Merchandise <merch@chrmaa.org>',
    payment_confirmation: 'CHRMAA Payments <payments@chrmaa.org>',
    password_reset: 'CHRMAA Security <security@chrmaa.org>',
  }
  return emails[type] || 'CHRMAA <noreply@chrmaa.org>'
}

function getSubject(type: EmailType, data: any): string {
  const subjects = {
    welcome: `Welcome to CHRMAA, ${data.name}!`,
    event_registration: `Event Registration Confirmation - ${data.event_name}`,
    merchandise_order: 'Merchandise Order Confirmation',
    payment_confirmation: `Payment Confirmation - ${data.reference}`,
    password_reset: 'Password Reset Request',
  }
  return subjects[type] || 'Message from CHRMAA'
}

// app/lib/email/service.ts
function getHtmlContent(type: EmailType, data: any): string {
  const templates: Record<EmailType, string> = {
    welcome: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2B4C73 0%, #1a365d 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">Welcome to CHRMAA!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Dear ${data.name},</p>
          <p>Welcome to the CHRMAA Alumni Association! We're excited to have you join our community.</p>
          <p>Your account is now active and you can access all member benefits.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background: #2B4C73; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Dashboard</a>
          </div>
          <p>Best regards,<br>The CHRMAA Team</p>
        </div>
      </div>
    `,
    event_registration: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2B4C73 0%, #1a365d 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">Event Registration Confirmed!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Dear ${data.name},</p>
          <p>Your registration for "${data.event_name}" has been confirmed.</p>
          <p>Date: ${data.event_date}</p>
          <p>Location: ${data.event_location}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/member/events" style="background: #2B4C73; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Events</a>
          </div>
          <p>Best regards,<br>The CHRMAA Team</p>
        </div>
      </div>
    `,
    merchandise_order: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2B4C73 0%, #1a365d 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">Order Confirmed!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Dear ${data.name},</p>
          <p>Thank you for your merchandise order. Your order has been received and is being processed.</p>
          <p>Order Total: Ksh ${data.total_amount}</p>
          <p>Shipping to: ${data.shipping_address}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/member/orders" style="background: #2B4C73; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Your Order</a>
          </div>
          <p>Best regards,<br>The CHRMAA Team</p>
        </div>
      </div>
    `,
    payment_confirmation: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2B4C73 0%, #1a365d 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">Payment Confirmed!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Dear ${data.name},</p>
          <p>Your payment of <strong>Ksh ${data.amount}</strong> has been confirmed successfully.</p>
          <p>Reference: ${data.reference}</p>
          <p>Receipt: ${data.receipt}</p>
          <p>Payment Type: ${data.type}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/member/dashboard" style="background: #2B4C73; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
          </div>
          <p>Best regards,<br>The CHRMAA Team</p>
        </div>
      </div>
    `,
    password_reset: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2B4C73 0%, #1a365d 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Dear ${data.name},</p>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.reset_url}" style="background: #2B4C73; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The CHRMAA Team</p>
        </div>
      </div>
    `,
  }

  return templates[type] || `<p>Thank you for your message.</p>`
}