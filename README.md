# StatusEnzin — Enterprise Multi-Tenant Uptime Monitoring & Status Page Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Backend](https://img.shields.io/badge/.NET-10.0-purple.svg)
![Frontend](https://img.shields.io/badge/Next.js-15.1-black.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-336791.svg)

**StatusEnzin** is a multi-tenant SaaS platform for automated HTTP/HTTPS endpoint monitoring, custom status page publishing, incident lifecycle management, and subscriber notifications — engineered with strict tenant data isolation, Stripe subscription billing, and real-time performance analytics.

---

## 🚀 Key Features

- **Automated High-Frequency Monitoring**: Background HTTP/HTTPS health checks at configurable intervals (30 seconds to 5 minutes) tracking status codes, response latencies, and 90-day rolling uptime percentages.
- **Interactive Public & Private Status Pages**: Live auto-refreshing status portals featuring 90-day visual uptime bar graphs, real-time latency charts, active incident timelines, and double opt-in email subscriber management.
- **Incident Lifecycle Management**: Complete incident workflow tracking (`Investigating` → `Identified` → `Monitoring` → `Resolved`) with real-time status updates and automated subscriber alerts.
- **Multi-Tenant Data Isolation**: Database-level scoping powered by EF Core Global Query Filters ensuring complete per-tenant isolation across all system queries.
- **Platform Administrator Control Panel**: Centralized management portal (`/platform-admin`) for platform super admins (`nazmul.d3V`) to monitor system-wide tenants, inspect real-time metrics, and manage tenant suspensions.
- **Day/Night Theme Toggle**: Native Dark/Light mode theme switcher (`ThemeToggle`) built into the top navigation bar with persistent user preferences in `localStorage`.
- **Stripe Subscription Billing**: Flexible 3-tier pricing model (`Starter`, `Pro`, `Business`) with coupon code support, prorated plan upgrades, and embedded Stripe Elements checkout.
- **Email Notification Queue**: Background worker for email subscriber confirmations and incident notifications delivered via Resend API.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend API** | .NET 10 Web API, ASP.NET Core Identity + JWT Authentication |
| **ORM & DB** | Entity Framework Core 9.0 + Npgsql (PostgreSQL 16) |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Vanilla CSS Design System + Tailwind CSS, Lucide Icons |
| **Payments** | Stripe.net SDK & Stripe Elements |
| **Email Service** | Resend API |

---

## 📁 Repository Structure

```
statusenzin/
├── README.md                                 # Project documentation & author details
├── docker-compose.yml                        # Multi-container Docker deployment
├── backend/
│   └── StatusEnzin.Api/                      # .NET 10 Web API project
│       ├── Controllers/                      # Auth, Monitors, Incidents, Admin, Billing
│       ├── Data/                             # AppDbContext, DbSeeder, TenantProvider
│       ├── DTOs/                             # API Data Transfer Objects
│       ├── Models/                           # Tenant, User, Monitor, Incident, StatusPage
│       ├── Services/                         # MonitorCheckWorker, StripeService, ResendEmailService
│       ├── Program.cs                        # Web API configuration & middleware
│       └── .env.example                      # Backend environment template
│
└── frontend/                                 # Next.js 15 App Router project
    ├── app/                                  # App Router pages (Dashboard, Admin, Status, Auth)
    ├── components/                           # Navbar, ThemeToggle, UptimeBar, StatusBadge
    ├── lib/                                  # Axios API client & TypeScript interfaces
    ├── public/                               # Static assets and branding logos
    └── package.json                          # Frontend dependencies
```

---

## 💻 Local Setup & Installation

### Prerequisites
- **.NET 10 SDK** (10.0+)
- **Node.js** (v18.0+) & **npm**
- **PostgreSQL** (14.0+) or free cloud database from [Neon.tech](https://neon.tech)

---

### Step 1 — Backend Configuration (.NET 10)

1. Navigate to the backend directory:
   ```powershell
   cd backend/StatusEnzin.Api
   ```

2. Create `.env` file and set database & admin credentials:
   ```env
   DATABASE_URL=Host=localhost;Port=5432;Database=statusenzin_dev;Username=postgres;Password=your_postgres_password
   API_URL=http://localhost:5001
   FRONTEND_URL=http://localhost:3000
   ALLOWED_ORIGINS=http://localhost:3000

   SUPER_ADMIN_EMAIL=nazmul.d3v@gmail.com
   SUPER_ADMIN_PASSWORD=15114600
   SUPER_ADMIN_FULL_NAME=Nazmul Dev Admin

   JWT_KEY=StatusEnzinSuperSecretKeyForJWTAuth2026!MustBeVeryLong
   SEED_DEMO_DATA=true
   ```

3. Restore dependencies and launch the backend API:
   ```powershell
   dotnet restore
   dotnet run
   ```
   The API will start listening at `http://localhost:5001`.

---

### Step 2 — Frontend Configuration (Next.js 15)

1. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001
   ```

3. Install npm packages and start dev server:
   ```powershell
   npm install
   npm run dev
   ```

4. Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔐 Default Administrator Credentials

- **Admin Username / Email**: `nazmul.d3V` / `nazmul.d3v@gmail.com`
- **Password**: `15114600`
- **Admin Access Portal**: Click **Admin Login** in the top navigation header or navigate to **[http://localhost:3000/login?role=admin](http://localhost:3000/login?role=admin)**.

## 🌐 Deploying Live to Vercel

### Step 1: Push Code to GitHub
Run this command in Git Bash to push your code to your repository `https://github.com/nazmul-d3v/statusenzin`:
```bash
git push -u origin main --force
```

### Step 2: Deploy Frontend on Vercel
1. Log into **[Vercel Dashboard](https://vercel.com/new)** and click **Import Repository**.
2. Select your GitHub repository **`nazmul-d3v/statusenzin`**.
3. In **Framework Preset**, select **Next.js**.
4. **IMPORTANT**: Click **Edit** beside **Root Directory** and select **`frontend`**.
5. Under **Environment Variables**, add:
   - Name: `NEXT_PUBLIC_API_URL` | Value: `http://localhost:5001` (or your production API URL)
6. Click **Deploy**. Vercel will build the frontend and host it live on your Vercel URL (e.g. `https://statusenzin.vercel.app`).

### Step 3: Deploy Backend API (.NET 10 + PostgreSQL)
- **PostgreSQL Database**: Create a free PostgreSQL instance on **[Neon.tech](https://neon.tech)**.
- **Backend API**: Host `backend/StatusEnzin.Api` on **[Render.com](https://render.com)** or **[Railway.app](https://railway.app)** using the provided `Dockerfile`.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
