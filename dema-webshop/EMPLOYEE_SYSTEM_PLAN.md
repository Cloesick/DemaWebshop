# 🔐 Dema Employee Verification & PDF Upload System

## 📋 **Overview**

System to verify Dema employees by ID number and allow them to upload and compress PDF catalogs.

---

## 🎯 **Requirements**

### **1. Employee Verification**
- ✅ Verify using employee ID number
- ✅ Store employee data securely
- ✅ Role-based access (employee, admin)
- ✅ Integration with existing NextAuth

### **2. PDF Upload**
- ✅ Upload PDF files (catalogs)
- ✅ Compress PDFs automatically (like pdf24.org)
- ✅ Preview uploaded PDFs
- ✅ Manage uploaded catalogs
- ✅ Delete/replace old versions

### **3. User Interface**
- ✅ "My Account" page integration
- ✅ Employee verification form
- ✅ PDF upload interface
- ✅ Compression progress indicator
- ✅ Upload history

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                   User Authentication                     │
│                  (NextAuth + Custom)                      │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    ┌────▼────┐            ┌──────▼──────┐
    │  Admin  │            │  Employee   │
    │  Role   │            │    Role     │
    └────┬────┘            └──────┬──────┘
         │                        │
         │    ┌───────────────────┤
         │    │                   │
    ┌────▼────▼───┐         ┌────▼──────────┐
    │   Employee  │         │  PDF Upload   │
    │  Management │         │  & Compress   │
    └─────────────┘         └───────────────┘
```

---

## 📂 **Database Schema**

### **Employee Table** (Prisma)
```prisma
model Employee {
  id              String   @id @default(cuid())
  employeeId      String   @unique  // Their ID number
  email           String   @unique
  name            String
  department      String?
  verified        Boolean  @default(false)
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  uploadedPdfs    PdfUpload[]
}

model PdfUpload {
  id              String   @id @default(cuid())
  filename        String
  originalSize    Int      // bytes
  compressedSize  Int      // bytes
  compressionRatio Float   // percentage
  uploadedBy      String
  employee        Employee @relation(fields: [uploadedBy], references: [id])
  uploadedAt      DateTime @default(now())
  status          String   // 'uploading', 'compressing', 'ready', 'error'
  path            String   // storage path
  publicUrl       String?  // CDN/public URL
}
```

---

## 🔧 **Components to Build**

### **1. Backend APIs**
```
/api/employee/verify          POST   - Verify employee by ID
/api/employee/register        POST   - Register new employee
/api/employee/list            GET    - List all employees (admin)
/api/employee/deactivate      POST   - Deactivate employee (admin)

/api/pdf/upload               POST   - Upload PDF file
/api/pdf/compress             POST   - Compress PDF
/api/pdf/list                 GET    - List user's PDFs
/api/pdf/delete               DELETE - Delete PDF
/api/pdf/download             GET    - Download PDF
```

### **2. Frontend Components**
```
/components/employee/
  ├── VerificationForm.tsx    - Employee ID verification
  ├── RegistrationForm.tsx    - New employee registration
  └── EmployeeStatus.tsx      - Show verification status

/components/pdf/
  ├── PdfUploader.tsx         - Upload interface
  ├── PdfCompressor.tsx       - Compression progress
  ├── PdfList.tsx             - Uploaded PDFs list
  └── PdfPreview.tsx          - Preview PDFs

/app/account/
  ├── employee/
  │   ├── page.tsx            - Employee verification page
  │   └── verify/page.tsx     - ID verification form
  └── pdfs/
      ├── page.tsx            - PDF management
      └── upload/page.tsx     - Upload interface
```

---

## 🔐 **Security**

### **Employee Verification Flow**
```
1. User logs in with Google (existing NextAuth)
2. Check if email is @demashop.be or approved domain
3. Ask for Employee ID number
4. Verify ID against database
5. Grant "employee" role
6. Allow PDF upload access
```

### **Access Control**
```typescript
// Middleware check
if (role !== 'employee' && role !== 'admin') {
  return 403 Forbidden
}

