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

module.exports = { getRooms, createRoom };