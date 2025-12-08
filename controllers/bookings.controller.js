const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


async function getBookings(req, res) {
    try {
        const bookings = await prisma.booking.findMany({
            where: { status: { not: 'cancelled' } }
        });
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
      where: { id: bookingId , status: { not: 'cancelled' }},
      include: { room: true, user: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
}


async function createBooking(req, res, next) {
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

    // Check if start_time and end_time are valid dates
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

    // check if within working hours
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

    // verify room and user exist
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
      // wrap pending booking + waiting list + history in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const pendingBooking = await tx.booking.create({
          data: {
            roomId: room_id,
            userId: user_id,
            title,
            startTime: start,
            endTime: end,
            status: 'pending'
          }
        });

        const waiting = await tx.waitingList.create({
          data: {
            bookingId: pendingBooking.id,   // ✅ link to the new pending booking
            status: 'pending'
          }
        });

        const history = await tx.bookingHistory.create({
          data: {
            bookingId: pendingBooking.id,   // ✅ log against the pending booking
            action: 'created-pending',
            changedById: user_id
          }
        });

        return { pendingBooking, waiting, history };
      });

      return res.status(409).json({
        error: 'Booking conflict — request added as pending and queued in waiting list',
        conflict: {
          id: conflict.id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          title: conflict.title
        },
        pendingBooking: result.pendingBooking,
        waitingListEntry: result.waiting
      });
    }


    // wrap active booking + history in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          roomId: room_id,
          userId: user_id,
          title,
          startTime: start,
          endTime: end,
          status: 'active'
        }
      });

      await tx.bookingHistory.create({
        data: {
          bookingId: created.id,
          action: 'created',
          changedById: user_id
        }
      });

      return created;
    });

  res.status(201).json(result);

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

    const { title, start_time, end_time, status } = req.body;

    // verify booking exists
    const existing = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { recurrence: true }
    });
    if (!existing) return res.status(404).json({ error: 'Booking not found' });

    // --- CASE 1: status-only update should only accept complete ---
    if (status && !start_time && !end_time) {

      // verify status update is valid
      if (status !== 'complete') {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.booking.update({
          where: { id: bookingId },
          data: { status }
        });

        await tx.bookingHistory.create({
          data: {
            bookingId,
            action: `status-changed-to-${status}`,
            changedById: existing.userId
          }
        });

        // recurrence logic: if marked complete and has recurrence rule
        let nextBooking = null;
        if (status === 'complete' && existing.recurrence) {
          const rule = existing.recurrence;
          let nextStart = new Date(existing.startTime);
          let nextEnd = new Date(existing.endTime);

          if (rule.frequency === 'daily') {
            nextStart.setDate(nextStart.getDate() + rule.interval);
            nextEnd.setDate(nextEnd.getDate() + rule.interval);
          } else if (rule.frequency === 'weekly') {
            nextStart.setDate(nextStart.getDate() + 7 * rule.interval);
            nextEnd.setDate(nextEnd.getDate() + 7 * rule.interval);
          }

          if (!rule.endDate || nextStart <= rule.endDate) {
            nextBooking = await tx.booking.create({
              data: {
                roomId: existing.roomId,
                userId: existing.userId,
                title: existing.title,
                startTime: nextStart,
                endTime: nextEnd,
                status: 'active',
                recurrenceId: rule.id
              }
            });

            await tx.bookingHistory.create({
              data: {
                bookingId: nextBooking.id,
                action: 'created-from-recurrence',
                changedById: existing.userId
              }
            });
          }
        }

        return { updated, nextBooking };
      });

      return res.status(200).json(result);
    }

    // --- CASE 2: reschedule update ---

    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'start_time and end_time are required' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ error: 'Invalid start_time or end_time' });
    }

    // working hours check
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const WORK_START = 9 * 60;
    const WORK_END = 17 * 60;
    if (startMinutes < WORK_START || endMinutes > WORK_END) {
      return res.status(400).json({ error: 'Bookings must be within working hours 09:00-17:00' });
    }

    // duration constraints
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 30) {
      return res.status(400).json({ error: 'Minimum booking duration is 30 minutes' });
    }
    if (durationMinutes > 240) {
      return res.status(400).json({ error: 'Maximum booking duration is 4 hours' });
    }

    const roomId = existing.roomId;
    const oldStart = existing.startTime;
    const oldEnd = existing.endTime;

    // check for overlapping bookings excluding this one
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId,
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
        error: 'Booking conflict — cannot update to an occupied slot',
        conflict: {
          id: conflict.id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          title: conflict.title
        }
      });
    }

    // Transaction: update booking + history + promotion + recurrence
    const result = await prisma.$transaction(async (tx) => {
      // update booking
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          title: typeof title === 'string' ? title : existing.title,
          startTime: start,
          endTime: end,
          status: status || 'active'
        }
      });

      // add history
      await tx.bookingHistory.create({
        data: {
          bookingId,
          action: 'updated',
          changedById: existing.userId
        }
      });

      // promotion logic for old slot
      let promoted = null;
      const pendingBooking = await tx.booking.findFirst({
        where: {
          roomId,
          status: 'pending',
          startTime: oldStart,
          endTime: oldEnd
        }
      });
      if (pendingBooking) {
        promoted = await tx.booking.update({
          where: { id: pendingBooking.id },
          data: { status: 'active' }
        });
        await tx.waitingList.updateMany({
          where: {
            bookingId: pendingBooking.id,
            status: 'pending'
          },
          data: { status: 'converted' }
        });
        await tx.bookingHistory.create({
          data: {
            bookingId: pendingBooking.id,
            action: 'promoted-from-waiting',
            changedById: pendingBooking.userId
          }
        });
      }

      // recurrence logic: if marked complete and has recurrence rule
      let nextBooking = null;
      if (status === 'complete' && existing.recurrence) {
        const rule = existing.recurrence;
        let nextStart = new Date(start);
        let nextEnd = new Date(end);

        if (rule.frequency === 'daily') {
          nextStart.setDate(nextStart.getDate() + rule.interval);
          nextEnd.setDate(nextEnd.getDate() + rule.interval);
        } else if (rule.frequency === 'weekly') {
          nextStart.setDate(nextStart.getDate() + 7 * rule.interval);
          nextEnd.setDate(nextEnd.getDate() + 7 * rule.interval);
        }
        // add other recurrence types as needed

        // only create if within recurrence window
        if (!rule.endDate || nextStart <= rule.endDate) {
          nextBooking = await tx.booking.create({
            data: {
              roomId,
              userId: existing.userId,
              title: existing.title,
              startTime: nextStart,
              endTime: nextEnd,
              status: 'active',
              recurrenceId: rule.id
            }
          });
          await tx.bookingHistory.create({
            data: {
              bookingId: nextBooking.id,
              action: 'created-from-recurrence',
              changedById: existing.userId
            }
          });
        }
      }

      return { updated, promoted, nextBooking };
    });

    res.status(200).json(result);
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

    // verify booking exists (include recurrence rule)
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { recurrence: true }
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    // Transaction: cancel booking + history + promotion logic + recurrence
    const result = await prisma.$transaction(async (tx) => {
      // soft-delete: mark as cancelled
      const cancelled = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'cancelled' }
      });

      // log cancellation in history
      await tx.bookingHistory.create({
        data: {
          bookingId,
          action: 'cancelled',
          changedById: booking.userId
        }
      });

      // promotion logic
      const pendingBooking = await tx.booking.findFirst({
        where: {
          roomId: booking.roomId,
          status: 'pending'
        },
        orderBy: { startTime: 'asc' }
      });

      let promoted = null;
      let updatedWaiting = null;

      if (pendingBooking) {
        // promote to active
        promoted = await tx.booking.update({
          where: { id: pendingBooking.id },
          data: { status: 'active' }
        });

        // update waiting list entry
        updatedWaiting = await tx.waitingList.updateMany({
          where: {
            bookingId: pendingBooking.id,
            status: 'pending'
          },
          data: { status: 'converted' }
        });

        // log promotion in history
        await tx.bookingHistory.create({
          data: {
            bookingId: pendingBooking.id,
            action: 'promoted-from-waiting',
            changedById: pendingBooking.userId
          }
        });
      }

      // recurrence logic: if booking has recurrence rule
      let nextBooking = null;
      if (booking.recurrence) {
        const rule = booking.recurrence;
        let nextStart = new Date(booking.startTime);
        let nextEnd = new Date(booking.endTime);

        if (rule.frequency === 'daily') {
          nextStart.setDate(nextStart.getDate() + rule.interval);
          nextEnd.setDate(nextEnd.getDate() + rule.interval);
        } else if (rule.frequency === 'weekly') {
          nextStart.setDate(nextStart.getDate() + 7 * rule.interval);
          nextEnd.setDate(nextEnd.getDate() + 7 * rule.interval);
        }

        // only create if within recurrence window
        if (!rule.endDate || nextStart <= rule.endDate) {
          nextBooking = await tx.booking.create({
            data: {
              roomId: booking.roomId,
              userId: booking.userId,
              title: booking.title,
              startTime: nextStart,
              endTime: nextEnd,
              status: 'active',
              recurrenceId: rule.id
            }
          });

          await tx.bookingHistory.create({
            data: {
              bookingId: nextBooking.id,
              action: 'created-from-recurrence',
              changedById: booking.userId
            }
          });
        }
      }

      return { cancelled, promoted, updatedWaiting, nextBooking };
    });

    res.json({
      message: 'Booking cancelled',
      booking: result.cancelled,
      promotedBooking: result.promoted,
      waitingListUpdate: result.updatedWaiting,
      nextBooking: result.nextBooking
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {getBookings, getBookingById, createBooking, updateBooking ,deleteBooking};