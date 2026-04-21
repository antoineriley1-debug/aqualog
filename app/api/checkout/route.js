/**
 * MedStar H2O — Checkout API
 * Processes payment and custom inquiry forms
 * 
 * POST /api/checkout — both payment and custom inquiry
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

function ensureAccountsFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    fs.writeFileSync(ACCOUNTS_FILE, '[]', 'utf8');
  }
}

function getAccounts() {
  try {
    ensureAccountsFile();
    return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  try {
    ensureAccountsFile();
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving accounts:', err);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { tier, companyName, contactName, email, phone, cardName, cardNumber, hospitalsNeeded, notes } = body;

    // Validate tier
    if (!['starter', 'pro', 'custom'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Validate required fields
    if (!companyName || !contactName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // For starter/pro, validate payment info (for demo purposes, just check presence)
    if (tier !== 'custom') {
      if (!cardName || !cardNumber) {
        return NextResponse.json({ error: 'Payment information required' }, { status: 400 });
      }
    }

    // Create account record
    const accountId = `acc_${randomUUID().slice(0, 12)}`;
    const now = new Date().toISOString();

    const account = {
      id: accountId,
      tier,
      status: 'pending', // pending -> active after setup
      companyName,
      contactName,
      email,
      phone,
      
      // For custom tier inquiries
      ...(tier === 'custom' && {
        hospitalsNeeded: hospitalsNeeded ? parseInt(hospitalsNeeded) : null,
        inquiryNotes: notes,
      }),

      // Payment info (encrypted in real implementation)
      ...(tier !== 'custom' && {
        paymentStatus: 'pending',
        lastFourCard: cardNumber ? cardNumber.slice(-4) : null,
      }),

      createdAt: now,
      updatedAt: now,
    };

    // Save account
    const accounts = getAccounts();
    accounts.push(account);
    saveAccounts(accounts);

    // TODO: In production:
    // - For starter/pro: Process payment with Stripe
    // - For custom: Send inquiry email to sales@medstarh2o.com

    // Send confirmation email (simulated)
    if (tier === 'custom') {
      // Would send email to sales team
      console.log(`[CHECKOUT] Custom inquiry from ${contactName} (${email}) - ${hospitalsNeeded} hospitals needed`);
    } else {
      // Would process Stripe payment
      console.log(`[CHECKOUT] Payment initiated for ${tier} plan by ${contactName}`);
    }

    return NextResponse.json({
      success: true,
      accountId,
      message: tier === 'custom' 
        ? 'Inquiry submitted. Our sales team will contact you shortly.'
        : 'Payment processing. Proceeding to account setup...'
    });
  } catch (err) {
    console.error('[checkout] Error:', err);
    return NextResponse.json({ error: 'Checkout failed. Please try again.' }, { status: 500 });
  }
}
