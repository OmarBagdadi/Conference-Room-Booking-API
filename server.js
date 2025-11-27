const express = require('express');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
// import {swaggerSpec} from './src/swaggerdocConfig.js';
const { swaggerSpec } = require('./swaggerdocConfig');
const roomsRouter = require('./routes/rooms.route.js');
const usersRouter = require('./routes/users.route.js');
const bookingsRouter = require('./routes/bookings.route.js');

const app = express();
app.use(cors());
app.use(express.json());

// swagger ui
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// health
/**
 * @openapi
 * /:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/', (req, res) => res.send({ ok: true }));

// mount API routers
app.use('/rooms', roomsRouter);
app.use('/users', usersRouter);
app.use('/bookings', bookingsRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on ${port} — docs: http://localhost:${port}/docs`));