const express = require('express');
const router = express.Router();

const { getBookings , getBookingById, createBooking, updateBooking, deleteBooking } =  require('../controllers/bookings.controller.js');

/**
 * @openapi
 * /bookings:
 *   get:
 *     summary: List bookings
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/', getBookings);

/**
 * @openapi
 * /bookings/{id}:
 *   get:
 *     summary: Get booking by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking found
 */
router.get('/:id', getBookingById);


/**
 * @openapi
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - room_id
 *               - title
 *               - start_time
 *               - end_time
 *             properties:
 *               user_id:
 *                 type: integer
 *               room_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: This field represents a date in ISO 8601 format (e.g., 2023-10-27)    
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: This field represents a date in ISO 8601 format (e.g., 2023-10-27)
 *     responses:
 *       201:
 *         description: New booking created
 */
router.post('/', createBooking);


/**
 * @openapi
 * /bookings/{id}:
 *   patch:
 *     summary: Update an existing booking
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_time
 *               - end_time
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the booking (optional)
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: This field represents a date in ISO 8601 format (e.g., 2023-10-27)    
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: This field represents a date in ISO 8601 format (e.g., 2023-10-27)
 *              status:
 *                 type: string
 *                 description: Status of the booking can only be updated to complete(optional)
 *     responses:
 *       200:
 *         description: Booking sucessfully updated 
 */
router.patch('/:id', updateBooking);

/**
 * @openapi
 * /bookings/{id}:
 *   delete:
 *     summary: Delete a booking by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking deleted
 */
router.delete('/:id', deleteBooking);

module.exports = router;