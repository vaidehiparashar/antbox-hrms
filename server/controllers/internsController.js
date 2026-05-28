const db = require('../database/db');
const bcrypt = require('bcrypt');
const { sendWelcomeEmail } = require('../services/mailService');

const getAllInterns = async (req, res, next) => {
  try {
    const sql = `
      SELECT i.*, d.name as department_name, u.name as mentor_name 
      FROM interns i
      LEFT JOIN departments d ON i.dept_id = d.id
      LEFT JOIN employees e ON i.mentor_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY i.id DESC
    `;
    const internsRes = await db.execute({ sql, args: [] });
    
    res.json({
      success: true,
      message: 'Interns fetched successfully',
      data: internsRes.rows,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const createIntern = async (req, res, next) => {
  try {
    const { name, email, college, dept_id, mentor_id, project, stipend, start_date, end_date, notes } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and Email are required', data: null, meta: null });
    }

    // Validate dept_id exists in departments table
    if (dept_id) {
      const deptCheck = await db.execute({
        sql: 'SELECT id FROM departments WHERE id = ?',
        args: [parseInt(dept_id)]
      });
      if (deptCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid Department Selected. Foreign key constraint failed.', data: null, meta: null });
      }
    }

    // Validate mentor_id exists in employees table
    if (mentor_id) {
      const mentorCheck = await db.execute({
        sql: 'SELECT id FROM employees WHERE id = ?',
        args: [parseInt(mentor_id)]
      });
      if (mentorCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid Mentor Selected. Foreign key constraint failed.', data: null, meta: null });
      }
    }

    const sql = `
      INSERT INTO interns (name, email, college, dept_id, mentor_id, project, stipend, start_date, end_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `;
    const args = [
      name, 
      email, 
      college || null, 
      dept_id ? parseInt(dept_id) : null, 
      mentor_id ? parseInt(mentor_id) : null, 
      project || null, 
      stipend ? parseFloat(stipend) : 0, 
      start_date || null, 
      end_date || null, 
      notes || null
    ];

    const result = await db.execute({ sql, args });

    let internId = result.lastInsertRowid;
    if (internId !== undefined && internId !== null) {
      internId = Number(internId);
    } else if (result.rows && result.rows[0]) {
      internId = Number(result.rows[0].id);
    }

    res.status(201).json({
      success: true,
      message: 'Intern added successfully',
      data: { intern_id: internId },
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const deleteIntern = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await db.execute({
      sql: 'DELETE FROM interns WHERE id = ?',
      args: [id]
    });

    res.json({
      success: true,
      message: 'Intern deleted successfully',
      data: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const convertInternToEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { designation, salary, employment_type = 'Full-time', contract_type = 'Permanent' } = req.body;

    // 1. Fetch Intern details
    const internRes = await db.execute({
      sql: 'SELECT * FROM interns WHERE id = ?',
      args: [id]
    });

    if (internRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Intern not found', data: null, meta: null });
    }

    const intern = internRes.rows[0];

    // 2. Generate a default password and hash
    const defaultPassword = 'password123';
    const passwordHash = bcrypt.hashSync(defaultPassword, 12);

    // 3. Insert into users
    const insertUserRes = await db.execute({
      sql: 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id',
      args: [intern.name, intern.email, passwordHash, 'Employee']
    });
    const userId = insertUserRes.rows[0].id;

    // 4. Insert into employees
    const today = new Date().toISOString().split('T')[0];
    const insertEmpRes = await db.execute({
      sql: `
        INSERT INTO employees (user_id, dept_id, designation, salary, joining_date, employment_type, contract_type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active') RETURNING id
      `,
      args: [userId, intern.dept_id, designation || 'Software Engineer', salary || 30000, today, employment_type, contract_type]
    });

    // 5. Update intern status to completed/converted
    await db.execute({
      sql: "UPDATE interns SET status = 'completed' WHERE id = ?",
      args: [id]
    });

    // 6. Audit log
    await db.execute({
      sql: 'INSERT INTO audit_log (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
      args: [req.user.id, 'convert_intern', 'employees', insertEmpRes.rows[0].id]
    });

    // Send Welcome Email
    await sendWelcomeEmail(intern.name, intern.email, defaultPassword).catch(err => {
      console.error('Conversion email failed:', err.message);
    });

    res.json({
      success: true,
      message: 'Intern converted to full-time employee successfully',
      data: { employee_id: insertEmpRes.rows[0].id },
      meta: null
    });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed: users.email')) {
      return res.status(400).json({ success: false, message: 'An employee with this email already exists', data: null, meta: null });
    }
    next(error);
  }
};

module.exports = {
  getAllInterns,
  createIntern,
  deleteIntern,
  convertInternToEmployee
};
