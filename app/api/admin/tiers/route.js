/**
 * MedStar H2O — Admin Tier Management API
 * Manage pricing tiers (enable/disable/update)
 * 
 * GET /api/admin/tiers — Get all tiers
 * PATCH /api/admin/tiers — Update tier
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TIERS_FILE = path.join(DATA_DIR, 'tiers.json');

const DEFAULT_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    hospitalLimit: 1,
    accountLimit: 'unlimited',
    description: 'Perfect for small facilities',
    enabled: true,
    order: 1,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    hospitalLimit: 10,
    accountLimit: 'unlimited',
    description: 'Scaled for multi-hospital networks',
    enabled: true,
    order: 2,
  },
  {
    id: 'custom',
    name: 'Custom',
    price: null,
    hospitalLimit: 'unlimited',
    accountLimit: 'unlimited',
    description: 'Enterprise-grade solutions',
    enabled: true,
    order: 3,
  },
];

function ensureTiersFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TIERS_FILE)) {
    fs.writeFileSync(TIERS_FILE, JSON.stringify(DEFAULT_TIERS, null, 2), 'utf8');
  }
}

function getTiers() {
  try {
    ensureTiersFile();
    const data = fs.readFileSync(TIERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_TIERS;
  }
}

function saveTiers(tiers) {
  try {
    ensureTiersFile();
    fs.writeFileSync(TIERS_FILE, JSON.stringify(tiers, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving tiers:', err);
  }
}

// TODO: Add proper auth check - verify user is super admin
function verifyAdminAccess(request) {
  // In production: Check JWT token and verify user is super admin
  // For now: Return true (add auth later)
  return true;
}

export async function GET(request) {
  try {
    const tiers = getTiers();
    return NextResponse.json({ tiers });
  } catch (err) {
    console.error('[tiers GET] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch tiers' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    // TODO: Uncomment after adding auth
    // if (!verifyAdminAccess(request)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const body = await request.json();
    const { tierId, enabled, price } = body;

    if (!tierId) {
      return NextResponse.json({ error: 'Tier ID required' }, { status: 400 });
    }

    const tiers = getTiers();
    const tierIndex = tiers.findIndex(t => t.id === tierId);

    if (tierIndex === -1) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    // Update tier
    if (enabled !== undefined) {
      tiers[tierIndex].enabled = enabled;
    }

    if (price !== undefined && tiers[tierIndex].id !== 'custom') {
      tiers[tierIndex].price = price === null ? null : parseFloat(price);
    }

    tiers[tierIndex].updatedAt = new Date().toISOString();

    saveTiers(tiers);

    return NextResponse.json({
      success: true,
      tier: tiers[tierIndex],
      message: 'Tier updated successfully',
    });
  } catch (err) {
    console.error('[tiers PATCH] Error:', err);
    return NextResponse.json(
      { error: 'Failed to update tier' },
      { status: 500 }
    );
  }
}
