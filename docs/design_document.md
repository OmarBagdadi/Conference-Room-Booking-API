# Conference Room Booking system design document

## Database Design
I wanted a schema that achieved 3NF, had no redundant attributes, strong data integrity, clear separation of concerns, was easy to maintain, and captured the booking lifecycle clearly. Heres the schema I came up with:

- Users & Rooms: Core entities, normalized so bookings reference them by ID instead of duplicating details.
- Bookings: Central table with lifecycle status (active, pending, cancelled, completed). Holds start/end times, user, room, and optional recurrence rule.
- RecurrenceRule: Separate table for repeat patterns (daily/weekly), avoiding duplication across bookings.
- WaitingList: One‑to‑one with a pending booking. Tracks promotion state (pending, notified, converted). This prevents duplication of user/room/time data.
- BookingHistory: Append‑only log of actions (created, updated, cancelled, promoted). Ensures auditability and analytics.
- Normalization: Achieves 3NF — no redundant attributes, strong referential integrity, and clear separation of concerns.

## Logic Approach
I focused on keeping business rules clear and consistent, with validation and conflict handling at the application level.

- Validation enforces working hours (09–17), minimum 30 min maximum 4 hours duration rule, and valid dates.
- Conflict detection uses interval overlap checks.
- Create flow: conflict → create pending booking + add to waiting list; else → create active booking.
- Update flow: reject update if selected slot occupied; if rescheduled sucessfully, promote the first pending booking waiting for the freed slot.
- Delete flow: cancel booking, then promote earliest pending booking if any.
- History records every transition.
- Transactions ensure atomicity for promotion and cancellation.


## Concurrent Requests
I thought about race conditions and made sure operations are safe under concurrent load.

- Transactions: Wrap conflict check and booking creation/update/cancel in a single transaction.
- Deterministic promotion: Always promote the earliest pending booking (by start time or creation order).
- Indexes: On (roomId, startTime, endTime, status) to make overlap checks efficient.
- Row locks: Can be used to prevent two concurrent promotions from selecting the same pending booking.
- Fairness: Pending bookings are promoted in consistent order to avoid user confusion.

## Scalability
I considered both vertical improvements (indexes, caching) and horizontal scaling with containers.

- Caching with Redis for availability queries.
- Indexes on booking times and statuses for fast lookups.
- Read replicas for heavy read queries.
- Partitioning for large Booking/History tables.
- Async workers for promotions and notifications.
- API throughput improved with pagination and batching.
- Use orchestration tools (Docker Compose locally, Docker Swarm in production) to spin up new API instances when load increases.
- Load balancing to distributes traffic across all container instances.
- Auto‑scaling adds/removes containers based on demand.


## With More Time
If I had more time, I’d strengthen correctness and add user‑facing features.

- Adding createdAt/updatedAt timestamps to bookings and waiting list for better ordering and auditing.
- Notifications to alert users when their pending booking is promoted.
- Testing API endpoints with Jest and Supertest to validate booking flows (create, update, delete, promotion) against a test database. This will ensures correctness under different scenarios and protects against regressions as the system evolves.
- Implementing authentication/authorization middleware using JWTs to secure endpoints with token‑based authentication, enforce roles (admin vs member), and ensure only authorized users can create, update, or cancel bookings.


