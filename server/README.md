# NepAgriMarket Backend API

Complete authentication system with role-based access control using Drizzle ORM and PostgreSQL.

## Features

- **User Authentication**: Register, login, and profile management
- **Role-Based Access Control**: Three user roles:
  - **Admin**: Highest level, has access to everything
  - **Buyer**: Standard user level
  - **Cooperative**: Standard user level (same as buyer)
- **JWT Authentication**: Secure token-based authentication
- **Password Security**: Bcrypt hashing with salt rounds
- **Database**: PostgreSQL with Drizzle ORM

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (local or remote)
- npm or yarn

## Local Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cp .env.example .env
```

Edit `.env` and update the following variables:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@localhost:5432/nepagrimarket

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database:
```sql
CREATE DATABASE nepagrimarket;
```

3. Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/nepagrimarket
```

#### Option B: Remote PostgreSQL (Recommended for Production)

Use a cloud PostgreSQL service like:
- **Supabase** (Free tier available)
- **Railway** (Free tier available)
- **Render** (Free tier available)
- **Neon** (Free tier available)
- **AWS RDS**
- **DigitalOcean Managed Databases**

### 4. Run Database Migrations

Generate migration files:
```bash
npm run db:generate
```

Run migrations:
```bash
npm run db:migrate
```

### 5. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "buyer",  // Optional: "buyer" or "cooperative" (default: "buyer")
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile (Protected)
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+9876543210"
}
```

#### Change Password (Protected)
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

## Role-Based Access Control

### Using Middleware

```javascript
const { authenticate, requireAdmin, requireBuyer, requireCooperative, requireBuyerOrCooperative } = require('./middleware/auth.middleware');

// Require authentication only
router.get('/protected', authenticate, handler);

// Require admin role
router.get('/admin-only', authenticate, requireAdmin, handler);

// Require buyer role
router.get('/buyer-only', authenticate, requireBuyer, handler);

// Require cooperative role
router.get('/cooperative-only', authenticate, requireCooperative, handler);

// Require either buyer or cooperative
router.get('/user-only', authenticate, requireBuyerOrCooperative, handler);
```

## Remote Hosting Setup

### Option 1: Railway (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (connect your repository)
   - Or select "Empty Project" and connect later

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically create a PostgreSQL instance
   - Copy the `DATABASE_URL` from the database service

4. **Configure Environment Variables**
   - Go to your service → "Variables" tab
   - Add the following:
     ```
     DATABASE_URL=<from PostgreSQL service>
     JWT_SECRET=<generate a strong random string>
     JWT_EXPIRES_IN=7d
     NODE_ENV=production
     FRONTEND_URL=<your-frontend-url>
     PORT=5000
     ```

5. **Deploy**
   - Railway will automatically detect your Node.js app
   - Add build command: `npm install`
   - Add start command: `npm start`
   - Railway will run migrations automatically if you add a post-deploy script

6. **Run Migrations**
   - Go to your service → "Deployments" → "View Logs"
   - Or use Railway CLI:
     ```bash
     railway run npm run db:migrate
     ```

### Option 2: Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up

2. **Create PostgreSQL Database**
   - Dashboard → "New" → "PostgreSQL"
   - Choose a name and region
   - Copy the "Internal Database URL"

3. **Create Web Service**
   - Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: nepagrimarket-api
     - **Environment**: Node
     - **Build Command**: `cd server && npm install`
     - **Start Command**: `cd server && npm start`
     - **Root Directory**: `server`

4. **Add Environment Variables**
   ```
   DATABASE_URL=<from PostgreSQL service>
   JWT_SECRET=<generate a strong random string>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   FRONTEND_URL=<your-frontend-url>
   PORT=5000
   ```

5. **Run Migrations**
   - After first deployment, go to "Shell" tab
   - Run: `cd server && npm run db:migrate`

### Option 3: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create nepagrimarket-api
   ```

3. **Add PostgreSQL Add-on**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set JWT_SECRET=<your-secret>
   heroku config:set JWT_EXPIRES_IN=7d
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=<your-frontend-url>
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Run Migrations**
   ```bash
   heroku run npm run db:migrate
   ```

### Option 4: DigitalOcean App Platform

1. **Create DigitalOcean Account**
   - Go to [digitalocean.com](https://digitalocean.com)

2. **Create App**
   - Go to "Apps" → "Create App"
   - Connect GitHub repository
   - Configure:
     - **Type**: Web Service
     - **Build Command**: `cd server && npm install`
     - **Run Command**: `cd server && npm start`
     - **HTTP Port**: 5000

3. **Add Database**
   - Go to "Components" → "Add Component" → "Database"
   - Select PostgreSQL
   - This will automatically set `DATABASE_URL`

4. **Add Environment Variables**
   ```
   JWT_SECRET=<your-secret>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   FRONTEND_URL=<your-frontend-url>
   ```

5. **Run Migrations**
   - Use DigitalOcean console or add a post-deploy script

## Creating an Admin User

Admin users cannot be created through the registration endpoint for security reasons. You need to create them directly in the database:

### Method 1: Using SQL

```sql
-- First, register a user normally through the API
-- Then update their role in the database:

UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### Method 2: Using a Script

Create a file `scripts/create-admin.js`:

```javascript
const { db } = require('../src/config/db');
const { users } = require('../src/models/users');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
require('dotenv').config();

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password>');
    process.exit(1);
  }
  
  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = nanoid();
  
  try {
    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });
    
    console.log(`Admin user created: ${email}`);
  } catch (error) {
    console.error('Error creating admin:', error.message);
  }
  
  process.exit(0);
}

createAdmin();
```

Run it:
```bash
node scripts/create-admin.js admin@example.com securepassword123
```

## Security Best Practices

1. **JWT Secret**: Use a strong, random string for `JWT_SECRET` in production
2. **Password Policy**: Enforce minimum password length (currently 6 characters)
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure `FRONTEND_URL` properly to restrict CORS
5. **Environment Variables**: Never commit `.env` file to version control
6. **Database**: Use connection pooling and SSL in production

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check if PostgreSQL is running (for local setup)
- Verify network access (for remote databases)
- Check SSL settings for production databases

### Migration Issues

- Ensure database exists before running migrations
- Check database user has CREATE TABLE permissions
- Verify `DATABASE_URL` format is correct

### Authentication Issues

- Verify `JWT_SECRET` is set
- Check token expiration settings
- Ensure token is sent in `Authorization: Bearer <token>` format

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/
│   │   └── auth.controller.js # Authentication logic
│   ├── middleware/
│   │   └── auth.middleware.js # Auth & authorization middleware
│   ├── models/
│   │   └── users.js           # User schema
│   ├── routes/
│   │   └── auth.route.js      # Authentication routes
│   └── index.js               # Main server file
├── migrations/
│   ├── migrate.js             # Migration runner
│   └── sql/                   # Generated SQL migrations
├── drizzle.config.js          # Drizzle configuration
├── package.json
├── .env.example
└── README.md
```

## License

MIT



