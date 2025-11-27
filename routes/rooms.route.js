const express = require('express');
const router = express.Router();

const { getRooms, createRoom } =  require('../controllers/rooms.controller.js');

/**
 * @openapi
 * /rooms:
 *   get:
 *     summary: List rooms
 *     responses:
 *       200:
 *         description: array of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   capacity:
 *                     type: integer
 */
router.get('/', getRooms);

/**
 * @openapi
 * /rooms:
 *   post:
 *     summary: Create room
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: created
 */
router.post('/', createRoom);

module.exports = router;