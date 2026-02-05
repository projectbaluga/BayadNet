# 🌐 BayadNet: Internet Subscriber Management System

BayadNet is a modern, mobile-first Web Application (PWA) designed for ISPs to manage subscriber billing, track payments, and automate outage-related credits. Built with the MERN stack and fully containerized with Docker.

---

## ✨ Features

### 💎 Premium Modern UI (Glassmorphism)
- **Glassmorphism Design**: Minimalist SaaS dashboard with `backdrop-blur` effects, soft shadows, and a clean `bg-slate-50` aesthetic.
- **Mobile-First & Responsive**: Adapts seamlessly from handheld devices to high-end desktops.
- **Visual Status Indicators**: Instant recognition of account status with color-coded badges:
  - 🟢 **Paid**: Account settled for the current month.
  - 🔴 **Overdue**: Past the billing cycle date.
  - 🟠 **Due Today**: Billing date matches current date.
  - 🟡 **Partial**: Payment made but doesn't cover the full pro-rated amount.
- **Smart Filtering**: Auto-categorization into 'Overdue/Partial', 'Upcoming', and 'Settled' sections.

### 🧮 Pro-rated Rebate System
Automated billing logic that ensures fairness by deducting service downtime.
- **Formula**: `Rebate = (Monthly Rate / Divisor) * Days Down`
- **Configurable Divisor**: Default is 30 days, adjustable via Admin Settings.
- **Automatic Calculation**: Deducts rebates from the base rate to determine the final `Amount Due`.
- **Precision**: Financial calculations are rounded to 2 decimal places.

### 📊 Real-time Dashboard & Analytics
- **Financial Snapshot**: Track Total Expected Revenue, Total Collected, and Net Profit (Total Collected - Provider Cost).
- **Collection Efficiency**: Visual gauge showing percentage of collected vs. expected revenue.
- **Issue Timeline**: Real-time chat-style reporting for technicians and staff with Socket.io integration.
- **Read Receipts**: "Seen by" indicators for issue reports to ensure team coordination.

---

## 🛠 Tech Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS, Lucide Icons, Socket.io-client.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io.
- **Real-time**: WebSockets for instant updates on reports and read receipts.
- **Storage**: Cloudinary integration for report attachments; local storage for proof-of-payment receipts.
- **Security**:
  - JWT-based Authentication.
  - Role-Based Access Control (Admin, Staff, Technician).
  - Express Rate Limiting on public routes.
- **Deployment**: Dockerized services with Nginx reverse proxy.

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

## 🔍 Codebase Overview & Architecture

### Backend (`/server`)
- **`index.js`**: Main entry point, Socket.io setup, and API routing.
- **`utils/logic.js`**: Core billing engine containing `processSubscriber` and `calculateStats`.
- **`models/`**: Mongoose schemas for `Subscriber`, `User`, `Setting`, and `MonthlyReport`.
- **`config/time.js`**: Virtual clock utility for simulation mode.

### Frontend (`/client`)
- **`App.jsx`**: Central dashboard logic and state management.
- **`components/`**: Modular UI elements like `SubscriberCard`, `SettingsModal`, and `UserManagement`.
- **`pages/CheckStatus.jsx`**: A public-facing portal for subscribers to check their balance using their Account ID.

### Real-time Flow
1. Staff adds a report on a Subscriber Card.
2. Server saves to DB and emits `report-added` via Socket.io.
3. Other connected clients receive the event and show a "New Report" notification (with sound).
4. When an Admin opens the "Issues" section, a `mark-as-read` event is sent, updating the "Seen by" status for everyone.

---

## 🚀 Future Roadmap & Improvements

- [ ] **Dynamic Monthly Cycles**: Transition from hardcoded "February 2026" to a dynamic system that handles recurring monthly billing automatically.
- [ ] **Component Decomposition**: Refactor `App.jsx` into smaller, reusable hooks and sub-components.
- [ ] **Enhanced Reporting**: Add PDF export for monthly financial reports.
- [ ] **Payment Gateway Integration**: Integrate GCash/PayMaya APIs for automated payment verification.

---

## 📝 License
MIT
