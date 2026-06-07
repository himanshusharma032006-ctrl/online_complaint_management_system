# College Complaint Management System

A full-stack production-ready web application for managing college complaints across multiple roles (Student, Staff, HOD, Admin) with real-time notifications, analytics, file uploads, and comprehensive Role-Based Access Control (RBAC).

## Features

- **Multi-Role Authorization**: Custom dashboards and capabilities tailored to Students, Staff members, HODs, and System Administrators.
- **Complaint Submission & Tracking**: Complete workflow from submission (with optional attachments & anonymity), review, allocation, to resolution and closing.
- **Collaborative Discussion Boards**: Interactive message sections for public queries and private staff notes (internal).
- **Executive Analytics**: Aggregated satisfaction ratings, category breakdowns, department workloads, and average resolution speed.
- **Toast Notifications**: Interactive alert feedback for updates, comments, and status assignments.
- **Premium Aesthetics**: Harmonious glassmorphic UI elements, interactive statistics, custom inline graphs, and dark-mode optimization.

## Technology Stack

- **Frontend**: Vite + React, Tailwind CSS, Lucide Icons, React Hook Form, Zod validation, Axios, React Query
- **Backend**: Node.js, Express, SQLite (via `better-sqlite3`), JSON Web Tokens (JWT), Multer file uploads, Express Validator
- **Root Dev Scripts**: Concurrent runner (`concurrently`) to run client & server in a single terminal session.

---

## Getting Started

### Prerequisites

- Node.js (v16.x or higher recommended)
- npm (v8.x or higher)

### Setup & Installation

1. Clone or navigate to the project directory:
   ```bash
   cd complaint_management_system
   ```

2. Run the automated setup script. This script installs root, client, and server dependencies, compiles the database schema, and seeds the DB with mock data:
   ```bash
   npm run setup
   ```

3. Start both the client and server concurrently in development mode:
   ```bash
   npm run dev
   ```
   - Frontend server starts at: `http://localhost:5173`
   - Backend API starts at: `http://localhost:5000`

---

## Demo Credentials

All demo accounts use the password: **`Demo@1234`**

| Email | Role | Department | Description |
| :--- | :--- | :--- | :--- |
| `admin@college.edu` | **Admin** | Admin Office | Full access: CRUD departments, user accounts, global audits, database deletion. |
| `hod.cse@college.edu` | **HOD** | Computer Science | Manage CSE: Allocate staff coordinators, change status, review departmental metrics. |
| `staff.cse@college.edu` | **Staff** | Computer Science | Solve assigned complaints, log action updates, write public replies / internal notes. |
| `student@college.edu` | **Student** | Computer Science | Submit complaints (with attachments), submit satisfaction feedback, write public comments. |

---

## Project Structure

```text
complaint_management_system/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable layout, auth, and UI elements
│   │   ├── contexts/       # React State Contexts (Auth, Theme)
│   │   ├── lib/            # Axios instance, formatting utils
│   │   ├── pages/          # Pages categorized by roles (student, staff, HOD, admin)
│   │   ├── App.jsx         # Lazy loaded routes and permissions
│   │   └── main.jsx        # Providers mountpoint
│   └── vite.config.js      # Proxy setup to port 5000
├── server/                 # Express Backend
│   ├── database/           # SQLite connection and seeding scripts
│   ├── middleware/         # Auth verify, role checking, file uploads
│   ├── routes/             # REST endpoints (auth, complaints, departments, etc.)
│   └── server.js           # Server application bootstrap
└── package.json            # Scripts to run concurrently
```
