import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer, timestamp } = body;

    // Format email content
    const emailBody = `
New Quote Request Received
========================

Customer Information:
- Name: ${customer.name || 'N/A'}
- Email: ${customer.email || 'N/A'}
- Phone: ${customer.phone || 'N/A'}
- Company: ${customer.company || 'N/A'}

Message: ${customer.message || 'None'}

Requested Items:
${items.map((item: any, index: number) => `
${index + 1}. ${item.name}
   SKU: ${item.sku}
   Quantity: ${item.quantity}
   Notes: ${item.notes || 'None'}
`).join('\n')}

Submitted at: ${new Date(timestamp).toLocaleString()}
========================
    `;

    // TODO: Replace with actual email service (SendGrid, Resend, etc.)
    // For now, just log it
    console.log('Quote Request:', emailBody);

    // In production, send email like this:
    /*
    await sendEmail({
      to: 'service@demashop.be',
      from: 'noreply@demashop.be',
      subject: `New Quote Request from ${customer.name || customer.email}`,
      text: emailBody,
      replyTo: customer.email
    });
    */

    return NextResponse.json({ 
      success: true,
      message: 'Quote request received successfully'
    });

  } catch (error) {
    console.error('Error processing quote request:', error);
    return NextResponse.json(
      { error: 'Failed to process quote request' },
      { status: 500 }
    );
  }
}
