const db = require('../database/db');
const bcrypt = require('bcrypt');
const { sendWelcomeEmail } = require('../services/mailService');

const getAllEmployees = async (req, res, next) => {
  try {
    const { status, dept_id, search } = req.query;
    let sql = `
      SELECT e.*, u.name, u.email, d.name as department_name 
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.dept_id = d.id
      WHERE 1=1
    `;
    const args = [];

    if (status) {
      sql += ' AND e.status = ?';
      args.push(status);
    }
    if (dept_id) {
      sql += ' AND e.dept_id = ?';
      args.push(dept_id);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR e.designation LIKE ?)';
      const searchParam = `%${search}%`;
      args.push(searchParam, searchParam, searchParam);
    }

    const employeesRes = await db.execute({ sql, args });
    
    res.json({
      success: true,
      message: 'Employees fetched successfully',
      data: employeesRes.rows,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Employees can only see themselves unless they are HR/Admin/Head
    if (req.user.role === 'Employee' && req.user.employee_id != id) {
      return res.status(403).json({ success: false, message: 'Forbidden', data: null, meta: null });
    }

    const sql = `
      SELECT e.*, u.name, u.email, d.name as department_name 
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.dept_id = d.id
      WHERE e.id = ?
    `;
    const employeeRes = await db.execute({ sql, args: [id] });
    
    if (employeeRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found', data: null, meta: null });
    }

    res.json({
      success: true,
      message: 'Employee fetched successfully',
      data: employeeRes.rows[0],
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const { 
      name, email, password, role = 'Employee',
      dept_id, designation, phone, address, dob, gender,
      joining_date, employment_type, contract_type, salary, bank_account, ifsc
    } = req.body;

    const photo_path = req.file ? req.file.path : null; // Uploaded via Cloudinary multer

    // Basic validation
    if (!name || !email || !password || !dept_id || !designation) {
      return res.status(400).json({ success: false, message: 'Missing required fields', data: null, meta: null });
    }

    const password_hash = bcrypt.hashSync(password, 12);

    // Make sure dept_id matches an existing department in departments table
    const deptCheck = await db.execute({
      sql: 'SELECT id FROM departments WHERE id = ?',
      args: [parseInt(dept_id)]
    });
    if (deptCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid Department Selected. Foreign key constraint failed.', data: null, meta: null });
    }

    // Step 1: INSERT INTO users
    const insertUserSql = `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`;
    const userRes = await db.execute({ sql: insertUserSql, args: [name, email, password_hash, role] });
    
    // Step 2: Get user_id (supporting lastInsertRowid, RETURNING, and select fallback)
    let userId = userRes.lastInsertRowid;
    if (userId !== undefined && userId !== null) {
      userId = Number(userId);
    }
    if (!userId && userRes.rows && userRes.rows[0]) {
      userId = Number(userRes.rows[0].id);
    }
    if (!userId) {
      const findUser = await db.execute({
        sql: 'SELECT id FROM users WHERE email = ?',
        args: [email]
      });
      if (findUser.rows && findUser.rows[0]) {
        userId = findUser.rows[0].id;
      }
    }
    
    if (!userId) {
      return res.status(500).json({ success: false, message: 'Failed to create user record', data: null, meta: null });
    }

    // Step 3: INSERT INTO employees using the user_id
    const insertEmpSql = `
      INSERT INTO employees (
        user_id, dept_id, designation, phone, address, dob, gender,
        joining_date, employment_type, contract_type, salary, bank_account, ifsc, photo_path, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;
    const empArgs = [
      userId, parseInt(dept_id), designation, phone, address, dob, gender,
      joining_date, employment_type, contract_type, salary, bank_account, ifsc, photo_path
    ];

    const empRes = await db.execute({ sql: insertEmpSql, args: empArgs });
    
    // Get new employee id
    let employeeId = empRes.lastInsertRowid;
    if (employeeId !== undefined && employeeId !== null) {
      employeeId = Number(employeeId);
    }
    if (!employeeId && empRes.rows && empRes.rows[0]) {
      employeeId = Number(empRes.rows[0].id);
    }
    if (!employeeId) {
      const findEmp = await db.execute({
        sql: 'SELECT id FROM employees WHERE user_id = ?',
        args: [userId]
      });
      if (findEmp.rows && findEmp.rows[0]) {
        employeeId = findEmp.rows[0].id;
      }
    }
    
    // Audit log
    await db.execute({
      sql: 'INSERT INTO audit_log (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
      args: [req.user.id, 'create', 'employees', employeeId]
    });

    // Send Welcoming Onboarding Email
    await sendWelcomeEmail(name, email, password).catch(err => {
      console.error('Welcome email dispatch failed:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { employee_id: employeeId },
      meta: null
    });
  } catch (error) {
    // Handle unique constraint on email
    if (error.message && error.message.includes('UNIQUE constraint failed: users.email')) {
      return res.status(400).json({ success: false, message: 'Email already exists', data: null, meta: null });
    }
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      designation, phone, address, dept_id, salary, status, exit_date, exit_reason
    } = req.body;

    const sql = `
      UPDATE employees SET 
        designation = COALESCE(?, designation),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        dept_id = COALESCE(?, dept_id),
        salary = COALESCE(?, salary),
        status = COALESCE(?, status),
        exit_date = COALESCE(?, exit_date),
        exit_reason = COALESCE(?, exit_reason)
      WHERE id = ?
    `;

    await db.execute({ 
      sql, 
      args: [designation, phone, address, dept_id, salary, status, exit_date, exit_reason, id] 
    });

    // If status is terminated/inactive, we should also update user.is_active
    if (status === 'terminated' || status === 'inactive') {
      await db.execute({
        sql: 'UPDATE users SET is_active = 0 WHERE id = (SELECT user_id FROM employees WHERE id = ?)',
        args: [id]
      });
    }

    await db.execute({
      sql: 'INSERT INTO audit_log (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
      args: [req.user.id, 'update', 'employees', id]
    });

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { exit_reason } = req.body;

    await db.execute({
      sql: "UPDATE employees SET status = 'terminated', exit_date = date('now'), exit_reason = ? WHERE id = ?",
      args: [exit_reason || 'Terminated by HR', id]
    });

    // Disable the user login as well
    await db.execute({
      sql: 'UPDATE users SET is_active = 0 WHERE id = (SELECT user_id FROM employees WHERE id = ?)',
      args: [id]
    });

    // Audit log
    await db.execute({
      sql: 'INSERT INTO audit_log (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
      args: [req.user.id, 'terminate', 'employees', id]
    });

    res.json({
      success: true,
      message: 'Employee terminated and soft deleted successfully',
      data: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
