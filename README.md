# Conference-Room-Booking-API

An API for booking conference rooms with containerized PostgreSQL database and Node.js API server.

## Prerequisites

- **Docker** and **Docker Compose** installed
  - Download from [docker.com](https://www.docker.com/products/docker-desktop)
- **Git** (to clone the repo)

That's it! No need to install Node.js, npm, or PostgreSQL — everything runs in containers.

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
- API Base URL: http://localhost:3000

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