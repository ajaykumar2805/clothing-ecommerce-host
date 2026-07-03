# Velvet & Thread - Clothing E-Commerce Host Application

A complete, production-ready, end-to-end e-commerce web application for selling clothing. Designed with a React-Tailwind CSS frontend, a Node.js-Express API server backend, and a PostgreSQL database.

This project includes built-in structured JSON logging hooks to support downstream data engineering, analytics, and ETL pipelines (tracking user clicks, checkout purchases, and stock level changes).

---

## Technical Architecture

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide icons, Stripe Elements checkout.
- **Backend**: Node.js, Express.js, JWT security authentication, Winston structured logger, PostgreSQL connection pool.
- **Database**: PostgreSQL (relational schemas, transactions, and variant constraints).
- **Payment Integration**: Stripe API (with dynamic mock sandbox fallback for offline testing).

---

## Directory Structure

```text
/clothing-ecommerce-host
│   .gitignore
│   README.md
│   package.json (workspace runner scripts)
│   docker-compose.yml (PostgreSQL docker database)
│
├───backend
│   │   server.js
│   │   .env.example
│   │   .env
│   │
│   ├───config
│   │       db.js (pg client connection pool)
│   │       logger.js (Winston logger with helper hooks)
│   │
│   ├───middleware
│   │       auth.js (JWT authentication and role checks)
│   │
│   ├───routes
│   │       auth.js (customer registration/login)
│   │       products.js (catalog lookup and custom queries)
│   │       orders.js (Stripe Payment intents and checkout transactions)
│   │       admin.js (inventories and product creations)
│   │
│   ├───db
│   │       schema.sql (PostgreSQL table schemas)
│   │       seed.sql (Initial mock clothes & test users data)
│   │
│   └───logs
│           events.json (Appended structured logs for ETL ingestion)
│
└───frontend
    │   package.json
    │   index.html (HTML structure, fonts)
    │   tailwind.config.js (Tailwind rules)
    │   postcss.config.js
    │   .env.example
    │   .env
    │
    └───src
        │   main.jsx
        │   App.jsx (routing paths)
        │   index.css (Tailwind classes)
        │
        ├───context
        │       AuthContext.jsx (customer state, token caching)
        │       CartContext.jsx (shopping cart state, client event triggers)
        │
        ├───components
        │   │   Navbar.jsx
        │   │   Footer.jsx
        │   │   ProductCard.jsx
        │   └───checkout
        │           CheckoutForm.jsx (Stripe + Sandbox form)
        │
        └───pages
                Home.jsx (product catalog filters)
                ProductDetail.jsx (size/color option grids)
                Cart.jsx (summary totals)
                Checkout.jsx (address check & Stripe setup)
                Profile.jsx (orders history check)
                AdminDashboard.jsx (stock adjustments and product entries)
                Login.jsx / Register.jsx (credentials verification)
```

---

## Local Setup & Installation

### 1. Prerequisites
- **Node.js** (v16.0 or higher recommended)
- **PostgreSQL** running locally OR **Docker** (to spin up the database container)

### 2. Set Up the Database

#### Using Docker Compose (Recommended)
From the root directory, spin up the configured PostgreSQL container:
```bash
docker-compose up -d
```
This launches a database running on `localhost:5432` with username `postgres`, password `password`, and database named `clothing_ecommerce`.

#### Running DB Migrations & Seeding
Connect to your PostgreSQL server and execute the initialization script followed by the seed script:
```bash
# Set up database tables
psql -U postgres -d clothing_ecommerce -f backend/db/schema.sql

# Seed catalog items and demo users
psql -U postgres -d clothing_ecommerce -f backend/db/seed.sql
```
*Note: If you run PostgreSQL on Windows, you can execute these files directly using pgAdmin, or run them from your terminal.*

### 3. Configure Environment Variables

Create `.env` files in both the frontend and backend directories. You can copy the template configurations:

#### Backend Config (`backend/.env`)
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=clothing_ecommerce_secret_key_2026
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clothing_ecommerce

# Stripe API Keys (Test Mode)
# Leave as default or empty to automatically engage mock payment simulation
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

#### Frontend Config (`frontend/.env`)
```ini
# Backend API address connection
VITE_API_URL=http://localhost:5000/api

# Stripe Publishable Token (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_yourPublishableKeyHere
```

### 4. Running the Dev Servers

From the root project workspace directory, run:
```bash
# Install root, backend, and frontend dependencies at once
npm run install:all

# Launch both servers concurrently
npm run dev
```

Your browser will automatically serve the Vite frontend on `http://localhost:5173` and the Express API server on `http://localhost:5000`.

---

## Testing Credentials

Use the following preconfigured accounts to test user and admin roles:

- **Customer Profile**:
  - Email: `customer@store.com`
  - Password: `customer123`
- **Admin Dashboard**:
  - Email: `admin@store.com`
  - Password: `admin123`

To test payments, checkout with any Stripe test credit card (e.g., number `4242 4242 4242 4242`, expiry `12/28`, CVV `424`).

---

## Logging Specs (For Data Pipelines)

All system-triggered logs are appended as single-line JSON records directly into standard output (`stdout`) and `backend/logs/events.json`.

### 1. User Behavior Logs
Emitted when users view product details, add styles to their cart, or discard items:
```json
{
  "message": "User behavior event",
  "level": "info",
  "event_type": "page_view" | "add_to_cart" | "remove_from_cart",
  "user_id": "a1b2c3d4-...", // "guest" if anonymous
  "session_id": "sess_x98f2...", // generated on frontend browser session
  "product_id": "c830d922-...",
  "variant_id": "uuid-...",
  "timestamp": "2026-07-03T23:22:12Z",
  "metadata": { ... } // e.g. path, title, selected size/color
}
```

### 2. Transaction Logs
Emitted upon checkout payment completion:
```json
{
  "message": "Transaction event",
  "level": "info",
  "event_type": "purchase_success",
  "order_id": "order-uuid-...",
  "user_id": "user-uuid-...", // null if guest checkout
  "total_amount": 139.98,
  "item_list": [
    {
      "product_id": "c830d922-...",
      "variant_id": "variant-uuid-...",
      "quantity": 2,
      "price": 49.99
    }
  ],
  "stripe_payment_intent_id": "pi_...",
  "timestamp": "2026-07-03T23:24:45Z"
}
```

### 3. Inventory Updates
Emitted whenever product stock changes due to client checkouts or admin panel stock adjustments:
```json
{
  "message": "Inventory update event",
  "level": "info",
  "event_type": "inventory_update",
  "product_id": "c830d922-...",
  "variant_id": "variant-uuid-...",
  "old_stock": 25,
  "new_stock": 23,
  "change": -2,
  "reason": "checkout" | "admin_adjustment",
  "timestamp": "2026-07-03T23:24:45Z"
}
```
