import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

const photos = {
  vitz:     ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800', 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'],
  fielder:  ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800'],
  corolla:  ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800', 'https://images.unsplash.com/photo-1561020469-fb4e2e20bf52?w=800'],
  rav4:     ['https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=800', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'],
  prado:    ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800'],
  hilux:    ['https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=800', 'https://images.unsplash.com/photo-1561155707-f92d13b09e2c?w=800'],
  hiace:    ['https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'],
  v8:       ['https://images.unsplash.com/photo-1563720223185-11003d516935?w=800', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800'],
  truck:    ['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800', 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800'],
  sprinter: ['https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800'],
  benz:     ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800', 'https://images.unsplash.com/photo-1605515298946-d664de67e6e0?w=800'],
  bmw:      ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', 'https://images.unsplash.com/photo-1580414057403-c5f451f30e1c?w=800'],
  coaster:  ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800'],
};

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.salesEnquiry.deleteMany();
  await prisma.salesListing.deleteMany();
  await prisma.buyEarnListing.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();

  const password = await hash('password123', 12);

  // ── Users ──────────────────────────────────────────────────────────────────

  const hostKigali = await prisma.user.create({ data: {
    name: 'Jean-Pierre Habimana', email: 'jean@gari.rw', password, role: 'HOST',
    nidaVerified: true, licenseVerified: true, phone: '+250788112233',
    avatar: 'https://i.pravatar.cc/150?img=11', trustScore: 92,
  }});

  const hostMusanze = await prisma.user.create({ data: {
    name: 'Immaculée Uwimana', email: 'imma@gari.rw', password, role: 'HOST',
    nidaVerified: true, licenseVerified: true, phone: '+250788445566',
    avatar: 'https://i.pravatar.cc/150?img=48', trustScore: 88,
  }});

  const hostRubavu = await prisma.user.create({ data: {
    name: 'David Nkurunziza', email: 'david@gari.rw', password, role: 'BOTH',
    nidaVerified: true, licenseVerified: true, phone: '+250788778899',
    avatar: 'https://i.pravatar.cc/150?img=22', trustScore: 95,
  }});

  const hostHuye = await prisma.user.create({ data: {
    name: 'Claudine Mukeshimana', email: 'claudine@gari.rw', password, role: 'HOST',
    nidaVerified: true, licenseVerified: true, phone: '+250789123456',
    avatar: 'https://i.pravatar.cc/150?img=44', trustScore: 85,
  }});

  const renter1 = await prisma.user.create({ data: {
    name: 'Amina Kagabo', email: 'amina@gari.rw', password, role: 'RENTER',
    nidaVerified: true, licenseVerified: true, phone: '+250789001122',
    avatar: 'https://i.pravatar.cc/150?img=33',
  }});

  const renter2 = await prisma.user.create({ data: {
    name: 'Patrick Mugisha', email: 'patrick@gari.rw', password, role: 'RENTER',
    nidaVerified: true, licenseVerified: false, phone: '+250789334455',
    avatar: 'https://i.pravatar.cc/150?img=15',
  }});

  await prisma.user.create({ data: {
    name: 'Gari Admin', email: 'admin@gari.rw', password, role: 'ADMIN',
    nidaVerified: true, licenseVerified: true,
  }});

  console.log('✅ Users created');

  // ── Rental Cars ─────────────────────────────────────────────────────────────

  const car1 = await prisma.car.create({ data: {
    hostId: hostKigali.id, make: 'Toyota', model: 'Vitz', year: 2018,
    type: 'ECONOMY', listingType: 'P2P', seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 28000, driverAvailable: false,
    description: 'Well-maintained Toyota Vitz, perfect for city driving in Kigali. Easy to park, fuel-efficient, comfortable for up to 5 passengers.',
    features: ['Air Conditioning', 'USB Charging', 'Bluetooth Audio'],
    photos: photos.vitz, district: 'gasabo', exactLocation: 'Kimironko, Gasabo',
    lat: -1.9393, lng: 30.1120, isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, mileageLimit: 200, fuelPolicy: 'Return Full', rating: 4.7, totalTrips: 32,
  }});

  const car2 = await prisma.car.create({ data: {
    hostId: hostKigali.id, make: 'Toyota', model: 'Fielder', year: 2019,
    type: 'ECONOMY', listingType: 'P2P', seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 35000, driverAvailable: true, driverPricePerDay: 15000,
    description: 'Spacious Toyota Fielder station wagon. Great for families or groups. Available with an experienced driver who knows all Rwanda roads.',
    features: ['Air Conditioning', 'Large Boot Space', 'Child Seat Available'],
    photos: photos.fielder, district: 'kicukiro', exactLocation: 'Niboye, Kicukiro',
    lat: -1.9706, lng: 30.1044, isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasChildSeat: true, mileageLimit: 300, fuelPolicy: 'Return Full', rating: 4.9, totalTrips: 58,
  }});

  const car3 = await prisma.car.create({ data: {
    hostId: hostKigali.id, make: 'Toyota', model: 'Corolla', year: 2020,
    type: 'SEDAN', listingType: 'P2P', seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 55000, driverAvailable: true, driverPricePerDay: 18000,
    description: 'Premium Toyota Corolla 2020 in excellent condition. Perfect for business travel or airport transfers. Very comfortable with modern features.',
    features: ['Air Conditioning', 'GPS Tracker', 'Leather Seats', 'Bluetooth'],
    photos: photos.corolla, district: 'nyarugenge', exactLocation: 'CBD Kigali, Nyarugenge',
    lat: -1.9441, lng: 30.0619, isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, mileageLimit: 250, fuelPolicy: 'Pre-Paid', rating: 4.8, totalTrips: 41,
  }});

  const car4 = await prisma.car.create({ data: {
    hostId: hostKigali.id, make: 'Toyota', model: 'RAV4', year: 2021,
    type: 'SUV_4X4', listingType: 'FLEET', seats: 5, transmission: 'AUTOMATIC', fuel: 'DIESEL',
    pricePerDay: 80000, driverAvailable: true, driverPricePerDay: 20000,
    description: 'Toyota RAV4 2021, ideal for safaris and upcountry travel. 4WD capable, perfect for Akagera, Volcanoes, or Nyungwe parks.',
    features: ['4WD', 'Air Conditioning', 'GPS Tracker', 'First Aid Kit', 'Roof Rack'],
    photos: photos.rav4, district: 'gasabo', exactLocation: 'KG 11 Ave, Gasabo',
    lat: -1.9100, lng: 30.0900, isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, mileageLimit: 500, fuelPolicy: 'Return Full', rating: 4.9, totalTrips: 87,
  }});

  const car5 = await prisma.car.create({ data: {
    hostId: hostMusanze.id, make: 'Toyota', model: 'Land Cruiser Prado', year: 2019,
    type: 'SUV_4X4', listingType: 'P2P', seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL',
    pricePerDay: 130000, driverAvailable: true, driverPricePerDay: 25000,
    description: 'Powerful Toyota Prado based in Musanze, gateway to Volcanoes National Park. Perfect for gorilla trekking and mountain adventures. Experienced driver available.',
    features: ['4WD', 'Air Conditioning', 'GPS Tracker', 'Cooler Box', 'Safari Extras'],
    photos: photos.prado, district: 'musanze', exactLocation: 'Musanze City Centre',
    lat: -1.4994, lng: 29.6340, isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasGPS: true, mileageLimit: 600, fuelPolicy: 'Return Full', rating: 5.0, totalTrips: 124,
  }});

  const car6 = await prisma.car.create({ data: {
    hostId: hostMusanze.id, make: 'Toyota', model: 'Hilux', year: 2020,
    type: 'PICKUP', listingType: 'FLEET', seats: 5, transmission: 'MANUAL', fuel: 'DIESEL',
    pricePerDay: 120000, driverAvailable: true, driverPricePerDay: 20000,
    description: 'Robust Toyota Hilux pickup, great for heavy-duty transport and off-road adventures in Northern Rwanda. Can carry cargo and passengers.',
    features: ['4WD', 'Bull Bar', 'Cargo Space', 'Air Conditioning'],
    photos: photos.hilux, district: 'musanze', exactLocation: 'Kinigi Road, Musanze',
    lat: -1.5100, lng: 29.6200, isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, mileageLimit: 400, fuelPolicy: 'Return Full', rating: 4.6, totalTrips: 39,
  }});

  const car7 = await prisma.car.create({ data: {
    hostId: hostRubavu.id, make: 'Toyota', model: 'Hiace (14-Seater)', year: 2018,
    type: 'MINIBUS', listingType: 'FLEET', seats: 14, transmission: 'MANUAL', fuel: 'DIESEL',
    pricePerDay: 130000, driverAvailable: true, driverPricePerDay: 25000,
    description: 'Spacious 14-seater Toyota Hiace minibus based in Rubavu (Gisenyi). Perfect for group tours to Lake Kivu, Congo Nile Trail, or cross-border travel.',
    features: ['Air Conditioning', 'Ample Luggage Space', 'Experienced Driver', 'Music System'],
    photos: photos.hiace, district: 'rubavu', exactLocation: 'Lake Kivu Shore, Rubavu',
    lat: -1.6767, lng: 29.2597, isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, mileageLimit: 800, fuelPolicy: 'Pre-Paid', rating: 4.8, totalTrips: 76,
  }});

  const car8 = await prisma.car.create({ data: {
    hostId: hostRubavu.id, make: 'Toyota', model: 'Land Cruiser V8', year: 2022,
    type: 'EXECUTIVE', listingType: 'FLEET', seats: 8, transmission: 'AUTOMATIC', fuel: 'DIESEL',
    pricePerDay: 220000, driverAvailable: true, driverPricePerDay: 30000,
    description: 'Luxury Toyota Land Cruiser V8, the ultimate executive vehicle in Rwanda. Used for VIP transfers, government delegations, and high-end tourism.',
    features: ['4WD', 'Premium Leather', 'Climate Control', 'GPS', 'WiFi Hotspot', 'Entertainment System'],
    photos: photos.v8, district: 'gasabo', exactLocation: 'Kigali Heights, Gasabo',
    lat: -1.9200, lng: 30.1000, isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasWifi: true, hasGPS: true, mileageLimit: 400, fuelPolicy: 'Pre-Paid', rating: 5.0, totalTrips: 45,
  }});

  await prisma.car.create({ data: {
    hostId: hostKigali.id, make: 'Suzuki', model: 'Vitara', year: 2021,
    type: 'SUV_4X4', listingType: 'P2P', seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 70000, driverAvailable: false,
    description: 'Stylish Suzuki Vitara 2021, perfect for weekend getaways. Compact but capable SUV, great on both city roads and moderate off-road.',
    features: ['4WD', 'Air Conditioning', 'Panoramic Sunroof', 'Apple CarPlay'],
    photos: photos.rav4, district: 'kicukiro', exactLocation: 'Gikondo, Kicukiro',
    lat: -1.9600, lng: 30.0900, isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, mileageLimit: 300, fuelPolicy: 'Return Full', rating: 4.7, totalTrips: 28,
  }});

  await prisma.car.create({ data: {
    hostId: hostMusanze.id, make: 'Toyota', model: 'Premio', year: 2017,
    type: 'SEDAN', listingType: 'P2P', seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 45000, driverAvailable: true, driverPricePerDay: 15000,
    description: 'Classic Toyota Premio, comfortable and reliable. Ideal for business trips or airport transfers in Northern Rwanda.',
    features: ['Air Conditioning', 'Comfortable Seats', 'Large Boot'],
    photos: photos.corolla, district: 'gicumbi', exactLocation: 'Byumba, Gicumbi',
    lat: -1.5800, lng: 30.0600, isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, mileageLimit: 250, fuelPolicy: 'Return Full', rating: 4.5, totalTrips: 19,
  }});

  await prisma.car.create({ data: {
    hostId: hostRubavu.id, make: 'Toyota', model: 'Prado TX', year: 2020,
    type: 'EXECUTIVE', listingType: 'FLEET', seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL',
    pricePerDay: 160000, driverAvailable: true, driverPricePerDay: 28000,
    description: 'Premium Toyota Prado TX from our Rubavu fleet. Perfect for Western Province tours including Nyungwe Forest, Lake Kivu, and Rusizi.',
    features: ['4WD', 'Leather Seats', 'GPS', 'Climate Control', 'Rear AC Vents'],
    photos: photos.prado, district: 'rubavu', exactLocation: 'Serena Hotel Area, Rubavu',
    lat: -1.6850, lng: 29.2400, isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasGPS: true, mileageLimit: 600, fuelPolicy: 'Pre-Paid', rating: 4.9, totalTrips: 63,
  }});

  await prisma.car.create({ data: {
    hostId: hostKigali.id, make: 'Toyota', model: 'Hiace (9-Seater)', year: 2019,
    type: 'MINIBUS', listingType: 'FLEET', seats: 9, transmission: 'MANUAL', fuel: 'DIESEL',
    pricePerDay: 110000, driverAvailable: true, driverPricePerDay: 22000,
    description: '9-seater Toyota Hiace based in Kigali. Perfect for corporate transfers, wedding transport, or group excursions around Rwanda.',
    features: ['Air Conditioning', 'Luggage Rack', 'Music System', 'USB Charging'],
    photos: photos.hiace, district: 'gasabo', exactLocation: 'Remera, Gasabo',
    lat: -1.9550, lng: 30.1200, isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, mileageLimit: 500, fuelPolicy: 'Pre-Paid', rating: 4.7, totalTrips: 52,
  }});

  // ── TRUCKS (driver always included) ─────────────────────────────────────────

  await prisma.car.create({ data: {
    hostId: hostKigali.id, make: 'Isuzu', model: 'FSR 33 Truck', year: 2019,
    type: 'PICKUP', listingType: 'FLEET', seats: 3, transmission: 'MANUAL', fuel: 'DIESEL',
    pricePerDay: 180000, driverAvailable: true, driverPricePerDay: 0,
    description: 'Isuzu FSR medium-duty cargo truck with professional driver included. Ideal for construction materials, furniture, and commercial deliveries across Rwanda. Driver is MANDATORY and included in the daily rate.',
    features: ['Professional Driver Included', 'Cargo Load 5 Tonnes', 'Fuel Efficient', 'Nationwide Coverage', 'Loading/Offloading Assistance'],
    photos: photos.truck, district: 'kicukiro', exactLocation: 'Gikondo Industrial, Kicukiro',
    lat: -1.9750, lng: 30.0850, isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, mileageLimit: 800, fuelPolicy: 'Pre-Paid', rating: 4.8, totalTrips: 67,
    depositAmount: 100000,
  }});

  await prisma.car.create({ data: {
    hostId: hostRubavu.id, make: 'Mercedes-Benz', model: 'Sprinter Cargo Van', year: 2021,
    type: 'PICKUP', listingType: 'FLEET', seats: 3, transmission: 'AUTOMATIC', fuel: 'DIESEL',
    pricePerDay: 150000, driverAvailable: true, driverPricePerDay: 0,
    description: 'Mercedes-Benz Sprinter cargo van, perfect for medium-sized deliveries, event equipment, and inter-city freight. Comes with an experienced driver — no self-drive available for this vehicle.',
    features: ['Professional Driver Included', 'Refrigerated Option Available', 'GPS Tracking', 'Cargo Volume 14m³', 'Door-to-Door Delivery'],
    photos: photos.sprinter, district: 'gasabo', exactLocation: 'Nyabugogo Hub, Gasabo',
    lat: -1.9350, lng: 30.0550, isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasGPS: true, mileageLimit: 600, fuelPolicy: 'Pre-Paid', rating: 4.9, totalTrips: 43,
    depositAmount: 80000,
  }});

  await prisma.car.create({ data: {
    hostId: hostHuye.id, make: 'Isuzu', model: 'NQR Tipper Truck', year: 2020,
    type: 'PICKUP', listingType: 'FLEET', seats: 3, transmission: 'MANUAL', fuel: 'DIESEL',
    pricePerDay: 250000, driverAvailable: true, driverPricePerDay: 0,
    description: 'Heavy-duty Isuzu tipper truck based in Huye (Butare). Ideal for quarry work, sand & gravel, construction sites. Professional driver with 10+ years experience included. Available for hire by the day or week.',
    features: ['Professional Driver Included', 'Tipper Hydraulics', 'Load Capacity 8 Tonnes', 'Construction Grade', 'Southern Province Coverage'],
    photos: photos.truck, district: 'huye', exactLocation: 'Ngoma Industrial Area, Huye',
    lat: -2.5995, lng: 29.7392, isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: false, mileageLimit: 400, fuelPolicy: 'Pre-Paid', rating: 4.6, totalTrips: 31,
    depositAmount: 150000,
  }});

  await prisma.car.create({ data: {
    hostId: hostKigali.id, make: 'Toyota', model: 'Coaster Bus (30-Seater)', year: 2020,
    type: 'MINIBUS', listingType: 'FLEET', seats: 30, transmission: 'MANUAL', fuel: 'DIESEL',
    pricePerDay: 300000, driverAvailable: true, driverPricePerDay: 0,
    description: '30-seater Toyota Coaster bus, the perfect solution for corporate retreats, school trips, wedding convoys, and MICE events. Experienced licensed driver always included. Air-conditioned for comfort on long journeys.',
    features: ['Professional Driver Included', 'Air Conditioning', 'Public Address System', 'Emergency Exits', 'MICE & Events Ready', 'Nationwide Coverage'],
    photos: photos.coaster, district: 'gasabo', exactLocation: 'Airport Road, Gasabo',
    lat: -1.9700, lng: 30.1350, isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, mileageLimit: 1000, fuelPolicy: 'Pre-Paid', rating: 4.9, totalTrips: 28,
    depositAmount: 200000,
  }});

  await prisma.car.create({ data: {
    hostId: hostMusanze.id, make: 'Mercedes-Benz', model: 'E-Class (Chauffeur)', year: 2022,
    type: 'EXECUTIVE', listingType: 'FLEET', seats: 4, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 280000, driverAvailable: true, driverPricePerDay: 0,
    description: 'Mercedes-Benz E-Class executive saloon with uniformed chauffeur. Perfect for VIP airport pickups, diplomatic missions, and corporate events. Driver is professional, English/French/Kinyarwanda speaking. Self-drive not available.',
    features: ['Uniformed Chauffeur Included', 'Premium Leather Interior', 'Climate Control', 'Privacy Glass', 'Complimentary Water', 'WiFi Hotspot', 'Door-to-Door Service'],
    photos: photos.benz, district: 'nyarugenge', exactLocation: 'Kigali Serena Hotel, Nyarugenge',
    lat: -1.9500, lng: 30.0600, isAvailable: true, isVerified: true, instantBooking: true,
    hasAC: true, hasWifi: true, hasGPS: true, mileageLimit: 500, fuelPolicy: 'Pre-Paid', rating: 5.0, totalTrips: 89,
    depositAmount: 0,
  }});

  await prisma.car.create({ data: {
    hostId: hostRubavu.id, make: 'BMW', model: '5 Series (Chauffeur)', year: 2023,
    type: 'EXECUTIVE', listingType: 'FLEET', seats: 4, transmission: 'AUTOMATIC', fuel: 'PETROL',
    pricePerDay: 320000, driverAvailable: true, driverPricePerDay: 0,
    description: 'The latest BMW 5 Series with dedicated professional chauffeur. Gari\'s most premium offering — reserved for VIP clients, ambassadors, and high-profile corporate events. 24/7 availability. Driver included, no self-drive.',
    features: ['Professional Chauffeur 24/7', 'Massage Seats', 'Harman Kardon Audio', 'Head-Up Display', 'Panoramic Roof', 'Premium Mineral Water', 'Airport Meet & Greet'],
    photos: photos.bmw, district: 'gasabo', exactLocation: 'Kigali Heights Mall, Gasabo',
    lat: -1.9250, lng: 30.0950, isAvailable: true, isVerified: true, instantBooking: false,
    hasAC: true, hasWifi: true, hasGPS: true, mileageLimit: 500, fuelPolicy: 'Pre-Paid', rating: 5.0, totalTrips: 22,
    depositAmount: 0,
  }});

  console.log('✅ Cars & trucks created');

  // ── Bookings & Reviews ─────────────────────────────────────────────────────

  const bookingData = [
    { car: car1, renter: renter1, days: 3, pricePerDay: 28000, loc: 'Kimironko Market' },
    { car: car4, renter: renter2, days: 5, pricePerDay: 80000, loc: 'Akagera National Park' },
    { car: car5, renter: renter1, days: 2, pricePerDay: 130000, loc: 'Volcanoes NP Gate' },
    { car: car7, renter: renter2, days: 4, pricePerDay: 130000, loc: 'Lake Kivu Shore' },
    { car: car3, renter: renter1, days: 1, pricePerDay: 55000, loc: 'KBC Station' },
    { car: car2, renter: renter2, days: 3, pricePerDay: 35000, loc: 'Nyabugogo Bus Park' },
    { car: car8, renter: renter1, days: 2, pricePerDay: 220000, loc: 'Kigali Convention Centre' },
  ];

  const reviewComments = [
    'Excellent car, smooth ride and well-maintained. Will rent again!',
    'Great experience. The host was very responsive and the car was spotless.',
    'Perfect for our safari trip. The car handled all the roads perfectly.',
    'Very comfortable and fuel-efficient. Highly recommended for Kigali city trips.',
    'Amazing vehicle and helpful host. The pickup process was seamless.',
    'The driver was professional and knew all the best routes. 10/10!',
    'Superb executive vehicle — arrived to every meeting in style.',
  ];

  for (const b of bookingData) {
    const subtotal = b.pricePerDay * b.days;
    const platformFee = Math.round(subtotal * 0.10);
    const pickupDate = new Date(Date.now() - Math.random() * 30 * 86400000);
    const returnDate = new Date(pickupDate.getTime() + b.days * 86400000);

    const booking = await prisma.booking.create({ data: {
      carId: b.car.id, renterId: b.renter.id, pickupDate, returnDate,
      withDriver: false, pickupLocation: b.loc, totalDays: b.days,
      subtotal, platformFee, driverFee: 0, totalAmount: subtotal + platformFee,
      status: 'COMPLETED', paymentMethod: 'MTN_MOMO', paymentStatus: 'PAID',
      momoTransactionId: `MOMO-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    }});

    await prisma.review.create({ data: {
      bookingId: booking.id, carId: b.car.id, reviewerId: b.renter.id,
      rating: Math.floor(Math.random() * 2) + 4,
      comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
    }});
  }

  console.log('✅ Bookings & reviews created');

  // ── Sales Listings ──────────────────────────────────────────────────────────

  await prisma.salesListing.createMany({ data: [
    {
      sellerId: hostKigali.id, make: 'Toyota', model: 'Corolla', year: 2018,
      mileage: 87000, colour: 'Silver', regNumber: 'RAC 123A',
      transmission: 'AUTOMATIC', fuel: 'PETROL', type: 'SEDAN',
      askingPrice: 14500000, condition: 'Good', district: 'gasabo',
      description: 'Toyota Corolla 2018 in excellent mechanical condition. Regularly serviced at Toyota Rwanda. Minor paint scratches on rear bumper. Full service history available. Fuel-efficient and reliable daily driver.',
      photos: photos.corolla, listingTier: 'STANDARD', tierPaidAmount: 5000,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 60),
    },
    {
      sellerId: hostMusanze.id, make: 'Toyota', model: 'Land Cruiser Prado', year: 2016,
      mileage: 145000, colour: 'White', regNumber: 'RAB 456B',
      transmission: 'AUTOMATIC', fuel: 'DIESEL', type: 'SUV_4X4',
      askingPrice: 38000000, condition: 'Good', district: 'musanze',
      description: 'Iconic Toyota Prado TZ-G in white. Has been used for gorilla trekking tourism — very well maintained. New tyres, recent full service, all electronics working. Minor body work may be needed. Price is negotiable.',
      photos: photos.prado, listingTier: 'PREMIUM', tierPaidAmount: 15000,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 90),
    },
    {
      sellerId: hostRubavu.id, make: 'Toyota', model: 'Hiace (14-Seater)', year: 2015,
      mileage: 230000, colour: 'White', regNumber: 'RAC 789C',
      transmission: 'MANUAL', fuel: 'DIESEL', type: 'MINIBUS',
      askingPrice: 22000000, condition: 'Fair', district: 'rubavu',
      description: '14-seater Toyota Hiace, popular for school and church transport. New clutch fitted recently. Engine is solid. Body has minor dents consistent with age. Perfect buy for a transport business. Test drive welcome in Rubavu.',
      photos: photos.hiace, listingTier: 'BASIC', tierPaidAmount: 0,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 30),
    },
    {
      sellerId: hostKigali.id, make: 'Isuzu', model: 'D-Max 4x4', year: 2020,
      mileage: 62000, colour: 'Black', regNumber: 'RAD 321D',
      transmission: 'AUTOMATIC', fuel: 'DIESEL', type: 'PICKUP',
      askingPrice: 28000000, condition: 'Excellent', district: 'kicukiro',
      description: 'Barely used Isuzu D-Max 4x4 double cab. Company-owned, meticulously maintained by manufacturer-approved workshop. Zero accident history. Full optional extras: bull bar, tow bar, bed liner, safari lights. One of the cleanest trucks on the market.',
      photos: photos.hilux, listingTier: 'PREMIUM', tierPaidAmount: 15000,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 90),
    },
    {
      sellerId: hostHuye.id, make: 'Honda', model: 'CR-V', year: 2019,
      mileage: 54000, colour: 'Blue', regNumber: 'RAE 654E',
      transmission: 'AUTOMATIC', fuel: 'PETROL', type: 'SUV_4X4',
      askingPrice: 25000000, condition: 'Excellent', district: 'huye',
      description: 'Honda CR-V 2019 in pristine condition. Single owner, female-driven, garaged. Full service history at Honda Centre. Comes with original floor mats, toolkit, and spare tyre. Reason for selling: relocating abroad.',
      photos: photos.rav4, listingTier: 'STANDARD', tierPaidAmount: 5000,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 60),
    },
    {
      sellerId: hostRubavu.id, make: 'Toyota', model: 'Vitz', year: 2017,
      mileage: 112000, colour: 'Red', regNumber: 'RAB 987F',
      transmission: 'AUTOMATIC', fuel: 'PETROL', type: 'ECONOMY',
      askingPrice: 9500000, condition: 'Good', district: 'gasabo',
      description: 'Reliable Toyota Vitz 2017, ideal first car or budget daily commuter. Recently serviced with new brake pads and oil change. Air conditioning works perfectly. Small scratch on driver door. Price firm.',
      photos: photos.vitz, listingTier: 'BASIC', tierPaidAmount: 0,
      alsoListForRent: false, status: 'AVAILABLE',
      expiresAt: addDays(new Date(), 30),
    },
  ]});

  console.log('✅ Sales listings created');

  // ── Buy & Earn Listings ─────────────────────────────────────────────────────

  const earnListings = [
    {
      make: 'Toyota', model: 'RAV4', year: 2022, type: 'SUV_4X4' as const,
      photos: photos.rav4, purchasePriceRwf: 55000000, repairCostRwf: 0,
      registrationCostRwf: 1500000, importDutiesRwf: 8000000,
      comparableDailyRate: 85000, occupancyPct: 70, maintenanceReservePct: 10,
      district: 'gasabo',
      roiData: { annualRevenueRwf: 21717500, annualCostRwf: 6455000, annualNetRwf: 15262500, roiPct: 23.5, paybackYears: 4.2, confidence: 'HIGH' },
      roiConfidence: 'HIGH',
    },
    {
      make: 'Toyota', model: 'Land Cruiser V8', year: 2021, type: 'EXECUTIVE' as const,
      photos: photos.v8, purchasePriceRwf: 120000000, repairCostRwf: 0,
      registrationCostRwf: 2000000, importDutiesRwf: 20000000,
      comparableDailyRate: 220000, occupancyPct: 65, maintenanceReservePct: 12,
      district: 'gasabo',
      roiData: { annualRevenueRwf: 52195000, annualCostRwf: 16926000, annualNetRwf: 35269000, roiPct: 24.8, paybackYears: 4.0, confidence: 'HIGH' },
      roiConfidence: 'HIGH',
    },
    {
      make: 'Toyota', model: 'Hiace (14-Seater)', year: 2022, type: 'MINIBUS' as const,
      photos: photos.hiace, purchasePriceRwf: 45000000, repairCostRwf: 0,
      registrationCostRwf: 1200000, importDutiesRwf: 6000000,
      comparableDailyRate: 130000, occupancyPct: 75, maintenanceReservePct: 10,
      district: 'kigali',
      roiData: { annualRevenueRwf: 35587500, annualCostRwf: 10396250, annualNetRwf: 25191250, roiPct: 47.9, paybackYears: 2.1, confidence: 'HIGH' },
      roiConfidence: 'HIGH',
    },
    {
      make: 'Mercedes-Benz', model: 'E-Class (Chauffeur)', year: 2022, type: 'EXECUTIVE' as const,
      photos: photos.benz, purchasePriceRwf: 95000000, repairCostRwf: 2000000,
      registrationCostRwf: 1500000, importDutiesRwf: 18000000,
      comparableDailyRate: 280000, occupancyPct: 60, maintenanceReservePct: 15,
      district: 'nyarugenge',
      roiData: { annualRevenueRwf: 61320000, annualCostRwf: 22698000, annualNetRwf: 38622000, roiPct: 32.9, paybackYears: 3.0, confidence: 'MEDIUM' },
      roiConfidence: 'MEDIUM',
    },
    {
      make: 'Toyota', model: 'Corolla', year: 2023, type: 'SEDAN' as const,
      photos: photos.corolla, purchasePriceRwf: 28000000, repairCostRwf: 0,
      registrationCostRwf: 800000, importDutiesRwf: 4000000,
      comparableDailyRate: 55000, occupancyPct: 68, maintenanceReservePct: 10,
      district: 'kicukiro',
      roiData: { annualRevenueRwf: 13651000, annualCostRwf: 4095300, annualNetRwf: 9555700, roiPct: 29.0, paybackYears: 3.4, confidence: 'HIGH' },
      roiConfidence: 'HIGH',
    },
  ];

  for (const e of earnListings) {
    await prisma.buyEarnListing.create({ data: { ...e, isActive: true } });
  }

  console.log('✅ Buy & Earn listings created');

  // ── Notifications ───────────────────────────────────────────────────────────

  await prisma.notification.createMany({ data: [
    { userId: hostKigali.id, title: 'New Booking Request', message: 'Amina Kagabo has requested to book your Toyota Vitz for 3 days.', type: 'BOOKING_REQUEST', read: false },
    { userId: renter1.id, title: 'Booking Confirmed!', message: 'Your booking for the Toyota RAV4 has been confirmed. Pickup tomorrow at 8:00 AM.', type: 'BOOKING_CONFIRMED', read: true },
    { userId: hostRubavu.id, title: 'Payment Received', message: 'RWF 582,400 has been sent to your MTN MoMo account for completed trip.', type: 'PAYMENT_RECEIVED', read: false },
    { userId: renter2.id, title: 'Review Reminder', message: 'How was your trip in the Toyota Land Cruiser Prado? Leave a review to help other renters.', type: 'REVIEW_REMINDER', read: false },
    { userId: hostKigali.id, title: 'New Sales Enquiry', message: 'Someone has made an enquiry about your Toyota Corolla for sale. Check your inbox.', type: 'GENERAL', read: false },
  ]});

  console.log('✅ Notifications created');
  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📧 Test accounts (password: password123)');
  console.log('   jean@gari.rw    — Host (Kigali)');
  console.log('   imma@gari.rw    — Host (Musanze)');
  console.log('   david@gari.rw   — Host (Rubavu)');
  console.log('   claudine@gari.rw — Host (Huye)');
  console.log('   amina@gari.rw   — Renter');
  console.log('   admin@gari.rw   — Admin');
}

main().catch(console.error).finally(() => prisma.$disconnect());
