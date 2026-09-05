# 🚀 Hackathon Full-Stack Architecture Skeleton

A pre-built, robust, zero-friction foundation engineered for speed during hackathons. Includes **Laravel 13 API with Sanctum & Role-based Authorization**, a modern **React (Vite + TypeScript + Tailwind CSS) Dashboard**, an internal **Node.js + Socket.io Realtime Broadcast Server**, and a **1-command dev runner**.

---

## 🏗️ Architecture & Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                    │
│             http://localhost:5173 (Port 5173)               │
│  - React Router v6          - Tailwind CSS                  │
│  - Axios with Interceptors  - Socket.io Client Hook         │
│  - Accessible Dialogs/UI    - Auth / Role State             │
└──────────────┬──────────────────────────────▲───────────────┘
               │ HTTP Requests                │ WebSockets
               │ (Bearer Token)               │ (Live Events)
               ▼                              │
┌───────────────────────────────┐  HTTP POST  ┌──────────────────────────────┐
│       Laravel 13 API          │────────────▶│    Node.js Socket.io Server  │
│    http://localhost:8000      │ /broadcast  │    http://localhost:3001     │
│ - Sanctum API Tokens          │             │ - Room / Channel Pub-Sub     │
│ - Role Middleware (Admin/User)│             │ - HTTP Webhook Dispatcher    │
│ - SQLite (Zero Config)        │             │ - Health & Ping/Pong Handler │
│ - Resource Controllers        │             └──────────────────────────────┘
└───────────────────────────────┘
```

---

## ⚡ Quick Start (1 Command)

### 1. Install & Setup
Run the automated setup script once:
```bash
./setup.sh
# or: npm run setup
```
This prepares `.env` files, installs dependencies across all three services, sets up SQLite, and seeds initial accounts.

### 2. Boot All Services
Start Laravel, Socket.io, and Vite concurrently with a single command:
```bash
npm run dev
```

The services will be live at:
| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:5173](http://localhost:5173) | React SPA with Live Realtime Status & CRUD UI |
| **Backend API** | [http://localhost:8000/api](http://localhost:8000/api) | Laravel REST API (Sanctum Authenticated) |
| **Realtime WS** | [http://localhost:3001](http://localhost:3001) | Socket.io server & `/api/broadcast` webhook |

---

## 🔑 Pre-Seeded Hackathon Accounts

The SQLite database is pre-seeded with sample users and records:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password` (or `password123`) | Full access, `/admin` route & API metrics |
| **User** | `user@example.com` | `password` (or `password123`) | Standard CRUD, denied from admin routes |

> **Tip**: The login page includes **1-Click Quick Login buttons** for instant testing.

---

## 📂 Project Structure

```text
├── backend/                  # Laravel 13 API
│   ├── app/
│   │   ├── Http/Controllers/Api/  # AuthController, ItemController
│   │   ├── Http/Middleware/       # RoleMiddleware
│   │   ├── Http/Requests/         # Form validation requests
│   │   ├── Http/Resources/        # Clean JSON API resources
│   │   ├── Models/                # User (Sanctum + Role), Item
│   │   └── Services/              # RealtimeService (HTTP webhook dispatcher)
│   ├── database/migrations/       # Users, Tokens, Items migrations
│   ├── database/seeders/          # Default admin, user, and demo records
│   └── routes/api.php             # Public & guarded routes
│
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/ui/         # Button, Input, Dialog, Card, Table, Badge...
│   │   ├── components/layout/     # Navbar (Live Socket badge), AppLayout
│   │   ├── components/auth/       # ProtectedRoute, RoleRoute
│   │   ├── context/               # AuthContext, SocketContext, ToastContext
│   │   ├── lib/api.ts             # Axios with Bearer token interceptor & 401 handler
│   │   ├── pages/                 # LoginPage, RegisterPage, Dashboard, ItemsPage, AdminPage
│   │   └── App.tsx                # React Router v6 setup
│
├── realtime/                 # Node.js + Socket.io Server
│   ├── server.js                  # Socket server + POST /api/broadcast webhook
│   └── test-client.js             # Automated end-to-end socket test
│
├── CRUD_BLUEPRINT.md         # 5-minute copy-paste recipe for new features
├── docker-compose.yml        # Multi-container setup for Docker hosts
├── setup.sh                  # One-click installation script
└── package.json              # Root orchestrator (npm run dev)
```

---

## 📋 Fast CRUD Boilerplate

To build your actual problem statement features fast, open:
👉 **[`CRUD_BLUEPRINT.md`](./CRUD_BLUEPRINT.md)**

It provides the copy-paste pattern:
`Model` -> `Migration` -> `Controller` -> `Resource` -> `Realtime Broadcast` -> `React Form + Table`.

---

## 🐳 Docker Deployment (Optional)

If deploying to a cloud VM or Docker environment:
```bash
docker compose up --build
```
This spins up `hackathon_backend`, `hackathon_realtime`, and `hackathon_frontend` containers simultaneously.

