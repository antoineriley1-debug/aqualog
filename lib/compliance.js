// Calculate compliance score for a hospital for a given month
// Returns: { grade, score, breakdown }
// Score components:
//   - Entry completeness (40%): % of expected shifts logged (3 shifts/day × 2 systems = 6 per day)
//   - Chemistry compliance (40%): % of readings within target range
//   - Alert response (20%): % of alerts acknowledged within 24 hours

export function calcComplianceScore(hospitalId, entries, alerts, year, month) {
  // month is 1-indexed
  const daysInMonth = new Date(year, month, 0).getDate();
  const expectedEntries = daysInMonth * 3 * 2; // 3 shifts × boiler + chilled

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthEntries = entries.filter(e => e.hospitalId === hospitalId && e.date?.startsWith(monthStr));
  const monthAlerts = alerts.filter(a => a.hospitalId === hospitalId && a.createdAt?.startsWith(monthStr));

  // Entry completeness
  const entryScore = Math.min(100, (monthEntries.length / expectedEntries) * 100);

  // Chemistry compliance — count OOR readings vs total readings
  const BOILER_FIELDS = [
    { key: 'ph', min: 8.5, max: 10.5 },
    { key: 'phosphate', min: 20, max: 60 },
    { key: 'sulfite', min: 20, max: 80 },
    { key: 'hardness', min: 0, max: 0, targetZero: true },
    { key: 'conductivity', min: 0, max: 3500 },
    { key: 'alkalinity', min: 100, max: 700 },
    { key: 'tds', min: 0, max: 3000 },
    { key: 'amine', min: 0, max: 10 },
  ];
  const CHILLED_FIELDS = [
    { key: 'ph', min: 7.5, max: 9.5 },
    { key: 'conductivity', min: 0, max: 2000 },
    { key: 'inhibitor', min: 50, max: 300 },
    { key: 'hardness', min: 0, max: 200 },
    { key: 'iron', min: 0, max: 2 },
    { key: 'tds', min: 0, max: 2000 },
    { key: 'molybdate', min: 5, max: 30 },
    { key: 'bacteria', min: 0, max: 1000 },
  ];

  let totalReadings = 0;
  let inRangeReadings = 0;
  monthEntries.forEach(e => {
    const fields = e.system === 'boiler' ? BOILER_FIELDS : CHILLED_FIELDS;
    fields.forEach(f => {
      const v = parseFloat(e.values?.[f.key]);
      if (!isNaN(v)) {
        totalReadings++;
        const inRange = f.targetZero ? v === 0 : (v >= f.min && v <= f.max);
        if (inRange) inRangeReadings++;
      }
    });
  });
  const chemScore = totalReadings > 0 ? (inRangeReadings / totalReadings) * 100 : 100;

  // Alert response — % acknowledged within 24h
  let responded = 0;
  monthAlerts.forEach(a => {
    if (a.acknowledged && a.acknowledgedAt) {
      const diff = new Date(a.acknowledgedAt) - new Date(a.createdAt);
      if (diff <= 86400000) responded++;
    }
  });
  const alertScore = monthAlerts.length > 0 ? (responded / monthAlerts.length) * 100 : 100;

  const score = Math.round(entryScore * 0.4 + chemScore * 0.4 + alertScore * 0.2);

  let grade;
  if (score >= 95) grade = 'A+';
  else if (score >= 90) grade = 'A';
  else if (score >= 85) grade = 'B+';
  else if (score >= 80) grade = 'B';
  else if (score >= 75) grade = 'C+';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return {
    grade,
    score,
    breakdown: {
      entryCompleteness: Math.round(entryScore),
      chemCompliance: Math.round(chemScore),
      alertResponse: Math.round(alertScore),
      totalEntries: monthEntries.length,
      expectedEntries,
      totalReadings,
      inRangeReadings,
      alertsTotal: monthAlerts.length,
      alertsResponded: responded,
    }
  };
}

export function gradeColor(grade) {
  if (grade.startsWith('A')) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
  if (grade.startsWith('B')) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
  if (grade.startsWith('C')) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
  if (grade === 'D') return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
  return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
}
