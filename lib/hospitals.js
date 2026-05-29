/**
 * FacilityH2O — FacilityH2O Inc. Water Chemistry Portal
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 */
// NOTE: fs/path imports are only used in getHospitalVendor — a server-only function.
// All client components only import HOSPITALS and getHospital which are pure data.
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

export const HOSPITALS = [
  {
    id: 'whc',
    name: 'MedStar Washington Hospital Center',
    code: 'WHC',
    address: '110 Irving Street NW, Washington, DC 20010',
    phone: '202-877-7000',
    image: 'https://www.medstarhealth.org/-/media/project/mho/medstar/news-and-publications/downloadable-images/medstar-washington-hospital-center_110-irving-street-nw_washington-dc.jpg',
    mapUrl: 'https://maps.google.com/?q=110+Irving+Street+NW+Washington+DC+20010',
    vendor: { ...DEFAULT_VENDOR },
    contacts: [
      { title: 'Facilities Director', name: 'Ryan Ollie', office: '847-421-7584', mobile: null, medstarEmail: 'ryan.ollie@facilityh2o.com', crothallEmail: 'ryan.ollie@facilityh2o.com' },
      { title: 'Facilities Technical Director', name: 'VACANT', office: null, mobile: null, medstarEmail: null, crothallEmail: null },
      { title: 'Facilities Manager - Sr AD (Electrical)', name: 'Joe May', office: null, mobile: '301-213-3314', medstarEmail: 'joe.may@facilityh2o.com', crothallEmail: 'joe.may@facilityh2o.com' },
      { title: 'Facility - Sr AD', name: 'Curtis Reece', office: '202-866-4108', mobile: '202-725-6161', medstarEmail: 'curtis.b.reece@facilityh2o.com', crothallEmail: 'curtis.reece@facilityh2o.com' },
      { title: 'Facility - Project Manager', name: 'Lazza Berhe', office: null, mobile: '703-991-9390', medstarEmail: 'lazza.berhe@facilityh2o.com', crothallEmail: 'Lazza.Berhe@FacilityH2O.com' },
      { title: 'Facilities Manager - AD (Chief Engineer)', name: 'VACANT', office: '202-877-6831', mobile: null, medstarEmail: null, crothallEmail: null },
      { title: 'Facilities Supervisor', name: 'Donnie Ellis', office: '202-877-6785', mobile: '240-353-3664', medstarEmail: 'donnie.r.ellis@facilityh2o.com', crothallEmail: 'donnie.ellis@facilityh2o.com' },
      { title: 'Facilities Manager - AD (General Maintenance)', name: 'James Gaston', office: '202-877-2587', mobile: '720-251-0694', medstarEmail: 'james.gaston2@facilityh2o.com', crothallEmail: null },
      { title: 'Facilities Manager - AD (HVAC)', name: 'Bernard Jordan', office: '202-877-2209', mobile: '202-841-8089', medstarEmail: 'bernard.jordan@facilityh2o.com', crothallEmail: 'bernard.jordan@facilityh2o.com' },
      { title: 'Facilities Coordinator', name: 'Danyelle Cooper', office: '202-877-6447', mobile: '202-607-4008', medstarEmail: 'danyelle.cooper@facilityh2o.com', crothallEmail: 'danyelle.cooper@facilityh2o.com' },
    ],
  },
  {
    id: 'somd',
    name: 'MedStar Southern Maryland Hospital Center',
    code: 'SoMD',
    address: '7503 Surratts Road, Clinton, MD 20735',
    phone: '301-877-7000',
    image: 'https://www.medstarhealth.org/-/media/project/mho/medstar/news-and-publications/downloadable-images/medstar-southern-maryland-hospital-center_503-surratts-road_clinton_maryland_2021.jpg',
    mapUrl: 'https://maps.google.com/?q=7503+Surratts+Road+Clinton+MD+20735',
    vendor: { ...DEFAULT_VENDOR },
    contacts: [
      { title: 'Facilities Director', name: 'Brandon Myers', office: '301-877-7276', mobile: '240-346-4038', medstarEmail: 'brandon.myers@facilityh2o.com', crothallEmail: 'Brandon.myers@facilityh2o.com' },
      { title: 'Facilities Manager (AD)', name: 'Michelle Faunce', office: '301-877-4551', mobile: '240-585-3330', medstarEmail: 'michelle.faunce@facilityh2o.com', crothallEmail: 'michelle.faunce@facilityh2o.com' },
      { title: 'Chief Engineer', name: 'Gonza Kirksey', office: null, mobile: '240-521-3799', medstarEmail: 'gonza.kirksey@facilityh2o.com', crothallEmail: 'gonza.kirksey@facilityh2o.com' },
      { title: 'Coordinator', name: 'Sarah Rivera', office: '301-877-4550', mobile: '410-261-9420', medstarEmail: 'sarah.rivera@facilityh2o.com', crothallEmail: 'sarah.rivera@facilityh2o.com' },
    ],
  },
  {
    id: 'harbor',
    name: 'MedStar Harbor Hospital',
    code: 'Harbor',
    address: '3001 South Hanover Street, Baltimore, MD 21225',
    phone: '410-350-3200',
    image: 'https://www.medstarhealth.org/-/media/project/mho/medstar/news-and-publications/downloadable-images/medstar-harbor-hospital_3001-south-hanover-street_baltimore.jpg',
    mapUrl: 'https://maps.google.com/?q=3001+South+Hanover+Street+Baltimore+MD+21225',
    vendor: { ...DEFAULT_VENDOR },
    contacts: [
      { title: 'Facilities Director', name: 'Bob Decker', office: '410-350-2282', mobile: '443-699-3142', medstarEmail: 'bob.e.decker@facilityh2o.com', crothallEmail: 'robert.decker@facilityh2o.com' },
      { title: 'Facilities Manager (AD)', name: 'James Batchelor', office: '410-350-3595', mobile: '443-703-8503', medstarEmail: 'james.batchelor@facilityh2o.com', crothallEmail: 'James.Batchelor@facilityh2o.com' },
      { title: 'Facilities Manager (AD)', name: 'Dennis Sheets', office: '410-350-7205', mobile: '443-962-3589', medstarEmail: 'dennis.e.sheets@facilityh2o.com', crothallEmail: 'dennis.sheets@facilityh2o.com' },
      { title: 'Compliance Administrator', name: 'Joanna Johnson', office: '410-350-2177', mobile: null, medstarEmail: 'joanna.johnson@facilityh2o.com', crothallEmail: 'joanna.johnson@facilityh2o.com' },
      { title: 'Coordinator', name: 'Margaret Redgraves', office: '410-350-3230', mobile: '443-928-5370', medstarEmail: 'margaret.redgraves@facilityh2o.com', crothallEmail: null },
    ],
  },
  {
    id: 'mont',
    name: 'MedStar Montgomery Medical Center',
    code: 'Montgomery',
    address: '18101 Prince Philip Drive, Olney, MD 20832',
    phone: '301-774-8882',
    image: 'https://www.medstarhealth.org/-/media/project/mho/medstar/news-and-publications/downloadable-images/medstar-mongtomery-medical-center_18101-prince-philip-drive_olney_maryland.jpg',
    mapUrl: 'https://maps.google.com/?q=18101+Prince+Philip+Drive+Olney+MD+20832',
    vendor: { ...DEFAULT_VENDOR },
    contacts: [
      { title: 'Facilities Director', name: 'Bob Dickey', office: '301-774-8982', mobile: '202-731-0975', medstarEmail: 'robert.b.dickey@facilityh2o.com', crothallEmail: 'bob.dickey@facilityh2o.com' },
      { title: 'Facilities Manager (AD)', name: 'VACANT', office: '301-774-8929', mobile: null, medstarEmail: null, crothallEmail: null },
      { title: 'Facilities Manager (AD)', name: 'Yawo Doh', office: '301-774-8945', mobile: '301-658-4125', medstarEmail: null, crothallEmail: null },
      { title: 'Coordinator', name: 'Jessica Frank', office: '301-774-8944', mobile: null, medstarEmail: 'jessica.l.frank@facilityh2o.com', crothallEmail: null },
    ],
  },
  {
    id: 'geo',
    name: 'MedStar Georgetown University Hospital',
    code: 'Georgetown',
    address: '3800 Reservoir Road NW, Washington, DC 20007',
    phone: '202-444-2000',
    image: 'https://www.medstarhealth.org/-/media/project/mho/medstar/news-and-publications/downloadable-images/medstar-georgetown-university-hospital_3800-reservoir-road-nw.jpg',
    mapUrl: 'https://maps.google.com/?q=3800+Reservoir+Road+NW+Washington+DC+20007',
    vendor: { ...DEFAULT_VENDOR },
    contacts: [
      { title: 'Facilities Director', name: 'Ryan Boughner', office: '202-444-0517', mobile: '240-274-0808', medstarEmail: 'ryan.boughner@facilityh2o.com', crothallEmail: 'ryan.boughner@facilityh2o.com' },
      { title: 'Senior Assistant Director', name: 'Harris Fleming', office: null, mobile: '301-310-9621', medstarEmail: null, crothallEmail: 'harris.fleming@facilityh2o.com' },
      { title: 'Facilities Manager (AD)', name: 'Benny Blocker', office: '202-444-2982', mobile: '202-794-3879', medstarEmail: 'benny.blocker@facilityh2o.com', crothallEmail: 'benny.blocker@facilityh2o.com' },
      { title: 'Assistant Director', name: 'Sarah Kang', office: null, mobile: '804-833-5800', medstarEmail: 'sarah.kang@facilityh2o.com', crothallEmail: 'sarah.kang@facilityh2o.com' },
      { title: 'Facilities Manager - Projects', name: 'Jeff Taylor', office: '202-444-2983', mobile: '410-572-7832', medstarEmail: 'jeff.taylor@facilityh2o.com', crothallEmail: 'jeff.taylor@facilityh2o.com' },
      { title: 'HVAC Controls Manager', name: 'Juan Zuniga', office: null, mobile: '804-835-4907', medstarEmail: 'juan.zuniga@facilityh2o.com', crothallEmail: 'juan.zuniga@facilityh2o.com' },
      { title: 'Program Manager', name: 'Kassandra Smith', office: null, mobile: '703-346-6803', medstarEmail: 'kassandra.smith@facilityh2o.com', crothallEmail: 'kassandra.smith@facilityh2o.com' },
      { title: 'Facilities Coordinator', name: 'Adrianna Hardaway', office: null, mobile: '540-212-1635', medstarEmail: 'adrianna.hardaway@facilityh2o.com', crothallEmail: 'adrianna.hardaway@facilityh2o.com' },
    ],
  },
  {
    id: 'frank',
    name: 'MedStar Franklin Square Medical Center',
    code: 'Franklin Sq.',
    address: '9000 Franklin Square Drive, Baltimore, MD 21237',
    phone: '443-777-7000',
    image: 'https://www.medstarhealth.org/-/media/project/mho/medstar/news-and-publications/downloadable-images/medstar-franklin-square-medical-center_9000-franklin-square-drive_rosedale_maryland.jpg',
    mapUrl: 'https://maps.google.com/?q=9000+Franklin+Square+Drive+Baltimore+MD+21237',
    vendor: { ...DEFAULT_VENDOR },
    contacts: [
      { title: 'Facilities Director', name: 'Ryan Stoots', office: '443-777-6142', mobile: '443-653-2018', medstarEmail: 'ryan.stoots@facilityh2o.com', crothallEmail: 'ryan.stoots@facilityh2o.com' },
      { title: 'Facilities Manager (AD)', name: 'Kevin Beachy', office: '443-777-8147', mobile: '410-662-2219', medstarEmail: 'kevin.beachy@facilityh2o.com', crothallEmail: 'kevin.beachy@facilityh2o.com' },
      { title: 'Facilities Manager (AD)', name: 'Eric Sparzak', office: '443-777-7508', mobile: '410-299-7374', medstarEmail: 'eric.sparzak@facilityh2o.com', crothallEmail: 'Eric.Sparzak@FacilityH2O.com' },
      { title: 'Coordinator', name: 'Jennifer Shylanski', office: '443-777-7814', mobile: null, medstarEmail: 'jennifer.c.shylanski@facilityh2o.com', crothallEmail: null },
    ],
  },
  {
    id: 'gs',
    name: 'MedStar Good Samaritan Hospital',
    code: 'Good Sam',
    address: '5601 Loch Raven Blvd., Baltimore, MD 21239',
    phone: '443-444-8000',
    image: 'https://www.medstarhealth.org/-/media/project/mho/medstar/news-and-publications/downloadable-images/medstar-good-samaritan-hospital_5601-loch-raven-boulevard_baltimore_2021.jpg',
    mapUrl: 'https://maps.google.com/?q=5601+Loch+Raven+Blvd+Baltimore+MD+21239',
    vendor: { ...DEFAULT_VENDOR },
    contacts: [
      { title: 'Facilities Director', name: 'James Yap', office: '443-444-3961', mobile: '443-703-8972', medstarEmail: 'james.s.yap@facilityh2o.com', crothallEmail: 'james.yap@facilityh2o.com' },
      { title: 'Facilities Manager (AD)', name: 'Mickey Reese', office: '443-444-3968', mobile: '410-913-1198', medstarEmail: 'mickey.reese@facilityh2o.com', crothallEmail: 'mickey.reese@facilityh2o.com' },
      { title: 'Facilities Manager (AD)', name: 'Richard Ernest', office: '443-444-3962', mobile: '202-699-2104', medstarEmail: 'richard.e.ernest@facilityh2o.com', crothallEmail: 'richard.ernest@facilityh2o.com' },
      { title: 'Facilities Coordinator', name: 'Rainier Horn', office: '443-444-3040', mobile: null, medstarEmail: 'rainier.horn@facilityh2o.com', crothallEmail: 'rainier.horn@facilityh2o.com' },
      { title: 'Coordinator', name: 'Heather Hurd', office: '443-444-3960', mobile: null, medstarEmail: 'heather.hurd@facilityh2o.com', crothallEmail: null },
    ],
  },
  {
    id: 'union',
    name: 'MedStar Union Memorial Hospital',
    code: 'Union Mem.',
    address: '201 East University Parkway, Baltimore, MD 21218',
    phone: '410-554-2000',
    image: 'https://www.medstarhealth.org/-/media/project/mho/medstar/news-and-publications/downloadable-images/medstar-union-memorial-hospital_201-east-university-pkwy_baltimore.jpg',
    mapUrl: 'https://maps.google.com/?q=201+East+University+Parkway+Baltimore+MD+21218',
    vendor: { ...DEFAULT_VENDOR },
    contacts: [
      { title: 'Facilities Director', name: 'Sam Mirmirani', office: '410-554-2512', mobile: '703-431-4115', medstarEmail: 'sam.mirmirani@facilityh2o.com', crothallEmail: 'amirhadi.mirmirani@FacilityH2O.com' },
      { title: 'Facilities Manager (AD)', name: 'Christopher Martin', office: '410-554-6799', mobile: '443-690-1665', medstarEmail: 'christopher.f.martin@facilityh2o.com', crothallEmail: 'chris.martin@facilityh2o.com' },
      { title: 'Facilities Manager (AD)', name: 'VACANT', office: '410-554-2513', mobile: null, medstarEmail: null, crothallEmail: null },
      { title: 'Compliance Administrator', name: 'David Poling', office: '410-554-6595', mobile: null, medstarEmail: 'dave.poling@facilityh2o.com', crothallEmail: 'dave.poling@facilityh2o.com' },
      { title: 'Coordinator', name: 'VACANT', office: '410-554-2510', mobile: null, medstarEmail: null, crothallEmail: null },
    ],
  },
  {
    id: 'stm',
    name: "MedStar St. Mary's Hospital",
    code: "St. Mary's",
    address: '25500 Point Lookout Road, Leonardtown, MD 20650',
    phone: '301-475-8981',
    image: 'https://www.medstarhealth.org/-/media/project/mho/medstar/news-and-publications/downloadable-images/medstar-st-marys-hospital_25500-point-lookout-road_leonardtown.jpg',
    mapUrl: 'https://maps.google.com/?q=25500+Point+Lookout+Road+Leonardtown+MD+20650',
    vendor: { ...DEFAULT_VENDOR },
    contacts: [
      { title: 'Facilities Director', name: 'Ramon Solomon', office: '301-475-6013', mobile: null, medstarEmail: 'Ramon.Salomon@MedStar.net', crothallEmail: null },
      { title: 'Facilities Manager (AD)', name: 'Pat Wilkinson', office: '240-434-7011', mobile: '301-904-6767', medstarEmail: 'patrick.wilkinson@facilityh2o.com', crothallEmail: 'pat.wilkinson@facilityh2o.com' },
    ],
  },
  {
    id: 'nrh',
    name: 'MedStar National Rehabilitation Hospital',
    code: 'NRH',
    address: '102 Irving Street NW, Washington, DC 20010',
    phone: '202-877-1000',
    image: 'https://www.medstarhealth.org/-/media/project/mho/medstar/news-and-publications/downloadable-images/medstar-national-rehabilitation-hospital_102-irving-street_washington_dc.jpg',
    mapUrl: 'https://maps.google.com/?q=102+Irving+Street+NW+Washington+DC+20010',
    vendor: { ...DEFAULT_VENDOR },
    contacts: [
      { title: 'Facilities Director', name: 'George Saoutis', office: '202-877-1050', mobile: '202-345-4531', medstarEmail: 'george.saoutis@facilityh2o.com', crothallEmail: 'george.saoutis@facilityh2o.com' },
      { title: 'Facility Supervisor (Mechanic)', name: 'Bobby Pearson', office: '202-877-1057', mobile: '301-440-1437', medstarEmail: 'robert.r.pearson@facilityh2o.com', crothallEmail: 'bobby.pearson@facilityh2o.com' },
      { title: 'Coordinator', name: 'Janelle Elder', office: '202-877-1059', mobile: '301-423-0637', medstarEmail: 'janelle.elder@facilityh2o.com', crothallEmail: null },
    ],
  },
];

export function getHospital(id) {
  return HOSPITALS.find((h) => h.id === id) || null;
}

// Get vendor info: check overrides first, fall back to hospitals.js default
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
