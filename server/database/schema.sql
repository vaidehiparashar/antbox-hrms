-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  head_id INTEGER
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  dept_id INTEGER,
  designation TEXT,
  phone TEXT,
  address TEXT,
  dob DATE,
  gender TEXT,
  joining_date DATE,
  employment_type TEXT,
  contract_type TEXT,
  salary REAL,
  bank_account TEXT,
  ifsc TEXT,
  photo_path TEXT,
  status TEXT DEFAULT 'active',
  exit_date DATE,
  exit_reason TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(dept_id) REFERENCES departments(id)
);

-- Interns
CREATE TABLE IF NOT EXISTS interns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  college TEXT,
  dept_id INTEGER,
  mentor_id INTEGER,
  project TEXT,
  stipend REAL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  FOREIGN KEY(dept_id) REFERENCES departments(id),
  FOREIGN KEY(mentor_id) REFERENCES employees(id)
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  date DATE NOT NULL,
  tap_in DATETIME,
  tap_out DATETIME,
  total_hours REAL,
  status TEXT,
  is_overtime INTEGER DEFAULT 0,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

-- Leaves
CREATE TABLE IF NOT EXISTS leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  type TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  doc_path TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by INTEGER,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id),
  FOREIGN KEY(reviewed_by) REFERENCES users(id)
);

-- Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  leave_type TEXT NOT NULL,
  total INTEGER DEFAULT 0,
  used INTEGER DEFAULT 0,
  year INTEGER NOT NULL,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  month INTEGER,
  year INTEGER,
  basic REAL,
  hra REAL,
  ta REAL,
  medical REAL,
  special_allowance REAL,
  pf_employee REAL,
  pf_employer REAL,
  esi REAL,
  professional_tax REAL,
  tds REAL,
  loans_deducted REAL,
  net_pay REAL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  payslip_path TEXT,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

-- Loans
CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  amount REAL NOT NULL,
  reason TEXT,
  monthly_deduction REAL NOT NULL,
  balance_remaining REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

-- Mails
CREATE TABLE IF NOT EXISTS mails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_name TEXT,
  sender_email TEXT,
  subject TEXT,
  body TEXT,
  category TEXT,
  status TEXT DEFAULT 'unread',
  assigned_to INTEGER,
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(assigned_to) REFERENCES users(id)
);

-- Deals
CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  dept_id INTEGER,
  client_name TEXT NOT NULL,
  value REAL,
  stage TEXT,
  result TEXT,
  closed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id),
  FOREIGN KEY(dept_id) REFERENCES departments(id)
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  author_id INTEGER,
  publish_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(author_id) REFERENCES users(id)
);

-- Announcement Seen
CREATE TABLE IF NOT EXISTS announcement_seen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement_id INTEGER,
  employee_id INTEGER,
  seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(announcement_id) REFERENCES announcements(id),
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  doc_type TEXT,
  file_path TEXT,
  expiry_date DATE,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

-- Performance
CREATE TABLE IF NOT EXISTS performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  reviewer_id INTEGER,
  period TEXT,
  self_rating INTEGER,
  manager_rating INTEGER,
  goals TEXT,
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employee_id) REFERENCES employees(id),
  FOREIGN KEY(reviewer_id) REFERENCES users(id)
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT,
  target_table TEXT,
  target_id INTEGER,
  old_value TEXT,
  new_value TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT NOT NULL,
  type TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
