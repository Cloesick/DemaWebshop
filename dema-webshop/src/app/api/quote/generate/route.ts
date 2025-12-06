import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { formData, products } = await request.json();

    // Generate PDF
    const pdfBytes = await generateQuotePDF(formData, products);

    // Send emails
    await sendQuoteEmails(formData, pdfBytes);

    return NextResponse.json({
      success: true,
      message: 'Quote generated and sent successfully',
    });
  } catch (error) {
    console.error('Error generating quote:', error);
    return NextResponse.json(
      { error: 'Failed to generate quote' },
      { status: 500 }
    );
  }
}

async function generateQuotePDF(formData: any, products: any[]) {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  let yPosition = height - 50;

  // Header - Company Info
  page.drawText('DEMA-SHOP bv', {
    x: 50,
    y: yPosition,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0.68, 0.94), // #00ADEF
  });

  yPosition -= 15;
  page.drawText('Ovenstraat 11 • 8800 Roeselare • Belgium', {
    x: 50,
    y: yPosition,
    size: 9,
    font: helveticaFont,
  });

  yPosition -= 12;
  page.drawText('T +32(0)51 20 51 41 • info@demashop.be • www.demashop.be', {
    x: 50,
    y: yPosition,
    size: 9,
    font: helveticaFont,
  });

  yPosition -= 12;
  page.drawText('BTW BE 0426.954.705 • RPR Kortrijk', {
    x: 50,
    y: yPosition,
    size: 8,
    font: helveticaFont,
  });

  // Title
  yPosition -= 40;
  page.drawText('QUOTE REQUEST', {
    x: 50,
    y: yPosition,
    size: 20,
    font: helveticaBold,
    color: rgb(0, 0.68, 0.94),
  });

  // Date
  yPosition -= 20;
  const today = new Date().toLocaleDateString('en-GB');
  page.drawText(`Date: ${today}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaFont,
  });

  // Customer Information Section
  yPosition -= 30;
  page.drawText('CUSTOMER INFORMATION', {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBold,
  });

  yPosition -= 20;
  const customerInfo = [
    `Customer Type: ${formData.customerType === 'business' ? 'Business' : 'Private'}`,
    formData.customerType === 'business' && formData.companyName ? `Company: ${formData.companyName}` : null,
    formData.vatNumber ? `VAT: ${formData.vatNumber}` : null,
    `Name: ${formData.firstName} ${formData.lastName}`,
    `Email: ${formData.email}`,
    `Phone: ${formData.phone}`,
    `Address: ${formData.address}`,
    `${formData.postalCode} ${formData.city}`,
  ].filter(Boolean);

  customerInfo.forEach((line) => {
    page.drawText(line!, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
    });
    yPosition -= 15;
  });

  // Products Section
  yPosition -= 20;
  page.drawText('REQUESTED PRODUCTS', {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBold,
  });

  yPosition -= 25;

  // Table Header
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: width - 100,
    height: 20,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText('Product', {
    x: 60,
    y: yPosition - 10,
    size: 10,
    font: helveticaBold,
  });

  page.drawText('SKU', {
    x: 300,
    y: yPosition - 10,
    size: 10,
    font: helveticaBold,
  });

  page.drawText('Qty', {
    x: 450,
    y: yPosition - 10,
    size: 10,
    font: helveticaBold,
  });

  yPosition -= 30;

  // Product Rows
  products.forEach((product, index) => {
    if (yPosition < 100) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }

    // Alternating row colors
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 50,
        y: yPosition - 12,
        width: width - 100,
        height: 18,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    const productName = product.name.length > 40 
      ? product.name.substring(0, 37) + '...' 
      : product.name;

    page.drawText(productName, {
      x: 60,
      y: yPosition - 7,
      size: 9,
      font: helveticaFont,
    });

    page.drawText(product.sku || 'N/A', {
      x: 300,
      y: yPosition - 7,
      size: 9,
      font: helveticaFont,
    });

    page.drawText(product.quantity.toString(), {
      x: 460,
      y: yPosition - 7,
      size: 9,
      font: helveticaFont,
    });

    yPosition -= 20;
  });

  // Comments Section
  if (formData.comments) {
    yPosition -= 20;
    page.drawText('ADDITIONAL COMMENTS', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaBold,
    });

    yPosition -= 20;
    const comments = formData.comments.substring(0, 200); // Limit length
    page.drawText(comments, {
      x: 50,
      y: yPosition,
      size: 9,
      font: helveticaFont,
      maxWidth: width - 100,
    });
  }

  // Footer
  page.drawText('This is a quote request. A formal quote will be sent to you shortly.', {
    x: 50,
    y: 50,
    size: 9,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText('Thank you for choosing DEMA-SHOP!', {
    x: 50,
    y: 35,
    size: 9,
    font: helveticaBold,
    color: rgb(0, 0.68, 0.94),
  });

  return await pdfDoc.save();
}

async function sendQuoteEmails(formData: any, pdfBytes: Uint8Array) {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

  // Email to customer
  await transporter.sendMail({
    from: `"DEMA-SHOP" <${process.env.SMTP_USER}>`,
    to: formData.email,
    subject: 'Your Quote Request - DEMA-SHOP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #00ADEF; color: white; padding: 20px; text-align: center;">
          <h1>Quote Request Received</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Dear ${formData.firstName} ${formData.lastName},</p>
          
          <p>Thank you for your quote request. We have received your inquiry and will process it shortly.</p>
          
          <p>Please find attached a copy of your quote request for your records.</p>
          
          <p>Our team will review your request and send you a detailed quote within 24-48 hours.</p>
          
          <div style="background-color: white; padding: 15px; border-left: 4px solid #00ADEF; margin: 20px 0;">
            <strong>What happens next?</strong><br/>
            1. Our team reviews your request<br/>
            2. We prepare a customized quote<br/>
            3. You receive the quote via email<br/>
            4. You can accept or discuss modifications
          </div>
          
          <p>If you have any questions, feel free to contact us:</p>
          <ul>
            <li>Email: info@demashop.be</li>
            <li>Phone: +32(0)51 20 51 41</li>
          </ul>
          
          <p>Best regards,<br/>
          <strong>DEMA-SHOP Team</strong></p>
        </div>
        <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          DEMA-SHOP bv • Ovenstraat 11 • 8800 Roeselare • Belgium<br/>
          www.demashop.be
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'quote-request.pdf',
        content: pdfBase64,
        encoding: 'base64',
      },
    ],
  });

  // Email to DEMA-SHOP team
  await transporter.sendMail({
    from: `"DEMA-SHOP Website" <${process.env.SMTP_USER}>`,
    to: 'info@demashop.be, nicolas.cloet@gmail.com',
    subject: `New Quote Request from ${formData.firstName} ${formData.lastName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #00ADEF; color: white; padding: 20px;">
          <h1>🔔 New Quote Request</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Customer Information</h2>
          <table style="width: 100%; background-color: white; padding: 15px;">
            <tr><td><strong>Name:</strong></td><td>${formData.firstName} ${formData.lastName}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${formData.email}</td></tr>
            <tr><td><strong>Phone:</strong></td><td>${formData.phone}</td></tr>
            <tr><td><strong>Type:</strong></td><td>${formData.customerType === 'business' ? 'Business' : 'Private'}</td></tr>
            ${formData.companyName ? `<tr><td><strong>Company:</strong></td><td>${formData.companyName}</td></tr>` : ''}
            ${formData.vatNumber ? `<tr><td><strong>VAT:</strong></td><td>${formData.vatNumber}</td></tr>` : ''}
            <tr><td><strong>Address:</strong></td><td>${formData.address}, ${formData.postalCode} ${formData.city}</td></tr>
          </table>
          
          ${formData.comments ? `
            <h3>Comments:</h3>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #00ADEF;">
              ${formData.comments}
            </div>
          ` : ''}
          
          <p style="margin-top: 20px;"><strong>Full quote request details are attached as PDF.</strong></p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'quote-request.pdf',
        content: pdfBase64,
        encoding: 'base64',
      },
    ],
  });
}
