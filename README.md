# Job Portal API (NestJS Backend)

A powerful, production-ready REST API built using **NestJS**, **TypeScript**, **TypeORM**, and **PostgreSQL**. This backend powers the Job Portal ecosystem, providing secure user authentication, role-based access control, job posting & application management, files storage, automated notifications, direct messaging/chat, and premium subscription payment flows integrated with Chapa.

---

## 🚀 Features & Modules

*   **Authentication & Auth Guards**: Secured using JWT tokens with Passport.js.
*   **Role-Based Access Control (RBAC)**: Custom authorization guards for different user types:
    *   `superadmin` — Overall platform controller.
    *   `company_admin` — Can post jobs, view applicants, manage subscription plans.
    *   `user` — Job seeker who can upload resumes, browse jobs, and apply.
*   **Job Management**: Creating, editing, publishing, and filtering job listings.
*   **Job Applications**: Track statuses (`Pending`, `Under Consideration`, `Accepted`, `Rejected`).
*   **Chapa Payment Integration**: Support for payment verification and webhooks for job-posting subscriptions.
*   **File Uploads**: Handles resumes, profile photos, and company logos using NestJS platform-express `multer` storage.
*   **Direct Chat**: In-app communication between company admins and job applicants.
*   **Database Seeding**: Easily generate sample users, companies, jobs, and applications.

---

## 🛠️ Tech Stack

*   **Framework**: NestJS (Node.js)
*   **Database**: PostgreSQL
*   **ORM**: TypeORM
*   **Auth**: JWT (JSON Web Tokens)
*   **File Handling**: Multer (Local Disk Storage)
*   **Payment**: Chapa API Integration
*   **Development Tools**: Prettier, ESLint, TypeScript, Jest

---

## 📋 Prerequisites

Before running the application, make sure you have:
*   [Node.js](https://nodejs.org/en) (v18 or higher recommended)
*   [PostgreSQL](https://www.postgresql.org/) database running locally or in the cloud.

---

## ⚙️ Setup & Configuration

1.  **Clone the Repository** and navigate to the backend directory:
    ```bash
    cd "Job Backend"
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Copy `.env.example` to `.env` and fill in your details:
    ```bash
    cp .env.example .env
    ```
    Update the values in `.env` to connect to your PostgreSQL database and set up your keys.

4.  **Seed the Database** (Optional, but recommended for development):
    This inserts testing accounts and dummy data into your database.
    ```bash
    npm run seed
    ```
    
    ### 🔑 Seeded Test Accounts
    | Role | Email | Password |
    | :--- | :--- | :--- |
    | **Superadmin** | `superadmin@jobportal.com` | `Password123!` |
    | **Company Admin** | `admin@techcorp.com` | `Password123!` |
    | **Job Seeker** | `selam@example.com` | `Password123!` |

---

## 🏃 Running the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production build
npm run build

# Start production server
npm run start:prod
```

The application will start on the port configured in `.env` (default is `5000`), with CORS open to the front-end origin (default is `http://localhost:5173`).

---

## 📂 Project Structure

```bash
src/
├── applicant/        # Job seeker profile, education & work experience modules
├── application/      # Job application workflow, status updates
├── auth/             # JWT passport strategy, role guards, register/login logic
├── chapa/            # Chapa payment gateway client and webhook setup
├── chat/             # Messaging and communication module
├── company/          # Company profile setup and details
├── config/           # App configuration loading and validation using AppConfigService
├── guards/           # Security and role authorization guards
├── jobs/             # Job creation, listing, searching & publishing logic
├── notifications/    # Application and message notifications
├── payments/         # Premium features checkout
├── pricing/          # Subscription pricing tiers configuration
├── users/            # Core user account management and profiles
├── app.module.ts     # Root module configuring DB, routing, and guards
├── main.ts           # App bootstrap endpoint
├── orm.config.ts     # TypeORM database configuration
└── seed.ts           # Seed script populated with mock data
```

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run end-to-end (e2e) tests
npm run test:e2e

# Run test coverage analysis
npm run test:cov
```

---

## 📝 License

This project is [UNLICENSED](LICENSE) (private repository).
