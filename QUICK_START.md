# MedStar H2O — Quick Start Guide

**Build Date:** April 20, 2026  
**Components:** 4 (Demo, Inquiries, Compliance Reports, Admin Dashboard)  
**Status:** Ready for integration

---

## 🚀 Quick Setup (5 Minutes)

### 1. Start Dev Server
```bash
cd aqualog
npm run dev
```

Visit: http://localhost:3000

---

### 2. Test Each Component

#### Demo Page
```
Visit: http://localhost:3000/demo
✓ Video embed (YouTube or custom URL via NEXT_PUBLIC_DEMO_VIDEO_URL)
✓ Feature cards (6 topics)
✓ Compliance info
✓ Pricing preview
✓ FAQ
```

#### Custom Inquiry (Checkout)
```
1. Visit: http://localhost:3000/pricing
2. Click "Contact Sales" (Custom tier)
3. Routed to: http://localhost:3000/checkout?tier=custom
4. Fill form:
   - Company: "Test Hospital"
   - Contact: "John Doe"
   - Email: "john@test.com"
   - Hospitals: "10"
   - Notes: "Testing inquiry system"
5. Click "Submit Inquiry"
6. Check: data/inquiries.json (record created)
```

#### Admin Dashboard
```
1. Visit: http://localhost:3000/settings/inquiries
   (auto-redirects to /dashboard if not admin, so need admin user account)
2. See inquiries in table
3. Click "View Details" on inquiry
4. Fill response notes
5. Click "Mark as Responded"
6. Check: data/inquiries.json (responded: true)
```

#### Compliance Report
```
1. Visit: http://localhost:3000/reports
2. Scroll to any hospital row
3. Click "📄 PDF" button
4. New tab opens with HTML report
5. See:
   - CONFIDENTIAL header (red banner)
   - Hospital info (name, address, ID)
   - Report period
   - Compliance checkboxes (4 standards)
   - Metrics (compliance %, entries, etc)
   - Audit trail
   - CONFIDENTIAL footer (red banner)
6. Print (Ctrl+P / Cmd+P) to save as PDF
```

---

## 📋 File Locations

```
app/demo/page.js                        Demo video page
app/api/inquiries/route.js              Inquiry API (POST/GET/PATCH)
app/api/reports/compliance/route.js     Compliance report generator
app/settings/inquiries/page.js          Admin dashboard
app/api/checkout/route.js               ✓ UPDATED (creates inquiries)
data/inquiries.json                     Inquiry storage
MEDSTAR_H2O_COMPONENTS.md               Full documentation
```

---

## 🔧 Configuration

### Optional: Auto-Reply Emails

To enable email notifications:

1. Get Resend API key: https://resend.com
2. Add to `.env.local`:
```bash
RESEND_API_KEY=re_your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Test:
   - Submit inquiry at `/checkout?tier=custom`
   - Check Resend dashboard for email
   - Email sent to inquiry email address

**Note:** If no API key, inquiries still save to database (non-blocking)

---

## 🧪 Quick Test Scenarios

### Scenario 1: New Inquiry
```
1. Visit /pricing → Click "Contact Sales"
2. Fill form → Submit
3. Check: data/inquiries.json has new entry
4. Email sent? (if RESEND_API_KEY set)
5. Response in browser? ✓ "We'll follow up in 24h"
```

### Scenario 2: Admin Response
```
1. Visit /settings/inquiries (as admin)
2. See new inquiry in "Pending" tab
3. Click "View Details"
4. Fill response: "Scheduled demo for Fri 2 PM"
5. Click "Mark as Responded"
6. Check: responded: true in data/inquiries.json
7. See in "Responded" tab ✓
```

### Scenario 3: Print Compliance Report
```
1. Visit /reports
2. Click "📄 PDF" for hospital
3. HTML report opens
4. Ctrl+P / Cmd+P
5. Save to PDF
6. Verify: CONFIDENTIAL headers, hospital info, metrics
```

---

## 🐛 Troubleshooting

### "No inquiries found" in admin dashboard
- Check: Is user marked as admin?
- Check: `/api/inquiries` returns empty array?
- Check: `data/inquiries.json` exists?
- Try: Post inquiry via `/checkout?tier=custom`, refresh dashboard

### Email not sending
- Check: `RESEND_API_KEY` set in `.env.local`?
- Check: Key is valid at resend.com?
- Check: Server logs for errors
- Note: Inquiries save even if email fails

### Compliance report shows "Hospital not found"
- Check: `hospitalId` parameter valid?
- Check: Hospital exists in `data/facilities.json`?
- Check: Query params: `from` and `to` are YYYY-MM-DD format?

---

## 📊 Database Schema

### inquiries.json
```json
[
  {
    "id": "inq_abc123def456",
    "accountId": "acc_xyz (or null)",
    "companyName": "St. Mary's Hospital",
    "contactName": "Jane Doe",
    "email": "jane@stmarys.org",
    "phone": "(202) 555-0123",
    "hospitalsNeeded": 15,
    "inquiryNotes": "Need SSO integration",
    "responded": false,
    "responseNotes": null,
    "createdAt": "2026-04-20T20:54:00Z",
    "updatedAt": "2026-04-20T20:54:00Z"
  }
]
```

---

## 🚀 Next Steps

### Immediate
- [x] Code complete
- [ ] Test all 4 components
- [ ] Verify email configuration
- [ ] Review compliance report styling
- [ ] Check admin dashboard functionality

### Short Term
- [ ] Add authentication to `/settings/inquiries`
- [ ] Set up Resend email service
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Refine compliance report template

### Long Term
- [ ] Migrate JSON to PostgreSQL/Supabase
- [ ] Add PDF export via puppeteer
- [ ] Implement demo video tracking
- [ ] Build inquiry notification emails
- [ ] Add compliance scoring & trending

---

## 📞 Contact

For questions about this implementation:
- Check: `MEDSTAR_H2O_COMPONENTS.md` (full docs)
- Check: Individual file comments (code-level details)
- Check: Component headers (purpose & features)

---

**Ready to test and deploy. Happy building! 🚀**
