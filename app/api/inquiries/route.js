/**
 * MedStar H2O — Custom Inquiries API
 * Handles custom tier inquiries, stores them, and sends auto-reply emails
 * 
 * POST /api/inquiries — Submit a custom inquiry
 * GET /api/inquiries — Get all inquiries (admin)
 * PATCH /api/inquiries/:id — Mark inquiry as responded (admin)
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

function ensureInquiriesFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INQUIRIES_FILE)) {
    fs.writeFileSync(INQUIRIES_FILE, '[]', 'utf8');
  }
}

function getInquiries() {
  try {
    ensureInquiriesFile();
    return JSON.parse(fs.readFileSync(INQUIRIES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveInquiries(inquiries) {
  try {
    ensureInquiriesFile();
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving inquiries:', err);
  }
}

/**
 * POST /api/inquiries
 * Submit a custom tier inquiry and send auto-reply email
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { accountId, companyName, contactName, email, phone, hospitalsNeeded, notes } = body;

    // Validate required fields
    if (!companyName || !contactName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Create inquiry record
    const inquiryId = `inq_${randomUUID().slice(0, 12)}`;
    const now = new Date().toISOString();

    const inquiry = {
      id: inquiryId,
      accountId: accountId || null,
      companyName,
      contactName,
      email,
      phone: phone || null,
      hospitalsNeeded: hospitalsNeeded ? parseInt(hospitalsNeeded) : null,
      inquiryNotes: notes || null,
      responded: false,
      responseNotes: null,
      createdAt: now,
      updatedAt: now,
    };

    // Save inquiry
    const inquiries = getInquiries();
    inquiries.push(inquiry);
    saveInquiries(inquiries);

    // Send auto-reply email via Resend (if configured)
    try {
      await sendAutoReplyEmail(inquiry);
    } catch (emailErr) {
      console.warn('[INQUIRIES] Auto-reply email failed (non-blocking):', emailErr.message);
      // Don't fail the inquiry submission if email fails
    }

    // Notify admin (in production, send to sales@facilityh2o.com)
    console.log(`[INQUIRIES] New custom inquiry: ${contactName} (${email}) - ${hospitalsNeeded || '?'} hospitals needed`);

    return NextResponse.json({
      success: true,
      inquiryId,
      message: 'Thank you for your inquiry. We will follow up within 24 hours.',
      demoUrl: `/demo`,
    });
  } catch (err) {
    console.error('[inquiries] Error:', err);
    return NextResponse.json({ error: 'Inquiry submission failed. Please try again.' }, { status: 500 });
  }
}

/**
 * GET /api/inquiries
 * Get all inquiries (admin view)
 */
export async function GET(request) {
  try {
    // In production, check for admin authentication here
    const inquiries = getInquiries();
    return NextResponse.json({ success: true, inquiries });
  } catch (err) {
    console.error('[inquiries] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

/**
 * PATCH /api/inquiries/:id
 * Mark inquiry as responded (admin)
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { inquiryId, responseNotes } = body;

    if (!inquiryId) {
      return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });
    }

    const inquiries = getInquiries();
    const inquiry = inquiries.find((i) => i.id === inquiryId);

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    inquiry.responded = true;
    inquiry.responseNotes = responseNotes || '';
    inquiry.updatedAt = new Date().toISOString();

    saveInquiries(inquiries);

    return NextResponse.json({ success: true, inquiry });
  } catch (err) {
    console.error('[inquiries] Error:', err);
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}

/**
 * Send auto-reply email via Resend API
 * Requires RESEND_API_KEY environment variable
 */
async function sendAutoReplyEmail(inquiry) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[EMAIL] Resend API key not configured. Skipping email.');
    return;
  }

  const demoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/demo`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #0891B2; margin-bottom: 20px;">Thank You for Your Interest!</h1>
      
      <p>Hi ${inquiry.contactName},</p>
      
      <p>Thank you for submitting your inquiry about MedStar H2O. We appreciate your interest in bringing 
      advanced water chemistry compliance to ${inquiry.companyName}.</p>
      
      <h2 style="color: #0891B2; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">What's Next?</h2>
      
      <p>Our sales team is reviewing your request and will contact you within 24 hours to discuss your specific needs.</p>
      
      <h2 style="color: #0891B2; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">Watch the Demo</h2>
      
      <p>In the meantime, check out our platform overview to see how MedStar H2O can help:</p>
      
      <p style="margin-top: 20px; margin-bottom: 20px;">
        <a href="${demoUrl}" 
           style="display: inline-block; padding: 12px 30px; background-color: #0891B2; color: white; 
                  text-decoration: none; border-radius: 6px; font-weight: bold;">
          Watch Demo Video
        </a>
      </p>
      
      <h2 style="color: #0891B2; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">Your Inquiry Details</h2>
      
      <p><strong>Company:</strong> ${inquiry.companyName}</p>
      <p><strong>Hospitals Needed:</strong> ${inquiry.hospitalsNeeded || 'Not specified'}</p>
      <p><strong>Contact:</strong> ${inquiry.contactName} (${inquiry.email})</p>
      ${inquiry.inquiryNotes ? `<p><strong>Notes:</strong> ${inquiry.inquiryNotes}</p>` : ''}
      
      <h2 style="color: #0891B2; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">Quick Links</h2>
      
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/demo" style="color: #0891B2; text-decoration: none;">Demo Video</a></li>
        <li><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing" style="color: #0891B2; text-decoration: none;">Pricing & Plans</a></li>
        <li><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/privacy" style="color: #0891B2; text-decoration: none;">Privacy Policy</a></li>
        <li><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/terms" style="color: #0891B2; text-decoration: none;">Terms of Service</a></li>
      </ul>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #666; margin-top: 20px;">
        <strong>MedStar H2O</strong><br>
        Water Chemistry Compliance for Hospital Networks<br>
        <a href="mailto:support@facilityh2o.com" style="color: #0891B2; text-decoration: none;">support@facilityh2o.com</a>
      </p>
      
      <p style="font-size: 12px; color: #999; margin-top: 10px;">
        This is an automated response. Your inquiry has been logged and our team will be in touch shortly.
      </p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'FacilityH2O <alerts@medstarh20log.com>', // verified sender; display brand is FacilityH2O
        to: inquiry.email,
        subject: 'Thank You for Your MedStar H2O Inquiry',
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log(`[EMAIL] Auto-reply sent to ${inquiry.email}`);
  } catch (err) {
    console.error('[EMAIL] Failed to send auto-reply:', err.message);
    throw err;
  }
}
