const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.CLIENT_URL,
    /\.vercel\.app$/,
    /\.railway\.app$/
  ]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Placeholder Routes (To be implemented)
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', data: null, meta: null });
});

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/employees', require('./routes/employees'));
app.use('/api/v1/attendance', require('./routes/attendance'));
app.use('/api/v1/payroll', require('./routes/payroll'));
app.use('/api/v1/interns', require('./routes/interns'));
app.use('/api/v1/leaves', require('./routes/leaves'));
app.use('/api/v1/mails', require('./routes/mails'));
app.use('/api/v1/departments', require('./routes/departments'));
// app.use('/api/v1/employees', require('./routes/employees'));
// ...

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    data: null,
    meta: null
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const db = require('./database/db');
    await db.execute('SELECT 1');
    console.log('Turso DB connected successfully');
  } catch (err) {
    console.error('Turso DB connection failed:', err.message);
  }
});
