const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
function addHours(date, hours) {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

async function main() {
  const now = new Date()

  // --- Rooms ---
  await prisma.room.createMany({
    data: [
      { name: "Room A", capacity: 6, amenities: ["TV", "Whiteboard"] },
      { name: "Room B", capacity: 10, amenities: ["Projector", "Conference Phone"] },
      { name: "Room C", capacity: 20, amenities: ["Projector", "Video Conferencing", "Whiteboard"] },
      { name: "Room D", capacity: 4, amenities: ["Monitor"] }
    ]
  })

  // --- Users ---
  await prisma.user.createMany({
    data: [
      { name: "Alice", email: "alice@example.com", role: "admin" },
      { name: "Bob", email: "bob@example.com", role: "member" },
      { name: "Charlie", email: "charlie@example.com", role: "member" },
      { name: "Diana", email: "diana@example.com", role: "member" },
      { name: "Eve", email: "eve@example.com", role: "member" }
    ]
  })

  // --- Recurrence Rules ---
  const dailyRule = await prisma.recurrenceRule.create({
    data: {
      frequency: "daily",
      interval: 1,
      startDate: addDays(now, 1),
      endDate: addDays(now, 7)
    }
  })

  const weeklyRule = await prisma.recurrenceRule.create({
    data: {
      frequency: "weekly",
      interval: 1,
      startDate: addDays(now, 2),
      endDate: addDays(now, 60)
    }
  })

  // --- Bookings ---
  const booking1 = await prisma.booking.create({
    data: {
      roomId: 1,
      userId: 1,
      title: "Daily Standup",
      startTime: addHours(addDays(now, 1), 9),
      endTime: addHours(addDays(now, 1), 9.5),
      status: "active",
      recurrenceId: dailyRule.id
    }
  })

  const booking2 = await prisma.booking.create({
    data: {
      roomId: 2,
      userId: 2,
      title: "Weekly Sync",
      startTime: addHours(addDays(now, 2), 10),
      endTime: addHours(addDays(now, 2), 11),
      status: "active",
      recurrenceId: weeklyRule.id
    }
  })

  const booking3 = await prisma.booking.create({
    data: {
      roomId: 3,
      userId: 3,
      title: "Client Presentation",
      startTime: addHours(addDays(now, 3), 14),
      endTime: addHours(addDays(now, 3), 15.5),
      status: "pending"
    }
  })

  // --- Waiting List (one-to-one with booking3) ---
  await prisma.waitingList.create({
    data: {
      bookingId: booking3.id,
      status: "pending"
    }
  })

  // --- Booking History ---
  await prisma.bookingHistory.createMany({
    data: [
      { bookingId: booking1.id, action: "created", changedById: 1 },
      { bookingId: booking2.id, action: "created", changedById: 2 },
      { bookingId: booking3.id, action: "created-pending", changedById: 3 }
    ]
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })