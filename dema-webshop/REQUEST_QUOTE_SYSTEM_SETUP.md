# Request Quote System - Complete Setup Guide ✅

## 🎯 **What Was Created**

A complete Request Quote system with:
- ✅ Header button with orange badge showing quote count
- ✅ Sliding panel (like cart) to manage quote items
- ✅ Form to collect customer information
- ✅ Email notification to both recipients
- ✅ Professional HTML email formatting

---

## 📦 **Installation Required**

### **1. Install nodemailer Package**

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

This package is required for sending emails from the API.

---

## ⚙️ **Environment Variables Setup**

### **2. Add SMTP Configuration**

Create or update `.env.local` file in the project root:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="DEMA Shop" <noreply@demashop.be>
```

---

## 📧 **Gmail SMTP Setup (Recommended)**

### **Option 1: Gmail App Password (Recommended)**

1. **Enable 2-Factor Authentication** on your Google account
2. Go to Google Account → Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Create a new app password for "Mail"
5. Use this 16-character password in `SMTP_PASS`

**Example `.env.local`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nicolas.cloet@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="DEMA Shop" <noreply@demashop.be>
```

### **Option 2: Alternative SMTP Services**

#### **SendGrid (Transactional Email Service)**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### **Mailgun**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

#### **Your Own Email Server**
```env
SMTP_HOST=mail.demashop.be
SMTP_PORT=587
SMTP_USER=noreply@demashop.be
SMTP_PASS=your-password
```

---

## 🎨 **What Was Implemented**

### **1. Header Button**

**Location:** `src/components/layout/Header.tsx`

**Features:**
- 📄 FiFileText icon (document icon)
- 🔢 Orange badge showing number of items in quote
- 🎨 Hover effect (text turns orange)
- 📱 Responsive (hides "Quote" text on mobile)
- 👆 Click opens quote panel

**Position:** To the left of the cart button

---

### **2. Quote Panel**

**Location:** `src/components/QuoteListSimplified.tsx`

**Features:**
- ✅ Sliding panel from right side (like cart)
- ✅ Shows all products added to quote
- ✅ Edit quantity for each item
- ✅ Add notes to each item
- ✅ Remove items
- ✅ Clear all items
- ✅ Customer information form
- ✅ Submit quote request

---

### **3. Email System**

**Location:** `src/app/api/quote-request/route.ts`

**Recipients:**
- ✅ nicolas.cloet@gmail.com
- ✅ info@demashop.be

**Email Features:**
- 📧 Professional HTML formatted email
- 🎨 Orange gradient header
- 📋 Customer information section
- 📦 List of all requested items with details
- 📅 Timestamp in Belgian format
- 🔄 Reply-to set to customer's email

---

## 🚀 **How to Use**

### **For Users:**

1. **Add Products to Quote:**
   - Click orange "Request Quote" button on any product card
   - Product is added to quote list

2. **View Quote:**
   - Click the "Quote" button in header (with document icon)
   - Quote panel slides in from right

3. **Manage Quote:**
   - Adjust quantities
   - Add notes to items
   - Remove unwanted items

4. **Submit Quote Request:**
   - Click "Proceed to Quote" button
   - Fill in personal/professional information:
     - First Name & Last Name
     - Email & Phone
     - Company (optional)
     - VAT Number (shows when company is entered)
     - Address (optional)
     - Message (optional)
   - Accept privacy policy and terms
   - Click "Send Quote Request"

5. **Confirmation:**
   - Success message shows
   - Quote is cleared
   - Panel closes automatically

---

## 📧 **Email Content**

### **Subject:**
```
🎯 New Quote Request from [Customer Name]
```

### **Email Includes:**

**Customer Information:**
- Name
- Email (clickable mailto link)
- Phone (clickable tel link)
- Company
- VAT Number (if provided)
- Address (if provided)
- Message (if provided)

**Requested Items:**
- Product name
- SKU
- Quantity
- Category
- Notes (if added)

