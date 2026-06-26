# Ride Booker - Backend

REST API for the Ride Booker motorcycle test ride booking system, built with NestJS and Supabase.

## Live API

API available at: **[BACKEND_URL]**
Swagger documentation: **[BACKEND_URL]/api**

## Tech Stack

- **NestJS** - Node.js framework
- **Prisma ORM** - database access
- **Supabase** - authentication and file storage
- **PostgreSQL** - database
- **Resend** - email notifications
- **Multer** - file upload handling

## Requirements

- Node.js 18+
- npm / yarn
- Supabase project
- Resend account

## Local Development

### 1. Clone the repository

```bash
git clone [REPO_URL]
cd ride-booker-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=your-postgresql-connection-string
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
APP_URL=your-app-url (dev -> http://localhost:3000 by default)
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Run the development server

```bash
npm run start:dev
```

API runs at `http://localhost:3000` by default.
Swagger documentation available at `http://localhost:3000/api` by default.

## Project Structure

src/

├── auth/ # Authentication, JWT guards, user management

├── bookings/ # Booking management

├── dashboard/ # Statistics and analytics

├── favorites/ # User favorites

├── inventory/ # Vehicle inventory per location

├── locations/ # Branch locations management

├── notifications/ # Email notification templates

├── organizations/ # Organization management

├── slots/ # Time slot management

├── vehicles/ # Vehicle and vehicle type management

└── main.ts # Application entry point
prisma/

├── schema.prisma # Database schema

└── migrations/ # Database migrations

## API Endpoints

Full documentation available via Swagger at `/api`.

| Module        | Endpoints                                                                            |
| ------------- | ------------------------------------------------------------------------------------ |
| Auth          | `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`, `GET /auth/me`       |
| Users         | `GET /auth/users`, `POST /auth/users`, `PATCH /auth/users/:id/role`                  |
| Vehicles      | `GET /vehicles`, `POST /vehicles`, `PATCH /vehicles/:id`, `POST /vehicles/:id/image` |
| Bookings      | `GET /bookings`, `POST /bookings`, `PATCH /bookings/:id/status`                      |
| Slots         | `GET /slots`, `POST /slots`, `PATCH /slots/:id`, `DELETE /slots/:id`                 |
| Inventory     | `GET /inventory`, `POST /inventory`, `PATCH /inventory/:id`                          |
| Organizations | `GET /organizations`, `POST /organizations`                                          |
| Locations     | `GET /locations`, `POST /locations`, `POST /locations/:id/assign-admin`              |
| Notifications | `GET /notification-templates`, `POST /notification-templates`                        |
| Dashboard     | `GET /dashboard/stats`, `GET /dashboard/location-comparison`                         |
| Favorites     | `GET /favorites/me`, `POST /favorites`, `DELETE /favorites/:vehicleId`               |

## User Roles

| Role           | Description                                |
| -------------- | ------------------------------------------ |
| `SUPER_ADMIN`  | Full system access                         |
| `ORG_ADMIN`    | Manages own organization and its locations |
| `BRANCH_ADMIN` | Manages own branch location                |
| `USER`         | Books test rides                           |

## Authentication

The system uses Supabase Auth with JWT tokens:

- `accessToken` - stored in memory (Zustand), sent as Bearer token
- `refreshToken` - stored in httpOnly cookie, used to refresh the session

## File Storage

Vehicle images are stored in Supabase Storage in the `vehicles` bucket (public read access). Images are automatically compressed before upload (max 1MB, 1600px).

## Email Notifications

Emails are sent via Resend API. Notification templates are configurable per organization/location through the admin panel. Supported events:

- `BOOKING_CREATED` - new booking created
- `BOOKING_CONFIRMED` - booking confirmed by admin
- `BOOKING_REJECTED` - booking rejected by admin
- `BOOKING_CANCELLED` - booking cancelled by user
- `ACCOUNT_CREATED` - new account registered
- `PASSWORD_RESET` - password reset requested

### Dynamic variables available in templates

| Variable             | Description                                  |
| -------------------- | -------------------------------------------- |
| `{recipient_name}`   | Name of the email recipient                  |
| `{customer_name}`    | Name of the customer who made the booking    |
| `{vehicle_name}`     | Motorcycle model name                        |
| `{location_name}`    | Branch name and address                      |
| `{date}`             | Booking date                                 |
| `{rejection_reason}` | Reason for rejection (BOOKING_REJECTED only) |
