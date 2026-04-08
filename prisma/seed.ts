import { PrismaClient, Role, RoomStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@roomcontrol.app" },
    update: {},
    create: {
      name: "Admin RoomControl",
      email: "admin@roomcontrol.app",
      hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  // Create receptionist
  const receptionist = await prisma.user.upsert({
    where: { email: "reception@roomcontrol.app" },
    update: {},
    create: {
      name: "Marie Dupont",
      email: "reception@roomcontrol.app",
      hashedPassword: await bcrypt.hash("reception123", 12),
      role: "RECEPTIONIST",
    },
  });

  // Create housekeeping user
  const housekeeper = await prisma.user.upsert({
    where: { email: "menage@roomcontrol.app" },
    update: {},
    create: {
      name: "Pierre Martin",
      email: "menage@roomcontrol.app",
      hashedPassword: await bcrypt.hash("menage123", 12),
      role: "HOUSEKEEPING",
    },
  });

  // Create demo hotel
  const hotel = await prisma.hotel.create({
    data: {
      name: "Grand Hotel du Lac",
      address: "12 Avenue du Lac, 74000 Annecy",
      phone: "+33 4 50 12 34 56",
      email: "contact@grandhoteldulac.fr",
      users: {
        create: [
          { userId: admin.id, role: "ADMIN" },
          { userId: receptionist.id, role: "RECEPTIONIST" },
          { userId: housekeeper.id, role: "HOUSEKEEPING" },
        ],
      },
    },
  });

  // Create room categories
  const categories = await Promise.all([
    prisma.roomCategory.create({
      data: {
        hotelId: hotel.id,
        name: "Simple",
        description: "Chambre simple confortable avec vue jardin",
        price: 89,
        capacity: 1,
        amenities: JSON.stringify(["Wi-Fi", "TV", "Climatisation"]),
      },
    }),
    prisma.roomCategory.create({
      data: {
        hotelId: hotel.id,
        name: "Double",
        description: "Chambre double spacieuse avec lit king-size",
        price: 129,
        capacity: 2,
        amenities: JSON.stringify(["Wi-Fi", "TV", "Climatisation", "Minibar", "Coffre-fort"]),
      },
    }),
    prisma.roomCategory.create({
      data: {
        hotelId: hotel.id,
        name: "Suite",
        description: "Suite luxueuse avec salon separé et vue lac",
        price: 249,
        capacity: 3,
        amenities: JSON.stringify(["Wi-Fi", "TV 55\"", "Climatisation", "Minibar", "Coffre-fort", "Baignoire balnéo", "Balcon"]),
      },
    }),
    prisma.roomCategory.create({
      data: {
        hotelId: hotel.id,
        name: "Deluxe",
        description: "Chambre Deluxe panoramique avec terrasse privee",
        price: 189,
        capacity: 2,
        amenities: JSON.stringify(["Wi-Fi", "TV", "Climatisation", "Minibar", "Coffre-fort", "Terrasse"]),
      },
    }),
  ]);

  // Create rooms
  const roomsData: { number: string; floor: number; categoryId: string; status: RoomStatus }[] = [];

  // Simple rooms: 101-105
  for (let i = 1; i <= 5; i++) {
    roomsData.push({
      number: `10${i}`,
      floor: 1,
      categoryId: categories[0].id,
      status: i <= 2 ? "OCCUPIED" : i === 5 ? "MAINTENANCE" : "AVAILABLE",
    });
  }

  // Double rooms: 201-210
  for (let i = 1; i <= 10; i++) {
    roomsData.push({
      number: `2${String(i).padStart(2, "0")}`,
      floor: 2,
      categoryId: categories[1].id,
      status: i <= 4 ? "OCCUPIED" : i === 8 ? "CLEANING" : "AVAILABLE",
    });
  }

  // Deluxe rooms: 301-305
  for (let i = 1; i <= 5; i++) {
    roomsData.push({
      number: `30${i}`,
      floor: 3,
      categoryId: categories[3].id,
      status: i <= 2 ? "OCCUPIED" : "AVAILABLE",
    });
  }

  // Suites: 401-403
  for (let i = 1; i <= 3; i++) {
    roomsData.push({
      number: `40${i}`,
      floor: 4,
      categoryId: categories[2].id,
      status: i === 1 ? "OCCUPIED" : "AVAILABLE",
    });
  }

  const rooms = await Promise.all(
    roomsData.map((r) =>
      prisma.room.create({
        data: { hotelId: hotel.id, ...r },
      })
    )
  );

  // Create demo guests
  const guests = await Promise.all([
    prisma.guest.create({
      data: { firstName: "Jean", lastName: "Martin", email: "jean.martin@email.com", phone: "+33 6 12 34 56 78", nationality: "Française" },
    }),
    prisma.guest.create({
      data: { firstName: "Sophie", lastName: "Bernard", email: "sophie.b@email.com", phone: "+33 6 98 76 54 32", nationality: "Française" },
    }),
    prisma.guest.create({
      data: { firstName: "James", lastName: "Wilson", email: "j.wilson@email.com", phone: "+44 7700 900000", nationality: "Britannique" },
    }),
    prisma.guest.create({
      data: { firstName: "Anna", lastName: "Schmidt", email: "anna.s@email.de", phone: "+49 151 12345678", nationality: "Allemande" },
    }),
  ]);

  // Create demo bookings
  const today = new Date();
  const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED");

  for (let i = 0; i < Math.min(occupiedRooms.length, guests.length); i++) {
    const checkIn = new Date(today);
    checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 3));
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2 + Math.floor(Math.random() * 5));
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        roomId: occupiedRooms[i].id,
        guestId: guests[i].id,
        createdById: receptionist.id,
        checkIn,
        checkOut,
        nights,
        guests: 1 + Math.floor(Math.random() * 2),
        status: "CHECKED_IN",
        ratePerNight: categories.find((c) => c.id === occupiedRooms[i].categoryId)?.price || 100,
        totalAmount: (categories.find((c) => c.id === occupiedRooms[i].categoryId)?.price || 100) * nights,
        paymentMethod: i % 2 === 0 ? "CARD" : "CASH",
        isPaid: true,
      },
    });
  }

  console.log("Seed completed!");
  console.log(`Created: 1 hotel, ${rooms.length} rooms, ${guests.length} guests`);
  console.log("Admin login: admin@roomcontrol.app / admin123");
  console.log("Reception login: reception@roomcontrol.app / reception123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
