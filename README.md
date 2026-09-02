# GrocerApp

A full-stack grocery delivery web application inspired by Blinkit. Built with React (Vite) on the frontend and Python Flask on the backend, featuring JWT-based authentication, role-based access control, product management, shopping cart, order placement, and a complete driver delivery module.

---

## Project Overview

GrocerApp is a multi-role grocery delivery platform that supports three user types: **Customer**, **Admin**, and **Driver**. Customers browse and order groceries, admins manage products/users/drivers and assign deliveries, and drivers handle the last-mile delivery workflow. The application ships as pre-built Docker images and can be started with a single command.

---

## Main Features

### Customer
- Browse products with category filtering and live search (debounced)
- View detailed product pages with stock information
- Add items to cart with adjustable quantities (capped to available stock)
- Place orders with real-time stock validation on the backend
- View order history with live delivery status tracking
- Secure sign-in / sign-up with JWT authentication

### Admin
- Dashboard with revenue, order, product, and user statistics
- Product management: add, edit, delete products with search/filter
- User management: view, search, toggle active/inactive, delete non-admin accounts
- Driver management: create drivers, view availability, set available/busy/inactive status
- Order management: view all orders, assign drivers to orders ready for pickup

### Driver
- Driver dashboard with delivery statistics
- View orders assigned to the logged-in driver only
- Update delivery status: Assigned → Picked Up → Out for Delivery → Delivered
- Set availability status (Available / Busy / Inactive)

### General
- Fully responsive design with sticky navbar and hamburger menu on mobile
- Light/dark theme toggle
- Cart badge showing item count
- Toast notification system for success/error/info messages
- Persistent cart and auth state via localStorage
- Environment-aware routing (dev vs. production base path)
- Health check endpoints for deployment monitoring

---

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | UI library |
| React Router DOM 7 | Client-side routing |
| Axios | HTTP client with JWT interceptor |
| Framer Motion | Animations and transitions |
| Lucide React | Icon library |
| Vite 8 | Build tool and dev server |
| ESLint | Code linting |
| Pure CSS | Custom properties, responsive media queries |

### Backend

| Technology | Purpose |
|------------|---------|
| Python 3.11.9 | Runtime |
| Flask | Web framework |
| Flask-SQLAlchemy | ORM |
| Flask-JWT-Extended | JWT authentication |
| Flask-CORS | Cross-origin resource sharing |
| Werkzeug | Password hashing |
| Gunicorn | Production WSGI server |

### Database

| Technology | Purpose |
|------------|---------|
| SQLite | Lightweight relational database (auto-created on first run) |

### DevOps & Deployment

| Tool | Purpose |
|------|---------|
| Docker | Containerized deployment |
| Docker Hub | Pre-built image hosting |
| Docker Compose | Multi-container orchestration |
| GitHub Actions | CI/CD — lint, build, deploy frontend to GitHub Pages |
| Render | Hosts the backend API |

---

## Application Architecture

```
Customer ──> React Frontend (Vite + Nginx)
                   │
                   v
              Axios (JWT interceptor)
                   │
                   v
              Flask REST API (Gunicorn)
                   │
            ┌──────┼──────┐
            v      v      v
         Auth   Routes  Models
         (JWT)  (REST)  (SQLAlchemy)
                   │
                   v
              SQLite Database

  ┌───────────┼───────────┐
  v           v           v
CUSTOMER     ADMIN      DRIVER
  │           │           │
Order    Assign Driver  Delivery
  │           │           │
  └───────────┼───────────┘
              v
           DELIVERED
```

The frontend communicates with the Flask backend through REST API endpoints. Nginx reverse-proxies all `/api` requests from the frontend container to the backend container. Authentication is handled via JWT tokens stored in `localStorage`. The Axios interceptor automatically attaches the token to every API request. All three roles are protected both on the frontend (via `ProtectedRoute` component) and on the backend (via JWT validation and role checks).

---

## Authentication and User Roles

### Roles

| Role | Access |
|------|--------|
| **Customer** (`user`) | Browse products, manage cart, place orders, view own order status |
| **Admin** (`admin`) | Full management of products, users, drivers, and all orders |
| **Driver** (`driver`) | View assigned orders, update delivery status, set availability |

### JWT Authentication

- JWT tokens are issued on successful sign-in and stored in `localStorage`
- The Axios interceptor automatically attaches the `Authorization: Bearer <token>` header to all API requests
- Tokens expire after **24 hours**
- Passwords are hashed using Werkzeug's `generate_password_hash` before storage

### Role Enforcement

- **Frontend:** `ProtectedRoute` component redirects unauthorized users to `/signin` or `/`
- **Backend:** Every protected endpoint validates the JWT token and checks `role` before processing
- Admin accounts cannot be deactivated or deleted by other admins
- Drivers can only view orders assigned to them; the backend enforces this restriction
- Customers can only view their own orders

---

## Grocery and Product Management

### Products

The application comes pre-seeded with **16 sample products** across 6 categories:

| Category | Example Products |
|----------|-----------------|
| Fruits | Fresh Apples, Banana, Fresh Oranges |
| Dairy | Amul Butter, Full Cream Milk, Paneer |
| Snacks | Lays Classic Salted, Maggi Noodles, Oreo Biscuits |
| Beverages | Coca-Cola, Tropicana Juice |
| Vegetables | Tomato, Onion, Potato |
| Household | Surf Excel, Vim Dishwash Liquid |

### Admin Product Operations

- Add new products with name, description, price, image URL, category, and stock
- Edit existing products
- Delete products
- Search and filter products by name or category
- View low-stock alerts on the dashboard

---

## Cart and Order Management

### Customer Cart Flow

```
Browse Products → Add to Cart → Adjust Quantities → Proceed to Checkout
                                                          │
                                                    Enter Delivery
                                                    Address, City,
                                                    Phone, Pincode
                                                          │
                                                    Place Order
                                                          │
                                                    Order Created
                                                    (stock validated
                                                     server-side)
```

### Checkout Details

- Delivery address, city, pincode (6 digits), and phone number (10 digits) are required
- Delivery fee: ₹30 (free delivery on orders above ₹500)
- Stock is validated server-side during order placement
- Cart is cleared after successful order creation

### Order Status Tracking

Customers can view delivery progress on their orders page:

```
✓ Pending
✓ Confirmed
✓ Preparing
✓ Ready for Pickup
✓ Assigned to Driver
✓ Picked Up
✓ Out for Delivery
○ Delivered
```

---

## Driver and Order Status Workflow

### Delivery Status Flow

The driver delivery module follows a strict status transition flow:

```
Order Placed (pending)
      ↓
   Confirmed
      ↓
   Preparing
      ↓
Ready for Pickup
      ↓
  Assigned ──────> Driver picks up assignment
      ↓
  Picked Up ─────> Driver confirms pickup
      ↓
Out for Delivery → Driver is en route
      ↓
  Delivered ─────> Delivery complete
```

### Who Can Do What

| Action | Customer | Admin | Driver |
|--------|----------|-------|--------|
| Place order | Yes | - | - |
| View own orders | Yes | - | - |
| View all orders | - | Yes | - |
| Assign driver | - | Yes | - |
| View assigned orders | - | - | Yes |
| Update delivery status | - | - | Yes (valid transitions only) |
| Manage products | - | Yes | - |
| Manage users | - | Yes | - |
| Manage drivers | - | Yes | - |
| Set driver availability | - | Yes | Yes (own) |

### Driver Availability

| Status | Meaning |
|--------|---------|
| **Available** | Ready to receive new deliveries |
| **Busy** | Currently handling an active delivery |
| **Inactive** | Not available for deliveries |

Availability transitions:
- Available → Busy: when driver picks up an order
- Busy → Available: when driver completes delivery
- Admin can manually set any driver's availability

---

## Payment Methods

The application currently supports the following payment methods:

| Method | Description |
|--------|-------------|
| **Cash on Delivery (COD)** | Pay in cash when the order is delivered to your doorstep |
| **Manual GPay QR Payment** | Scan a GPay QR code and pay manually; order is confirmed upon payment verification |

> Online payment gateway integration (Stripe/Razorpay) is listed as a future improvement.

---

## Docker Deployment

GrocerApp ships as two pre-built Docker images on Docker Hub. The frontend (Nginx) serves the React app and reverse-proxies `/api` requests to the backend (Gunicorn + Flask). The backend stores data in a persistent SQLite volume.

### Docker Hub Images

| Component | Image |
|-----------|-------|
| Frontend | `deveshpandi0202/grocerapp-frontend:latest` |
| Backend | `deveshpandi0202/grocerapp-backend:latest` |

### Architecture

```
Browser ──> Frontend (Nginx :80 → localhost:8080)
                │
                ├── /            → React SPA (static files)
                └── /api/*       → proxy to Backend (Gunicorn :5000)
                                        │
                                        └── SQLite DB (Docker volume: /app/data)
```

---

## Complete Client Installation Instructions

### Prerequisites

Before you begin, make sure the following are installed on your computer:

