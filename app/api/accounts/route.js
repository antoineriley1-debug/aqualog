/**
 * MedStar H2O — Accounts API
 * Get account details, list accounts, validate tier limits
 * 
 * GET /api/accounts?accountId=xxx — Get account by ID
 * GET /api/accounts?email=xxx — Get account by email
 * POST /api/accounts/validate-tier-limit — Check if hospital limit allows adding
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const HOSPITALS_FILE = path.join(DATA_DIR, 'hospitals.json');

const TIER_LIMITS = {
  starter: 1,
  pro: 10,
  custom: 999,
};

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const email = searchParams.get('email');

    const accounts = readJSON(ACCOUNTS_FILE);

    if (accountId) {
      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }
      return NextResponse.json({ account });
    }

    if (email) {
      const account = accounts.find(a => a.email?.toLowerCase() === email.toLowerCase());
      if (!account) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }
      return NextResponse.json({ account });
    }

    // No specific query - return all accounts (admin only)
    // TODO: Add auth check
    return NextResponse.json({ accounts });
  } catch (err) {
    console.error('[accounts GET] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, accountId } = body;

    if (action === 'validate-tier-limit') {
      const accounts = readJSON(ACCOUNTS_FILE);
      const hospitals = readJSON(HOSPITALS_FILE);

      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }

      const tierLimit = TIER_LIMITS[account.tier] || 0;
      const hospitalCount = hospitals.filter(h => h.accountId === accountId).length;
      const canAddMore = hospitalCount < tierLimit;

      return NextResponse.json({
        accountId,
        tier: account.tier,
        tierLimit,
        hospitalCount,
        canAddMore,
        message: canAddMore
          ? `You can add ${tierLimit - hospitalCount} more hospital(s)`
          : `Your ${account.tier} plan limit of ${tierLimit} hospital(s) has been reached`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[accounts POST] Error:', err);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
