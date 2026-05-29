# Ant Box — Enterprise HRMS ERP Platform

A production-grade, cloud-native Human Resource Management System built for internal enterprise use. The platform manages the complete employee lifecycle including onboarding, attendance, payroll, leave management, and inter-departmental analytics through a unified, role-based dashboard.

---

## Live Deployment

| Service | URL |
|---|---|
| Frontend Application | https://antbox-hrms.vercel.app |
| Backend API | https://antbox-hrms-production.up.railway.app |
| API Health Check | https://antbox-hrms-production.up.railway.app/api/v1/health |
| Database | Turso Cloud SQLite — ap-south-1 (Mumbai) |

---

## Access Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin / HR Manager | admin@hrms.com | password123 |
| Employee (Demo) | john.doe@hrms.com | password123 |

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| Framer Motion | 11.x | Animations and transitions |
| Recharts | 2.x | Data visualization and charts |
| Axios | 1.x | HTTP client |
| React Router | 6.x | Client-side routing |
| Vite | 5.x | Build tool and dev server |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18.x | Runtime environment |
| Express.js | 4.x | REST API framework |
| @libsql/client | Latest | Turso cloud SQLite driver |
| JSON Web Token | 9.x | Authentication tokens |
| bcrypt | 5.x | Password hashing |
| PDFKit | 0.x | Payslip PDF generation |
| Nodemailer | 6.x | Transactional email dispatch |
| Cloudinary | 2.x | Cloud file and PDF storage |
| Multer | 1.x | File upload middleware |
| Joi | 17.x | Input validation |
| Helmet | 7.x | HTTP security headers |
| CORS | 2.x | Cross-origin resource sharing |

### Infrastructure
| Service | Provider | Purpose |
|---|---|---|
| Frontend Hosting | Vercel | CDN-delivered React SPA |
| Backend Hosting | Railway | Node.js server (always-on) |
| Database | Turso | Serverless cloud SQLite |
| File Storage | Cloudinary | Documents, photos, payslips |
| Email Delivery | Brevo (Sendinblue) | SMTP transactional mail |
| Version Control | GitHub | Source code repository |

---

## System Architecture

```
CLIENT LAYER
─────────────────────────────────────────────────────────────
Browser / Mobile Browser
    │
    │  HTTPS
    ▼
FRONTEND — Vercel CDN
─────────────────────────────────────────────────────────────
React 18 + TypeScript + Tailwind CSS
    │
    │  Reads VITE_API_URL environment variable
    │  All API calls prefixed with /api/v1
    │  JWT token stored in localStorage
    │
    │  REST API calls over HTTPS
    ▼
BACKEND — Railway (Node.js 18)
─────────────────────────────────────────────────────────────
Express.js Server (port 5000)
    │
    ├── /api/v1/auth          JWT login, logout, password reset
    ├── /api/v1/employees     CRUD, search, export, soft-delete
    ├── /api/v1/interns       CRUD, convert to employee
    ├── /api/v1/attendance    Tap-in, tap-out, daily logs
    ├── /api/v1/leaves        Apply, approve, reject
    ├── /api/v1/payroll       Generate, bulk run, PDF stream
    ├── /api/v1/mails         Inbox, accept, reject, archive
    ├── /api/v1/departments   Headcount, hours, deals
    ├── /api/v1/performance   Reviews, ratings, goals
    ├── /api/v1/announcements Post, seen tracking
    ├── /api/v1/documents     Upload, expiry tracking
    ├── /api/v1/dashboard     KPI aggregation
    └── /api/v1/notifications In-app notification feed
    │
    ├── Middleware Stack
    │   ├── auth.js           JWT verification on every route
    │   ├── rbac.js           Role-based access control
    │   ├── errorHandler.js   Centralized error responses
    │   └── Helmet + CORS     Security headers
    │
    ├── Services
    │   ├── payrollService.js Salary calculation engine
    │   ├── pdfService.js     PDFKit payslip generator
    │   └── mailService.js    Nodemailer + Brevo SMTP
    │
    │  Async SQL via @libsql/client
    ▼
DATABASE — Turso Cloud SQLite (Mumbai Region)
─────────────────────────────────────────────────────────────
16 Tables:
    users, employees, departments, interns,
    attendance, leaves, leave_balances,
    payroll, loans, mails, deals,
    announcements, announcement_seen,
    documents, performance,
    audit_log, notifications
    │
    ▼
EXTERNAL SERVICES
─────────────────────────────────────────────────────────────
    ├── Cloudinary       PDF payslips, employee photos, documents
    └── Brevo SMTP       Leave emails, payslip emails, welcome emails
```

---

## Request Flow — Example: HR Approves a Leave

```
1. HR clicks "Approve" on Leaves page
        │
        ▼
2. React sends PUT /api/v1/leaves/:id/approve
   with Authorization: Bearer <jwt_token>
        │
        ▼
3. auth.js middleware verifies JWT
   rbac.js middleware checks role = hr_manager or admin
        │
        ▼
4. leavesController.js runs:
   UPDATE leaves SET status = 'approved' WHERE id = ?
        │
        ▼
5. mailService.js sends email via Brevo SMTP:
   "Your leave from [date] to [date] has been approved."
        │
        ▼
6. notifications table gets a new row for the employee
        │
        ▼
7. audit_log records: who approved, when, which leave
        │
        ▼
8. JSON response returned to frontend
   Leave status updates in real time on screen
```

