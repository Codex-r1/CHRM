// app/(backend)/lib/email/emailService.ts
import { supabaseAdmin } from "../supabase/admin";

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  type?: 'welcome' | 'registration' | 'payment' | 'event';
  data?: Record<string, any>;
}

export async function sendEmail(emailData: EmailData) {
  // Replace with your email provider (SendGrid, Resend, etc.)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Old Turians Society <onboarding@resend.dev>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

// Registration Confirmation Email
export function getRegistrationEmail(name: string, email: string) {
  return {
    to: email,
    subject: 'Welcome to the Old Turians Society! 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Georgia', serif; color: #1B3A6B; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px; }
          .header { border-bottom: 4px solid #C9A84C; padding-bottom: 20px; }
          .content { padding: 30px 0; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #1B3A6B; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold;
          }
          .footer { border-top: 2px solid #1B3A6B/10; padding-top: 20px; font-size: 12px; color: #1B3A6B/60; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="font-family: 'Georgia', serif; color: #1B3A6B;">Welcome to the Old Turians Society</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>We are delighted to welcome you to the Old Turians Society, the official alumni network of St Andrew's Turi.</p>
            <p>Your membership has been successfully registered. Here's what you can look forward to:</p>
            <ul>
              <li>Connect with fellow alumni worldwide</li>
              <li>Access exclusive events and reunions</li>
              <li>Stay updated with Turi news</li>
              <li>Shop official merchandise</li>
            </ul>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">
                Login to Your Account
              </a>
            </p>
            <p>We look forward to staying connected with you.</p>
            <p>Warm regards,<br><strong>The Old Turians Society</strong></p>
          </div>
          <div class="footer">
            <p>St Andrew's Turi · Est. 1931 · Seeking the Highest</p>
            <p>© ${new Date().getFullYear()} Old Turians Society. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// Merchandise Order Confirmation Email
export function getMerchandiseEmail(name: string, email: string, order: any) {
  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.color_name} / ${item.size}</td>
      <td>${item.quantity}</td>
      <td>KES ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  return {
    to: email,
    subject: 'Your Merchandise Order Confirmation 🛍️',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Georgia', serif; color: #1B3A6B; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px; }
          .header { border-bottom: 4px solid #C9A84C; padding-bottom: 20px; }
          .content { padding: 30px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #1B3A6B; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #1B3A6B/10; }
          .total { font-size: 18px; font-weight: bold; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #1B3A6B; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold;
          }
          .footer { border-top: 2px solid #1B3A6B/10; padding-top: 20px; font-size: 12px; color: #1B3A6B/60; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="font-family: 'Georgia', serif; color: #1B3A6B;">Order Confirmation</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Thank you for your merchandise order! Your order has been confirmed and is being processed.</p>
            
            <p><strong>Order #:</strong> ${order.id}</p>
            <p><strong>Shipping Method:</strong> ${order.shipping_method}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Variant</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr>
                  <td colspan="3" style="text-align: right;"><strong>Subtotal</strong></td>
                  <td>KES ${order.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right;"><strong>Shipping</strong></td>
                  <td>KES ${order.shipping_cost.toLocaleString()}</td>
                </tr>
                <tr class="total">
                  <td colspan="3" style="text-align: right;"><strong>Total</strong></td>
                  <td>KES ${order.total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            
            <p>You will receive a shipping confirmation with tracking details once your order ships.</p>
            
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/member/dashboard" class="button">
                View Order Status
              </a>
            </p>
            
            <p>Thank you for supporting the Old Turians Society!</p>
            <p>Warm regards,<br><strong>The Old Turians Society</strong></p>
          </div>
          <div class="footer">
            <p>St Andrew's Turi · Est. 1931 · Seeking the Highest</p>
            <p>© ${new Date().getFullYear()} Old Turians Society. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// Event Registration Confirmation Email
export function getEventRegistrationEmail(name: string, email: string, event: any) {
  return {
    to: email,
    subject: `Event Registration Confirmed: ${event.name} 🎫`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Georgia', serif; color: #1B3A6B; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px; }
          .header { border-bottom: 4px solid #C9A84C; padding-bottom: 20px; }
          .content { padding: 30px 0; }
          .event-details { background: #1B3A6B/5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #1B3A6B; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold;
          }
          .footer { border-top: 2px solid #1B3A6B/10; padding-top: 20px; font-size: 12px; color: #1B3A6B/60; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="font-family: 'Georgia', serif; color: #1B3A6B;">Event Registration Confirmed</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Your registration for the following event has been confirmed:</p>
            
            <div class="event-details">
              <h3 style="margin-top: 0;">${event.name}</h3>
              <p><strong>Date:</strong> ${new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <p><strong>Price:</strong> KES ${event.price.toLocaleString()}</p>
            </div>
            
            <p>We look forward to seeing you there!</p>
            
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" class="button">
                View All Events
              </a>
            </p>
            
            <p>Warm regards,<br><strong>The Old Turians Society</strong></p>
          </div>
          <div class="footer">
            <p>St Andrew's Turi · Est. 1931 · Seeking the Highest</p>
            <p>© ${new Date().getFullYear()} Old Turians Society. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}