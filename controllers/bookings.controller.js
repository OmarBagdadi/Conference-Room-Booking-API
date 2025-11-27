const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


async function getBookings(req, res) {
    try {
        const bookings = await prisma.booking.findMany();
        res.json(bookings);
    } catch (err) {
        res.status(404).json({ error: 'No bookings found' })
    }
}


async function getBookingById(req, res, next) {
  try {
    const id = req.params.id;
    const bookingId = Number(id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true, user: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
}


async function createBooking(req, res) {
    try {
    const { room_id, user_id, start_time, end_time, title } = req.body;

    // basic validation
    if (
      typeof room_id !== 'number' ||
      typeof user_id !== 'number' ||
      typeof title !== 'string' ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ error: 'Invalid start_time or end_time' });
    }

    // working hours check (09:00 - 17:00)
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const WORK_START = 9 * 60;   // 09:00
    const WORK_END = 17 * 60;    // 17:00

    if (startMinutes < WORK_START || endMinutes > WORK_END) {
      return res.status(400).json({ error: 'Bookings must be within working hours 09:00-17:00' });
    }

    // duration constraints: min 30 minutes, max 4 hours (240 minutes)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 30) {
      return res.status(400).json({ error: 'Minimum booking duration is 30 minutes' });
    }
    if (durationMinutes > 240) {
      return res.status(400).json({ error: 'Maximum booking duration is 4 hours' });
    }

    // verify room and user exist (optional but recommended)
    const [room, user] = await Promise.all([
      prisma.room.findUnique({ where: { id: room_id } }),
      prisma.user.findUnique({ where: { id: user_id } }),
    ]);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // check for overlapping bookings on the same room
    // overlap if existing.start < newEnd AND existing.end > newStart
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId: room_id,
        status: { not: 'cancelled' },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } }
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Booking conflict',
        conflict: {
          id: conflict.id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          title: conflict.title
        }
      });
    }

    // create booking
    const created = await prisma.booking.create({
      data: {
        roomId: room_id,
        userId: user_id,
        title,
        startTime: start,
        endTime: end
      }
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}


async function updateBooking(req, res, next) {
  try {
    const id = req.params.id;
    const bookingId = Number(id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }

    const { title, start_time, end_time } = req.body;
    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'start_time and end_time are required' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ error: 'Invalid start_time or end_time' });
    }

    // working hours check (09:00 - 17:00)
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const WORK_START = 9 * 60;   // 09:00
    const WORK_END = 17 * 60;    // 17:00

    if (startMinutes < WORK_START || endMinutes > WORK_END) {
      return res.status(400).json({ error: 'Bookings must be within working hours 09:00-17:00' });
    }

    // duration constraints: min 30 minutes, max 4 hours (240 minutes)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 30) {
      return res.status(400).json({ error: 'Minimum booking duration is 30 minutes' });
    }
    if (durationMinutes > 240) {
      return res.status(400).json({ error: 'Maximum booking duration is 4 hours' });
    }

    // verify booking exists and get roomId
    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!existing) return res.status(404).json({ error: 'Booking not found' });

    const roomId = existing.roomId;

    // check for overlapping bookings on the same room excluding this booking
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId: roomId,
        id: { not: bookingId },
        status: { not: 'cancelled' },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } }
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Booking conflict',
        conflict: {
          id: conflict.id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          title: conflict.title
        }
      });
    }

    // perform update
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        title: typeof title === 'string' ? title : existing.title,
        startTime: start,
        endTime: end
      }
    });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteBooking(req, res, next) {
  try {
    const id = req.params.id;
    const bookingId = Number(id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }

    // verify booking exists
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // soft-delete, mark as 'cancelled'
    // if (booking.status === 'cancelled') {
    //   return res.status(400).json({ error: 'Booking already cancelled' });
    // }

    // const cancelled = await prisma.booking.update({
    //   where: { id: bookingId },
    //   data: { status: 'cancelled' }
    // });
    const cancelled = await prisma.booking.delete({ 
        where: { id: bookingId } 
    });

    res.json({ message: 'Booking cancelled', booking: cancelled });
  } catch (err) {
    next(err);
  }
}

module.exports = {getBookings, getBookingById, createBooking, updateBooking ,deleteBooking};