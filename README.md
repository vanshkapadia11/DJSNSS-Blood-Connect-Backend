# Blood Donation Platform — Backend API

Production-ready Node.js + Express + MongoDB backend for a blood donation platform.

**Flow:** NGOs / Hospitals / Blood Banks (`Organization`) create blood donation **Events** → **Volunteers** browse and enroll → Organization marks who actually showed up and donated → **Admin** moderates the whole platform.

---

## Tech Stack

- **Runtime:** Node.js 18+, Express 4
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (Bearer token), bcrypt password hashing
- **Security:** helmet, cors, express-rate-limit, express-mongo-sanitize, hpp, payload size limits
- **Validation:** express-validator
- **Logging:** winston (rotating daily log files) + morgan (HTTP access logs)
- **Containerization:** Docker + docker-compose (app + MongoDB)

---

## Project Structure

```
src/
├── config/
│   └── db.js                  # MongoDB connection
├── models/
│   ├── Volunteer.js
│   ├── Organization.js        # NGO / Hospital / BloodBank (type enum)
│   ├── Admin.js
│   ├── Event.js
│   └── EventParticipation.js  # junction table: Volunteer <-> Event
├── middlewares/
│   ├── auth.js                # protect() + authorize(...roles)
│   ├── errorHandler.js        # centralized error handling
│   ├── rateLimiter.js         # global / auth / enroll limiters
│   └── validate.js            # express-validator result handler
├── validators/
│   ├── authValidators.js
│   └── eventValidators.js
├── controllers/
│   ├── authController.js
│   ├── volunteerController.js
│   ├── orgController.js
│   └── adminController.js
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   ├── volunteerRoutes.js
│   ├── orgRoutes.js
│   ├── adminRoutes.js
│   └── index.js
├── utils/
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── asyncHandler.js
│   ├── generateToken.js
│   └── logger.js
├── seed/
│   └── seedAdmin.js           # creates the first Admin (no public admin-register route)
├── app.js                     # Express app + middleware stack
└── server.js                  # bootstraps DB + HTTP server, graceful shutdown
```

---

## Data Model

### Volunteer
`name, email, password (hashed), phone_no, age, college, blood_group (enum), health_conditions, address, isActive`

### Organization (merges NGO / Hospital / Blood Bank)
`name, type (NGO | Hospital | BloodBank), address, contact_number, email, password (hashed), isVerified, isActive`

### Event
`org (ref), name, description, location, urgency (Low|Medium|High|Critical), requirements_count, start_date, duration_days, expiry_date (auto-calculated), status (Active|Closed|Expired)`

### EventParticipation (junction table)
`event (ref), volunteer (ref), status (Registered|Participated|Cancelled|NoShow), enrolled_at, participated_at`

This single collection replaces the "Events Donated" list on Volunteer and the "Enrolled/Participated" lists on Event — a compound **unique index on `{event, volunteer}`** also prevents duplicate registrations at the database level.

### Admin
`name, email, password (hashed)` — **no public registration route**; created via `npm run seed:admin`.

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, CORS_ORIGIN, etc.

# 3. Create the first admin account
npm run seed:admin

# 4. Run
npm run dev     # development (nodemon)
npm start        # production
```

### With Docker

```bash
cp .env.example .env
docker-compose up --build
# then, in another terminal, seed the admin inside the running container:
docker-compose exec api npm run seed:admin
```

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

### Auth (public, rate-limited stricter than global)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/volunteer/register` | Register a volunteer |
| POST | `/auth/org/register` | Register an NGO/Hospital/BloodBank |
| POST | `/auth/login` | `{ email, password, role }` → JWT |
| GET | `/auth/me` | Get current logged-in user (any role) |

### Volunteer (`role: volunteer`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/events?page=&limit=&urgency=&search=` | Browse active events (paginated) |
| GET | `/events/:eventId` | Event detail + live enrolled count |
| POST | `/events/:eventId/enroll` | Register for an event |
| DELETE | `/events/:eventId/enroll` | Cancel my own registration |
| GET | `/volunteer/me/events` | My enrolled / participated events |
| PUT | `/volunteer/me` | Update my profile |

### Organization (`role: org`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/events` | Create event |
| PUT | `/events/:eventId` | Update event (owner only) |
| DELETE | `/events/:eventId` | Delete event (owner only) |
| GET | `/events/:eventId/volunteers` | List volunteers enrolled for this event |
| POST | `/events/:eventId/participants` | Bulk-mark attendance: `{ volunteer_ids: [...], status? }` |
| GET | `/org/me/events?page=&limit=` | Events created by this org |

### Admin (`role: admin`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/volunteers` | List all volunteers |
| GET | `/admin/volunteers/:id` | Get volunteer by ID |
| DELETE | `/admin/volunteers/:id` | Deactivate a volunteer |
| GET | `/admin/orgs` | List all organizations |
| GET | `/admin/orgs/:id` | Get organization by ID |
| GET | `/admin/events` | List all events |
| GET | `/admin/events/:id` | Get event by ID |
| DELETE | `/admin/events/:id` | Delete any event |

Every response follows the same envelope:
```json
{ "success": true, "message": "...", "data": { ... }, "meta": { "page": 1, "limit": 10, "total": 42 } }
```
Errors:
```json
{ "success": false, "message": "...", "errors": [ "field: reason" ] }
```

---

## Security Measures Implemented

- Passwords hashed with **bcrypt** (never returned in API responses — `select: false` on the schema field).
- **JWT** auth with a `role` claim; a single `protect` + `authorize(...roles)` middleware pair guards every private route.
- **Rate limiting**: global limiter (100 req / 15 min by default) + a stricter limiter on `/auth/*` (10 req / 15 min) + a per-minute limiter on event enrollment to stop spam registrations.
- **helmet** for secure HTTP headers, **cors** with an explicit origin allow-list, **hpp** against parameter pollution, **express-mongo-sanitize** against NoSQL injection.
- Request body size capped at 10kb.
- Centralized error handler normalizes Mongoose validation errors, duplicate-key errors, invalid ObjectId errors, and JWT errors into consistent JSON responses — stack traces are only included when `NODE_ENV=development`.
- Admin accounts cannot be created over the API — only via the `seed:admin` script, closing off a common privilege-escalation vector.
- `EventParticipation` has a compound unique index on `{event, volunteer}` — duplicate registrations are rejected at the database layer, not just in application code.
- Admin "remove volunteer" **soft-deletes** (`isActive: false`) rather than hard-deleting, preserving historical participation records for audit/reporting.
- Winston logs (rotated daily, 14-day retention) separate error logs from combined logs; morgan streams HTTP access logs into the same logger.
- Graceful shutdown on `SIGINT`/`SIGTERM`, and the process exits cleanly on unhandled rejections/exceptions so a process manager (PM2, Docker, Kubernetes) can restart it rather than run in a corrupted state.

---

## Notes / Next Steps You May Want

- Add refresh tokens / token blacklist if you need logout-everywhere semantics.
- Add a cron job (e.g. `node-cron`) to flip `Event.status` from `Active → Expired` once `expiry_date` passes, instead of relying only on `isExpired()` checks at request time.
- Add email/SMS notifications (e.g. via SendGrid/Twilio) when a volunteer enrolls or an event is about to expire.
- Add automated tests (Jest + Supertest + mongodb-memory-server) — the code is structured (controllers/services separated from routes) to make this straightforward to add.
