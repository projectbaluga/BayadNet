# 🌐 Internet Subscriber Management System (PWA)

A modern, mobile-first Web Application for managing internet subscribers, billing cycles, and payment adjustments.

## 🚀 Features

- **Mobile-First Design**: Optimized for mobile devices with a card-based layout and large interactive elements.
- **PWA Ready**: Installable on home screens and includes offline caching via Service Workers.
- **Automated Billing**: Automatically calculates status (Paid, Due Today, Overdue) for February 2026.
- **Special Credit Rules**:
    - **Storm Credit**: Automatically applies a 50% discount to eligible subscribers.
    - **Free Month**: Handles 100% credit for specific subscribers (e.g., "Bonete").
- **Dashboard**: Real-time summary of Collections, Overdue accounts, and Today's dues.
- **Secure Authentication**: JWT-based admin login.
- **Dockerized**: Ready for production with multi-stage builds and Nginx.

---

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Axios.
- **Backend**: Node.js, Express, Mongoose.
- **Database**: MongoDB.
- **Deployment**: Docker, Docker Compose, Nginx.

---

## 🏃 Quick Start (Docker)

Ensure you have **Docker** and **Docker Compose** installed.

1.  **Clone the project** and navigate to the root directory.
2.  **Run the application**:
    ```bash
    docker-compose up --build
    ```
3.  **Access the App**:
    -   Frontend: `http://localhost:3000`
    -   Backend API: `http://localhost:5000`
4.  **Login Credentials**:
    -   **Username**: `admin`
    -   **Password**: `password123`

*Note: The database is automatically seeded with initial subscriber data on startup.*

---

## 📁 Project Structure

```text
├── client/                 # React Frontend
│   ├── src/                # UI Components & Logic
│   ├── public/             # PWA Assets (Manifest, Service Worker)
│   ├── Dockerfile          # Multi-stage production build
│   └── nginx.conf          # Production Nginx configuration
├── server/                 # Node.js Backend
│   ├── models/             # Mongoose Schemas (Subscriber, User)
│   ├── index.js            # Express API & Business Logic
│   ├── seed.js             # Data seeding script
│   └── Dockerfile          # Backend production build
└── docker-compose.yml       # Orchestration
```

---

## ⚖️ Business Logic (Feb 2026)

-   **Storm Credit**: Subscribers with "2 Weeks" credit receive a **50% discount** on their monthly rate for Feb 2026.
-   **1 Month Free**: Subscribers with "1 Month" credit (e.g., "Bonete") are automatically marked as **Paid** with an amount due of **₱0**.
-   **Cycle Logic**: Status is calculated by comparing the subscriber's billing cycle (e.g., 7th) against the current date.
-   **Simulation Date**: You can change the "current date" by setting the `SIMULATION_DATE` environment variable in the `docker-compose.yml` (e.g., `SIMULATION_DATE=2026-03-01`).

---

## 🗄️ Database Management
For detailed instructions on how to manage the MongoDB database, connect via Compass, or perform backups, please refer to the [DB_MANAGEMENT.md](./DB_MANAGEMENT.md) guide.

---

## 🛡 Production Considerations

-   **Nginx**: Serves the frontend static files and proxies API requests to the backend.
-   **JWT**: All sensitive endpoints are protected by Bearer Token authentication.
-   **Bcrypt**: Admin passwords are salted and hashed before being stored in MongoDB.
-   **Security Headers**: Dockerized setup uses standard production-grade images.

---

## 📝 License
MIT
