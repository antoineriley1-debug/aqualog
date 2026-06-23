'use client';
import Sidebar from '@/components/Sidebar';

const sections = [
  {
    title: '⚖️ Intellectual Property & Proprietary Rights',
    effective: 'Effective: April 2026 · Copyright Registration Filed',
    content: [
      {
        heading: 'Ownership',
        text: 'FacilityH2O Inc.H2OLog.com and all content, features, functionality, source code, data architecture, user interface design, logging methodology, validation logic, system workflows, and visual displays contained therein are the exclusive proprietary property of Antoine W. Riley Sr. and are protected under applicable United States copyright law, trade secret law, and other intellectual property laws and treaties.',
      },
      {
        heading: 'Copyright Registration',
        text: 'A copyright registration claim has been filed with the United States Copyright Office for this software and platform. Unauthorized reproduction, duplication, modification, reverse engineering, decompilation, disassembly, or creation of derivative works based on this platform — in whole or in part — is strictly prohibited and may result in civil and criminal liability under 17 U.S.C. § 501 et seq.',
      },
      {
        heading: 'Restricted Use',
        text: 'Access to FacilityH2O Inc.H2OLog.com is granted solely for the authorized internal use of credentialed users within their assigned facility. Users may not: (a) copy, replicate, or reconstruct any portion of the platform\'s interface, workflow, or data structure; (b) use the platform as a reference to develop competing software; (c) scrape, harvest, or extract data through automated means; or (d) share login credentials with any unauthorized party.',
      },
      {
        heading: 'Trade Secret Notice',
        text: 'The data logging methodology, parameter validation framework, multi-hospital isolation architecture, and shift-based compliance workflow embodied in this platform constitute trade secrets of the owner. Access to this platform does not convey any license or right to use, disclose, or exploit these trade secrets.',
      },
      {
        heading: 'No License Granted',
        text: 'Nothing in these Terms shall be construed as granting any license or right to use any intellectual property of FacilityH2O Inc.H2OLog.com without the express prior written consent of the owner. All rights not expressly granted herein are reserved by Antoine W. Riley Sr.',
      },
    ],
  },
  {
    title: '≡ Acceptable Use Policy',
    effective: 'Effective: April 2026',
    content: [
      {
        heading: '1. Authorized Users',
        text: 'FacilityH2O is an internal system restricted exclusively to authorized employees and contractors of FacilityH2O and FacilityH2O Inc.. Access is granted on a per-site basis. No unauthorized personnel may access this system.',
      },
      {
        heading: '2. Permitted Use',
        text: 'This system is authorized solely for logging, reviewing, and managing water chemistry readings for assigned FacilityH2O Inc. facilities. Any other use is prohibited.',
      },
      {
        heading: '3. Prohibited Actions',
        text: `Users may NOT: (a) share login credentials with any other person; (b) attempt to access another hospital's data; (c) export or transmit chemistry data to unauthorized external parties; (d) use the system for any purpose other than water chemistry compliance; (e) attempt to reverse-engineer or tamper with the system.`,
      },
      {
        heading: '4. Monitoring',
        text: 'All activity within FacilityH2O is logged and may be reviewed by system administrators at any time. By using this system, you consent to such monitoring.',
      },
      {
        heading: '5. Violations',
        text: 'Violations of this policy may result in immediate account suspension, termination of employment or contract, and/or legal action.',
      },
    ],
  },
  {
    title: '️ Data Retention Policy',
    effective: 'Effective: April 2026',
    content: [
      {
        heading: '1. Retention Period',
        text: 'All water chemistry readings logged in FacilityH2O are retained for a minimum of 24 months from the date of entry, consistent with ASHRAE Standard 188 and The Joint Commission water management plan documentation requirements.',
      },
      {
        heading: '2. Data Types Stored',
        text: 'FacilityH2O stores: water chemistry readings (pH, phosphate, sulfite, conductivity, etc.), user account information, shift entry records, alert records, and system access logs. No Protected Health Information (PHI) is collected or stored.',
      },
      {
        heading: '3. Regulatory Basis',
        text: 'Retention periods are aligned with: ASHRAE Standard 188-2018 (Legionellosis: Risk Management for Building Water Systems), The Joint Commission EC.02.05.07, and FacilityH2O internal documentation standards.',
      },
      {
        heading: '4. Backups',
        text: 'System data is backed up automatically by the hosting provider. Backups are retained for a minimum of 30 days.',
      },
      {
        heading: '5. Data Deletion',
        text: 'Upon decommission of this system, all data will be exported to CSV format and transferred to FacilityH2O Inc. records management prior to deletion. No data will be destroyed without written authorization from the FacilityH2O Inc. Systems Director.',
      },
    ],
  },
  {
    title: '■ System Security Policy',
    effective: 'Effective: April 2026',
    content: [
      {
        heading: '1. Authentication',
        text: 'Each user is assigned individual login credentials. Shared credentials between hospitals or individuals are strictly prohibited. Credentials must be kept confidential.',
      },
      {
        heading: '2. Role-Based Access Control',
        text: 'Access is controlled by role: (a) System Administrator — Antoine Riley, full access to all facilities; (b) Operators — restricted to their assigned hospital only; (c) No cross-facility data visibility for operators under any circumstance.',
      },
      {
        heading: '3. Data Isolation',
        text: 'Each hospital\'s data is logically isolated. The system enforces hospital-level access at the API layer, ensuring no operator can query, view, or export another facility\'s records.',
      },
      {
        heading: '4. Encryption',
        text: 'All data in transit is encrypted via HTTPS/TLS. Access to FacilityH2O via unencrypted HTTP is not permitted in production.',
      },
      {
        heading: '5. Incident Response',
        text: 'Any suspected security incident, unauthorized access, or data breach must be reported immediately to Antoine Riley (antoine.riley@facilityh2o.com) and the FacilityH2O IT security team.',
      },
      {
        heading: '6. Password Policy',
        text: 'Passwords must be a minimum of 8 characters. Users should change their default password upon first login. Passwords should not be reused or shared.',
      },
    ],
  },
  {
    title: '■ Privacy Notice',
    effective: 'Effective: April 2026',
    content: [
      {
        heading: '1. Internal System',
        text: 'FacilityH2O is an internal system operated by FacilityH2O for FacilityH2O Inc.. This notice applies to all authorized users of the system.',
      },
      {
        heading: '2. What Is Logged',
        text: 'The system records: water chemistry readings and entries; user login activity and timestamps; alert acknowledgments; and any notes or comments entered by operators. No patient data or Protected Health Information is collected.',
      },
      {
        heading: '3. Who Can Access Your Activity',
        text: 'Antoine Riley (Systems Director) and designated FacilityH2O management have access to all system activity across all facilities for compliance and oversight purposes.',
      },
      {
        heading: '4. No External Sharing',
        text: 'Data recorded in FacilityH2O is not shared with external parties except as required by law, regulation, or accreditation audit.',
      },
      {
        heading: '5. Security',
        text: 'The system is hosted on a secured cloud platform with HTTPS encryption, role-based access controls, and automated backups.',
      },
      {
        heading: '6. Questions',
        text: 'For questions about this privacy notice or your access, contact Antoine Riley at antoine.riley@facilityh2o.com.',
      },
    ],
  },
];

export default function LegalPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Legal & Policies</h1>
          <p className="text-gray-500 text-sm mt-1">
            FacilityH2O Inc.H2OLog.com · FacilityH2O · FacilityH2O Inc. · Managed by FacilityH2O · Last Updated: April 7, 2026
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-[#003366] px-6 py-4">
                <h2 className="text-white font-bold text-lg">{section.title}</h2>
                <p className="text-blue-200 text-xs mt-0.5">{section.effective}</p>
              </div>
              <div className="px-6 py-5 space-y-5">
                {section.content.map((item) => (
                  <div key={item.heading}>
                    <h3 className="font-semibold text-[#003366] text-sm mb-1.5">{item.heading}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          © 2026 Antoine W. Riley Sr. · FacilityH2O Inc.H2OLog.com · All Rights Reserved · Copyright Registration Filed with the U.S. Copyright Office
        </div>
      </main>
    </div>
  );
}
