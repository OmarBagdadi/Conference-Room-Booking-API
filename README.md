# Conference-Room-Booking-API

An API for booking conference rooms with containerized PostgreSQL database and Node.js API server.

## Prerequisites

- **Docker** and **Docker Compose** installed
  - Download from [docker.com](https://www.docker.com/products/docker-desktop)
- **Git** (to clone the repo)

No need to install Node.js, npm, or PostgreSQL everything runs in containers.

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/OmarBagdadi/Conference-Room-Booking-API.git
cd Conference-Room-Booking-API
```

### 2. Start the API and Database

```bash
docker compose up --build
```
or

```bash
docker compose up --build -d
```
to run in detached mode

This command:

- Builds the API Docker image
- Starts the PostgreSQL database container
- Starts the API server on http://localhost:3000
- Runs Prisma migrations automatically

Wait for output showing

```bash
Server listening on 3000 — docs: http://localhost:3000/docs
```

### 3. Access the API
- Swagger UI (API Docs): http://localhost:3000/docs

#### Common Commands

- Run Prisma Studio (GUI database viewer)

```bash
docker compose run --rm -p 5555:5555 api npx prisma studio
```
Opens at http://localhost:5555

- Run Database Migrations
```bash
docker compose run --rm api npx prisma migrate dev --name <migration_name>
```
- Seed the Database (populate with sample data)
```bash
docker compose run --rm api node prisma/seed.js
```
- View Logs
```bash
# All services
docker compose logs -f

# API only
docker compose logs -f api

# Database only
docker compose logs -f db
```
- Stop the Services
```bash
docker compose down
```
- Stop and Remove Data (reset database)
```bash
docker compose down -v
```

## Project Structure

```
├── server.js                 # Express server entry point
├── controllers/              # Route handler logic
├── routes/                   # API route definitions
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.js              # Seed script for sample data
│   └── migrations/          # Database migrations
├── Dockerfile               # Docker image configuration
├── docker-compose.yml       # Multi-container orchestration
├── scripts/
│   └── entrypoint.sh        # Container startup script
└── .env                     # Environment variables (local dev)
```

## API Endpoints

- **GET /docs** — Swagger API documentation
- **GET /rooms** — List all rooms
- **POST /rooms** — Create a new room
- **GET /rooms/:id/availability?date=YYYY-MM-DD** — Check room availability
- **GET /rooms/filter?capacity=6&amenities=TV,Whiteboard** — Filter rooms
- **GET /users** — List all users
- **GET /users/:id/bookings** — Get user's bookings
- **GET /bookings** — List all bookings
- **POST /bookings** — Create a booking
- **GET /bookings/:id** — Get booking details
- **PATCH /bookings/:id** — Update/reschedule a booking
- **DELETE /bookings/:id** — Cancel a booking

## Test Cases for Routes

### Rooms Routes
- GET /rooms — List all rooms
  - 200 OK: Returns an array of rooms with id, name, capacity, amenities.
  - Validation: Ensure seeded rooms appear (e.g., “Conference Room A” with capacity 10).
- POST /rooms — Create a new room
  - 201 Created: When valid payload { name: "New Room", capacity: 8, amenities: ["TV"] }.
  - 400 Bad Request: Missing required fields (e.g., no name).
  - Validation: Room appears in subsequent GET /rooms.
- GET /rooms/:id/availability?date=YYYY-MM-DD
  - 200 OK: Returns availability slots for valid room and date.
  - 404 Not Found: Invalid room id.
  - 400 Bad Request: Missing or invalid date query.
  - Validation: Ensure booked slots are excluded, free slots within 09:00–17:00 returned.
- GET /rooms/filter?capacity=6&amenities=TV,Whiteboard
  - 200 OK: Returns rooms matching filters.
  - 400 Bad Request: Invalid query parameters (e.g., non‑integer capacity).
  - Validation: Ensure only rooms with capacity ≥6 and both amenities are returned.

### Users Routes
- GET /users — List all users
  `- 200 OK: Returns array of users with id, name, email.
  -` Validation: Seeded users appear.
- GET /users/:id/bookings — Get user’s bookings
  - 200 OK: Returns bookings for valid user id.
  - 404 Not Found: Invalid user id.
  - Validation: Ensure bookings match the user’s seeded data.

### Bookings Routes
- GET /bookings — List all bookings
  - 200 OK: Returns array of bookings with id, roomId, userId, status.
  - Validation: Seeded bookings appear.
- POST /bookings — Create a booking
  - 201 Created: Valid payload creates active booking.
  - 409 Conflict: Overlapping booking → should create pending booking + waiting list entry.
  - 400 Bad Request: Invalid payload (e.g., duration <30 minutes).
  - Validation: Booking appears in GET /bookings, history entry created.
- GET /bookings/:id — Get booking details
  - 200 OK: Returns booking details for valid id.
  - 404 Not Found: Invalid booking id.
- PATCH /bookings/:id — Update/reschedule a booking
  - 200 OK: Valid update changes times and logs history.
  - 409 Conflict: Attempt to reschedule into occupied slot.
  - 404 Not Found: Invalid booking id.
  - Special Case: If status changed to complete and recurrence rule exists → new booking created.
  - Validation: Updated booking returned, history entry created, recurrence booking appears.
- DELETE /bookings/:id — Cancel a booking
  - 200 OK: Cancels booking, logs history, promotes earliest pending booking if any.
  - 400 Bad Request: Already cancelled booking.
  - 404 Not Found: Invalid booking id.
  - Validation: Cancelled booking status = cancelled, promoted booking status = active, waiting list updated.


## Troubleshooting

Database connection error
- Ensure ```docker compose up``` completed successfully
- Check logs: ```docker compose logs db```
- Verify DATABASE_URL in [docker-compose.yml](./docker-compose.yml) uses db as host (not localhost)

Prisma client error
- Rebuild without cache: ```docker compose build --no-cache api```
- Regenerate client: ```docker compose run --rm api npx prisma generate```

Port already in use
- Change port mappings in [docker-compose.yml](./docker-compose.yml):
    - API: change "3000:3000" to "3001:3000" (host:container)
    - Database: change "5432:5432" to "5433:5432"

Container won't start
- Check logs: ```docker compose logs api```
- Ensure .env file exists (or use docker-compose env vars)
- Verify Docker daemon is running

## Tech Stack

- Backend: **Node.js + Express.js**
- Database: **PostgreSQL 15**
- ORM: **Prisma**
- API Documentation: **Swagger (OpenAPI 3.0)**
- Containerization: **Docker & Docker Compose**