const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function setTime(baseDate, hour, minute = 0) {
  const d = new Date(baseDate)
  d.setHours(hour, minute, 0, 0)
  return d
}

function workSlot(baseDate, startHour, durationMinutes) {
  const start = setTime(baseDate, startHour)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  return { start, end }
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

  // --- Bookings (all between 9–17) ---
  const slot1 = workSlot(addDays(now, 1), 9, 30)   // 09:00–09:30
  const booking1 = await prisma.booking.create({
    data: {
      roomId: 1,
      userId: 1,
      title: "Daily Standup",
      startTime: slot1.start,
      endTime: slot1.end,
      status: "active",
      recurrenceId: dailyRule.id
    }
  })

  const slot2 = workSlot(addDays(now, 2), 10, 60)  // 10:00–11:00
  const booking2 = await prisma.booking.create({
    data: {
      roomId: 2,
      userId: 2,
      title: "Weekly Sync",
      startTime: slot2.start,
      endTime: slot2.end,
      status: "active",
      recurrenceId: weeklyRule.id
    }
  })

  const slot3 = workSlot(addDays(now, 3), 14, 90)  // 14:00–15:30
  const booking3 = await prisma.booking.create({
    data: {
      roomId: 3,
      userId: 3,
      title: "Client Presentation",
      startTime: slot3.start,
      endTime: slot3.end,
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