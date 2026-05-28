const db = require('../database/db');

const getAttendance = async (req, res, next) => {
  try {
    const { employee_id, month, year, date } = req.query;
    
    // Authorization check
    if (req.user.role === 'Employee' && req.user.employee_id != employee_id && employee_id) {
        return res.status(403).json({ success: false, message: 'Forbidden to view others attendance', data: null, meta: null });
    }

    let sql = `
      SELECT a.*, e.designation, u.name as employee_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const args = [];

    if (employee_id) {
      sql += ' AND a.employee_id = ?';
      args.push(employee_id);
    } else if (req.user.role === 'Employee') {
      sql += ' AND a.employee_id = ?';
      args.push(req.user.employee_id);
    }

    if (date) {
      sql += ' AND a.date = ?';
      args.push(date);
    } else if (month && year) {
      const monthStr = month.padStart(2, '0');
      sql += ' AND a.date LIKE ?';
      args.push(`${year}-${monthStr}-%`);
    }

    sql += ' ORDER BY a.date DESC';

    const attendanceRes = await db.execute({ sql, args });

    res.json({
      success: true,
      message: 'Attendance fetched successfully',
      data: attendanceRes.rows,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const getTodayAttendance = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch all active employees
    const empsRes = await db.execute(`
      SELECT e.id as employee_id, u.name as employee_name, d.name as department_name, e.designation
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.dept_id = d.id
      WHERE e.status = 'active'
      ORDER BY u.name ASC
    `);

    // Fetch today's attendance logs
    const attendanceRes = await db.execute({
      sql: 'SELECT * FROM attendance WHERE date = ?',
      args: [today]
    });

    const attMap = {};
    attendanceRes.rows.forEach(row => {
      attMap[row.employee_id] = row;
    });

    const data = empsRes.rows.map(emp => {
      const att = attMap[emp.employee_id];
      return {
        ...emp,
        tap_in: att ? att.tap_in : null,
        tap_out: att ? att.tap_out : null,
        total_hours: att ? att.total_hours : 0,
        is_overtime: att ? att.is_overtime : 0,
        status: att ? att.status : 'Absent'
      };
    });

    res.json({
      success: true,
      message: "Today's attendance grid fetched successfully",
      data,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const tapInEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    // Check if already tapped in today
    const checkRes = await db.execute({
      sql: 'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
      args: [employeeId, today]
    });

    if (checkRes.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Already tapped in today', data: null, meta: null });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.execute({
      sql: "INSERT INTO attendance (employee_id, date, tap_in, total_hours, status) VALUES (?, ?, ?, 0, 'Present')",
      args: [employeeId, today, now]
    });

    res.json({
      success: true,
      message: 'Tapped in successfully',
      data: { tap_in: now },
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const tapOutEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    // Get tap in record
    const recordRes = await db.execute({
      sql: 'SELECT id, tap_in, tap_out FROM attendance WHERE employee_id = ? AND date = ?',
      args: [employeeId, today]
    });

    if (recordRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No tap in record found for today', data: null, meta: null });
    }

    const record = recordRes.rows[0];

    if (record.tap_out) {
      return res.status(400).json({ success: false, message: 'Already tapped out today', data: null, meta: null });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Calculate total hours
    const tapInTime = new Date(record.tap_in.replace(' ', 'T') + 'Z');
    const tapOutTime = new Date(now.replace(' ', 'T') + 'Z');
    const diffMs = tapOutTime - tapInTime;
    const total_hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    const is_overtime = total_hours > 9 ? 1 : 0;

    await db.execute({
      sql: 'UPDATE attendance SET tap_out = ?, total_hours = ?, is_overtime = ? WHERE id = ?',
      args: [now, total_hours, is_overtime, record.id]
    });

    res.json({
      success: true,
      message: 'Tapped out successfully',
      data: { tap_out: now, total_hours, is_overtime },
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendance,
  getTodayAttendance,
  tapInEmployee,
  tapOutEmployee
};
