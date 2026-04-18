/**
 * FacilityH2O — Global Theme API
 * Author & Owner: Antoine Riley
 * Only ariley (super-admin) can change the global theme.
 * All users see the theme ariley sets.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUserFromRequest } from '@/lib/auth';

const THEME_FILE = path.join(process.cwd(), 'data', 'theme.json');
const SUPER_ADMIN_ID = 'usr_ariley';

const PRESETS = {
  medstar:  { primary: '#0072CE', navy: '#003366', accent: '#F6C90E', mode: 'light', name: 'FacilityH2O (Default)' },
  dark:     { primary: '#0072CE', navy: '#0d1526', accent: '#F6C90E', mode: 'dark',  name: 'Dark Mode'         },
  ocean:    { primary: '#0891b2', navy: '#0c4a6e', accent: '#22d3ee', mode: 'light', name: 'Ocean'             },
  forest:   { primary: '#16a34a', navy: '#14532d', accent: '#86efac', mode: 'light', name: 'Forest'            },
  midnight: { primary: '#6366f1', navy: '#1e1b4b', accent: '#a5b4fc', mode: 'dark',  name: 'Midnight'          },
  slate:    { primary: '#475569', navy: '#1e293b', accent: '#94a3b8', mode: 'dark',  name: 'Slate'             },
  crimson:  { primary: '#dc2626', navy: '#7f1d1d', accent: '#fca5a5', mode: 'dark',  name: 'Crimson'           },
};

function readTheme() {
  try {
    if (fs.existsSync(THEME_FILE)) return JSON.parse(fs.readFileSync(THEME_FILE, 'utf8'));
  } catch {}
  return { ...PRESETS.medstar, preset: 'medstar' };
}

function writeTheme(t) {
  fs.writeFileSync(THEME_FILE, JSON.stringify(t, null, 2), 'utf8');
}

// GET — public, any user can read current theme
export async function GET() {
  const theme = readTheme();
  return NextResponse.json({ theme, presets: PRESETS });
}

// POST — ariley only, sets global theme
export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.id !== SUPER_ADMIN_ID) {
    return NextResponse.json({ error: 'Only the system owner can change the global theme.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { preset, custom } = body;

  let newTheme;
  if (preset && PRESETS[preset]) {
    newTheme = { ...PRESETS[preset], preset };
  } else if (custom) {
    // Custom colors — validate they're hex values
    const hex = /^#[0-9A-Fa-f]{6}$/;
    if (!hex.test(custom.primary || '') || !hex.test(custom.navy || '')) {
      return NextResponse.json({ error: 'Invalid hex color values.' }, { status: 400 });
    }
    newTheme = { ...readTheme(), ...custom, preset: 'custom' };
  } else {
    return NextResponse.json({ error: 'Provide preset or custom colors.' }, { status: 400 });
  }

  writeTheme(newTheme);
  return NextResponse.json({ ok: true, theme: newTheme });
}