// Only employees can upload PDFs
// Only admins can manage all employees
```

---

## 📦 **PDF Compression (pdf24-like)**

### **Libraries to Use**
```json
{
  "pdf-lib": "^1.17.1",        // PDF manipulation
  "ghostscript4js": "^3.2.1",  // PDF compression
  "multer": "^1.4.5-lts.1",    // File upload
  "sharp": "^0.33.0"           // Image optimization (for PDF images)
}
```

### **Compression Strategy**
```typescript
1. Analyze PDF structure
2. Compress images inside PDF (reduce DPI, optimize)
3. Remove unnecessary metadata
4. Optimize fonts
5. Compress streams
6. Target: 50-70% size reduction (like pdf24)
```

### **Compression Levels**
```
- Low:     Fast, ~30% reduction
- Medium:  Balanced, ~50% reduction (default)
- High:    Slow, ~70% reduction, slight quality loss
```

---

## 🎨 **User Interface Design**

### **1. My Account Page**
```
┌─────────────────────────────────────────────┐
│  My Account                                  │
├─────────────────────────────────────────────┤
│                                              │
│  Profile Information                         │
│  - Name: John Doe                           │
│  - Email: john@demashop.be                  │
│  - Role: Employee                           │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  Employee Verification               │  │
│  │  Status: ✅ Verified                  │  │
│  │  Employee ID: EMP-12345              │  │
│  │  Department: Sales                   │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  📄 Upload PDF Catalogs               │  │
│  │                                       │  │
│  │  [Upload New PDF]                    │  │
│  │                                       │  │
│  │  Recent Uploads:                     │  │
│  │  - catalog-2024.pdf (Compressed)     │  │
│  │  - products-nov.pdf (Processing...)  │  │
│  └──────────────────────────────────────┘  │
│                                              │
└─────────────────────────────────────────────┘
```

### **2. PDF Upload Interface**
```
┌─────────────────────────────────────────────┐
│  Upload PDF Catalog                          │
├─────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Drag & Drop PDF here                  │ │
│  │  or click to browse                    │ │
│  │                                         │ │
│  │         📄                              │ │
│  │                                         │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Compression Level:                          │
│  ○ Low (Fast)  ● Medium  ○ High (Best)      │
│                                              │
│  Options:                                    │
│  ☑ Compress images                          │
│  ☑ Remove metadata                          │
│  ☐ Convert to PDF/A                         │
│                                              │
│  [Cancel]  [Upload & Compress]              │
│                                              │
└─────────────────────────────────────────────┘
```

### **3. Compression Progress**
```
┌─────────────────────────────────────────────┐
│  Compressing: catalog-2024.pdf               │
├─────────────────────────────────────────────┤
│                                              │
│  ████████████░░░░░░░░░░░░ 65%               │
│                                              │
│  ✓ Uploaded (10.5 MB)                       │
│  ✓ Analyzing structure                      │
│  ⟳ Compressing images...                    │
│  ○ Optimizing fonts                         │
│  ○ Finalizing                               │
│                                              │
│  Estimated time: 45 seconds                 │
│  Target size: ~3.2 MB (70% reduction)       │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🚀 **Implementation Steps**

### **Phase 1: Database & Auth** (2 hours)
1. ✅ Create Prisma schema
2. ✅ Run migrations
3. ✅ Update auth logic
4. ✅ Create employee verification API

### **Phase 2: PDF Upload** (2 hours)
1. ✅ Create upload API endpoint
2. ✅ Build upload UI component
3. ✅ Handle file storage
4. ✅ Add upload progress

### **Phase 3: PDF Compression** (3 hours)
1. ✅ Install pdf-lib and dependencies
2. ✅ Implement compression logic
3. ✅ Create compression API
4. ✅ Add progress tracking
5. ✅ Test compression quality

### **Phase 4: UI/UX** (2 hours)
1. ✅ Build account pages
2. ✅ Create PDF management UI
3. ✅ Add admin dashboard
4. ✅ Style components

### **Phase 5: Testing** (1 hour)
1. ✅ Test employee verification
2. ✅ Test PDF upload
3. ✅ Test compression
4. ✅ Security testing

**Total Estimated Time: 10 hours**

---

## 📊 **Success Metrics**

- ✅ Employee verification < 30 seconds
- ✅ PDF upload success rate > 95%
- ✅ Compression ratio: 50-70%
- ✅ Upload time: < 2 min for 10MB PDF
- ✅ Compression time: < 1 min for 10MB PDF

---

## 🔒 **Security Considerations**

1. **File Validation**
   - Check file type (only PDF)
   - Check file size (max 50MB)
   - Scan for malware
   - Validate PDF structure

2. **Access Control**
   - Employee ID verification
   - Email domain verification
   - Role-based permissions
   - Rate limiting

3. **Data Protection**
   - Encrypt PDFs at rest
   - Secure file storage
   - Audit logs
   - GDPR compliance

---

## 💰 **Cost Estimate**

### **Storage** (Vercel Blob/S3)
- 100 PDFs × 5MB avg = 500MB
- Cost: ~$0.02/month

### **Compression** (Serverless functions)
- 100 uploads/month × 1 min each
- Cost: ~$0.10/month

**Total: ~$0.12/month** (negligible)

---

## 🎯 **Future Enhancements**

1. **Batch Upload** - Upload multiple PDFs at once
2. **OCR Integration** - Extract text from scanned PDFs
3. **Auto-tagging** - AI-powered catalog categorization
4. **Version Control** - Track PDF versions
5. **Collaboration** - Share PDFs with team members
6. **Analytics** - Track downloads and views

---

**Status:** Ready to implement 🚀  
**Priority:** High  
**Estimated delivery:** 10 hours (1-2 days)
