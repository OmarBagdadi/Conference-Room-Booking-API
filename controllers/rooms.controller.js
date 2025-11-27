const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getRooms(req,res) {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
}

async function createRoom(req, res) {
  const data = req.body;
  const created = await prisma.room.create({ data });
  res.status(201).json(created);
}

async function getRoomAvailability(req, res, next) {
  try {
    // validate room id
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid room id' });
    }

    // validate date arguement
    const date = req.query.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid or missing date (YYYY-MM-DD)' });
    }

    // verify room exists
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // define working hours on that date (local time)
    const workStart = new Date(`${date}T09:00:00`);
    const workEnd = new Date(`${date}T17:00:00`);

    // fetch bookings that intersect working hours, ignore cancelled
    const bookings = await prisma.booking.findMany({
      where: {
        roomId: id,
        status: { not: 'cancelled' },
        AND: [
          { startTime: { lt: workEnd } },
          { endTime: { gt: workStart } }
        ]
      },
      orderBy: { startTime: 'asc' }
    });

    // build availability by subtracting bookings from working hours
    const availability = [];
    let cursor = workStart;

    for (const b of bookings) {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);

      // if there's free time before this booking
      if (bStart > cursor) {
        const slotEnd = bStart < workEnd ? bStart : workEnd;
        if (cursor < slotEnd) {
          availability.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
        }
      }

      // move cursor forward
      if (bEnd > cursor) cursor = bEnd;
      if (cursor >= workEnd) break;
    }

    // final slot after last booking
    if (cursor < workEnd) {
      availability.push({ start: cursor.toISOString(), end: workEnd.toISOString() });
    }

    res.json({ date, roomId: id, availability });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRooms, createRoom , getRoomAvailability};