1. **Git** — Download from [https://git-scm.com](https://git-scm.com)
2. **Docker Desktop** — Download from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - Docker Desktop includes the `docker compose` plugin
   - **Docker Desktop must be running** before you execute any Docker commands

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Deveshpandi-0202/REACT.git
cd REACT
```

### Step 2 — Pull the Docker Images

```bash
docker compose -f docker-compose.pull.yml pull
```

This downloads the latest pre-built frontend and backend images from Docker Hub. You only need to do this once, or when updating to a newer version.

### Step 3 — Start the Application

```bash
docker compose -f docker-compose.pull.yml up -d
```

The `-d` flag runs the containers in the background. On the very first start, the backend automatically creates the database and seeds sample products and demo accounts.

### Step 4 — Open the Application

Open your browser and navigate to:

```
http://localhost:8080
```

That is the **only URL you need**. The frontend proxies all API requests to the backend internally.

---

## How to Start the Application

```bash
docker compose -f docker-compose.pull.yml up -d
```

---

## How to Stop the Application

```bash
docker compose -f docker-compose.pull.yml down
```

This stops and removes the containers but **keeps your data** (the database is stored in a Docker volume).

---

## How to Update to the Latest Docker Images

To pull the newest images and restart the application:

```bash
docker compose -f docker-compose.pull.yml pull
docker compose -f docker-compose.pull.yml up -d
```

This downloads the latest images from Docker Hub and recreates the containers with the new versions. Your data is preserved.

---

## Accessing the Application

| What | URL |
|------|-----|
| Application | [http://localhost:8080](http://localhost:8080) |
| Backend API (internal) | Accessed through the frontend at `/api` |

### Verify Containers Are Running

```bash
docker compose -f docker-compose.pull.yml ps
```

You should see two containers (`grocerapp-backend` and `grocerapp-frontend`) with status `Up`.

### View Logs

```bash
docker compose -f docker-compose.pull.yml logs          # all services
docker compose -f docker-compose.pull.yml logs frontend # frontend only
docker compose -f docker-compose.pull.yml logs backend  # backend only
```

Add `-f` to stream live logs: `docker compose -f docker-compose.pull.yml logs -f`

### Restart the Application

```bash
docker compose -f docker-compose.pull.yml restart
```

### Reset All Data

To wipe the database and start completely fresh:

```bash
docker compose -f docker-compose.pull.yml down -v
docker compose -f docker-compose.pull.yml up -d
```

> **Warning:** This deletes all products, users, orders, and driver data.

---

## Project Structure

```
REACT/
├── .github/
│   └── workflows/
│       └── deploy.yml                  # GitHub Actions CI/CD pipeline
├── backend/
│   ├── app.py                          # Flask app — routes, models, seed logic
│   ├── seed.py                         # Database seeder (standalone script)
│   ├── requirements.txt                # Python dependencies
│   ├── runtime.txt                     # Python version pin
│   ├── Dockerfile                      # Backend Docker image definition
│   ├── entrypoint.sh                   # Container entrypoint (Gunicorn)
│   └── .dockerignore                   # Docker build exclusions
├── my-react-app/
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # Node dependencies & scripts
│   ├── vite.config.js                  # Vite configuration
│   ├── nginx.conf                      # Nginx config for SPA + API proxy
│   ├── Dockerfile                      # Frontend Docker image definition
│   ├── .env.example                    # Env template for local development
│   ├── .env.production                 # Production API URL
│   ├── .dockerignore                   # Docker build exclusions
│   └── src/
│       ├── main.jsx                    # React entry point
│       ├── App.jsx                     # Root component with all routes
│       ├── App.css                     # All styles (responsive)
│       ├── index.css                   # Root reset
│       ├── api/
│       │   └── axios.js               # Axios instance + JWT interceptor
│       ├── context/
│       │   ├── AuthContext.jsx         # Authentication state management
│       │   ├── CartContext.jsx         # Shopping cart state management
│       │   ├── ThemeContext.jsx        # Light/dark theme toggle
│       │   └── ToastContext.jsx        # Toast notification system
│       ├── components/
│       │   ├── Navbar.jsx              # Navigation bar with role-based links
│       │   ├── ProtectedRoute.jsx      # Auth/role guard
│       │   ├── ProductCard.jsx         # Product grid card
│       │   ├── CartItem.jsx            # Cart line item
│       │   ├── CategoryFilter.jsx      # Category filter buttons
│       │   ├── Footer.jsx              # Site footer
│       │   └── PasswordInput.jsx       # Password field with show/hide toggle
│       └── pages/
│           ├── Home.jsx                # Product listing with search & filters
│           ├── ProductDetail.jsx       # Single product view + add to cart
│           ├── Signin.jsx              # Login form
│           ├── Signup.jsx              # Registration form
│           ├── Cart.jsx                # Cart review and checkout link
│           ├── Checkout.jsx            # Delivery details + place order
│           ├── Orders.jsx              # Customer order history with status tracking
│           ├── admin/
│           │   ├── Dashboard.jsx       # Admin stats, product table, search
│           │   ├── AddProduct.jsx      # Add product form
│           │   ├── EditProduct.jsx     # Edit product form
│           │   ├── UserManagement.jsx  # User management panel
│           │   ├── DriverManagement.jsx # Driver management panel
│           │   └── OrdersManagement.jsx # All orders + driver assignment
│           └── driver/
│               └── DriverDashboard.jsx # Driver dashboard + delivery status controls
├── docker-compose.yml                  # Docker Compose (build from source)
├── docker-compose.pull.yml             # Docker Compose (pull pre-built images)
├── deploy.ps1                          # Manual deploy script (PowerShell)
├── render.yaml                         # Render deployment config
└── README.md
```

---

## API Overview

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | No | Backend health check |
| `GET` | `/api` | No | API status and available endpoints |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | No | Register a new user |
| `POST` | `/api/auth/signin` | No | Login, returns JWT token and user info |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/products` | No | List products (supports `?category=` and `?search=`) |
| `GET` | `/api/products/:id` | No | Get a single product by ID |
| `POST` | `/api/products` | JWT + Admin | Create a new product |
| `PUT` | `/api/products/:id` | JWT + Admin | Update an existing product |
| `DELETE` | `/api/products/:id` | JWT + Admin | Delete a product |

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/categories` | No | List distinct product categories |

### Orders (Customer)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/orders` | JWT | Place an order (validates stock, requires delivery details) |
| `GET` | `/api/orders/my` | JWT | Get current user's order history |
| `GET` | `/api/orders/:id` | JWT | Get a specific order by ID |

### Driver

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/driver/orders` | JWT + Driver | List orders assigned to the logged-in driver |
| `GET` | `/api/driver/orders/:id` | JWT + Driver | Get details of a specific assigned order |
| `PUT` | `/api/driver/orders/:id/status` | JWT + Driver | Update delivery status (validates transition) |

### Admin — Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/orders` | JWT + Admin | List all orders |
| `PUT` | `/api/admin/orders/:id/assign-driver` | JWT + Admin | Assign a driver to an order |

### Admin — Drivers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/drivers` | JWT + Admin | List all drivers with stats |
| `POST` | `/api/admin/drivers` | JWT + Admin | Create a new driver account |
| `PUT` | `/api/admin/drivers/:id/availability` | JWT + Admin | Set driver availability |

### Admin — Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/users` | JWT + Admin | List all users |
| `PUT` | `/api/admin/users/:id/toggle` | JWT + Admin | Toggle user active/inactive status |
| `DELETE` | `/api/admin/users/:id` | JWT + Admin | Delete a non-admin user |

### Admin — Dashboard Stats

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/stats` | JWT + Admin | Revenue, order, product, user, and driver statistics |

---

## Important Notes

- **Docker Desktop must be running** before executing any `docker compose` commands.
- The application uses `docker-compose.pull.yml` (not `docker-compose.yml`) for the client delivery workflow. Always specify `-f docker-compose.pull.yml` in your commands.
- The backend is **not exposed directly** to your computer. All API traffic goes through the frontend's Nginx proxy at `/api`.
- On the first start, the backend automatically creates the database schema and seeds sample products and demo accounts. No manual setup is needed.
- Data is persisted in a Docker volume (`backend-data`). Container restarts and `docker compose down` do not delete your data.
- Use `docker compose -f docker-compose.pull.yml down -v` only if you want to **wipe all data** and start fresh.
- The `JWT_SECRET_KEY` in the compose file uses a development default. For production, set a secure secret in a `.env` file in the project root.
- The admin login uses `admin123` as the email/username field (not an actual email address).
- Driver status transitions are validated server-side. Drivers cannot skip or reverse statuses arbitrarily.
- The application is fully responsive and works on desktop, tablet, and mobile devices.

---

## GitHub Repository

[https://github.com/Deveshpandi-0202/REACT](https://github.com/Deveshpandi-0202/REACT)

## Docker Hub

| Component | Link |
|-----------|------|
| Frontend Image | [https://hub.docker.com/r/deveshpandi0202/grocerapp-frontend](https://hub.docker.com/r/deveshpandi0202/grocerapp-frontend) |
| Backend Image | [https://hub.docker.com/r/deveshpandi0202/grocerapp-backend](https://hub.docker.com/r/deveshpandi0202/grocerapp-backend) |