---

## Modules

| Module | Features |
|---|---|
| Dashboard | KPI cards, attendance ring chart, department headcount, recent activity, announcements |
| Employee Management | 100-employee directory, 4-step onboarding wizard, soft delete with exit logging, CSV export |
| Intern Management | Intern roster, mentor assignment, Convert to Employee flow, internship certificate PDF |
| Leave Management | Apply, approve, reject with auto-email, leave balance tracker, leave calendar |
| Attendance | Tap-in and tap-out per employee, daily log, overtime detection, late arrival flagging |
| Payroll Engine | Salary structure calculation, individual PDF payslip download, bulk payroll run, auto email |
| Mail Inbox | Unified HR inbox, accept and reject with auto-reply, categorization, archive |
| Department Dashboard | Per-department working hours, client deals pipeline, leave utilization, headcount |
| Performance | Quarterly review cycles, self and manager ratings, KPI tracking |
| Announcements | Priority levels, seen tracking, scheduled publish |
| Document Vault | Per-employee document storage, expiry alerts |
| Settings | Company profile, role management, audit log |

---

## Role-Based Access Control

| Role | Access Scope |
|---|---|
| Super Admin | Full access to all modules and settings |
| HR Manager | All employee, leave, payroll, and mail modules |
| Department Head | Own department data only |
| Employee | Own profile, attendance, leave application, payslips |
| Intern | Own profile and attendance only |

---

## Security Implementation

- All passwords hashed with bcrypt at 12 rounds
- JWT tokens signed with a secret key, verified on every API route
- RBAC middleware enforces role checks before every controller
- Input validated with Joi on all POST and PUT endpoints
- HTTP security headers applied via Helmet
- Rate limiting applied via express-rate-limit
- Soft deletes only — no employee data is permanently destroyed
- Every destructive action recorded in the audit_log table
- Environment variables never committed to version control

---

## Database Schema Summary

16 tables managing the full HR data model:

```
users              Core authentication and role storage
employees          Employment details, salary, bank info
departments        Department registry with head assignment
interns            Internship roster linked to departments
attendance         Daily tap-in and tap-out records
leaves             Leave applications and approval status
leave_balances     Annual leave quota per employee per type
payroll            Monthly payroll records per employee
loans              Salary advance tracking and deductions
mails              HR inbox for external and internal mail
deals              Client deal pipeline per department
announcements      Company-wide notice board
announcement_seen  Acknowledgement tracking per employee
documents          File metadata and expiry tracking
performance        Quarterly review records
audit_log          Immutable record of all system actions
notifications      In-app notification queue per user
```

---

## Local Development Setup

```bash
# Clone the repository
git clone https://github.com/parasharvaidehi2/antbox-hrms.git
cd antbox-hrms

# Backend setup
cd server
npm install
cp .env.example .env
# Fill in .env with your Turso, Cloudinary, and Brevo credentials
node database/seed.js
npm run dev

# Frontend setup (new terminal)
cd client
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
npm run dev

# Access at http://localhost:5173
```

---

## Environment Variables

### Backend (/server/.env)

```
PORT=5000
JWT_SECRET=
TURSO_URL=
TURSO_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
CLIENT_URL=
```

### Frontend (/client/.env)

```
VITE_API_URL=
```

---

## Planned Future Enhancements

### Phase 2 — Q3 2026
- Biometric device integration via REST webhook for automated tap-in and tap-out
- Mobile application (React Native) for employee self-service portal
- WhatsApp Business API integration for leave approval notifications
- Advanced payroll: TDS Form 16 auto-generation for annual tax filing

### Phase 3 — Q4 2026
- Multi-company support with tenant isolation at the database level
- AI-powered attendance anomaly detection flagging unusual patterns
- Recruitment module: job postings, application tracking, interview scheduling
- Integration with accounting software (Tally, Zoho Books) for payroll sync
- Custom report builder with drag-and-drop field selection

### Phase 4 — 2027
- HRMS mobile app published to Play Store and App Store
- SSO integration with Google Workspace and Microsoft Azure AD
- Automated compliance reporting for PF, ESI, and professional tax authorities
- Employee engagement surveys with sentiment analysis
- Learning Management System (LMS) module for internal training

---

## Project Structure

```
antbox-hrms/
├── client/                          React frontend
│   ├── src/
│   │   ├── components/              Shared UI components
│   │   ├── pages/                   One file per module
│   │   ├── context/                 AuthContext, ThemeContext
│   │   ├── api/                     Axios instance and API functions
│   │   └── utils/                   Helpers and formatters
│   ├── vercel.json                  SPA routing configuration
│   └── .env.example
├── server/                          Express backend
│   ├── controllers/                 Business logic per module
│   ├── routes/                      API route definitions
│   ├── middleware/                  Auth, RBAC, error handler
│   ├── services/                    PDF, mail, payroll engine
│   ├── database/
│   │   ├── db.js                    Turso connection
│   │   ├── schema.sql               Table definitions
│   │   └── seed.js                  Demo data seeder
│   ├── railway.json                 Railway deployment config
│   └── .env.example
└── README.md
```

---

## Built By

Ant Box Internal Engineering
Platform Version: 1.0.0
Last Updated: May 2026