**Metadata:**
- Submission timestamp
- Belgian date/time format

---

## 🎨 **Visual Design**

### **Header Button:**
```
┌─────────────────────────────┐
│  📄 Quote (2)  🛒 Cart (5)  │
│   ↑orange badge  ↑red badge  │
└─────────────────────────────┘
```

### **Email Preview:**
```
┌──────────────────────────────────┐
│  🎯 New Quote Request            │
│  DEMA Shop - Quote System        │
├──────────────────────────────────┤
│                                  │
│  👤 Customer Information         │
│  ├─ Name: John Doe              │
│  ├─ Email: john@example.com     │
│  ├─ Phone: +32 123 456 789      │
│  └─ Company: ACME Corp          │
│                                  │
│  📦 Requested Items (3)          │
│  ├─ 1. Product Name             │
│  │  SKU: ABC123                 │
│  │  Quantity: 5                 │
│  ├─ 2. Product Name 2           │
│  └─ 3. Product Name 3           │
│                                  │
│  📅 Submitted: [Date & Time]    │
└──────────────────────────────────┘
```

---

## ✅ **Testing Checklist**

### **Before Testing:**
- [ ] Install nodemailer: `npm install nodemailer`
- [ ] Configure `.env.local` with SMTP settings
- [ ] Restart dev server: `npm run dev`

### **Test Flow:**
1. [ ] Click "Request Quote" on a product card
2. [ ] See badge count increase on header button
3. [ ] Click "Quote" button in header
4. [ ] Quote panel opens from right
5. [ ] See product in list
6. [ ] Adjust quantity
7. [ ] Add notes
8. [ ] Click "Proceed to Quote"
9. [ ] Fill in form
10. [ ] Submit quote request
11. [ ] Check both email addresses received the quote
12. [ ] Verify email format looks professional
13. [ ] Test "Reply" button replies to customer

---

## 🐛 **Troubleshooting**

### **"Cannot find module 'nodemailer'"**
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### **"Failed to send quote request"**
- Check `.env.local` has correct SMTP settings
- Verify SMTP credentials are correct
- Check console for detailed error message
- Try using Gmail App Password (see Gmail setup above)

### **Email not received:**
- Check spam/junk folder
- Verify recipient email addresses in code
- Check server logs for errors
- Confirm SMTP server is reachable

### **Quote button not visible:**
- Hard refresh: `Ctrl + Shift + R`
- Clear browser cache
- Restart dev server

---

## 📝 **Files Modified**

### **1. Header Component**
```
src/components/layout/Header.tsx
```
**Changes:**
- Added Request Quote button
- Imported useQuote hook
- Added FiFileText icon
- Added orange badge with count

### **2. Quote Panel**
```
src/components/QuoteListSimplified.tsx
```
**Status:** Already existed, no changes needed

### **3. API Route**
```
src/app/api/quote-request/route.ts
```
**Changes:**
- Added nodemailer integration
- Implemented HTML email formatting
- Set recipients to nicolas.cloet@gmail.com and info@demashop.be
- Added professional email styling

### **4. Environment Variables**
```
.env.local (create this file)
```
**New variables:** SMTP configuration

---

## 🎯 **Summary**

**Created:**
- ✅ Request Quote button in header (left of cart)
- ✅ Orange badge showing quote item count
- ✅ Sliding panel for quote management
- ✅ Customer information form
- ✅ Email system sending to 2 recipients
- ✅ Professional HTML email format

**Required:**
- 📦 Install nodemailer package
- ⚙️ Configure SMTP in .env.local
- 🔄 Restart dev server

**Recipients:**
- nicolas.cloet@gmail.com
- info@demashop.be

**Status:** ✅ Ready to test after nodemailer installation!

---

**Generated:** November 28, 2025  
**Feature:** Complete Request Quote System  
**Email Recipients:** 2 (nicolas.cloet@gmail.com, info@demashop.be)  
**Next Step:** Install nodemailer and configure SMTP
