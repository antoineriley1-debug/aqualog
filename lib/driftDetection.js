/**
 * FacilityH2O — Drift & Trend Detection Engine
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * Looks back up to 3 years of readings to identify:
 * - Short-term drift (last N readings trending toward a limit)
 * - Long-term trends (sustained directional movement over weeks/months)
 * - Seasonal patterns (same time last year comparison)
 * - Regulatory trending for Joint Commission surveys
 */

// 3-year lookback in milliseconds
const THREE_YEARS_MS = 1095 * 24 * 60 * 60 * 1000;

/**
 * Filter entries for a specific hospital, system, and parameter
 * looking back up to 3 years.
 */
function getParamHistory(entries, hospitalId, system, param, maxAgeDays = 1095) {
  const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
  return entries
    .filter((e) =>
      e.hospitalId === hospitalId &&
      e.system === system &&
      e.values?.[param] !== undefined &&
      !isNaN(parseFloat(e.values[param])) &&
      new Date(e.createdAt).getTime() >= cutoff
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((e) => ({
      value:     parseFloat(e.values[param]),
      date:      e.date || e.createdAt?.slice(0, 10),
      shift:     e.shift,
      createdAt: e.createdAt,
    }));
}

/**
 * Linear regression on an array of values.
 * Returns slope (positive = trending up, negative = trending down).
 */
function linearSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  values.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

/**
 * Main drift detection — checks multiple time windows.
 * Returns drift warning or null.
 *
 * @param {Array}  entries    - All entries from the data store
 * @param {string} hospitalId
 * @param {string} system     - 'boiler' | 'chilled'
 * @param {string} param      - parameter key
 * @param {object} range      - { min, max, targetZero }
 * @param {object} options    - { shortWindow, mediumWindow, longWindow, notifyThresholdDays }
 */
export function detectDrift(entries, hospitalId, system, param, range, options = {}) {
  const {
    shortWindow  = 3,    // readings for immediate drift
    mediumWindow = 14,   // days for weekly trend
    longWindow   = 90,   // days for quarterly trend
    notifyThresholdDays = 3, // from notification rules (default 3)
  } = options;

  // Get full 3-year history for this parameter
  const history = getParamHistory(entries, hospitalId, system, param, 1095);
  if (history.length < 2) return null;

  const allValues = history.map((h) => h.value);

  // ── Short-term drift (last N readings) ───────────────────────────────────
  const recent = history.slice(-Math.max(shortWindow, notifyThresholdDays));
  const recentVals = recent.map((h) => h.value);

  // All currently in range?
  const allInRange = recentVals.every((v) => {
    if (range.targetZero) return v === 0;
    return (range.min == null || v >= range.min) && (range.max == null || v <= range.max);
  });

  const shortSlope = linearSlope(recentVals);

  // Trending toward max
  if (allInRange && range.max != null && shortSlope > 0) {
    const nearMax = recentVals[recentVals.length - 1] >= range.max * 0.88;
    if (nearMax && recentVals.length >= notifyThresholdDays) {
      return buildWarning('high', 'short', param, recentVals, range, history, shortSlope);
    }
  }

  // Trending toward min
  if (allInRange && range.min != null && range.min > 0 && shortSlope < 0) {
    const nearMin = recentVals[recentVals.length - 1] <= range.min + (range.max - range.min) * 0.12;
    if (nearMin && recentVals.length >= notifyThresholdDays) {
      return buildWarning('low', 'short', param, recentVals, range, history, shortSlope);
    }
  }

  // ── Medium-term trend (last 14 days) ─────────────────────────────────────
  const medCutoff = Date.now() - (mediumWindow * 24 * 60 * 60 * 1000);
  const medHistory = history.filter((h) => new Date(h.createdAt).getTime() >= medCutoff);
  if (medHistory.length >= 4) {
    const medVals = medHistory.map((h) => h.value);
    const medSlope = linearSlope(medVals);
    const last = medVals[medVals.length - 1];

    if (range.max != null && medSlope > 0 && last >= range.max * 0.85) {
      return buildWarning('high', 'medium', param, medVals, range, history, medSlope, `${mediumWindow}-day trend`);
    }
    if (range.min != null && range.min > 0 && medSlope < 0 && last <= range.min * 1.15) {
      return buildWarning('low', 'medium', param, medVals, range, history, medSlope, `${mediumWindow}-day trend`);
    }
  }

  // ── Long-term trend (last 90 days) ───────────────────────────────────────
  const longCutoff = Date.now() - (longWindow * 24 * 60 * 60 * 1000);
  const longHistory = history.filter((h) => new Date(h.createdAt).getTime() >= longCutoff);
  if (longHistory.length >= 10) {
    const longVals = longHistory.map((h) => h.value);
    const longSlope = linearSlope(longVals);
    const last = longVals[longVals.length - 1];

    // Persistent long-term drift even if not yet near limit
    const slopeSignificant = Math.abs(longSlope) > (range.max || 100) * 0.002;
    if (slopeSignificant && range.max != null && longSlope > 0 && last >= range.max * 0.80) {
      return buildWarning('high', 'long', param, longVals.slice(-10), range, history, longSlope, `${longWindow}-day trend`);
    }
    if (slopeSignificant && range.min != null && range.min > 0 && longSlope < 0 && last <= range.min * 1.20) {
      return buildWarning('low', 'long', param, longVals.slice(-10), range, history, longSlope, `${longWindow}-day trend`);
    }
  }

  return null;
}

function buildWarning(direction, window, param, recentVals, range, fullHistory, slope, label) {
  const last    = recentVals[recentVals.length - 1];
  const limit   = direction === 'high' ? range.max : range.min;
  const pctToLimit = limit ? Math.abs(((last - limit) / limit) * 100).toFixed(1) : null;

  // Compute 30-day, 90-day, 1-year, 3-year stats from full history
  const stats = computeStats(fullHistory.map((h) => h.value));

  return {
    direction,
    window,
    windowLabel: label || `${recentVals.length}-reading drift`,
    param,
    current:     last,
    limit,
    pctToLimit,
    slope:       parseFloat(slope.toFixed(4)),
    trend:       recentVals,
    stats,
    fullHistoryCount: fullHistory.length,
    message: `${param} is trending ${direction === 'high' ? 'HIGH' : 'LOW'} — ${label || `last ${recentVals.length} readings`}: ${recentVals.join(' → ')} (limit: ${limit}). ${pctToLimit ? `${pctToLimit}% from limit.` : ''}`,
  };
}

function computeStats(values) {
  if (!values.length) return {};
  const sorted = [...values].sort((a, b) => a - b);
  const avg    = values.reduce((s, v) => s + v, 0) / values.length;
  const min    = sorted[0];
  const max    = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  const stddev = Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length);
  return {
    count:  values.length,
    avg:    parseFloat(avg.toFixed(3)),
    min:    parseFloat(min.toFixed(3)),
    max:    parseFloat(max.toFixed(3)),
    median: parseFloat(median.toFixed(3)),
    stddev: parseFloat(stddev.toFixed(3)),
  };
}

