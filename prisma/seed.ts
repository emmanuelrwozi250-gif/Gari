import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const carPhotos = {
  vitz: [
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
  ],
  fielder: [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800',
  ],
  corolla: [
    'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800',
    'https://images.unsplash.com/photo-1561020469-fb4e2e20bf52?w=800',
  ],
  rav4: [
    'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=800',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
  ],
  prado: [
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
  ],
  hilux: [
    'https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=800',
    'https://images.unsplash.com/photo-1561155707-f92d13b09e2c?w=800',
  ],
  hiace: [
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
  ],
  v8: [
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800',
  ],
};

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();

  // Create host users
  const password = await hash('password123', 12);

  const hostKigali = await prisma.user.create({
    data: {
      name: 'Jean-Pierre Habimana',
      email: 'jean@gari.rw',
      password,
      role: 'HOST',
      nidaVerified: true,
      licenseVerified: true,
      phone: '+250788112233',
      avatar: 'https://i.pravatar.cc/150?img=11',
    },
  });

  const hostMusanze = await prisma.user.create({
    data: {
      name: 'Immaculee Uwimana',
      email: 'imma@gari.rw',
      password,
      role: 'HOST',
      nidaVerified: true,
      licenseVerified: true,
      phone: '+250788445566',
      avatar: 'https://i.pravatar.cc/150?img=48',
    },
  });

  const hostRubavu = await prisma.user.create({
    data: {
      name: 'David Nkurunziza',
      email: 'david@gari.rw',
      password,
      role: 'BOTH',
      nidaVerified: true,
      licenseVerified: true,
      phone: '+250788778899',
      avatar: 'https://i.pravatar.cc/150?img=22',
    },
  });

  // Renter users
  const renter1 = await prisma.user.create({
    data: {
      name: 'Amina Kagabo',
      email: 'amina@gari.rw',
      password,
      role: 'RENTER',
      nidaVerified: true,
      licenseVerified: true,
      phone: '+250789001122',
      avatar: 'https://i.pravatar.cc/150?img=33',
    },
  });

  const renter2 = await prisma.user.create({
    data: {
      name: 'Patrick Mugisha',
      email: 'patrick@gari.rw',
      password,
      role: 'RENTER',
      nidaVerified: true,
      licenseVerified: false,
      phone: '+250789334455',
      avatar: 'https://i.pravatar.cc/150?img=15',
    },
  });

  // Admin user
  await prisma.user.create({
    data: {
      name: 'Gari Admin',
      email: 'admin@gari.rw',
      password,
      role: 'ADMIN',
      nidaVerified: true,
      licenseVerified: true,
    },
  });

  console.log('✅ Users created');

  // Create car listings
  const car1 = await prisma.car.create({
    data: {
      hostId: hostKigali.id,
      make: 'Toyota', model: 'Vitz', year: 2018,
      type: 'ECONOMY', listingType: 'P2P',
      seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
      pricePerDay: 28000,
      driverAvailable: false,
      description: 'Well-maintained Toyota Vitz, perfect for city driving in Kigali. Easy to park, fuel-efficient, and comfortable for up to 5 passengers.',
      features: ['Air Conditioning', 'USB Charging', 'Bluetooth Audio'],
      photos: carPhotos.vitz,
      district: 'gasabo',
      exactLocation: 'Kimironko, Gasabo',
      lat: -1.9393, lng: 30.1120,
      isAvailable: true, isVerified: true, instantBooking: true,
      hasAC: true, hasWifi: false, hasGPS: false,
      mileageLimit: 200, fuelPolicy: 'Return Full',
      rating: 4.7, totalTrips: 32,
    },
  });

  const car2 = await prisma.car.create({
    data: {
      hostId: hostKigali.id,
      make: 'Toyota', model: 'Fielder', year: 2019,
      type: 'ECONOMY', listingType: 'P2P',
      seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
      pricePerDay: 35000,
      driverAvailable: true, driverPricePerDay: 15000,
      description: 'Spacious Toyota Fielder station wagon. Great for families or groups. Available with an experienced driver who knows all Rwanda roads.',
      features: ['Air Conditioning', 'Large Boot Space', 'Child Seat Available'],
      photos: carPhotos.fielder,
      district: 'kicukiro',
      exactLocation: 'Niboye, Kicukiro',
      lat: -1.9706, lng: 30.1044,
      isAvailable: true, isVerified: true, instantBooking: false,
      hasAC: true, hasChildSeat: true,
      mileageLimit: 300, fuelPolicy: 'Return Full',
      rating: 4.9, totalTrips: 58,
    },
  });

  const car3 = await prisma.car.create({
    data: {
      hostId: hostKigali.id,
      make: 'Toyota', model: 'Corolla', year: 2020,
      type: 'SEDAN', listingType: 'P2P',
      seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
      pricePerDay: 55000,
      driverAvailable: true, driverPricePerDay: 18000,
      description: 'Premium Toyota Corolla 2020 in excellent condition. Perfect for business travel or airport transfers. Very comfortable with modern features.',
      features: ['Air Conditioning', 'GPS Tracker', 'Leather Seats', 'Bluetooth'],
      photos: carPhotos.corolla,
      district: 'nyarugenge',
      exactLocation: 'CBD Kigali, Nyarugenge',
      lat: -1.9441, lng: 30.0619,
      isAvailable: true, isVerified: true, instantBooking: true,
      hasAC: true, hasGPS: true,
      mileageLimit: 250, fuelPolicy: 'Pre-Paid',
      rating: 4.8, totalTrips: 41,
    },
  });

  const car4 = await prisma.car.create({
    data: {
      hostId: hostKigali.id,
      make: 'Toyota', model: 'RAV4', year: 2021,
      type: 'SUV_4X4', listingType: 'FLEET',
      seats: 5, transmission: 'AUTOMATIC', fuel: 'DIESEL',
      pricePerDay: 80000,
      driverAvailable: true, driverPricePerDay: 20000,
      description: 'Toyota RAV4 2021, ideal for safaris and upcountry travel. 4WD capable, perfect for Akagera, Volcanoes, or Nyungwe parks.',
      features: ['4WD', 'Air Conditioning', 'GPS Tracker', 'First Aid Kit', 'Roof Rack'],
      photos: carPhotos.rav4,
      district: 'gasabo',
      exactLocation: 'KG 11 Ave, Gasabo',
      lat: -1.9100, lng: 30.0900,
      isAvailable: true, isVerified: true, instantBooking: true,
      hasAC: true, hasGPS: true,
      mileageLimit: 500, fuelPolicy: 'Return Full',
      rating: 4.9, totalTrips: 87,
    },
  });

  const car5 = await prisma.car.create({
    data: {
      hostId: hostMusanze.id,
      make: 'Toyota', model: 'Land Cruiser Prado', year: 2019,
      type: 'SUV_4X4', listingType: 'P2P',
      seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL',
      pricePerDay: 130000,
      driverAvailable: true, driverPricePerDay: 25000,
      description: 'Powerful Toyota Prado based in Musanze, gateway to Volcanoes National Park. Perfect for gorilla trekking and mountain adventures. Experienced driver available.',
      features: ['4WD', 'Air Conditioning', 'GPS Tracker', 'Cooler Box', 'Safari Extras'],
      photos: carPhotos.prado,
      district: 'musanze',
      exactLocation: 'Musanze City Centre',
      lat: -1.4994, lng: 29.6340,
      isAvailable: true, isVerified: true, instantBooking: false,
      hasAC: true, hasGPS: true,
      mileageLimit: 600, fuelPolicy: 'Return Full',
      rating: 5.0, totalTrips: 124,
    },
  });

  const car6 = await prisma.car.create({
    data: {
      hostId: hostMusanze.id,
      make: 'Toyota', model: 'Hilux', year: 2020,
      type: 'PICKUP', listingType: 'FLEET',
      seats: 5, transmission: 'MANUAL', fuel: 'DIESEL',
      pricePerDay: 120000,
      driverAvailable: true, driverPricePerDay: 20000,
      description: 'Robust Toyota Hilux pickup, great for heavy-duty transport and off-road adventures in Northern Rwanda. Can carry cargo and passengers.',
      features: ['4WD', 'Bull Bar', 'Cargo Space', 'Air Conditioning'],
      photos: carPhotos.hilux,
      district: 'musanze',
      exactLocation: 'Kinigi Road, Musanze',
      lat: -1.5100, lng: 29.6200,
      isAvailable: true, isVerified: true, instantBooking: true,
      hasAC: true,
      mileageLimit: 400, fuelPolicy: 'Return Full',
      rating: 4.6, totalTrips: 39,
    },
  });

  const car7 = await prisma.car.create({
    data: {
      hostId: hostRubavu.id,
      make: 'Toyota', model: 'Hiace (14-Seater)', year: 2018,
      type: 'MINIBUS', listingType: 'FLEET',
      seats: 14, transmission: 'MANUAL', fuel: 'DIESEL',
      pricePerDay: 130000,
      driverAvailable: true, driverPricePerDay: 25000,
      description: 'Spacious 14-seater Toyota Hiace minibus based in Rubavu (Gisenyi). Perfect for group tours to Lake Kivu, Congo Nile Trail, or cross-border travel.',
      features: ['Air Conditioning', 'Ample Luggage Space', 'Experienced Driver', 'Music System'],
      photos: carPhotos.hiace,
      district: 'rubavu',
      exactLocation: 'Lake Kivu Shore, Rubavu',
      lat: -1.6767, lng: 29.2597,
      isAvailable: true, isVerified: true, instantBooking: false,
      hasAC: true,
      mileageLimit: 800, fuelPolicy: 'Pre-Paid',
      rating: 4.8, totalTrips: 76,
    },
  });

  const car8 = await prisma.car.create({
    data: {
      hostId: hostRubavu.id,
      make: 'Toyota', model: 'Land Cruiser V8', year: 2022,
      type: 'EXECUTIVE', listingType: 'FLEET',
      seats: 8, transmission: 'AUTOMATIC', fuel: 'DIESEL',
      pricePerDay: 220000,
      driverAvailable: true, driverPricePerDay: 30000,
      description: 'Luxury Toyota Land Cruiser V8, the ultimate executive vehicle in Rwanda. Used for VIP transfers, government delegations, and high-end tourism.',
      features: ['4WD', 'Premium Leather', 'Climate Control', 'GPS', 'WiFi Hotspot', 'Entertainment System'],
      photos: carPhotos.v8,
      district: 'gasabo',
      exactLocation: 'Kigali Heights, Gasabo',
      lat: -1.9200, lng: 30.1000,
      isAvailable: true, isVerified: true, instantBooking: false,
      hasAC: true, hasWifi: true, hasGPS: true,
      mileageLimit: 400, fuelPolicy: 'Pre-Paid',
      rating: 5.0, totalTrips: 45,
    },
  });

  const car9 = await prisma.car.create({
    data: {
      hostId: hostKigali.id,
      make: 'Suzuki', model: 'Vitara', year: 2021,
      type: 'SUV_4X4', listingType: 'P2P',
      seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
      pricePerDay: 70000,
      driverAvailable: false,
      description: 'Stylish Suzuki Vitara 2021, perfect for weekend getaways. Compact but capable SUV, great on both city roads and moderate off-road.',
      features: ['4WD', 'Air Conditioning', 'Panoramic Sunroof', 'Apple CarPlay'],
      photos: carPhotos.rav4,
      district: 'kicukiro',
      exactLocation: 'Gikondo, Kicukiro',
      lat: -1.9600, lng: 30.0900,
      isAvailable: true, isVerified: true, instantBooking: true,
      hasAC: true,
      mileageLimit: 300, fuelPolicy: 'Return Full',
      rating: 4.7, totalTrips: 28,
    },
  });

  const car10 = await prisma.car.create({
    data: {
      hostId: hostMusanze.id,
      make: 'Toyota', model: 'Premio', year: 2017,
      type: 'SEDAN', listingType: 'P2P',
      seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
      pricePerDay: 45000,
      driverAvailable: true, driverPricePerDay: 15000,
      description: 'Classic Toyota Premio, comfortable and reliable. Ideal for business trips or airport transfers in Northern Rwanda.',
      features: ['Air Conditioning', 'Comfortable Seats', 'Large Boot'],
      photos: carPhotos.corolla,
      district: 'gicumbi',
      exactLocation: 'Byumba, Gicumbi',
      lat: -1.5800, lng: 30.0600,
      isAvailable: true, isVerified: true, instantBooking: true,
      hasAC: true,
      mileageLimit: 250, fuelPolicy: 'Return Full',
      rating: 4.5, totalTrips: 19,
    },
  });

  const car11 = await prisma.car.create({
    data: {
      hostId: hostRubavu.id,
      make: 'Toyota', model: 'Prado TX', year: 2020,
      type: 'EXECUTIVE', listingType: 'FLEET',
      seats: 7, transmission: 'AUTOMATIC', fuel: 'DIESEL',
      pricePerDay: 160000,
      driverAvailable: true, driverPricePerDay: 28000,
      description: 'Premium Toyota Prado TX from our Rubavu fleet. Perfect for Western Province tours including Nyungwe Forest, Lake Kivu, and Rusizi.',
      features: ['4WD', 'Leather Seats', 'GPS', 'Climate Control', 'Rear AC Vents'],
      photos: carPhotos.prado,
      district: 'rubavu',
      exactLocation: 'Serena Hotel Area, Rubavu',
      lat: -1.6850, lng: 29.2400,
      isAvailable: true, isVerified: true, instantBooking: false,
      hasAC: true, hasGPS: true,
      mileageLimit: 600, fuelPolicy: 'Pre-Paid',
      rating: 4.9, totalTrips: 63,
    },
  });

  const car12 = await prisma.car.create({
    data: {
      hostId: hostKigali.id,
      make: 'Toyota', model: 'Hiace (9-Seater)', year: 2019,
      type: 'MINIBUS', listingType: 'FLEET',
      seats: 9, transmission: 'MANUAL', fuel: 'DIESEL',
      pricePerDay: 110000,
      driverAvailable: true, driverPricePerDay: 22000,
      description: '9-seater Toyota Hiace based in Kigali. Perfect for corporate transfers, wedding transport, or group excursions around Rwanda.',
      features: ['Air Conditioning', 'Luggage Rack', 'Music System', 'USB Charging'],
      photos: carPhotos.hiace,
      district: 'gasabo',
      exactLocation: 'Remera, Gasabo',
      lat: -1.9550, lng: 30.1200,
      isAvailable: true, isVerified: true, instantBooking: true,
      hasAC: true,
      mileageLimit: 500, fuelPolicy: 'Pre-Paid',
      rating: 4.7, totalTrips: 52,
    },
  });

  console.log('✅ Cars created');

  // Create bookings and reviews
  const bookingData = [
    { car: car1, renter: renter1, days: 3, pricePerDay: 28000, district: 'gasabo', loc: 'Kimironko Market' },
    { car: car4, renter: renter2, days: 5, pricePerDay: 80000, district: 'kayonza', loc: 'Akagera National Park' },
    { car: car5, renter: renter1, days: 2, pricePerDay: 130000, district: 'musanze', loc: 'Volcanoes NP Gate' },
    { car: car7, renter: renter2, days: 4, pricePerDay: 130000, district: 'rubavu', loc: 'Lake Kivu Shore' },
    { car: car3, renter: renter1, days: 1, pricePerDay: 55000, district: 'nyarugenge', loc: 'KBC Station' },
  ];

  for (const b of bookingData) {
    const subtotal = b.pricePerDay * b.days;
    const platformFee = Math.round(subtotal * 0.10);
    const totalAmount = subtotal + platformFee;
    const pickupDate = new Date(Date.now() - Math.random() * 30 * 86400000);
    const returnDate = new Date(pickupDate.getTime() + b.days * 86400000);

    const booking = await prisma.booking.create({
      data: {
        carId: b.car.id,
        renterId: b.renter.id,
        pickupDate,
        returnDate,
        withDriver: false,
        pickupLocation: b.loc,
        totalDays: b.days,
        subtotal,
        platformFee,
        driverFee: 0,
        totalAmount,
        status: 'COMPLETED',
        paymentMethod: 'MTN_MOMO',
        paymentStatus: 'PAID',
        momoTransactionId: `MOMO-${Date.now()}`,
      },
    });

    const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
    await prisma.review.create({
      data: {
        bookingId: booking.id,
        carId: b.car.id,
        reviewerId: b.renter.id,
        rating,
        comment: [
          'Excellent car, smooth ride and well-maintained. Will rent again!',
          'Great experience. The host was very responsive and the car was spotless.',
          'Perfect for our safari trip. The car handled all the roads perfectly.',
          'Very comfortable and fuel-efficient. Highly recommended for Kigali city trips.',
          'Amazing vehicle and helpful host. The pickup process was seamless.',
        ][Math.floor(Math.random() * 5)],
      },
    });
  }

  // Update car ratings
  for (const car of [car1, car3, car4, car5, car7]) {
    const reviews = await prisma.review.findMany({ where: { carId: car.id } });
    if (reviews.length > 0) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await prisma.car.update({
        where: { id: car.id },
        data: { rating: Math.round(avg * 10) / 10, totalTrips: reviews.length },
      });
    }
  }

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: hostKigali.id,
        title: 'New Booking Request',
        message: 'Amina Kagabo has requested to book your Toyota Vitz for 3 days.',
        type: 'BOOKING_REQUEST',
        read: false,
      },
      {
        userId: renter1.id,
        title: 'Booking Confirmed!',
        message: 'Your booking for the Toyota RAV4 has been confirmed. Pickup on May 1st.',
        type: 'BOOKING_CONFIRMED',
        read: true,
      },
      {
        userId: hostRubavu.id,
        title: 'Payment Received',
        message: 'RWF 582,400 has been sent to your MTN MoMo account for completed trip.',
        type: 'PAYMENT_RECEIVED',
        read: false,
      },
    ],
  });

  console.log('✅ Bookings, reviews, and notifications created');
  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📧 Test accounts:');
  console.log('   Host (Kigali):    jean@gari.rw    / password123');
  console.log('   Host (Musanze):   imma@gari.rw    / password123');
  console.log('   Host (Rubavu):    david@gari.rw   / password123');
  console.log('   Renter:           amina@gari.rw   / password123');
  console.log('   Admin:            admin@gari.rw   / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
