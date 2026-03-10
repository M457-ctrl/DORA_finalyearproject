# NepAgriMarket Backend - Features to Explain to Teacher

## Overview

This is a complete **Node.js + Express backend** for an agricultural marketplace application called NepAgriMarket. It includes user authentication, role-based access control, and a secure database system.

---

## Core Features Implemented

### 1. **User Authentication System** ✅

**What it does:** Allows users to create accounts and log in securely

**Key Points to Explain:**

- **Registration**: Users can sign up with email and password

  - Email is stored in lowercase to prevent duplicates
  - Passwords are **hashed using bcrypt** (not stored in plain text!)
  - Users get assigned a role: buyer or cooperative
  - Optional fields: first name, last name, phone number

- **Login**: Users authenticate with email and password

  - System verifies password against stored hash
  - On successful login, user receives a **JWT token**
  - Token is used for subsequent requests as proof of authentication

- **JWT (JSON Web Token)**
  - Secure token system that proves user is logged in
  - Token expires after 7 days (configurable)
  - Sent in Authorization header: `Authorization: Bearer <token>`
  - Cannot be forged because it's signed with a secret key

**Code Example:**

```javascript
// Registration request
POST /api/auth/register
{
  "email": "farmer@example.com",
  "password": "secure123",
  "firstName": "Ram",
  "role": "cooperative"
}

// Login request
POST /api/auth/login
{
  "email": "farmer@example.com",
  "password": "secure123"
}

// Response includes token
{
  "success": true,
  "data": {
    "user": { id, email, role, ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 2. **Role-Based Access Control (RBAC)** ✅

**What it does:** Different users have different permissions

**Three User Roles:**

| Role            | Permission Level | Can Do                                               |
| --------------- | ---------------- | ---------------------------------------------------- |
| **Admin**       | Highest          | Everything - manage all users, system settings, etc. |
| **Buyer**       | Standard         | View products, make orders, manage own profile       |
| **Cooperative** | Standard         | List products, manage listings, view buyers          |

**How It Works:**

- Each user has a role assigned during registration
- When accessing protected routes, system checks user's role
- Some endpoints only allow specific roles
- Admins automatically have access to everything

**Code Example:**

```javascript
// Public route - anyone can access
POST /api/auth/register

// Protected route - requires login
GET /api/auth/profile (needs valid token)

// Admin-only route - requires admin role
DELETE /api/users/:id (only admin can delete users)

// Buyer/Cooperative - same level access
POST /api/products (both can create products)
```

---

### 3. **Password Security** ✅

**What it does:** Protects user passwords from being stolen

**Security Measures:**

- **Bcrypt Hashing**: Passwords are encrypted using bcrypt algorithm

  - Bcrypt is a one-way function (cannot be reversed)
  - Even if database is stolen, passwords remain safe
  - Salt rounds = 12 (higher = more secure but slower)

- **Never Stored in Plain Text**: Passwords are never readable in database

  - Database breach doesn't expose passwords
  - Password can only be verified, not read

- **Password Validation**:
  - Minimum 6 characters
  - Compared using bcrypt.compare() for login

**Code Example:**

```javascript
// When user registers:
const hashedPassword = await bcrypt.hash(password, 12);
// Stored in database: $2a$12$... (hashed version)

// When user logs in:
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
// Returns true/false without exposing actual password
```

---

### 4. **Profile Management** ✅

**What it does:** Users can view and update their profile information

**Functionality:**

- **View Profile**: Get logged-in user's complete information

  - All their details in one request
  - Protected route (requires login)

- **Update Profile**: Change name, phone number, etc.

  - Can update: firstName, lastName, phone
  - Email and role cannot be changed
  - UpdatedAt timestamp is automatically set

- **Change Password**: Securely update password
  - Requires entering current password first (verification)
  - New password must be at least 6 characters
  - Old password is verified before allowing change

**Code Example:**

```javascript
// View profile
GET /api/auth/profile
Headers: Authorization: Bearer <token>
Response: { user: { id, email, firstName, ... } }

// Update profile
PUT /api/auth/profile
{
  "firstName": "Sita",
  "lastName": "Sharma",
  "phone": "9841234567"
}

