const express = require('express');
const router = express.Router();

const { getUsers } = require('../controllers/users.controller.js');

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

module.exports = router;