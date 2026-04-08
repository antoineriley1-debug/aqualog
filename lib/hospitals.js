/**
 * FacilityH2O — Water Chemistry Compliance Portal
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O Inc. All rights reserved.
 */
let fs, path;
if (typeof window === 'undefined') {
  fs = require('fs');
  path = require('path');
}

const DEFAULT_VENDOR = {
  company: 'Nalco Water',
  rep: 'Contact your local Nalco rep',
  phone: null,
  emergency: '800-288-0879',
  email: null,
  accountNumber: null,
};

const genericContact = (hospitalEmail) => [
  { title: 'Facilities Director', name: 'TBD', office: null, mobile: null, primaryEmail: `director@${hospitalEmail}`, secondaryEmail: null },
  { title: 'Facilities Manager', name: 'TBD', office: null, mobile: null, primaryEmail: `manager@${hospitalEmail}`, secondaryEmail: null },
  { title: 'Chief Engineer', name: 'TBD', office: null, mobile: null, primaryEmail: `engineer@${hospitalEmail}`, secondaryEmail: null },
  { title: 'Coordinator', name: 'TBD', office: null, mobile: null, primaryEmail: `coordinator@${hospitalEmail}`, secondaryEmail: null },
];

export const HOSPITALS = [
  {
    id: 'whc',
    name: 'Washington Medical Center',
    code: 'WHC',
    address: '1600 Pennsylvania Ave NW, Washington, DC 20001',
    phone: '202-555-1001',
    image: null,
    mapUrl: 'https://maps.google.com/?q=1600+Pennsylvania+Ave+NW+Washington+DC+20001',
    vendor: { ...DEFAULT_VENDOR },
    contacts: genericContact('whc.facilityh2o.com'),
  },
  {
    id: 'somd',
    name: 'Lincoln Health Pavilion',
    code: 'Lincoln',
    address: '1 Lincoln Square, Springfield, IL 62701',
    phone: '217-555-1002',
    image: null,
    mapUrl: 'https://maps.google.com/?q=1+Lincoln+Square+Springfield+IL+62701',
    vendor: { ...DEFAULT_VENDOR },
    contacts: genericContact('lincoln.facilityh2o.com'),
  },
  {
    id: 'harbor',
    name: 'Jefferson Memorial Hospital',
    code: 'Jefferson',
    address: '400 Jefferson Dr SW, Washington, DC 20024',
    phone: '202-555-1003',
    image: null,
    mapUrl: 'https://maps.google.com/?q=400+Jefferson+Dr+SW+Washington+DC+20024',
    vendor: { ...DEFAULT_VENDOR },
    contacts: genericContact('jefferson.facilityh2o.com'),
  },
  {
    id: 'mont',
    name: 'Madison Community Hospital',
    code: 'Madison',
    address: '200 Madison Blvd, Madison, WI 53703',
    phone: '608-555-1004',
    image: null,
    mapUrl: 'https://maps.google.com/?q=200+Madison+Blvd+Madison+WI+53703',
    vendor: { ...DEFAULT_VENDOR },
    contacts: genericContact('madison.facilityh2o.com'),
  },
  {
    id: 'geo',
    name: 'Adams Regional Medical Center',
    code: 'Adams',
    address: '55 Adams Street, Quincy, MA 02169',
    phone: '617-555-1005',
    image: null,
    mapUrl: 'https://maps.google.com/?q=55+Adams+Street+Quincy+MA+02169',
    vendor: { ...DEFAULT_VENDOR },
    contacts: genericContact('adams.facilityh2o.com'),
  },
  {
    id: 'frank',
    name: 'Monroe General Hospital',
    code: 'Monroe',
    address: '825 Monroe Ave, Rochester, NY 14607',
    phone: '585-555-1006',
    image: null,
    mapUrl: 'https://maps.google.com/?q=825+Monroe+Ave+Rochester+NY+14607',
    vendor: { ...DEFAULT_VENDOR },
    contacts: genericContact('monroe.facilityh2o.com'),
  },
  {
    id: 'gs',
    name: 'Jackson Memorial Center',
    code: 'Jackson',
    address: '1611 Jackson Ave, Nashville, TN 37203',
    phone: '615-555-1007',
    image: null,
    mapUrl: 'https://maps.google.com/?q=1611+Jackson+Ave+Nashville+TN+37203',
    vendor: { ...DEFAULT_VENDOR },
    contacts: genericContact('jackson.facilityh2o.com'),
  },
  {
    id: 'union',
    name: 'Polk Health System',
    code: 'Polk',
    address: '301 Polk Street, Nashville, TN 37208',
    phone: '615-555-1008',
    image: null,
    mapUrl: 'https://maps.google.com/?q=301+Polk+Street+Nashville+TN+37208',
    vendor: { ...DEFAULT_VENDOR },
    contacts: genericContact('polk.facilityh2o.com'),
  },
  {
    id: 'stm',
    name: 'Tyler Medical Institute',
    code: 'Tyler',
    address: '700 Tyler Road, Richmond, VA 23220',
    phone: '804-555-1009',
    image: null,
    mapUrl: 'https://maps.google.com/?q=700+Tyler+Road+Richmond+VA+23220',
    vendor: { ...DEFAULT_VENDOR },
    contacts: genericContact('tyler.facilityh2o.com'),
  },
  {
    id: 'nrh',
    name: 'Harrison Rehabilitation Center',
    code: 'Harrison',
    address: '9 Harrison Blvd, North Bend, OH 45052',
    phone: '513-555-1010',
    image: null,
    mapUrl: 'https://maps.google.com/?q=9+Harrison+Blvd+North+Bend+OH+45052',
    vendor: { ...DEFAULT_VENDOR },
    contacts: genericContact('harrison.facilityh2o.com'),
  },
];

export function getHospital(id) {
  return HOSPITALS.find((h) => h.id === id) || null;
}

export function getHospitalVendor(hospitalId) {
  try {
    const overridesPath = path.join(process.cwd(), 'data', 'hospital-overrides.json');
    if (fs.existsSync(overridesPath)) {
      const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      if (overrides[hospitalId]?.vendor) {
        return overrides[hospitalId].vendor;
      }
    }
  } catch {
    // fall through
  }
  const hospital = getHospital(hospitalId);
  return hospital?.vendor || { ...DEFAULT_VENDOR };
}
