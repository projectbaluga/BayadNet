# 🌐 BayadNet: Internet Subscriber Management System

BayadNet is a modern, mobile-first Web Application (PWA) designed for ISPs to manage subscriber billing, track payments, and automate outage-related credits. Built with the MERN stack and fully containerized with Docker.

---

## ✨ Features

### 💎 Premium Modern UI (Glassmorphism)
- **Glassmorphism Design**: Minimalist SaaS dashboard with `backdrop-blur` effects, soft shadows, and a clean `bg-slate-50` aesthetic.
- **Mobile-First & Responsive**: Adapts seamlessly from handheld devices to high-end desktops (4-column grid layout).
- **Visual Status Indicators**: Instant recognition of account status with color-coded badges (Green: Paid, Red: Overdue, Orange: Due Today).
- **Smart Filtering**: Filter subscribers by payment status (All, Paid, Overdue, Upcoming).

### 🧮 Pro-rated Rebate System
The system features an automated, fair billing logic that replaces fixed credits with a daily pro-rated rebate system.
- **Formula**: `Rebate = (Monthly Rate / 30) * Days Down`
- **Automatic Calculation**: The total amount due is automatically calculated by deducting the rebate from the base monthly rate.
- **Precision**: Calculations are rounded to 2 decimal places to ensure financial accuracy.

### 📊 Comprehensive Dashboard
- **Total Subscribers**: Real-time count of all active users.
- **Monthly Revenue**: Projected revenue after all rebates are applied.
- **Total Collected**: Real-time tracking of payments received.
- **Overdue/Due Today**: Critical metrics highlighted for immediate action.

---

## 🛠 Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS (Glassmorphism theme), Headless UI.
- **Backend**: Node.js, Express, Mongoose.
- **Database**: MongoDB (with persistent volume).
- **Security**: JWT Authentication, Bcrypt password hashing.
- **Deployment**: Docker, Docker Compose, Nginx (Multi-stage builds).

---

## 🏃 Installation & Deployment

### Prerequisites
- Docker and Docker Compose installed on your system.

### Quick Start
1. **Clone the repository** and navigate to the project root.
2. **Launch the system**:
   ```bash
   sudo docker compose up --build -d
   ```
3. **Access the Application**:
   - **Frontend**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000`

### Admin Credentials
- **Username**: `admin`
- **Password**: `password123`

---

## ⚙️ Environment Variables

The system uses environment variables in the `docker-compose.yml` for configuration:

| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `TZ` | System Timezone for accurate billing cycles | `Asia/Manila` |
| `SIMULATION_DATE` | Mock date for testing billing logic (e.g. Feb 2026) | `2026-02-15` |
| `JWT_SECRET` | Secret key for token generation | `your_secret_string` |
| `MONGO_URI` | MongoDB Connection String | `mongodb://mongo:27017/internet_billing` |

---

## 🗄️ Database Management

- **Automated Seeding**: The `seed.js` script automatically populates the database with initial subscriber data if the collection is empty.
- **Persistence**: A Docker volume `mongo-data` is used to ensure payment history and subscriber data persist across container restarts.
- **Manual Management**: For detailed DB operations, see [DB_MANAGEMENT.md](./DB_MANAGEMENT.md).

---

## 📁 Project Structure

```text
├── client/                 # React Frontend
│   ├── src/                # UI Components (Glassmorphism theme)
│   ├── Dockerfile          # Multi-stage production build (Nginx)
│   └── nginx.conf          # Reverse proxy configuration
├── server/                 # Node.js Backend
│   ├── models/             # Mongoose Schemas
│   ├── utils/              # Rebate & Billing Logic
│   ├── tests/              # Jest Unit Tests
│   └── Dockerfile          # Backend production build
└── docker-compose.yml       # Service Orchestration
```

---

## 📝 License
MIT