// Change password
PUT /api/auth/change-password
{
  "currentPassword": "old123",
  "newPassword": "new123"
}
```

---

### 5. **Middleware & Request Processing** ✅

**What it does:** Processes requests before they reach controllers

**Middleware Components:**

| Middleware         | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| **Helmet**         | Security headers (protects from common attacks) |
| **CORS**           | Allow frontend to communicate with backend      |
| **Express JSON**   | Parse JSON request bodies                       |
| **Authentication** | Verify JWT tokens                               |
| **Authorization**  | Check user roles and permissions                |
| **Error Handler**  | Catch and format all errors                     |

**Security Headers (Helmet):**

```javascript
- X-Content-Type-Options: nosniff (prevents MIME-type sniffing)
- X-Frame-Options: DENY (prevents clickjacking)
- Strict-Transport-Security: enforce HTTPS
- Content-Security-Policy: prevent XSS attacks
```

---

### 6. **Error Handling** ✅

**What it does:** Gracefully handles and reports errors

**Error Types Handled:**

- **400 Bad Request**: Invalid input (missing email, password too short)
- **401 Unauthorized**: Invalid or missing token
- **403 Forbidden**: User role not allowed for this action
- **404 Not Found**: Resource doesn't exist
- **500 Server Error**: Unexpected server issues

**Consistent Error Response Format:**

```javascript
{
  "success": false,
  "message": "Descriptive error message",
  "error": "Full stack trace (only in development)"
}
```

**Features:**

- All errors are caught and returned as JSON
- No sensitive info exposed in production
- Full error details in development for debugging
- Proper HTTP status codes used

---

### 7. **Database Management** ✅

**What it does:** Stores user data securely in PostgreSQL

**Technologies:**

- **PostgreSQL**: Powerful, reliable database
- **Drizzle ORM**: Type-safe database queries
  - Prevents SQL injection attacks
  - Query builder with IDE autocomplete
  - Automatic schema generation

**Database Schema:**

```javascript
Users Table:
- id: Unique identifier
- email: User email (must be unique)
- password: Hashed password
- role: admin | buyer | cooperative
- firstName, lastName, phone: User info
- isActive: Account status
- isEmailVerified: Email verification status
- createdAt, updatedAt: Timestamps
```

**Database Features:**

- **Migrations**: Version control for database schema
  - Changes tracked and reversible
  - Run with `npm run db:migrate`
- **Drizzle Studio**: Visual database viewer
  - See and edit data in browser
  - Run with `npm run db:studio`

---

### 8. **Environment Variables & Configuration** ✅

**What it does:** Configures the application for different environments

**Configuration Variables:**

```env
PORT=5000                          # Server port
NODE_ENV=development               # Environment (dev/production)
DATABASE_URL=postgresql://...      # Database connection
JWT_SECRET=your-secret-key         # JWT signing key
JWT_EXPIRES_IN=7d                  # Token expiration
FRONTEND_URL=http://localhost:3000 # CORS allowed origin
```

**Benefits:**

- Same code works in development and production
- Secrets not hardcoded in source code
- Easy to change configuration without code changes

---

### 9. **API Health Checks** ✅

**What it does:** Provides endpoints to verify server is running

**Health Check Endpoints:**

```javascript
// Root endpoint
GET /
Response: { success, message: "Welcome to NepAgriMarket API", version: "1.0.0" }

// Health check
GET /health
Response: { success, status: "healthy", timestamp: "2024-12-12T..." }
```

---

### 10. **Graceful Shutdown** ✅

**What it does:** Safely stops the server

**Features:**

- Listens for `SIGTERM` and `SIGINT` signals
- Closes active connections before exiting
- Prevents data corruption
- Proper exit codes for monitoring

**Use Cases:**

- Docker container stopping
- Process manager (PM2) graceful reload
- Manual Ctrl+C shutdown

---

### 11. **Error Handling on Idle Connections** ✅

**What it does:** Handles database connection issues

**Features:**

- Monitors connection pool for errors
- Logs unexpected connection failures
- Exits process if database connection fails
- Allows monitoring tool to restart the app

---

### 12. **User Account Status Management** ✅

**What it does:** Allows disabling user accounts

**Features:**

- **isActive Flag**: Admin can deactivate accounts
- **Deactivated users cannot:**
  - Login to their account
  - Use their JWT token
  - Access protected routes
- **Email Verified Status**: Track email verification (future feature)

**Use Case:**

```javascript
// Admin can deactivate spamming account
UPDATE users SET isActive = false WHERE id = "user123"

