const express = require('express');
const router = express.Router();

const { getUsers , getUserBookings} = require('../controllers/users.controller.js');

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List users
 *     responses:
 *       200:
 *         description: array of users
 */
router.get('/', getUsers );

/**
 * @openapi
 * /users/{id}/bookings:
 *   get:
 *     summary: Get all bookings for a specific user
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: array of bookings
 */
router.get('/:id/bookings', getUserBookings);


module.exports = router;