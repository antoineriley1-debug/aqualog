import { NextResponse } from 'next/server';
import { addEntry, getAllEntries } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';
import fs from 'fs';
import path from 'path';

const SEED_FLAG_FILE = path.join(process.cwd(), 'data', '.seeded');

export async function GET(request) {
  try {
    // Check if already seeded
    if (fs.existsSync(SEED_FLAG_FILE)) {
      return NextResponse.json({ message: 'Data already seeded', skipped: true });
    }

    const now = new Date();
    const systems = ['boiler', 'chilled'];
    const shifts = ['morning', 'afternoon', 'evening'];
    const operatorNames = ['John Smith', 'Maria Garcia', 'Ahmed Hassan', 'Sarah Johnson'];
    const testerNames = ['Lab Tech A', 'Lab Tech B', 'Lab Tech C'];

    let entriesCreated = 0;

    for (const hospital of HOSPITALS) {
      for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
        const entryDate = new Date(now);
        entryDate.setDate(entryDate.getDate() - daysAgo);
        const dateStr = entryDate.toISOString().split('T')[0];

        const entriesPerDay = Math.random() > 0.3 ? 2 : 3;

        for (let i = 0; i < entriesPerDay; i++) {
          const system = systems[Math.floor(Math.random() * systems.length)];
          const shift = shifts[Math.floor(Math.random() * shifts.length)];
          const operatorName = operatorNames[Math.floor(Math.random() * operatorNames.length)];
          const testerName = testerNames[Math.floor(Math.random() * testerNames.length)];

          let ph, alkalinity, conductivity, chlorine;

          if (system === 'boiler') {
            const isOutOfRange = Math.random() < 0.1;
            ph = isOutOfRange ? (Math.random() > 0.5 ? 7 + Math.random() * 1 : 11 + Math.random() * 1) : 8.5 + Math.random() * 2;
            alkalinity = 100 + Math.random() * 100;
            conductivity = 500 + Math.random() * 500;
            chlorine = 0.2 + Math.random() * 0.3;
          } else {
            const isOutOfRange = Math.random() < 0.08;
            ph = isOutOfRange ? (Math.random() > 0.5 ? 6.5 + Math.random() * 0.8 : 9.6 + Math.random() * 0.6) : 7.5 + Math.random() * 2;
            alkalinity = 80 + Math.random() * 80;
            conductivity = 300 + Math.random() * 400;
            chlorine = 0.3 + Math.random() * 0.4;
          }

          addEntry({
            hospitalId: hospital.id,
            system,
            shift,
            date: dateStr,
            time: `${9 + i * 3}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            operatorName,
            testerName,
            values: { ph: parseFloat(ph.toFixed(2)), alkalinity: parseFloat(alkalinity.toFixed(1)), conductivity: parseFloat(conductivity.toFixed(1)), chlorine: parseFloat(chlorine.toFixed(2)) },
            createdAt: new Date(entryDate.getTime() + Math.random() * 86400000).toISOString(),
          });
          entriesCreated++;
        }
      }
    }

    // Create seed flag
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(SEED_FLAG_FILE, new Date().toISOString());
    } catch (e) {
      // File system may be read-only on Render
    }

    return NextResponse.json({ success: true, entriesCreated, totalEntries: getAllEntries().length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
