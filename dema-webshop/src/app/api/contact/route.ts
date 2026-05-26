import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.json();

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Save to database (example using Prisma)
    try {
      // Uncomment and configure this if you're using Prisma
      /*
      await prisma.lead.create({
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          company: formData.company || '',
          inquiryType: formData.inquiryType,
          message: formData.message,
          budget: formData.budget,
          timeline: formData.timeline,
          heardAbout: formData.heardAbout,
          metadata: JSON.stringify({
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          }),
        },
      });
      */
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request if database save fails
    }

    // 2. Send confirmation email to the user
    await resend.emails.send({
      from: 'DemaShop <noreply@demashop.com>',
      to: formData.email,
      subject: 'Thank you for contacting DemaShop!',
      text: `Hi ${formData.name},\n\nThank you for reaching out to DemaShop. We've received your message and our team will get back to you within 24-48 hours.\n\nHere's a summary of your inquiry:\n- Name: ${formData.name}\n- Email: ${formData.email}\n- Phone: ${formData.phone || 'Not provided'}\n- Company: ${formData.company || 'Not provided'}\n- Inquiry Type: ${formData.inquiryType || 'Not specified'}\n- Budget: ${formData.budget || 'Not specified'}\n- Timeline: ${formData.timeline || 'Not specified'}\n\nYour Message:\n${formData.message}\n\nBest regards,\nThe DemaShop Team`,
    });

    // 3. Send notification to your sales team
    await resend.emails.send({
      from: 'DemaShop Contact Form <noreply@demashop.com>',
      to: 'sales@demashop.com',
      subject: `New Contact Form Submission: ${formData.inquiryType || 'General Inquiry'}`,
      text: `New contact form submission from ${formData.name} (${formData.email}):\n\n` +
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Phone: ${formData.phone || 'Not provided'}\n` +
        `Company: ${formData.company || 'Not provided'}\n` +
        `Inquiry Type: ${formData.inquiryType || 'Not specified'}\n` +
        `Budget: ${formData.budget || 'Not specified'}\n` +
        `Timeline: ${formData.timeline || 'Not specified'}\n` +
        `How they heard about us: ${formData.heardAbout || 'Not specified'}\n\n` +
        `Message:\n${formData.message}\n\n` +
        `---\n` +
        `IP: ${request.headers.get('x-forwarded-for') || 'unknown'}\n` +
        `User Agent: ${request.headers.get('user-agent') || 'unknown'}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}
