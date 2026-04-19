import { config } from 'dotenv';
config(); // load .env before PrismaClient initialises

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { addDays, subDays } from 'date-fns';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Photo helpers ────────────────────────────────────────────────────────
function u(id: string) {
  return `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=60`;
}
function p(id: number) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`;
}

// 5 Unsplash IDs confirmed working; 15 replaced with verified Pexels photos
const photos = {
  // ✓ Confirmed-working Unsplash IDs — keep as-is
  pajero:     [u('1519641471654-76ce0107ad1b')],
  polo:       [u('1471444928139-48c5bf5173f8')],
  hiace:      [u('1570125909232-eb263c188f7e')],
  coaster:    [u('1544620347-c4fd4a3d5957')],

  // ✓ Verified Pexels photos
  rav4:       [p(9615358)],               // "A Blue Toyota RAV4"
  prado:      [p(19758141)],              // "Black Toyota Land Cruiser Prado on Road"
  fielder:    [p(5421969)],               // "A Green Toyota Corolla Parked Near Houses" (Fielder = Corolla wagon)
  corollacx:  [p(30486410)],              // "Toyota SUV in Oregon Desert Landscape"
  sportage:   [p(30587817), p(20400581)], // "Stylish Kia Sportage SUV at Sunset" + "Kia Sportage Cars Offroad"
  tucson:     [p(12007134), p(1134857)],  // "Hyundai Tucson Dirt Road" + "Tucson Golden Hour"
  tiguan:     [p(14038277)],              // "Back View of Volkswagen Tiguan"
  c200:       [p(10224502)],              // "A Black Mercedes Benz C Class on Road"
  lcv8:       [p(9420592)],               // "A Black Toyota Land Cruiser LC80"
  hilux:      [p(19143577)],              // "Close up of Toyota Hilux at Sunset"
  forester:   [p(19868891)],              // "Black Subaru Forester"
  xtrail:     [p(11798451)],              // "A Parked Red Nissan Rogue" (Rogue = X-Trail globally)
  byd:        [p(9800029)],               // "Electric Cars Charging on Stations"
  crv:        [p(13885915)],              // "Honda CR-V on Road among Sequoias"
  outlander:  [p(2676096)],               // "Mitsubishi Montero Sport Parked on Grass Field"
  axio:       [p(9544521)],               // "White Car on the Roadside"
};

async function main() {
  console.log('🌱 Seeding database…');

  // ── Deletions (leaf → root, respecting FK constraints) ──────────────────

  // New tables (may not exist in all environments — skip gracefully)
  const newTables = [
    () => prisma.notificationLog.deleteMany(),
    () => prisma.bookingExtension.deleteMany(),
    () => prisma.inspectionPhoto.deleteMany(),
    () => prisma.dispute.deleteMany(),
    () => prisma.refund.deleteMany(),
    () => prisma.blockedDate.deleteMany(),
    () => prisma.carImage.deleteMany(),
  ];
  for (const del of newTables) {
    try { await del(); } catch { /* table not yet migrated — skip */ }
  }

  // Original tables
  await prisma.salesEnquiry.deleteMany();
  await prisma.salesListing.deleteMany();
  await prisma.buyEarnListing.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.insurance.deleteMany();
  await prisma.bookingHold.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.carAvailability.deleteMany();
  await prisma.car.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.message.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  const password = await hash('password123', 12);

  // ── Users ──────────────────────────────────────────────────────────────

  const jean = await prisma.user.create({ data: {
    name: 'Jean-Pierre Habimana', email: 'jean@gari.rw', password,
    phone: '+250788100001', role: 'HOST',
    nidaVerified: true, licenseVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=11', trustScore: 92,
  }});

  const immaculee = await prisma.user.create({ data: {
    name: 'Immaculée Uwimana', email: 'imma@gari.rw', password,
    phone: '+250788100002', role: 'HOST',
    nidaVerified: true, licenseVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=48', trustScore: 88,
  }});

  const david = await prisma.user.create({ data: {
    name: 'David Nkurunziza', email: 'david@gari.rw', password,
    phone: '+250788100003', role: 'BOTH',
    nidaVerified: true, licenseVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=22', trustScore: 95,
  }});

  const claudine = await prisma.user.create({ data: {
    name: 'Claudine Mukamana', email: 'claudine@gari.rw', password,
    phone: '+250788100004', role: 'HOST',
    nidaVerified: true, licenseVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=44', trustScore: 85,
  }});

  const renter = await prisma.user.create({ data: {
    name: 'Patrick Mugisha', email: 'renter@gari.rw', password,
    phone: '+250788100010', role: 'RENTER',
    nidaVerified: true, licenseVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=33',
  }});

  const renter2 = await prisma.user.create({ data: {
    name: 'Amina Kagabo', email: 'amina@gari.rw', password,
    phone: '+250788100011', role: 'RENTER',
    nidaVerified: true, licenseVerified: true,
    avatar: 'https://i.pravatar.cc/150?img=5',
  }});

  await prisma.user.create({ data: {
    name: 'Gari Admin', email: 'admin@gari.rw', password, role: 'ADMIN',
    nidaVerified: true, licenseVerified: true,
  }});

  console.log('✅ Users created');

  // ── Rental Cars ─────────────────────────────────────────────────────────

  // 01 — Toyota RAV4 2021
  const rav4 = await prisma.car.create({ data: {
    hostId: jean.id, make: 'Toyota', model: 'RAV4', year: 2021,
    type: 'SUV_4X4', listingType: 'FLEET',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 75000, depositAmount: 100000,
    driverAvailable: true, driverPricePerDay: 20000,
    description:
      'Toyota RAV4 2021 in excellent condition. Automatic transmission, ' +
      '5 comfortable seats, ideal for city driving and upcountry trips. ' +
      'Recently serviced. Air conditioning works perfectly. ' +
      'Available for airport pickup at KIA.',
    features: ['4WD', 'Air Conditioning', 'GPS Tracker', 'First Aid Kit', 'Bluetooth', 'Backup Camera'],
    photos: photos.rav4,
    district: 'gasabo', exactLocation: 'KG 11 Ave, Gasabo, Kigali',
    lat: -1.9100, lng: 30.0900,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 250, fuelPolicy: 'Return Full',
    rating: 4.9, totalTrips: 87,
    isSafariCapable: false,
  }});

  // 02 — Kia Sportage 2022
  const sportage = await prisma.car.create({ data: {
    hostId: immaculee.id, make: 'Kia', model: 'Sportage', year: 2022,
    type: 'SUV_4X4', listingType: 'P2P',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 65000, depositAmount: 80000,
    driverAvailable: true, driverPricePerDay: 20000,
    description:
      'Kia Sportage 2022 — one of the most popular SUVs in Kigali. ' +
      'Spacious interior, modern infotainment system with Apple CarPlay. ' +
      'Excellent fuel economy for a 2.0L SUV. Perfect for business travel ' +
      'or weekend trips to Musanze or Rubavu.',
    features: ['Air Conditioning', 'GPS Tracker', 'Bluetooth', 'Apple CarPlay', 'Backup Camera', 'Lane Assist'],
    photos: photos.sportage,
    district: 'kicukiro', exactLocation: 'KG 572 St, Kicukiro, Kigali',
    lat: -1.9706, lng: 30.1044,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 250, fuelPolicy: 'Return Full',
    rating: 4.8, totalTrips: 34,
    isSafariCapable: false,
  }});

  // 03 — Toyota Land Cruiser Prado 2020
  const prado = await prisma.car.create({ data: {
    hostId: immaculee.id, make: 'Toyota', model: 'Land Cruiser Prado', year: 2020,
    type: 'SUV_4X4', listingType: 'P2P',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL',
    pricePerDay: 130000, depositAmount: 200000,
    driverAvailable: true, driverPricePerDay: 25000,
    description:
      'Toyota Land Cruiser Prado 2020 — the preferred vehicle for gorilla ' +
      'trekking, Akagera safaris, and long-distance upcountry travel. ' +
      '4WD with diff lock, 2.8L diesel engine. Seats 7 comfortably. ' +
      'This is the vehicle NGOs, UN staff, and serious travellers choose. ' +
      'Available for pickup at Kigali Airport.',
    features: ['4WD', 'Air Conditioning', 'GPS Tracker', 'First Aid Kit', '7 Seats', 'Roof Rack', 'Diff Lock', 'Cruise Control'],
    photos: photos.prado,
    district: 'musanze', exactLocation: 'Musanze Town Centre, Northern Province',
    lat: -1.4994, lng: 29.6340,
    isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 300, fuelPolicy: 'Return Full',
    rating: 5.0, totalTrips: 124,
    isSafariCapable: true,
  }});

  // 04 — Toyota Fielder 2019
  await prisma.car.create({ data: {
    hostId: jean.id, make: 'Toyota', model: 'Fielder', year: 2019,
    type: 'ECONOMY', listingType: 'P2P',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 35000, depositAmount: 50000,
    driverAvailable: true, driverPricePerDay: 15000,
    description:
      "Toyota Fielder 2019 — Rwanda's most popular everyday car. " +
      'Reliable 1.5L engine, excellent fuel economy (14km/L). ' +
      'Spacious boot, comfortable for 4-5 passengers. ' +
      'Perfect for city errands, airport runs, and short upcountry trips. ' +
      'The most affordable way to have your own wheels in Kigali.',
    features: ['Air Conditioning', 'Bluetooth', 'USB Charging'],
    photos: photos.fielder,
    district: 'kicukiro', exactLocation: 'KK 15 Ave, Kicukiro, Kigali',
    lat: -1.9706, lng: 30.1044,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, smokingAllowed: false,
    mileageLimit: 200, fuelPolicy: 'Return Full',
    rating: 4.9, totalTrips: 58,
    isSafariCapable: false,
  }});

  // 05 — Toyota Corolla Cross 2022
  await prisma.car.create({ data: {
    hostId: david.id, make: 'Toyota', model: 'Corolla Cross', year: 2022,
    type: 'SUV_4X4', listingType: 'FLEET',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 60000, depositAmount: 80000,
    driverAvailable: true, driverPricePerDay: 18000,
    description:
      'Toyota Corolla Cross 2022 — the newer compact crossover that sits ' +
      'between the Fielder and the RAV4. Higher ground clearance than a ' +
      'sedan, more fuel-efficient than a full SUV. ' +
      '1.8L engine, very smooth automatic gearbox. ' +
      'Popular with business travellers and families.',
    features: ['Air Conditioning', 'GPS Tracker', 'Bluetooth', 'Backup Camera', 'Keyless Entry'],
    photos: photos.corollacx,
    district: 'gasabo', exactLocation: 'KG 7 Ave, Gasabo, Kigali',
    lat: -1.9100, lng: 30.0900,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 250, fuelPolicy: 'Return Full',
    rating: 4.8, totalTrips: 29,
    isSafariCapable: false,
  }});

  // 06 — Hyundai Tucson 2021
  await prisma.car.create({ data: {
    hostId: claudine.id, make: 'Hyundai', model: 'Tucson', year: 2021,
    type: 'SUV_4X4', listingType: 'P2P',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 68000, depositAmount: 80000,
    driverAvailable: true, driverPricePerDay: 20000,
    description:
      'Hyundai Tucson 2021 in midnight blue. One of the most stylish ' +
      'mid-size SUVs on Kigali roads. Panoramic sunroof, premium interior. ' +
      '2.0L petrol engine, smooth 6-speed automatic. ' +
      'Great for business meetings or weekend getaways to Rubavu.',
    features: ['Air Conditioning', 'GPS Tracker', 'Panoramic Sunroof', 'Heated Seats', 'Bluetooth', 'Wireless Charging'],
    photos: photos.tucson,
    district: 'gasabo', exactLocation: 'KN 3 Rd, Gasabo, Kigali',
    lat: -1.9100, lng: 30.0900,
    isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 250, fuelPolicy: 'Return Full',
    rating: 4.9, totalTrips: 41,
    isSafariCapable: false,
  }});

  // 07 — Mitsubishi Pajero 2020
  await prisma.car.create({ data: {
    hostId: david.id, make: 'Mitsubishi', model: 'Pajero', year: 2020,
    type: 'SUV_4X4', listingType: 'FLEET',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL',
    pricePerDay: 110000, depositAmount: 150000,
    driverAvailable: true, driverPricePerDay: 25000,
    description:
      "Mitsubishi Pajero 2020 — a serious off-road vehicle built for " +
      "Rwanda's toughest terrain. 3.2L diesel engine, Super Select 4WD " +
      'system, 7 seats. Extensively used by NGOs and tour operators. ' +
      'Handles the Volcanoes NP tracks and Akagera dirt roads with ease. ' +
      'Driver available with full knowledge of Northern/Western routes.',
    features: ['4WD', 'Air Conditioning', 'GPS Tracker', 'First Aid Kit', '7 Seats', 'Super Select 4WD', 'Roof Rack'],
    photos: photos.pajero,
    district: 'musanze', exactLocation: 'Musanze, Northern Province',
    lat: -1.4994, lng: 29.6340,
    isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 300, fuelPolicy: 'Return Full',
    rating: 4.9, totalTrips: 67,
    isSafariCapable: true,
  }});

  // 08 — Volkswagen Polo 2021
  await prisma.car.create({ data: {
    hostId: jean.id, make: 'Volkswagen', model: 'Polo', year: 2021,
    type: 'ECONOMY', listingType: 'P2P',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 38000, depositAmount: 50000,
    driverAvailable: true, driverPricePerDay: 15000,
    description:
      'Volkswagen Polo 2021 — compact, efficient, easy to park in Kigali. ' +
      '1.0L TSI turbocharged petrol engine delivers better performance ' +
      'than its size suggests. Excellent fuel economy at 18km/L. ' +
      'Perfect for solo travellers and couples exploring Kigali.',
    features: ['Air Conditioning', 'Bluetooth', 'USB Port', 'Parking Sensors'],
    photos: photos.polo,
    district: 'nyarugenge', exactLocation: 'KN 5 Rd, Nyarugenge, Kigali',
    lat: -1.9450, lng: 30.0600,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, smokingAllowed: false,
    mileageLimit: 200, fuelPolicy: 'Return Full',
    rating: 4.7, totalTrips: 23,
    isSafariCapable: false,
  }});

  // 09 — Volkswagen Tiguan 2022
  await prisma.car.create({ data: {
    hostId: claudine.id, make: 'Volkswagen', model: 'Tiguan', year: 2022,
    type: 'SUV_4X4', listingType: 'FLEET',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 78000, depositAmount: 100000,
    driverAvailable: true, driverPricePerDay: 20000,
    description:
      'Volkswagen Tiguan 2022 in metallic grey. Premium European SUV ' +
      'with a beautifully crafted interior. 2.0L TSI engine, 7-speed ' +
      'DSG automatic. Noticeably smoother ride than Japanese SUVs. ' +
      'Popular with expats and business executives. ' +
      'Panoramic sunroof makes city driving a pleasure.',
    features: ['Air Conditioning', 'GPS Tracker', 'Panoramic Roof', 'Bluetooth', 'Automatic Parking', 'Adaptive Cruise Control'],
    photos: photos.tiguan,
    district: 'gasabo', exactLocation: 'KG 9 Ave, Gasabo, Kigali',
    lat: -1.9100, lng: 30.0900,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 250, fuelPolicy: 'Return Full',
    rating: 4.8, totalTrips: 19,
    isSafariCapable: false,
  }});

  // 10 — Mercedes-Benz C200 2022
  const c200 = await prisma.car.create({ data: {
    hostId: david.id, make: 'Mercedes-Benz', model: 'C200', year: 2022,
    type: 'EXECUTIVE', listingType: 'FLEET',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 150000, depositAmount: 300000,
    driverAvailable: true, driverPricePerDay: 30000,
    description:
      'Mercedes-Benz C200 2022 — the most refined executive sedan ' +
      'available on Gari. 1.5L turbo petrol with EQ Boost mild hybrid. ' +
      'MBUX touchscreen, 64-colour ambient lighting, massaging seats. ' +
      'The car that makes the right impression at corporate meetings, ' +
      'diplomatic functions, and VIP airport transfers. ' +
      'Professional chauffeur available for full-day hire.',
    features: ['Air Conditioning', 'GPS', 'Heated Leather Seats', 'MBUX Infotainment', 'Ambient Lighting', '360° Camera', 'Wireless Charging', 'Burmester Sound'],
    photos: photos.c200,
    district: 'nyarugenge', exactLocation: 'KN 3 Rd, Nyarugenge, Kigali',
    lat: -1.9450, lng: 30.0600,
    isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 200, fuelPolicy: 'Return Full',
    rating: 5.0, totalTrips: 45,
    isSafariCapable: false,
  }});

  // 11 — Toyota Land Cruiser V8 2022
  await prisma.car.create({ data: {
    hostId: david.id, make: 'Toyota', model: 'Land Cruiser V8', year: 2022,
    type: 'EXECUTIVE', listingType: 'FLEET',
    seats: 8, transmission: 'AUTOMATIC', fuel: 'DIESEL',
    pricePerDay: 200000, depositAmount: 400000,
    driverAvailable: true, driverPricePerDay: 30000,
    description:
      "Toyota Land Cruiser V8 2022 — the flagship of the Gari fleet. " +
      "4.5L V8 twin-turbo diesel, 8 seats, built for the most demanding " +
      "expeditions. Used by heads of state, UN delegations, and premium " +
      "safari operators across East Africa. " +
      "Multi-terrain system handles everything from Kigali tarmac to " +
      "Akagera's roughest bush tracks. Includes professional driver.",
    features: ['4WD', 'Air Conditioning', 'GPS Tracker', 'First Aid Kit', '8 Seats', 'Multi-Terrain Select', 'Crawl Control', 'Refrigerator', 'Premium Sound'],
    photos: photos.lcv8,
    district: 'gasabo', exactLocation: 'KG 11 Ave, Gasabo, Kigali',
    lat: -1.9100, lng: 30.0900,
    isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 300, fuelPolicy: 'Return Full',
    rating: 5.0, totalTrips: 45,
    isSafariCapable: true,
  }});

  // 12 — Toyota Hilux 2021 Double Cab
  const hilux = await prisma.car.create({ data: {
    hostId: jean.id, make: 'Toyota', model: 'Hilux', year: 2021,
    type: 'PICKUP', listingType: 'FLEET',
    seats: 5, transmission: 'MANUAL', fuel: 'DIESEL',
    pricePerDay: 90000, depositAmount: 150000,
    driverAvailable: true, driverPricePerDay: 22000,
    description:
      'Toyota Hilux 2021 Double Cab — the workhorse of Rwanda. ' +
      '2.8L diesel engine, 4WD low range, raised suspension. ' +
      'Tow bar rated for 3.5 tonnes. Perfect for construction projects, ' +
      'agricultural logistics, and adventure trips where paved roads end. ' +
      'Open cargo bed can carry equipment, luggage, or supplies.',
    features: ['4WD', 'Air Conditioning', 'First Aid Kit', 'Tow Bar', 'Cargo Bed', 'Bull Bar', 'Snorkel'],
    photos: photos.hilux,
    district: 'kicukiro', exactLocation: 'KK 15 Rd, Kicukiro, Kigali',
    lat: -1.9706, lng: 30.1044,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, smokingAllowed: false,
    mileageLimit: 400, fuelPolicy: 'Return Full',
    rating: 4.8, totalTrips: 52,
    isSafariCapable: true,
  }});

  // 13 — Subaru Forester 2020
  await prisma.car.create({ data: {
    hostId: immaculee.id, make: 'Subaru', model: 'Forester', year: 2020,
    type: 'SUV_4X4', listingType: 'P2P',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 72000, depositAmount: 90000,
    driverAvailable: true, driverPricePerDay: 20000,
    description:
      "Subaru Forester 2020 with Subaru's legendary Symmetrical AWD. " +
      '2.0L boxer engine, continuously variable transmission. ' +
      'EyeSight driver assist system for safety. ' +
      'Higher seating position than most cars in its class. ' +
      "A favourite among Kigali's expat community and outdoor enthusiasts.",
    features: ['AWD', 'Air Conditioning', 'GPS Tracker', 'EyeSight Safety', 'Panoramic Sunroof', 'Symmetrical AWD'],
    photos: photos.forester,
    district: 'gasabo', exactLocation: 'KG 14 Ave, Gasabo, Kigali',
    lat: -1.9100, lng: 30.0900,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 250, fuelPolicy: 'Return Full',
    rating: 4.8, totalTrips: 31,
    isSafariCapable: false,
  }});

  // 14 — Nissan X-Trail 2020
  await prisma.car.create({ data: {
    hostId: claudine.id, make: 'Nissan', model: 'X-Trail', year: 2020,
    type: 'SUV_4X4', listingType: 'P2P',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 70000, depositAmount: 90000,
    driverAvailable: true, driverPricePerDay: 20000,
    description:
      'Nissan X-Trail 2020 — 7-seat family SUV, practical and reliable. ' +
      '2.5L petrol engine, smooth CVT gearbox. Third row folds flat for ' +
      'extra luggage space. Around View Monitor for easy parking. ' +
      'A popular choice for families and small groups. ' +
      'Available for airport pickup with advance notice.',
    features: ['4WD', 'Air Conditioning', 'GPS Tracker', '7 Seats', 'Bluetooth', 'Around View Monitor'],
    photos: photos.xtrail,
    district: 'nyarugenge', exactLocation: 'KN 1 Rd, Nyarugenge, Kigali',
    lat: -1.9450, lng: 30.0600,
    isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 250, fuelPolicy: 'Return Full',
    rating: 4.7, totalTrips: 26,
    isSafariCapable: false,
  }});

  // 15 — BYD Atto 3 2023 (Electric)
  await prisma.car.create({ data: {
    hostId: claudine.id, make: 'BYD', model: 'Atto 3', year: 2023,
    type: 'SUV_4X4', listingType: 'P2P',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'ELECTRIC',
    pricePerDay: 80000, depositAmount: 120000,
    driverAvailable: true, driverPricePerDay: 20000,
    description:
      "BYD Atto 3 2023 — Rwanda's future arriving now. Fully electric, " +
      'zero emissions, 400+ km range. The most advanced technology of any ' +
      'car on Gari: 15.6" rotating touchscreen, ambient lighting, ' +
      'Vehicle-to-Load capability (use it as a power source). ' +
      "Charges overnight at the host's location before your trip. " +
      'The cleanest, most modern way to explore Kigali.',
    features: ['Electric Vehicle', 'Air Conditioning', 'GPS', 'Rotating Touchscreen', 'V2L Power Export', 'Fast Charge', 'Ambient Lighting'],
    photos: photos.byd,
    district: 'gasabo', exactLocation: 'KG 200 St, Gasabo, Kigali',
    lat: -1.9100, lng: 30.0900,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 300, fuelPolicy: 'Return Charged',
    rating: 4.9, totalTrips: 12,
    isSafariCapable: false,
  }});

  // 16 — Toyota Hiace 14-Seater 2020
  const hiace = await prisma.car.create({ data: {
    hostId: david.id, make: 'Toyota', model: 'Hiace (14-Seater)', year: 2020,
    type: 'MINIBUS', listingType: 'FLEET',
    seats: 14, transmission: 'MANUAL', fuel: 'DIESEL',
    pricePerDay: 130000, depositAmount: 200000,
    driverAvailable: true, driverPricePerDay: 25000,
    description:
      'Toyota Hiace 2020 — 14-seater minibus, the standard for group ' +
      'transport in Rwanda. Air-conditioned, comfortable captain seats, ' +
      'overhead luggage rack. Used for corporate transfers, ' +
      'school trips, church groups, and wedding transport. ' +
      'Driver mandatory. Covers all 30 districts.',
    features: ['Air Conditioning', 'First Aid Kit', '14 Seats', 'Luggage Rack', 'Tinted Windows', 'PA System'],
    photos: photos.hiace,
    district: 'rubavu', exactLocation: 'Rubavu Town Centre, Western Province',
    lat: -1.6767, lng: 29.2597,
    isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, smokingAllowed: false,
    mileageLimit: 500, fuelPolicy: 'Return Full',
    rating: 4.8, totalTrips: 76,
    isSafariCapable: false,
  }});

  // 17 — Toyota Coaster 30-Seater 2019
  await prisma.car.create({ data: {
    hostId: jean.id, make: 'Toyota', model: 'Coaster (30-Seater)', year: 2019,
    type: 'MINIBUS', listingType: 'FLEET',
    seats: 30, transmission: 'MANUAL', fuel: 'DIESEL',
    pricePerDay: 280000, depositAmount: 300000,
    driverAvailable: true, driverPricePerDay: 35000,
    description:
      'Toyota Coaster 2019 — 30-seater full coach. The right vehicle ' +
      'for large groups: conferences, company events, pilgrimages, ' +
      'wedding parties, and sports team travel. ' +
      'Reclining seats, PA microphone, luggage hold underneath. ' +
      'Professional driver with clean Class B licence included. ' +
      'Available for single-day hire or multi-day tours across Rwanda.',
    features: ['Air Conditioning', 'First Aid Kit', '30 Reclining Seats', 'Luggage Hold', 'PA Microphone', 'Entertainment Screen'],
    photos: photos.coaster,
    district: 'gasabo', exactLocation: 'KG 11 Ave, Gasabo, Kigali',
    lat: -1.9100, lng: 30.0900,
    isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, smokingAllowed: false,
    mileageLimit: 500, fuelPolicy: 'Return Full',
    rating: 4.9, totalTrips: 28,
    isSafariCapable: false,
  }});

  // 18 — Honda CR-V 2021
  await prisma.car.create({ data: {
    hostId: immaculee.id, make: 'Honda', model: 'CR-V', year: 2021,
    type: 'SUV_4X4', listingType: 'P2P',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 68000, depositAmount: 80000,
    driverAvailable: true, driverPricePerDay: 20000,
    description:
      'Honda CR-V 2021 with Honda Sensing safety suite. ' +
      '1.5L VTEC Turbo engine, smooth CVT. Magic Seat rear configuration ' +
      'allows for unusually flexible cargo arrangements. ' +
      'One of the most comfortable rides in its class — ideal for ' +
      'long drives to Lake Kivu or Nyungwe Forest. ' +
      'Well-maintained by its private owner in Kicukiro.',
    features: ['Air Conditioning', 'GPS Tracker', 'Honda Sensing', 'Magic Seat', 'Bluetooth', 'Wireless Charging'],
    photos: photos.crv,
    district: 'kicukiro', exactLocation: 'KK 25 Ave, Kicukiro, Kigali',
    lat: -1.9706, lng: 30.1044,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 250, fuelPolicy: 'Return Full',
    rating: 4.8, totalTrips: 19,
    isSafariCapable: false,
  }});

  // 19 — Mitsubishi Outlander 2022
  await prisma.car.create({ data: {
    hostId: david.id, make: 'Mitsubishi', model: 'Outlander', year: 2022,
    type: 'SUV_4X4', listingType: 'FLEET',
    seats: 7, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 78000, depositAmount: 100000,
    driverAvailable: true, driverPricePerDay: 20000,
    description:
      'Mitsubishi Outlander 2022 — third generation, fully redesigned. ' +
      '2.5L naturally aspirated engine, S-AWC all-wheel control system. ' +
      'Seats 7, with real legroom in the third row. ' +
      'Diamond white exterior, premium interior with heated seats. ' +
      'A quieter, more refined alternative to the Pajero for families ' +
      'who want 7 seats without full off-road capability.',
    features: ['Air Conditioning', 'GPS Tracker', '7 Seats', 'S-AWC All-Wheel Control', 'Heated Seats', 'Wireless Charging'],
    photos: photos.outlander,
    district: 'gasabo', exactLocation: 'KG 3 Ave, Gasabo, Kigali',
    lat: -1.9100, lng: 30.0900,
    isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, smokingAllowed: false,
    mileageLimit: 250, fuelPolicy: 'Return Full',
    rating: 4.7, totalTrips: 15,
    isSafariCapable: false,
  }});

  // 20 — Toyota Axio 2018 (Economy)
  await prisma.car.create({ data: {
    hostId: jean.id, make: 'Toyota', model: 'Axio', year: 2018,
    type: 'ECONOMY', listingType: 'P2P',
    seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 30000, depositAmount: 40000,
    driverAvailable: true, driverPricePerDay: 15000,
    description:
      'Toyota Axio 2018 — the most affordable car on Gari. ' +
      '1.5L petrol, automatic, clean and reliable. ' +
      'Ideal for solo trips, quick errands around Kigali, ' +
      'or anyone who just needs to get from A to B without fuss. ' +
      'Recently serviced, tyres replaced 3 months ago.',
    features: ['Air Conditioning', 'Bluetooth', 'USB Port'],
    photos: photos.axio,
    district: 'kicukiro', exactLocation: 'KK 1 Rd, Kicukiro, Kigali',
    lat: -1.9706, lng: 30.1044,
    isAvailable: true, isVerified: false,
    instantBooking: true,
    hasAC: true, smokingAllowed: false,
    mileageLimit: 200, fuelPolicy: 'Return Full',
    rating: 4.6, totalTrips: 8,
    isSafariCapable: false,
  }});

  console.log('✅ 20 rental cars created');

  // ── Bookings & Reviews ─────────────────────────────────────────────────
  // Create completed bookings so reviews have valid bookingIds

  async function makeCompletedBooking(
    carId: string, renterId: string, days: number,
    pricePerDay: number, loc: string, daysAgo: number
  ) {
    const pickupDate = subDays(new Date(), daysAgo + days);
    const returnDate = subDays(new Date(), daysAgo);
    const subtotal = pricePerDay * days;
    const platformFee = Math.round(subtotal * 0.10);
    return prisma.booking.create({ data: {
      carId, renterId, pickupDate, returnDate,
      withDriver: false, pickupLocation: loc,
      totalDays: days, subtotal, platformFee,
      driverFee: 0, totalAmount: subtotal + platformFee,
      status: 'COMPLETED', paymentMethod: 'MTN_MOMO',
      paymentStatus: 'PAID',
      momoTransactionId: `MOMO-SEED-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      completedAt: subDays(new Date(), daysAgo),
    }});
  }

  // RAV4 — 3 reviews (4.9 avg)
  const b1 = await makeCompletedBooking(rav4.id, renter.id, 3, 75000, 'KIA Airport', 14);
  const b2 = await makeCompletedBooking(rav4.id, renter2.id, 3, 75000, 'Musanze Town', 35);
  const b3 = await makeCompletedBooking(rav4.id, renter.id, 2, 75000, 'Kimironko Market', 62);

  await prisma.review.createMany({ data: [
    { bookingId: b1.id, carId: rav4.id, reviewerId: renter.id, rating: 5,
      comment: 'Excellent car, smooth ride and very clean. Jean-Pierre was punctual for pickup at the airport. Will definitely rent again.',
      createdAt: subDays(new Date(), 14) },
    { bookingId: b2.id, carId: rav4.id, reviewerId: renter2.id, rating: 5,
      comment: 'Used for a 3-day trip to Musanze. AC worked perfectly, comfortable for 4 people with luggage. Good fuel economy.',
      createdAt: subDays(new Date(), 35) },
    { bookingId: b3.id, carId: rav4.id, reviewerId: renter.id, rating: 4,
      comment: 'Good car overall. Minor issue — GPS was a bit outdated for Kigali roads. Host sorted it quickly when I mentioned it.',
      createdAt: subDays(new Date(), 62) },
  ]});

  // Sportage — 2 reviews (5.0)
  const b4 = await makeCompletedBooking(sportage.id, renter.id, 4, 65000, 'Kigali CBD', 21);
  const b5 = await makeCompletedBooking(sportage.id, renter2.id, 7, 65000, 'Kigali Convention Centre', 48);

  await prisma.review.createMany({ data: [
    { bookingId: b4.id, carId: sportage.id, reviewerId: renter.id, rating: 5,
      comment: 'Beautiful car, very modern. Apple CarPlay made navigation easy. Immaculée was very responsive on WhatsApp.',
      createdAt: subDays(new Date(), 21) },
    { bookingId: b5.id, carId: sportage.id, reviewerId: renter2.id, rating: 5,
      comment: 'Rented for a week for work. Comfortable, fuel-efficient, no issues. Would recommend to colleagues.',
      createdAt: subDays(new Date(), 48) },
  ]});

  // Prado — 2 reviews (5.0)
  const b6 = await makeCompletedBooking(prado.id, renter2.id, 3, 130000, 'Volcanoes NP Gate', 10);
  const b7 = await makeCompletedBooking(prado.id, renter.id, 5, 130000, 'Akagera NP', 40);

  await prisma.review.createMany({ data: [
    { bookingId: b6.id, carId: prado.id, reviewerId: renter2.id, rating: 5,
      comment: 'Perfect for gorilla trekking. The driver knew all the Kinigi roads and we arrived safely despite the rain. Highly recommend.',
      createdAt: subDays(new Date(), 10) },
    { bookingId: b7.id, carId: prado.id, reviewerId: renter.id, rating: 5,
      comment: 'Took this to Akagera for a 5-day safari. Handled every track with ease. Comfortable inside, cold AC, lots of space.',
      createdAt: subDays(new Date(), 40) },
  ]});

  // C200 — 1 review (5.0)
  const b8 = await makeCompletedBooking(c200.id, renter.id, 1, 150000, 'Kigali Serena Hotel', 7);
  await prisma.review.create({ data: {
    bookingId: b8.id, carId: c200.id, reviewerId: renter.id, rating: 5,
    comment: 'Arrived to my board meeting in style. The car was immaculate, driver was professional and punctual. Worth every franc.',
    createdAt: subDays(new Date(), 7),
  }});

  // Hilux — 1 review (5.0)
  const b9 = await makeCompletedBooking(hilux.id, renter2.id, 2, 90000, 'Gikondo Industrial', 18);
  await prisma.review.create({ data: {
    bookingId: b9.id, carId: hilux.id, reviewerId: renter2.id, rating: 5,
    comment: 'Used for a construction site delivery. Loaded it with materials — no problem. Reliable diesel engine, very easy to drive.',
    createdAt: subDays(new Date(), 18),
  }});

  // Hiace — 1 review (4.8)
  const b10 = await makeCompletedBooking(hiace.id, renter.id, 2, 130000, 'Lake Kivu Shore', 30);
  await prisma.review.create({ data: {
    bookingId: b10.id, carId: hiace.id, reviewerId: renter.id, rating: 5,
    comment: 'Hired for a team-building trip to Rubavu. 14 of us, all comfortable. Driver was excellent. Will use again for company events.',
    createdAt: subDays(new Date(), 30),
  }});

  console.log('✅ Bookings & reviews created');

  // ── Sales Listings ──────────────────────────────────────────────────────

  await prisma.salesListing.createMany({ data: [
    {
      sellerId: jean.id,
      make: 'Toyota', model: 'Fielder', year: 2017,
      mileage: 112000, colour: 'White', regNumber: 'RAC 112A',
      transmission: 'AUTOMATIC', fuel: 'PETROL', type: 'ECONOMY',
      askingPrice: 9500000, condition: 'Good', district: 'gasabo',
      description:
        'Toyota Fielder 2017 in good condition. 112,000km, full service history. ' +
        'Single owner since import. Regular oil changes, new tyres 6 months ago. ' +
        'Logbook clean, insurance current. Ideal first car or reliable family wagon.',
      photos: [u('1590362891991-f776e747a588')],
      listingTier: 'STANDARD', tierPaidAmount: 5000,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 60),
    },
    {
      sellerId: immaculee.id,
      make: 'Toyota', model: 'Land Cruiser Prado', year: 2016,
      mileage: 145000, colour: 'White', regNumber: 'RAB 456B',
      transmission: 'AUTOMATIC', fuel: 'DIESEL', type: 'SUV_4X4',
      askingPrice: 38000000, condition: 'Good', district: 'musanze',
      description:
        'Toyota Land Cruiser Prado 2016 TZ-G. 145,000km. Well maintained by NGO — ' +
        'full service records available. New brake pads and rotors. ' +
        'Roof rack included. Clean logbook, inspected by Gari team.',
      photos: [u('1605559424843-9073c6e99773')],
      listingTier: 'PREMIUM', tierPaidAmount: 15000,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 90),
    },
    {
      sellerId: claudine.id,
      make: 'Kia', model: 'Sportage', year: 2020,
      mileage: 62000, colour: 'Blue', regNumber: 'RAD 327C',
      transmission: 'AUTOMATIC', fuel: 'PETROL', type: 'SUV_4X4',
      askingPrice: 22000000, condition: 'Excellent', district: 'kicukiro',
      description:
        'Kia Sportage 2020 in excellent condition. Only 62,000km. One owner, ' +
        'all services at authorised dealer. Full panoramic sunroof, ' +
        'Apple CarPlay, blind spot monitor. No accidents. ' +
        'Reason for sale: owner relocating overseas.',
      photos: [u('1617469767053-d3b523a0b982')],
      listingTier: 'PREMIUM', tierPaidAmount: 15000,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 90),
    },
    {
      sellerId: david.id,
      make: 'Toyota', model: 'Hilux', year: 2019,
      mileage: 98000, colour: 'Silver', regNumber: 'RAE 789D',
      transmission: 'MANUAL', fuel: 'DIESEL', type: 'PICKUP',
      askingPrice: 28000000, condition: 'Good', district: 'gasabo',
      description:
        'Toyota Hilux 2019 Double Cab, 2.8L diesel. 98,000km, ' +
        'well-maintained construction company vehicle. ' +
        'Bull bar, snorkel, tow bar fitted. Recent gearbox service. ' +
        'Clean title. Priced for quick sale — serious offers only.',
      photos: [u('1558618666-fcd25c85cd64')],
      listingTier: 'STANDARD', tierPaidAmount: 5000,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 60),
    },
    {
      sellerId: jean.id,
      make: 'Hyundai', model: 'Tucson', year: 2019,
      mileage: 87000, colour: 'Grey', regNumber: 'RAB 654E',
      transmission: 'AUTOMATIC', fuel: 'PETROL', type: 'SUV_4X4',
      askingPrice: 18000000, condition: 'Good', district: 'nyarugenge',
      description:
        'Hyundai Tucson 2019, 2.0L petrol. 87,000km. ' +
        'Clean interior, no major accidents. ' +
        'Climate control, rear view camera, Android Auto. ' +
        'Tyres at 60% tread. Asking price is negotiable.',
      photos: [u('1552519507-da3b142c6e3d')],
      listingTier: 'STANDARD', tierPaidAmount: 5000,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 60),
    },
    {
      sellerId: immaculee.id,
      make: 'Volkswagen', model: 'Polo', year: 2019,
      mileage: 54000, colour: 'White', regNumber: 'RAC 321F',
      transmission: 'AUTOMATIC', fuel: 'PETROL', type: 'ECONOMY',
      askingPrice: 12500000, condition: 'Excellent', district: 'kicukiro',
      description:
        'Volkswagen Polo 2019, 1.0L TSI. Only 54,000km — barely run in. ' +
        'Full VW dealer service history. Parking sensors, Bluetooth, ' +
        'cruise control. No scratches, no dents. ' +
        'Best economy car available on Gari right now.',
      photos: [u('1471444928139-48c5bf5173f8')],
      listingTier: 'STANDARD', tierPaidAmount: 5000,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 60),
    },
  ]});

  console.log('✅ 6 sales listings created');

  // ── Buy & Earn Listings ─────────────────────────────────────────────────

  const earnListings = [
    {
      make: 'Toyota', model: 'RAV4', year: 2022, type: 'SUV_4X4' as const,
      photos: photos.rav4,
      purchasePriceRwf: 55000000, repairCostRwf: 0,
      registrationCostRwf: 1500000, importDutiesRwf: 8000000,
      comparableDailyRate: 75000, occupancyPct: 70, maintenanceReservePct: 10,
      district: 'gasabo',
      roiData: { annualRevenueRwf: 19162500, annualCostRwf: 5748750, annualNetRwf: 13413750, roiPct: 20.6, paybackYears: 4.9, confidence: 'HIGH' },
      roiConfidence: 'HIGH',
    },
    {
      make: 'Toyota', model: 'Land Cruiser V8', year: 2022, type: 'EXECUTIVE' as const,
      photos: photos.lcv8,
      purchasePriceRwf: 120000000, repairCostRwf: 0,
      registrationCostRwf: 2000000, importDutiesRwf: 20000000,
      comparableDailyRate: 200000, occupancyPct: 65, maintenanceReservePct: 12,
      district: 'gasabo',
      roiData: { annualRevenueRwf: 47450000, annualCostRwf: 15384000, annualNetRwf: 32066000, roiPct: 22.6, paybackYears: 4.4, confidence: 'HIGH' },
      roiConfidence: 'HIGH',
    },
    {
      make: 'Toyota', model: 'Hiace (14-Seater)', year: 2022, type: 'MINIBUS' as const,
      photos: photos.hiace,
      purchasePriceRwf: 45000000, repairCostRwf: 0,
      registrationCostRwf: 1200000, importDutiesRwf: 6000000,
      comparableDailyRate: 130000, occupancyPct: 75, maintenanceReservePct: 10,
      district: 'gasabo',
      roiData: { annualRevenueRwf: 35587500, annualCostRwf: 10396250, annualNetRwf: 25191250, roiPct: 47.9, paybackYears: 2.1, confidence: 'HIGH' },
      roiConfidence: 'HIGH',
    },
    {
      make: 'Mercedes-Benz', model: 'C200', year: 2022, type: 'EXECUTIVE' as const,
      photos: photos.c200,
      purchasePriceRwf: 70000000, repairCostRwf: 0,
      registrationCostRwf: 1500000, importDutiesRwf: 14000000,
      comparableDailyRate: 150000, occupancyPct: 60, maintenanceReservePct: 15,
      district: 'nyarugenge',
      roiData: { annualRevenueRwf: 32850000, annualCostRwf: 12484500, annualNetRwf: 20365500, roiPct: 23.9, paybackYears: 4.2, confidence: 'MEDIUM' },
      roiConfidence: 'MEDIUM',
    },
    {
      make: 'Toyota', model: 'Hilux Double Cab', year: 2022, type: 'PICKUP' as const,
      photos: photos.hilux,
      purchasePriceRwf: 38000000, repairCostRwf: 0,
      registrationCostRwf: 1000000, importDutiesRwf: 6000000,
      comparableDailyRate: 90000, occupancyPct: 72, maintenanceReservePct: 10,
      district: 'kicukiro',
      roiData: { annualRevenueRwf: 23652000, annualCostRwf: 7095600, annualNetRwf: 16556400, roiPct: 36.9, paybackYears: 2.7, confidence: 'HIGH' },
      roiConfidence: 'HIGH',
    },
  ];

  for (const e of earnListings) {
    await prisma.buyEarnListing.create({ data: { ...e, isActive: true } });
  }

  console.log('✅ Buy & Earn listings created');

  // ── Notifications ───────────────────────────────────────────────────────

  await prisma.notification.createMany({ data: [
    { userId: jean.id, title: 'New Booking Request', message: 'Patrick Mugisha has requested to book your Toyota RAV4 for 3 days.', type: 'BOOKING_REQUEST', read: false },
    { userId: renter.id, title: 'Booking Confirmed!', message: 'Your booking for the Toyota RAV4 has been confirmed. Pickup tomorrow at 8:00 AM from KG 11 Ave.', type: 'BOOKING_CONFIRMED', read: true },
    { userId: david.id, title: 'Payment Received', message: 'RWF 330,000 has been sent to your MTN MoMo account for the completed Land Cruiser V8 trip.', type: 'PAYMENT_RECEIVED', read: false },
    { userId: renter2.id, title: 'Leave a Review', message: 'How was your trip in the Kia Sportage? Leave a review to help other renters.', type: 'REVIEW_REMINDER', read: false },
    { userId: immaculee.id, title: 'Sales Enquiry', message: 'Someone has enquired about your Toyota Land Cruiser Prado for sale. Check your inbox.', type: 'GENERAL', read: false },
  ]});

  console.log('✅ Notifications created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('─────────────────────────────────────────');
  console.log('📧 Test accounts (password: password123)');
  console.log('   jean@gari.rw      — Host (Kigali)');
  console.log('   imma@gari.rw      — Host (Musanze)');
  console.log('   david@gari.rw     — Host (Rubavu)');
  console.log('   claudine@gari.rw  — Host (Kigali)');
  console.log('   renter@gari.rw    — Renter (Patrick Mugisha)');
  console.log('   amina@gari.rw     — Renter (Amina Kagabo)');
  console.log('   admin@gari.rw     — Admin');
  console.log('─────────────────────────────────────────');
}

main().catch(console.error).finally(() => prisma.$disconnect());
