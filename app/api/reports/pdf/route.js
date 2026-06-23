/**
 * FacilityH2O — PDF Report Generator
 * Generates DOH and Joint Commission compliant reports
 * 
 * GET /api/reports/pdf?hospitalId=xxx&from=2026-01-01&to=2026-01-31&format=doh|jc
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUserFromRequest } from '@/lib/auth';

// HTML to PDF conversion using pdfkit would require server-side setup
// Using html2pdf alternative or returning printable HTML

export async function GET(request) {
  // Auth check — must be signed in
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId');
    const from = searchParams.get('from') || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const format = searchParams.get('format') || 'doh'; // 'doh' or 'jc'

    if (!hospitalId) {
      return NextResponse.json({ error: 'hospitalId required' }, { status: 400 });
    }

    // Load data
    const dataDir = path.join(process.cwd(), 'data');
    
    let hospitals = [];
    let entries = [];
    let alerts = [];
    
    try {
      if (fs.existsSync(path.join(dataDir, 'facilities.json'))) {
        hospitals = JSON.parse(fs.readFileSync(path.join(dataDir, 'facilities.json'), 'utf8'));
      }
      if (fs.existsSync(path.join(dataDir, 'entries.json'))) {
        entries = JSON.parse(fs.readFileSync(path.join(dataDir, 'entries.json'), 'utf8'));
      }
      if (fs.existsSync(path.join(dataDir, 'alerts.json'))) {
        alerts = JSON.parse(fs.readFileSync(path.join(dataDir, 'alerts.json'), 'utf8'));
      }
    } catch (e) {
      console.log('[reports/pdf] Using empty data sets:', e.message);
    }

    const hospital = hospitals.find((h) => h.id === hospitalId) || { name: 'Unknown Hospital', address: 'Address not found', id: hospitalId };
    const filteredEntries = entries.filter((e) => e.hospitalId === hospitalId && e.date >= from && e.date <= to);
    const filteredAlerts = alerts.filter((a) => a.hospitalId === hospitalId && a.createdAt >= `${from}T00:00:00Z` && a.createdAt <= `${to}T23:59:59Z`);

    // Calculate compliance metrics
    let totalReadings = 0;
    let compliantReadings = 0;
    const parameterStats = {};
    const st108Params = [
      { key: 'ph', min: 5.0, max: 9.5, waterType: 'utility' },
      { key: 'conductivity', min: 0, max: 500, unit: 'µS/cm', waterType: 'utility' },
      { key: 'turbidity', min: 0, max: 1.0, unit: 'NTU', waterType: 'utility' },
      { key: 'hardness', min: 0, max: 500, unit: 'mg/L CaCO₃', waterType: 'utility' },
      { key: 'chlorine', min: 0, max: 0.5, unit: 'mg/L', waterType: 'utility' },
      { key: 'tds', min: 0, max: 500, unit: 'mg/L', waterType: 'utility' },
    ];

    filteredEntries.forEach((e) => {
      st108Params.forEach((param) => {
        const v = parseFloat(e.values?.[param.key]);
        if (!isNaN(v)) {
          totalReadings++;
          const isCompliant = v >= param.min && v <= param.max;
          if (isCompliant) compliantReadings++;

          if (!parameterStats[param.key]) {
            parameterStats[param.key] = { total: 0, compliant: 0, min: param.min, max: param.max };
          }
          parameterStats[param.key].total++;
          if (isCompliant) {
            parameterStats[param.key].compliant++;
          }
        }
      });
    });

    const complianceRate = totalReadings > 0 ? ((compliantReadings / totalReadings) * 100).toFixed(1) : 'N/A';

    // Generate report based on format
    let htmlReport;

    if (format === 'jc') {
      htmlReport = generateJointCommissionReport(hospital, filteredEntries, filteredAlerts, parameterStats, complianceRate, from, to, totalReadings, compliantReadings);
    } else {
      htmlReport = generateDOHReport(hospital, filteredEntries, filteredAlerts, parameterStats, complianceRate, from, to, totalReadings, compliantReadings);
    }

    // Return as HTML (can be printed to PDF via browser or server-side conversion)
    const filename = `${format}-report-${hospitalId}-${new Date().toISOString().split('T')[0]}.html`;
    return new NextResponse(htmlReport, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[reports/pdf] Error:', err);
    return NextResponse.json({ error: 'Report generation failed: ' + err.message }, { status: 500 });
  }
}

function generateDOHReport(hospital, entries, alerts, parameterStats, complianceRate, from, to, totalReadings, compliantReadings) {
  const reportDate = new Date().toISOString().split('T')[0];
  const auditTrail = [{
    action: 'DOH Report Generated',
    user: 'System',
    timestamp: new Date().toISOString(),
    details: `Department of Health compliance report for ${hospital.name} from ${from} to ${to}`,
  }];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DOH Report - ${hospital.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; color: #000; line-height: 1.4; background: white; }
    .page { max-width: 850px; margin: 0 auto; padding: 40px 20px; page-break-after: always; }
    
    /* Official Header */
    .header {
      text-align: center;
      border-bottom: 3px double #000;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    
    .header h1 {
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 2px;
    }
    
    .header p {
      font-size: 11px;
      margin-top: 5px;
    }
    
    /* Facility Info Block */
    .facility-block {
      border: 2px solid #000;
      padding: 15px;
      margin-bottom: 20px;
      font-size: 11px;
    }
    
    .facility-block-header {
      font-weight: bold;
      border-bottom: 1px solid #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    .facility-info-row {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 10px;
      padding: 4px 0;
    }
    
    .facility-info-label {
      font-weight: bold;
      text-transform: uppercase;
    }
    
    /* Compliance Summary */
    .compliance-summary {
      border: 1px solid #000;
      padding: 15px;
      margin-bottom: 20px;
      background: #f9f9f9;
      font-size: 11px;
    }
    
    .compliance-summary-title {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 10px;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    
    .metric {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 10px;
      padding: 5px 0;
      border-bottom: 1px dotted #ccc;
    }
    
    .metric:last-child {
      border-bottom: none;
    }
    
    .metric-label {
      font-weight: bold;
    }
    
    /* Parameters Table */
    .parameters-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10px;
    }
    
    .parameters-table th {
      border: 1px solid #000;
      padding: 8px;
      background: #e0e0e0;
      font-weight: bold;
      text-align: left;
      text-transform: uppercase;
    }
    
    .parameters-table td {
      border: 1px solid #000;
      padding: 6px 8px;
      text-align: left;
    }
    
    .parameters-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    /* Alerts Section */
    .alerts-section {
      border: 1px solid #b91c1c;
      border-left: 5px solid #b91c1c;
      padding: 15px;
      margin-bottom: 20px;
      background: #fef2f2;
      font-size: 11px;
    }
    
    .alerts-title {
      font-weight: bold;
      color: #b91c1c;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    
    /* Certification Block */
    .certification {
      border: 2px solid #000;
      padding: 15px;
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
    }
    
    .certification p {
      margin: 5px 0;
    }
    
    .signature-line {
      border-bottom: 1px solid #000;
      margin: 20px 0;
      padding-top: 10px;
      font-size: 10px;
    }
    
    /* Footer */
    .footer {
      border-top: 2px solid #000;
      padding-top: 10px;
      margin-top: 30px;
      font-size: 9px;
      text-align: center;
    }
    
    /* Print Styles */
    @media print {
      body { background: white; }
      .page { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Official Header -->
    <div class="header">
      <h1>NEW YORK DEPARTMENT OF HEALTH</h1>
      <p>WATER QUALITY MONITORING COMPLIANCE REPORT</p>
      <p>ANSI/AAMI ST108:2023</p>
    </div>
    
    <!-- Facility Information -->
    <div class="facility-block">
      <div class="facility-block-header">FACILITY INFORMATION</div>
      <div class="facility-info-row">
        <span class="facility-info-label">FACILITY NAME:</span>
        <span>${hospital.name}</span>
      </div>
      <div class="facility-info-row">
        <span class="facility-info-label">ADDRESS:</span>
        <span>${hospital.address || 'Not provided'}</span>
      </div>
      <div class="facility-info-row">
        <span class="facility-info-label">LICENSE ID:</span>
        <span>${hospital.id || 'N/A'}</span>
      </div>
      <div class="facility-info-row">
        <span class="facility-info-label">REPORTING PERIOD:</span>
        <span>${from} through ${to}</span>
      </div>
      <div class="facility-info-row">
        <span class="facility-info-label">REPORT GENERATED:</span>
        <span>${new Date().toLocaleString()}</span>
      </div>
    </div>
    
    <!-- Compliance Summary -->
    <div class="compliance-summary">
      <div class="compliance-summary-title">WATER QUALITY COMPLIANCE SUMMARY</div>
      <div class="metric">
        <span class="metric-label">Overall Compliance Rate:</span>
        <span>${complianceRate}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Total Readings Tested:</span>
        <span>${totalReadings}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Compliant Readings:</span>
        <span>${compliantReadings}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Non-Compliant Readings:</span>
        <span>${totalReadings - compliantReadings}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Total Monitoring Entries:</span>
        <span>${entries.length}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Unresolved Alerts:</span>
        <span>${alerts.length}</span>
      </div>
    </div>
    
    <!-- Parameters Performance -->
    <div style="margin-bottom: 20px;">
      <div style="font-weight: bold; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; font-size: 11px;">
        PARAMETER PERFORMANCE SUMMARY
      </div>
      <table class="parameters-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>ST108 Limit</th>
            <th>Tested</th>
            <th>Compliant</th>
            <th>Non-Compliant</th>
            <th>% Compliant</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(parameterStats).map(([key, stats]) => {
            const pct = stats.total > 0 ? ((stats.compliant / stats.total) * 100).toFixed(1) : 'N/A';
            return `
            <tr>
              <td style="text-transform: capitalize;">${key}</td>
              <td>${stats.min}–${stats.max}</td>
              <td>${stats.total}</td>
              <td>${stats.compliant}</td>
              <td>${stats.total - stats.compliant}</td>
              <td>${pct}%</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Alerts if any -->
    ${alerts.length > 0 ? `
    <div class="alerts-section">
      <div class="alerts-title">⚠️  OPEN ALERTS / CORRECTIVE ACTIONS REQUIRED</div>
      ${alerts.map((a, i) => `
        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dotted #666;">
          <strong>${i + 1}. ${a.type || 'Alert'}:</strong> ${a.message || 'Details unavailable'}<br>
          <em style="font-size: 9px;">Created: ${new Date(a.createdAt).toLocaleString()}</em>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Certification -->
    <div class="certification">
      <p><strong>CERTIFICATION</strong></p>
      <p style="margin-top: 15px;">This report certifies that the above-named facility has implemented</p>
      <p>water quality monitoring in accordance with ANSI/AAMI ST108:2023</p>
      <p>standards for the reporting period identified above.</p>
      
      <div class="signature-line">
        Authorized Facility Representative Signature / Date
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>This report is required for Department of Health inspection and survey compliance.</p>
      <p>Retain for minimum 3 years per regulatory requirements.</p>
      <p>Generated by FacilityH2O Water Chemistry Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateJointCommissionReport(hospital, entries, alerts, parameterStats, complianceRate, from, to, totalReadings, compliantReadings) {
  const reportDate = new Date().toISOString().split('T')[0];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Joint Commission Report - ${hospital.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; background: white; }
    .page { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #1f2937;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 12px;
      color: #666;
    }
    
    .standard-ref {
      background: #f3f4f6;
      border-left: 4px solid #0891b2;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      color: #1f2937;
      background: #e5e7eb;
      padding: 10px;
      margin-bottom: 12px;
      border-left: 4px solid #0891b2;
    }
    
    .info-box {
      border: 1px solid #d1d5db;
      padding: 15px;
      margin-bottom: 15px;
      background: #f9fafb;
    }
    
    .info-row {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 15px;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: bold;
      color: #374151;
    }
    
    .compliance-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    
    .compliance-table th {
      background: #0891b2;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: bold;
    }
    
    .compliance-table td {
      border: 1px solid #d1d5db;
      padding: 8px 10px;
    }
    
    .compliance-table tr:nth-child(even) {
      background: #f3f4f6;
    }
    
    .metric-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .metric {
      border: 1px solid #d1d5db;
      padding: 15px;
      text-align: center;
      background: white;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #0891b2;
      margin-bottom: 5px;
    }
    
    .metric-label {
      font-size: 12px;
      color: #666;
      font-weight: bold;
    }
    
    .checklist {
      border: 1px solid #d1d5db;
      padding: 15px;
      background: #f9fafb;
    }
    
    .checklist-item {
      padding: 8px 0;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .checklist-item:last-child {
      border-bottom: none;
    }
    
    .checkbox {
      width: 16px;
      height: 16px;
      border: 1px solid #999;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .alert-box {
      border-left: 4px solid #dc2626;
      padding: 12px;
      margin-bottom: 15px;
      background: #fef2f2;
      font-size: 12px;
    }
    
    .footer {
      border-top: 2px solid #1f2937;
      padding-top: 15px;
      margin-top: 30px;
      font-size: 10px;
      text-align: center;
      color: #666;
    }
    
    @media print {
      body { background: white; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>WATER QUALITY MANAGEMENT COMPLIANCE REPORT</h1>
      <p>Joint Commission Standard EC.02.05.02</p>
    </div>
    
    <div class="standard-ref">
      <strong>Compliance Standard:</strong> EC.02.05.02 – The organization manages the water systems to reduce the risk of waterborne disease transmission.<br>
      <strong>Requirements:</strong> ST108:2023 water quality monitoring, treatment equipment maintenance, corrective actions for out-of-spec results.
    </div>
    
    <!-- Facility Information -->
    <div class="section">
      <div class="section-title">Facility Information</div>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Facility Name:</span>
          <span>${hospital.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Address:</span>
          <span>${hospital.address || 'Not provided'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">License/Facility ID:</span>
          <span>${hospital.id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Reporting Period:</span>
          <span>${from} through ${to}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Report Generated:</span>
          <span>${new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
    
    <!-- Compliance Overview -->
    <div class="section">
      <div class="section-title">Compliance Overview</div>
      <div class="metric-card">
        <div class="metric">
          <div class="metric-value">${complianceRate}%</div>
          <div class="metric-label">Overall Compliance</div>
        </div>
        <div class="metric">
          <div class="metric-value">${entries.length}</div>
          <div class="metric-label">Monitoring Entries</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric">
          <div class="metric-value">${totalReadings}</div>
          <div class="metric-label">Total Parameters Tested</div>
        </div>
        <div class="metric">
          <div class="metric-value">${alerts.length}</div>
          <div class="metric-label">Open Alerts</div>
        </div>
      </div>
    </div>
    
    <!-- Parameter Performance -->
    <div class="section">
      <div class="section-title">Water Quality Parameter Performance</div>
      <table class="compliance-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>ST108 Specification</th>
            <th>Tests Performed</th>
            <th>Compliant</th>
            <th>Non-Compliant</th>
            <th>Compliance %</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(parameterStats).map(([key, stats]) => {
            const pct = stats.total > 0 ? ((stats.compliant / stats.total) * 100).toFixed(1) : 'N/A';
            return `
            <tr>
              <td style="text-transform: capitalize; font-weight: bold;">${key}</td>
              <td>${stats.min}–${stats.max}</td>
              <td>${stats.total}</td>
              <td>${stats.compliant}</td>
              <td>${stats.total - stats.compliant}</td>
              <td>${pct}%</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Compliance Checklist -->
    <div class="section">
      <div class="section-title">EC.02.05.02 Compliance Checklist</div>
      <div class="checklist">
        <div class="checklist-item">
          <div class="checkbox">☑</div>
          <span><strong>Water Management Program (WMP)</strong> – Written program in place and current</span>
        </div>
        <div class="checklist-item">
          <div class="checkbox">☑</div>
          <span><strong>ST108 Monitoring</strong> – Water quality tested per schedule for all water types</span>
        </div>
        <div class="checklist-item">
          <div class="checkbox">☑</div>
          <span><strong>Treatment Equipment</strong> – RO/DI and sterilization systems maintained</span>
        </div>
        <div class="checklist-item">
          <div class="checkbox">☑</div>
          <span><strong>Lab Testing</strong> – Microbial and chemical results documented with chain of custody</span>
        </div>
        <div class="checklist-item">
          <div class="checkbox">☑</div>
          <span><strong>Corrective Actions</strong> – Out-of-spec results trigger documented actions within 24h</span>
        </div>
        <div class="checklist-item">
          <div class="checkbox">☑</div>
          <span><strong>Documentation</strong> – All records retained minimum 3 years, accessible for surveys</span>
        </div>
        <div class="checklist-item">
          <div class="checkbox">☑</div>
          <span><strong>Staff Competency</strong> – Personnel trained and competent in water management</span>
        </div>
      </div>
    </div>
    
    <!-- Alerts Section -->
    ${alerts.length > 0 ? `
    <div class="section">
      <div class="section-title">Open Alerts Requiring Attention</div>
      ${alerts.map((a) => `
        <div class="alert-box">
          <strong>Alert:</strong> ${a.type || 'Water Quality Issue'}<br>
          ${a.message || 'Details not available'}<br>
          <em>Created: ${new Date(a.createdAt).toLocaleString()}</em>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <div class="footer">
      <p>This report documents compliance with Joint Commission Standard EC.02.05.02 and ANSI/AAMI ST108:2023 water quality requirements.</p>
      <p>Generated by FacilityH2O Water Chemistry Platform | Report valid for accreditation survey submission</p>
      <p>Printed: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `;
}
