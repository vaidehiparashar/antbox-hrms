# ANT BOX - HR Management System (HRMS) ERP

ANT BOX is a state-of-the-art, premium Human Resource Management System (HRMS) ERP application designed to manage organizational workflows, attendance systems, dynamic compensation slabs, leave dispatch schedules, and administrative support channels.

## 🚀 Key Modules & Capabilities

* **Modern Dashboard**: High-fidelity operational center showing real-time organizational KPIs (Total Employees, Active Interns, Open Leaves, Pending Support Mails) with harmonic graphs.
* **Employee Directory**: Complete directory management supporting search, comprehensive profile views, and an E2E 4-step wizard to dynamically onboard staff.
* **Attendance Ledger**: Real-time checking grid with automatic late flags, overtime monitoring, and dynamic Tap In/Out controllers.
* **Payroll Engine**: Branded PDF payslip streaming generator (using PDFKit) featuring direct browser download, bulk ZIP packaging on the fly, dynamic compensation calculations, and email synchronization.
* **Leave Flow Manager**: Streamlined schedule tracker to request, review, approve, and reject leaves with automated SMTP status dispatches.
* **Support Inbox**: Dynamic administrative support center featuring mail categories, email previewing, and automated response actions.
* **Announcements Board**: High-priority global notice center for organizational dispatches.
* **CRM Deals Panel**: Corporate deals ledger tracking performance, sales progress, and conversions.

## 🛠️ Technology Stack

* **Frontend**: React (TypeScript), Vite, TailwindCSS (v4), Lucide Icons, Axios.
* **Backend**: Node.js (Express), PDFKit (Binary Streaming), Archiver (ZIP Bulk Compression).
* **Database**: Turso Cloud SQLite (using the `@libsql/client` SDK).
* **Cloud Storage**: Cloudinary (for raw PDF files and documents).
* **Notifications**: Brevo SMTP (for transactional email dispatches).

---

## 💻 Local Quickstart

### Prerequisites
* Node.js v18+
* A Turso SQLite Database URL & Auth Token
* Cloudinary API Credentials

### Backend Setup
1. Open the `/server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database seed data (optional):
   ```bash
   npm run seed
   ```
4. Start the local server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:5000`*

### Frontend Setup
1. Open the `/client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *The client will run on `http://localhost:5173`*

---

## 🌐 Production Deployment

This project is prepared for standard production deployments:
* **Backend**: Configured for instant deployment on [Railway.app](https://railway.app) via `railway.json` and Node v18 engine scripts.
* **Frontend**: Configured for single-page routing and static deployment on [Vercel](https://vercel.com) via `vercel.json` rewrites and dynamic environment variable hosts.
