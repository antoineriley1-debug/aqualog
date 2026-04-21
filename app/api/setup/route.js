/**
 * MedStar H2O — Account Setup API
 * Completes account setup after checkout
 * 
 * POST /api/setup/complete — Create hospital and operators
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const HOSPITALS_FILE = path.join(DATA_DIR, 'hospitals.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const TIER_LIMITS = {
  starter: 1,
  pro: 10,
  custom: 999,
};

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  [ACCOUNTS_FILE, HOSPITALS_FILE, USERS_FILE].forEach((file) => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '[]', 'utf8');
    }
  });
}

function readJSON(filePath) {
  try {
    ensureFiles();
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  try {
    ensureFiles();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing JSON:', err);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { accountId, tier, hospital, operators } = body;

    if (!accountId || !tier || !hospital) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate tier
    if (!TIER_LIMITS[tier]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get existing account
    const accounts = readJSON(ACCOUNTS_FILE);
    const account = accounts.find(a => a.id === accountId);

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Validate hospital info
    if (!hospital.name || !hospital.name.trim()) {
      return NextResponse.json({ error: 'Hospital name required' }, { status: 400 });
    }

    if (!operators || operators.length === 0) {
      return NextResponse.json({ error: 'At least one operator required' }, { status: 400 });
    }

    // Validate all operators have required fields
    for (const op of operators) {
      if (!op.name || !op.email || !op.password) {
        return NextResponse.json({ error: 'All operator fields required' }, { status: 400 });
      }
    }

    // Create hospital record
    const hospitalId = `hos_${randomUUID().slice(0, 12)}`;
    const now = new Date().toISOString();

    const newHospital = {
      id: hospitalId,
      accountId,
      tier,
      name: hospital.name.trim(),
      address: hospital.address || '',
      city: hospital.city || '',
      state: hospital.state || '',
      zipCode: hospital.zipCode || '',
      phone: hospital.phone || '',
      maxHospitals: TIER_LIMITS[tier],
      operatorCount: operators.length,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    // Create operator user records
    const operatorIds = [];
    const users = readJSON(USERS_FILE);

    for (const op of operators) {
      const userId = `usr_${randomUUID().slice(0, 12)}`;
      operatorIds.push(userId);

      const newUser = {
        id: userId,
        accountId,
        hospitalId,
        username: op.email.toLowerCase(),
        email: op.email.toLowerCase(),
        name: op.name.trim(),
        password: op.password, // TODO: Hash password with bcrypt in production
        role: 'operator',
        active: true,
        createdAt: now,
        updatedAt: now,
      };

      users.push(newUser);
    }

    // Save all data
    const hospitals = readJSON(HOSPITALS_FILE);
    hospitals.push(newHospital);
    writeJSON(HOSPITALS_FILE, hospitals);
    writeJSON(USERS_FILE, users);

    // Update account status
    const updatedAccounts = accounts.map(a =>
      a.id === accountId
        ? {
            ...a,
            status: 'active',
            hospitalId,
            operatorCount: operators.length,
            updatedAt: now,
          }
        : a
    );
    writeJSON(ACCOUNTS_FILE, updatedAccounts);

    // Log audit event
    const auditFile = path.join(DATA_DIR, 'audit.json');
    const audit = readJSON(auditFile);
    audit.push({
      id: `aud_${randomUUID().slice(0, 8)}`,
      type: 'account',
      action: 'setup_complete',
      accountId,
      hospitalId,
      detail: `Account activated: ${hospital.name}`,
      outcome: 'SUCCESS',
      createdAt: now,
    });
    writeJSON(auditFile, audit);

    return NextResponse.json({
      success: true,
      hospitalId,
      accountId,
      operatorCount: operators.length,
      message: 'Account activated successfully',
    });
  } catch (err) {
    console.error('[setup] Error:', err);
    return NextResponse.json({ error: 'Setup failed. Please try again.' }, { status: 500 });
  }
}
