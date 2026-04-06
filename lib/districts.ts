export interface District {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
}

export interface PopularLocation {
  name: string;
  lat: number;
  lng: number;
  district: string;
}

export const RWANDA_DISTRICTS: District[] = [
  // Kigali City
  { id: 'gasabo',     name: 'Gasabo',     province: 'Kigali City',       lat: -1.8978, lng: 30.1128 },
  { id: 'kicukiro',   name: 'Kicukiro',   province: 'Kigali City',       lat: -1.9706, lng: 30.1044 },
  { id: 'nyarugenge', name: 'Nyarugenge', province: 'Kigali City',       lat: -1.9441, lng: 30.0619 },

  // Northern Province
  { id: 'burera',     name: 'Burera',     province: 'Northern Province', lat: -1.4700, lng: 29.8200 },
  { id: 'gakenke',    name: 'Gakenke',    province: 'Northern Province', lat: -1.6900, lng: 29.7800 },
  { id: 'gicumbi',    name: 'Gicumbi',    province: 'Northern Province', lat: -1.5800, lng: 30.0600 },
  { id: 'musanze',    name: 'Musanze',    province: 'Northern Province', lat: -1.4994, lng: 29.6340 },
  { id: 'rulindo',    name: 'Rulindo',    province: 'Northern Province', lat: -1.7300, lng: 29.9600 },

  // Southern Province
  { id: 'gisagara',   name: 'Gisagara',   province: 'Southern Province', lat: -2.6200, lng: 29.8300 },
  { id: 'huye',       name: 'Huye',       province: 'Southern Province', lat: -2.5963, lng: 29.7394 },
  { id: 'kamonyi',    name: 'Kamonyi',    province: 'Southern Province', lat: -2.0100, lng: 29.8800 },
  { id: 'muhanga',    name: 'Muhanga',    province: 'Southern Province', lat: -2.0833, lng: 29.7500 },
  { id: 'nyamagabe',  name: 'Nyamagabe',  province: 'Southern Province', lat: -2.4500, lng: 29.4800 },
  { id: 'nyanza',     name: 'Nyanza',     province: 'Southern Province', lat: -2.3500, lng: 29.7400 },
  { id: 'nyaruguru',  name: 'Nyaruguru',  province: 'Southern Province', lat: -2.7100, lng: 29.5400 },
  { id: 'ruhango',    name: 'Ruhango',    province: 'Southern Province', lat: -2.2300, lng: 29.7800 },

  // Eastern Province
  { id: 'bugesera',   name: 'Bugesera',   province: 'Eastern Province',  lat: -2.1600, lng: 30.2200 },
  { id: 'gatsibo',    name: 'Gatsibo',    province: 'Eastern Province',  lat: -1.5900, lng: 30.4200 },
  { id: 'kayonza',    name: 'Kayonza',    province: 'Eastern Province',  lat: -1.8900, lng: 30.6500 },
  { id: 'kirehe',     name: 'Kirehe',     province: 'Eastern Province',  lat: -2.1600, lng: 30.6600 },
  { id: 'ngoma',      name: 'Ngoma',      province: 'Eastern Province',  lat: -2.1500, lng: 30.4800 },
  { id: 'nyagatare',  name: 'Nyagatare',  province: 'Eastern Province',  lat: -1.2965, lng: 30.3258 },
  { id: 'rwamagana',  name: 'Rwamagana',  province: 'Eastern Province',  lat: -1.9488, lng: 30.4346 },

  // Western Province
  { id: 'karongi',    name: 'Karongi',    province: 'Western Province',  lat: -2.0700, lng: 29.3500 },
  { id: 'ngororero',  name: 'Ngororero',  province: 'Western Province',  lat: -1.8700, lng: 29.5300 },
  { id: 'nyabihu',    name: 'Nyabihu',    province: 'Western Province',  lat: -1.6700, lng: 29.5000 },
  { id: 'nyamasheke', name: 'Nyamasheke', province: 'Western Province',  lat: -2.3400, lng: 29.1600 },
  { id: 'rubavu',     name: 'Rubavu',     province: 'Western Province',  lat: -1.6767, lng: 29.2597 },
  { id: 'rusizi',     name: 'Rusizi',     province: 'Western Province',  lat: -2.4800, lng: 28.9000 },
  { id: 'rutsiro',    name: 'Rutsiro',    province: 'Western Province',  lat: -1.9400, lng: 29.4400 },
];

export const PROVINCES = RWANDA_DISTRICTS.map(d => d.province).filter(
  (p, i, arr) => arr.indexOf(p) === i
);

export const DISTRICTS_BY_PROVINCE = PROVINCES.reduce((acc, province) => {
  acc[province] = RWANDA_DISTRICTS.filter(d => d.province === province);
  return acc;
}, {} as Record<string, District[]>);

export const POPULAR_LOCATIONS: PopularLocation[] = [
  { name: 'Kigali International Airport (KIA)', lat: -1.9686, lng: 30.1395, district: 'gasabo' },
  { name: 'Kigali Convention Centre',           lat: -1.9540, lng: 30.0934, district: 'gasabo' },
  { name: 'Nyamirambo, Kigali',                 lat: -1.9835, lng: 30.0333, district: 'nyarugenge' },
  { name: 'Kimironko Market, Kigali',            lat: -1.9393, lng: 30.1120, district: 'gasabo' },
  { name: 'Volcanoes National Park',             lat: -1.4900, lng: 29.5500, district: 'musanze' },
  { name: 'Nyungwe Forest',                      lat: -2.4800, lng: 29.2000, district: 'nyamasheke' },
  { name: 'Lake Kivu Shore, Rubavu',             lat: -1.6800, lng: 29.2500, district: 'rubavu' },
  { name: 'Akagera National Park',               lat: -1.6800, lng: 30.7000, district: 'kayonza' },
  { name: 'Huye (Butare) City Centre',           lat: -2.5963, lng: 29.7394, district: 'huye' },
  { name: 'Musanze City Centre',                 lat: -1.4994, lng: 29.6340, district: 'musanze' },
];
