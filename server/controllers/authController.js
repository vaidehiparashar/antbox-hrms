const db = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', data: null, meta: null });
    }

    const userRes = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    
    const user = userRes.rows[0];
    
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or account disabled', data: null, meta: null });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', data: null, meta: null });
    }

    // Get employee details if they are an employee
    const empRes = await db.execute({
      sql: 'SELECT id, dept_id FROM employees WHERE user_id = ?',
      args: [user.id]
    });
    
    const employee = empRes.rows[0];

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      employee_id: employee ? employee.id : null,
      dept_id: employee ? employee.dept_id : null
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: payload
      },
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userRes = await db.execute({
      sql: 'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      args: [req.user.id]
    });
    
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', data: null, meta: null });
    }
    
    res.json({
      success: true,
      message: 'User details fetched',
      data: user,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe };
