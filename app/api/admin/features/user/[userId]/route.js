/**
 * GET /api/admin/features/user/[userId]
 * Get feature unlock status for a specific user
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    const dataDir = path.join(process.cwd(), 'data');
    const featureLockFile = path.join(dataDir, 'feature-locks.json');

    // Load feature locks
    let featureLocks = {};
    if (fs.existsSync(featureLockFile)) {
      try {
        featureLocks = JSON.parse(fs.readFileSync(featureLockFile, 'utf8'));
      } catch {
        featureLocks = {};
      }
    }

    const userFeatures = featureLocks[userId] || {
      unlockedFeatures: [],
      lockedFeatures: [],
    };

    return NextResponse.json({
      userId,
      unlockedFeatures: userFeatures.unlockedFeatures,
      lockedFeatures: userFeatures.lockedFeatures,
      lastModified: userFeatures.lastModified || null,
    });
  } catch (err) {
    console.error('[admin/features/user] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch user features: ' + err.message }, { status: 500 });
  }
}
