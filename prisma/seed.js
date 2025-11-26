const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.room.createMany({
    data: [
      { name: "Room A", capacity: 6, amenities: ["TV", "Whiteboard"] },
      { name: "Room B", capacity: 10, amenities: ["Projector", "Conference Phone"] }
    ]
  })
  await prisma.user.createMany({
    data: [
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" }
    ]
  })
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())