/**
 * Full 3-year trend report for a hospital + system + parameter.
 * Returns monthly averages, overall direction, and regulatory summary.
 */
export function getTrendReport(entries, hospitalId, system, param, range) {
  const history = getParamHistory(entries, hospitalId, system, param, 1095);
  if (history.length < 2) return null;

  // Group by month
  const byMonth = {};
  history.forEach((h) => {
    const month = h.date?.slice(0, 7) || h.createdAt?.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(h.value);
  });

  const monthly = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({
      month,
      avg:   parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(3)),
      min:   parseFloat(Math.min(...vals).toFixed(3)),
      max:   parseFloat(Math.max(...vals).toFixed(3)),
      count: vals.length,
      inRange: vals.filter((v) => {
        if (range.targetZero) return v === 0;
        return (range.min == null || v >= range.min) && (range.max == null || v <= range.max);
      }).length,
    }));

  const allVals = history.map((h) => h.value);
  const overallSlope = linearSlope(allVals);
  const stats = computeStats(allVals);

  // 30 / 90 / 365 day windows
  const windows = [30, 90, 365, 1095].map((days) => {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const w = history.filter((h) => new Date(h.createdAt).getTime() >= cutoff);
    return { days, count: w.length, stats: computeStats(w.map((h) => h.value)), slope: parseFloat(linearSlope(w.map((h) => h.value)).toFixed(4)) };
  });

  return {
    hospitalId,
    system,
    param,
    range,
    totalReadings: history.length,
    dateRange:     { from: history[0].date, to: history[history.length - 1].date },
    overallSlope,
    direction:     overallSlope > 0.001 ? 'RISING' : overallSlope < -0.001 ? 'FALLING' : 'STABLE',
    stats,
    monthly,
    windows,
  };
}
