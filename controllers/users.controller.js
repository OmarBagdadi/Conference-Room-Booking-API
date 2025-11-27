const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


async function getUsers(req, res) {
  const users = await prisma.user.findMany();
  res.json(users);
}

async function getUserBookings(req, res, next) {
  try {
    const id = req.params.id;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { room: true },
      orderBy: { startTime: 'asc' }
    });

    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers , getUserBookings };