const express = require('express');
const router = express.Router();

const { getRooms, createRoom , getRoomAvailability, filterRooms} =  require('../controllers/rooms.controller.js');

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
 * /rooms/filter:
 *   get:
 *     summary: Filter rooms by minimum capacity and/or amenities
 *     description: Provide either or both query parameters to filter rooms. Amenities can be provided as a comma separated string or repeated query parameter.
 *     parameters:
 *       - in: query
 *         name: capacity
 *         schema:
 *           type: integer
 *         description: Minimum required capacity (optional)
 *         example: 6
 *       - in: query
 *         name: amenities
 *         schema:
 *           type: string
 *         description: Comma separated list of required amenities or repeated param (optional). eg. "TV,Whiteboard"
 *     responses:
 *       '200':
 *         description: List of rooms matching filters
 *       '400':
 *         description: Invalid query parameters
 */
router.get('/filter', filterRooms);


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

/**
 * @openapi
 * /rooms/{id}/availability:
 *   get:
 *     summary: Get room availability for a given date
 *     description: Returns available time ranges within working hours (09:00-17:00) for the specified room and date.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Room ID
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: date
 *         in: query
 *         description: Date in YYYY-MM-DD format
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-11-27"
 *     responses:
 *       '200':
 *         description: Available time ranges for the room on the requested date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   format: date
 *                 roomId:
 *                   type: integer
 *                 availability:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-27T09:00:00.000Z"
 *                       end:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-27T10:30:00.000Z"
 *       '400':
 *         description: Invalid room id or missing/invalid date
 *       '404':
 *         description: Room not found
 */
router.get('/:id/availability', getRoomAvailability);

module.exports = router;