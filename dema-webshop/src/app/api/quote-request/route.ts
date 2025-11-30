import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email recipients
const RECIPIENTS = ['nicolas.cloet@gmail.com', 'info@demashop.be'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer, timestamp } = body;

    // Format email content as HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .section { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #f97316; }
    .customer-info { display: grid; grid-template-columns: 120px 1fr; gap: 10px; }
    .item { background: #fff; padding: 12px; margin: 8px 0; border: 1px solid #e5e7eb; border-radius: 4px; }
    .item-header { font-weight: bold; color: #f97316; margin-bottom: 5px; }
    .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎯 New Quote Request</h1>
      <p style="margin: 5px 0 0 0;">DEMA Shop - Quote Management System</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2 style="color: #f97316; margin-top: 0;">👤 Customer Information</h2>
        <div class="customer-info">
          <strong>Name:</strong><span>${customer.name || 'N/A'}</span>
          <strong>Email:</strong><span><a href="mailto:${customer.email}">${customer.email || 'N/A'}</a></span>
          <strong>Phone:</strong><span><a href="tel:${customer.phone}">${customer.phone || 'N/A'}</a></span>
          <strong>Company:</strong><span>${customer.company || 'N/A'}</span>
          ${customer.vatNumber ? `<strong>VAT Number:</strong><span>${customer.vatNumber}</span>` : ''}
          ${customer.address ? `<strong>Address:</strong><span>${customer.address}</span>` : ''}
        </div>
        ${customer.message ? `
          <div style="margin-top: 15px;">
            <strong>📝 Message:</strong>
            <p style="background: #f9fafb; padding: 10px; border-radius: 4px; margin: 5px 0;">${customer.message}</p>
          </div>
        ` : ''}
      </div>

      <div class="section">
        <h2 style="color: #f97316; margin-top: 0;">📦 Requested Items (${items.length})</h2>
        ${items.map((item: any, index: number) => `
          <div class="item">
            <div class="item-header">${index + 1}. ${item.name}</div>
            <div style="font-size: 14px; color: #6b7280;">
              <strong>SKU:</strong> ${item.sku}<br>
              <strong>Quantity:</strong> ${item.quantity}<br>
              ${item.category ? `<strong>Category:</strong> ${item.category}<br>` : ''}
              ${item.notes ? `<strong>Notes:</strong> ${item.notes}<br>` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <p>📅 Submitted: ${new Date(timestamp).toLocaleString('nl-BE', { 
          dateStyle: 'full', 
          timeStyle: 'long' 
        })}</p>
        <p>This is an automated message from DEMA Shop Quote System</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const emailText = `
New Quote Request Received
========================

Customer Information:
- Name: ${customer.name || 'N/A'}
- Email: ${customer.email || 'N/A'}
- Phone: ${customer.phone || 'N/A'}
- Company: ${customer.company || 'N/A'}
${customer.vatNumber ? `- VAT Number: ${customer.vatNumber}\n` : ''}
${customer.address ? `- Address: ${customer.address}\n` : ''}

Message: ${customer.message || 'None'}

Requested Items (${items.length}):
${items.map((item: any, index: number) => `
${index + 1}. ${item.name}
   SKU: ${item.sku}
   Quantity: ${item.quantity}
   ${item.category ? `Category: ${item.category}\n   ` : ''}${item.notes ? `Notes: ${item.notes}` : ''}
`).join('\n')}

Submitted at: ${new Date(timestamp).toLocaleString()}
========================
    `;

    // Send email using nodemailer
    // Configure your SMTP settings in environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send to both recipients
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"DEMA Shop" <noreply@demashop.be>',
      to: RECIPIENTS.join(', '),
      replyTo: customer.email,
      subject: `🎯 New Quote Request from ${customer.name || customer.email}`,
      text: emailText,
      html: emailHtml,
    });

    console.log('✅ Quote request email sent to:', RECIPIENTS.join(', '));

    return NextResponse.json({ 
      success: true,
      message: 'Quote request sent successfully'
    });

  } catch (error) {
    console.error('❌ Error processing quote request:', error);
    
    // Log the error details
    console.log('Error details:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      { error: 'Failed to send quote request. Please try again or contact us directly.' },
      { status: 500 }
    );
  }
}
