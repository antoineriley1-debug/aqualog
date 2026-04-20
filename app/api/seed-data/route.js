import { NextResponse } from 'next/server';
import { addEntry, getAllEntries } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';

export async function POST(request) {
  try {
    // Generate 30 days of entries for each hospital
    const now = new Date();
    const hospitals = HOSPITALS;
    const systems = ['boiler', 'chilled'];
    const shifts = ['morning', 'afternoon', 'evening'];
    const operatorNames = ['John Smith', 'Maria Garcia', 'Ahmed Hassan', 'Sarah Johnson'];
    const testerNames = ['Lab Tech A', 'Lab Tech B', 'Lab Tech C'];

    let entriesCreated = 0;

    for (const hospital of hospitals) {
      for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
        const entryDate = new Date(now);
        entryDate.setDate(entryDate.getDate() - daysAgo);
        const dateStr = entryDate.toISOString().split('T')[0];

        // 2-3 entries per day per hospital (morning, afternoon, sometimes evening)
        const entriesPerDay = Math.random() > 0.3 ? 2 : 3;

        for (let i = 0; i < entriesPerDay; i++) {
          const system = systems[Math.floor(Math.random() * systems.length)];
          const shift = shifts[Math.floor(Math.random() * shifts.length)];
          const operatorName = operatorNames[Math.floor(Math.random() * operatorNames.length)];
          const testerName = testerNames[Math.floor(Math.random() * testerNames.length)];

          // Generate realistic pH values (with occasional out-of-range)
          let ph, alkalinity, conductivity, chlorine;

          if (system === 'boiler') {
            // Target: 8.5-10.5
            const isOutOfRange = Math.random() < 0.1; // 10% out of range
            ph = isOutOfRange
              ? (Math.random() > 0.5 ? 7 + Math.random() * 1 : 11 + Math.random() * 1)
              : 8.5 + Math.random() * 2;
            alkalinity = 100 + Math.random() * 100;
            conductivity = 500 + Math.random() * 500;
            chlorine = 0.2 + Math.random() * 0.3;
          } else {
            // Target: 7.5-9.5
            const isOutOfRange = Math.random() < 0.08;
            ph = isOutOfRange
              ? (Math.random() > 0.5 ? 6.5 + Math.random() * 0.8 : 9.6 + Math.random() * 0.6)
              : 7.5 + Math.random() * 2;
            alkalinity = 80 + Math.random() * 80;
            conductivity = 300 + Math.random() * 400;
            chlorine = 0.3 + Math.random() * 0.4;
          }

          const entry = {
            hospitalId: hospital.id,
            system,
            shift,
            date: dateStr,
            time: `${9 + i * 3}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            operatorName,
            testerName,
            values: {
              ph: parseFloat(ph.toFixed(2)),
              alkalinity: parseFloat(alkalinity.toFixed(1)),
              conductivity: parseFloat(conductivity.toFixed(1)),
              chlorine: parseFloat(chlorine.toFixed(2)),
            },
            notes: Math.random() > 0.7 ? 'Routine maintenance completed' : '',
            createdAt: new Date(entryDate.getTime() + Math.random() * 86400000).toISOString(),
          };

          addEntry(entry);
          entriesCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${entriesCreated} fake entries for trend testing`,
      entriesCreated,
      totalEntries: getAllEntries().length,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