// User tries to login:
// Error: "Account is deactivated. Please contact administrator"
```

---

## Technologies Used

### Backend Framework

- **Express.js** (v5): Web server framework
  - Handles HTTP requests and responses
  - Routing system
  - Middleware support

### Authentication & Security

- **jsonwebtoken** (JWT): Secure token generation and verification
- **bcryptjs**: Password hashing
- **helmet**: Security headers
- **cors**: Cross-Origin Resource Sharing

### Database

- **PostgreSQL**: Relational database
- **pg**: PostgreSQL client
- **drizzle-orm**: ORM for type-safe queries

### Utilities

- **dotenv**: Environment variable management
- **nanoid**: Unique ID generation
- **winston**: Logging (installed but can be used)
- **socket.io**: Real-time communication (installed for future use)

### Development Tools

- **drizzle-kit**: Database schema management and migrations

---

## Project Structure

```
server/
├── src/
│   ├── app.js                    ← Express app configuration
│   ├── index.js                  ← Entry point that exports app
│   ├── config/
│   │   └── db.js                 ← Database connection setup
│   ├── controllers/
│   │   └── auth.controller.js    ← Business logic (register, login, etc.)
│   ├── models/
│   │   └── users.js              ← Database table definition
│   ├── middleware/
│   │   ├── auth.middleware.js    ← JWT verification & authorization
│   │   ├── errorHandler.js       ← Error handling
│   │   └── index.js
│   └── routes/
│       └── auth.route.js         ← API endpoints
├── server.js                      ← Main server file (run this)
├── package.json                   ← Dependencies
└── .env                          ← Configuration (not in git)
```

---

## API Endpoints

### Authentication Routes

| Method | Endpoint                  | Protected | Purpose                       |
| ------ | ------------------------- | --------- | ----------------------------- |
| POST   | /api/auth/register        | No        | Create new account            |
| POST   | /api/auth/login           | No        | Login with credentials        |
| GET    | /api/auth/profile         | Yes       | View logged-in user's profile |
| PUT    | /api/auth/profile         | Yes       | Update profile info           |
| PUT    | /api/auth/change-password | Yes       | Change password               |

---

## Key Learning Concepts for Teacher

### 1. MVC Architecture

- **Models**: Database schema (users table)
- **Views**: JSON responses (API returns JSON instead of HTML)
- **Controllers**: Business logic (register, login functions)

### 2. Authentication Flow

```
User Login
    ↓
Check email exists
    ↓
Verify password (bcrypt)
    ↓
Generate JWT token
    ↓
Return token to user
    ↓
User stores token locally
    ↓
User sends token with each request
    ↓
Server verifies token
    ↓
Grant access to protected resources
```

### 3. Security Principles

- **Authentication**: Verify who user is (login)
- **Authorization**: Check what user can do (role-based)
- **Password Security**: Hash + Salt (bcrypt)
- **Token Security**: JWT signed with secret key
- **CORS**: Control which frontends can access API

### 4. REST API Principles

- **Standard HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes**: 200 (ok), 400 (bad request), 401 (unauthorized), etc.
- **Resource-based URLs**: `/api/auth/profile` (noun-based, not verb-based)
- **JSON Responses**: Consistent format with success flag and data

---

## How to Demo/Test for Teacher

### 1. Start the Server

```bash
npm run dev
```

Shows: "Server is running on port 5000"

### 2. Test Health Check

```bash
curl http://localhost:5000/health
```

Returns: Server is healthy ✅

### 3. Test Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Returns: JWT token and user data ✅

### 4. Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Returns: JWT token ✅

### 5. Test Protected Route (with token)

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <your_token>"
```

Returns: User profile ✅

### 6. Test Invalid Token

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer invalid"
```

Returns: 401 Unauthorized ✅

---

## Future Enhancement Ideas

1. **Email Verification**: Verify user emails before allowing login
2. **Password Reset**: Send reset link via email
3. **Two-Factor Authentication (2FA)**: Extra security layer
4. **User Roles**: Add more roles (seller, moderator, etc.)
5. **Product Management**: Add product endpoints
6. **Real-time Notifications**: Use Socket.io for live updates
7. **Logging**: Use Winston to log all activities
8. **Rate Limiting**: Prevent brute force attacks
9. **Image Upload**: Allow users to upload profile pictures
10. **Search & Filter**: Search products, users, etc.

---

## Conclusion

This backend implements a **production-ready authentication system** with:

- ✅ Secure user registration and login
- ✅ JWT token-based authentication
- ✅ Role-based access control
- ✅ Password hashing with bcrypt
- ✅ Error handling and validation
- ✅ Database with PostgreSQL
- ✅ Clean code architecture (MVC pattern)
- ✅ RESTful API design
- ✅ Security best practices

All features are documented with comments in the code for easy understanding! 📚
