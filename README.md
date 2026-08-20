# GrocerApp

A full-stack grocery delivery web application inspired by Blinkit. Built with React (Vite) on the frontend and Python Flask on the backend, featuring JWT-based authentication, role-based access control, product management, shopping cart, and order placement.

---

## Live Demo

| Layer | URL |
|-------|-----|
| **Frontend** (GitHub Pages) | [https://deveshpandi-0202.github.io/REACT/](https://deveshpandi-0202.github.io/REACT/) |
| **Backend API** (Render) | [https://blinkit-backend-mg62.onrender.com/api](https://blinkit-backend-mg62.onrender.com/api) |

---

## Features

### Customer

- Browse products with category filtering and live search (debounced)
- View detailed product pages with stock information
- Add items to cart with adjustable quantities (capped to available stock)
- Place orders with real-time stock validation on the backend
- Secure sign-in / sign-up with JWT authentication
- Responsive design for desktop, tablet, and mobile

### Admin

- Dashboard to view, add, edit, and delete products
- User management panel with statistics (total, active, inactive users)
- Toggle user active/inactive status and delete non-admin accounts
- Role-based access control (admin-only routes)

### General

- Fully responsive design with sticky navbar and hamburger menu on mobile
- Cart badge showing item count
- Persistent cart and auth state via localStorage
- Environment-aware routing (dev vs. production base path)
- Health check endpoints for deployment monitoring

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | UI library |
| React Router DOM 7 | Client-side routing |
| Axios | HTTP client with JWT interceptor |
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
| GitHub Actions | CI/CD — lint, build, deploy frontend to GitHub Pages |
| Render | Hosts the backend API |

---

## Project Architecture

```
React Frontend (Vite)
    |
    v
Axios API Requests (with JWT interceptor)
    |
    v
Flask REST API
    |
    v
JWT Authentication / Authorization
    |
    v
SQLAlchemy ORM
    |
    v
SQLite Database
```

The frontend communicates with the Flask backend through REST API endpoints. Authentication is handled via JWT tokens stored in `localStorage`. The Axios interceptor automatically attaches the token to every API request. Admin-only routes are protected both on the frontend (via `ProtectedRoute` component) and on the backend (via JWT validation and role checks).

---

## Project Structure

```
REACT/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD pipeline
├── backend/
│   ├── app.py                      # Flask app — routes, models, init
│   ├── seed.py                     # Database seeder (standalone script)
│   ├── requirements.txt            # Python dependencies
│   ├── runtime.txt                 # Python version pin
│   └── blinkit.db                  # SQLite database (auto-created, git-ignored)
├── my-react-app/
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Node dependencies & scripts
│   ├── vite.config.js              # Vite configuration
│   ├── eslint.config.js            # ESLint flat config
│   ├── .env.example                # Env template for local development
│   ├── .env.production             # Production API URL (GitHub Pages)
│   └── src/
│       ├── main.jsx                # React entry point
│       ├── App.jsx                 # Root component with routes
│       ├── App.css                 # All styles (responsive)
│       ├── index.css               # Root reset
│       ├── api/
│       │   └── axios.js            # Axios instance + JWT interceptor
│       ├── context/
│       │   ├── AuthContext.jsx      # Authentication state management
│       │   └── CartContext.jsx      # Shopping cart state management
│       ├── components/
│       │   ├── Navbar.jsx           # Navigation bar with cart badge
│       │   ├── ProtectedRoute.jsx   # Auth/role guard
│       │   ├── ProductCard.jsx      # Product grid card
│       │   ├── CartItem.jsx         # Cart line item
│       │   └── CategoryFilter.jsx   # Category filter buttons
│       └── pages/
│           ├── Home.jsx             # Product listing with search & filters
│           ├── ProductDetail.jsx    # Single product view + add to cart
│           ├── Signin.jsx           # Login form
│           ├── Signup.jsx           # Registration form
│           ├── Cart.jsx             # Cart & checkout
│           └── admin/
│               ├── Dashboard.jsx    # Admin product table
│               ├── AddProduct.jsx   # Add product form
│               ├── EditProduct.jsx  # Edit product form
│               └── UserManagement.jsx # User management panel
├── deploy.ps1                      # Manual deploy script (PowerShell)
├── render.yaml                     # Render deployment config
└── README.md
```

---

## Database Schema

### Users Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer | Primary key |
| `name` | String(120) | Not null |
| `email` | String(120) | Unique, not null |
| `password` | String(256) | Hashed with Werkzeug |
| `role` | String(10) | `"admin"` or `"user"` |
| `is_active` | Boolean | Default `True` |
| `created_at` | DateTime | Auto-set on creation |

### Products Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer | Primary key |
| `name` | String(200) | Not null |
| `description` | Text | Default empty |
| `price` | Float | Not null |
| `image_url` | String(500) | Default empty |
| `category` | String(100) | Not null |
| `stock` | Integer | Default 0 |
| `created_at` | DateTime | Auto-set on creation |

### Orders Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer | Primary key |
| `user_id` | Integer | Foreign key to `users.id` |
| `total_amount` | Float | Not null |
| `status` | String(20) | Default `"pending"` |
| `created_at` | DateTime | Auto-set on creation |

### Order Items Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer | Primary key |
| `order_id` | Integer | Foreign key to `orders.id` |
| `product_id` | Integer | Foreign key to `products.id` |
| `quantity` | Integer | Not null |
| `price` | Float | Price at time of order |

---

## API Endpoints

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | No | Backend health check |
| `GET` | `/api` | No | API status and available endpoints |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | No | Register a new user |
| `POST` | `/api/auth/signin` | No | Login, returns JWT token |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/products` | No | List products (supports `?category=` and `?search=` query params) |
| `GET` | `/api/products/:id` | No | Get a single product by ID |
| `POST` | `/api/products` | JWT + Admin | Create a new product |
| `PUT` | `/api/products/:id` | JWT + Admin | Update an existing product |
| `DELETE` | `/api/products/:id` | JWT + Admin | Delete a product |

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/categories` | No | List distinct product categories |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/orders` | JWT | Place an order (validates stock availability) |
| `GET` | `/api/orders/my` | JWT | Get current user's order history |

### Admin — User Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/users` | JWT + Admin | List all users |
| `PUT` | `/api/admin/users/:id/toggle` | JWT + Admin | Toggle user active/inactive status |
| `DELETE` | `/api/admin/users/:id` | JWT + Admin | Delete a non-admin user |

---

## Authentication & Authorization

- **JWT tokens** are issued on successful sign-in and stored in `localStorage`
- The Axios interceptor automatically attaches the `Authorization: Bearer <token>` header to all API requests
- Tokens expire after **24 hours**
- **Protected routes** on the frontend redirect unauthenticated users to `/signin`
- **Admin routes** redirect non-admin users to `/`
- **Backend middleware** validates JWT and checks `role === "admin"` on protected endpoints
- Admin accounts cannot be deactivated or deleted by other admins
- Passwords are hashed using Werkzeug's `generate_password_hash` before storage

---

## User Flow

```
Home (browse, search, filter products)
  -> Product Detail (view details, choose quantity)
    -> Add to Cart
      -> Cart Page (review items, adjust quantities)
        -> Checkout (place order with backend stock validation)
          -> Order Confirmation
```

## Admin Flow

```
Admin Dashboard (view all products in table)
  -> Add Product / Edit Product / Delete Product

Admin User Management (view all users with statistics)
  -> Toggle active status / Delete user
```

## Cart & Order Flow

```
Add to Cart -> Stored in localStorage via CartContext
Adjust Quantity -> Updates in-memory state -> Synced to localStorage
Checkout -> Cart items sent to backend API -> Stock validated server-side -> Order created -> Cart cleared
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18 and **npm**
- **Python** >= 3.11 and **pip**
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Deveshpandi-0202/REACT.git
cd REACT
```

### 2. Set Up the Backend

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server (auto-creates DB + seeds sample data on first run)
python app.py
```

The backend starts at **`http://localhost:5000`**.

### 3. Set Up the Frontend

Open a new terminal:

```bash
cd my-react-app

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend starts at **`http://localhost:5173`**.

### 4. Open in Browser

Navigate to **`http://localhost:5173`**.

---

## Environment Variables

### Frontend (`my-react-app/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

A `.env` file is used for local development. For production, `.env.production` points to the deployed backend on Render.

### Backend

The Flask app reads these from the environment:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `JWT_SECRET_KEY` | Secret for signing JWT tokens | `<dev-only-fallback>` |

> **Note:** On Render, `JWT_SECRET_KEY` is auto-generated via the `render.yaml` configuration. For production, always set a secure secret through your deployment platform. Never commit real secret values to the repository.

---

## Deployment

### Frontend — GitHub Pages

Automatic via GitHub Actions. Every push to `main` triggers:

1. `npm ci` — install dependencies
2. `npm run lint` — lint check
3. `npm run build` — production build
4. Deploy to GitHub Pages

### Backend — Render

Auto-deploys via `render.yaml`:

1. Installs Python dependencies from `requirements.txt`
2. Starts with `gunicorn app:app`
3. Health check configured at `/`
4. `JWT_SECRET_KEY` is auto-generated in the Render dashboard

---

## Scripts Reference

### Frontend (`my-react-app/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `python app.py` | Run Flask dev server |
| `gunicorn app:app` | Run with Gunicorn (production) |
| `python seed.py` | Drop and recreate all tables with seed data |

---

## Future Improvements

- Order history page for customers
- Payment gateway integration (Stripe/Razorpay)
- Product image upload instead of URL input
- Pagination for product listings
- Email notifications for order confirmation
- Admin analytics dashboard with sales charts
- Product reviews and ratings
- Inventory alerts when stock is low
- Migrate from SQLite to PostgreSQL for production
- Rate limiting on authentication endpoints

---

## Author

**Devesh Pandi**
GitHub: [Deveshpandi-0202](https://github.com/Deveshpandi-0202)
