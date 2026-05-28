const db = require('../database/db');
const { sendLeaveApproved, sendLeaveRejected } = require('../services/mailService');

const getAllLeaves = async (req, res, next) => {
  try {
    const sql = `
      SELECT l.*, u.name as employee_name, u.email as employee_email, e.designation
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY l.id DESC
    `;
    const leavesRes = await db.execute({ sql, args: [] });

    res.json({
      success: true,
      message: 'Leaves fetched successfully',
      data: leavesRes.rows,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const approveLeave = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Fetch leave request
    const leaveRes = await db.execute({
      sql: 'SELECT * FROM leaves WHERE id = ?',
      args: [id]
    });

    if (leaveRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found', data: null, meta: null });
    }

    const leave = leaveRes.rows[0];

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave request is already processed', data: null, meta: null });
    }

    // 2. Fetch employee details
    const empRes = await db.execute({
      sql: `SELECT e.id as emp_id, u.name, u.email FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ?`,
      args: [leave.employee_id]
    });
    const employee = empRes.rows[0];

    // 3. Calculate leave days
    const fromDate = new Date(leave.from_date);
    const toDate = new Date(leave.to_date);
    const timeDiff = toDate.getTime() - fromDate.getTime();
    const leaveDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // 4. Update status of leave to approved
    await db.execute({
      sql: "UPDATE leaves SET status = 'approved', reviewed_by = ?, remarks = ? WHERE id = ?",
      args: [req.user.id, 'Approved by manager', id]
    });

    // 5. Update leave balances
    const leaveYear = fromDate.getFullYear();
    await db.execute({
      sql: 'UPDATE leave_balances SET used = used + ? WHERE employee_id = ? AND leave_type = ? AND year = ?',
      args: [leaveDays, leave.employee_id, leave.type, leaveYear]
    });

    // 6. Send Leave Approved Email
    await sendLeaveApproved(employee.name, employee.email, leave.from_date, leave.to_date).catch(err => {
      console.error('Approved leave email failed:', err.message);
    });

    // 7. Audit log
    await db.execute({
      sql: 'INSERT INTO audit_log (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
      args: [req.user.id, 'approve_leave', 'leaves', id]
    });

    res.json({
      success: true,
      message: 'Leave request approved successfully',
      data: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

const rejectLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required', data: null, meta: null });
    }

    // 1. Fetch leave request
    const leaveRes = await db.execute({
      sql: 'SELECT * FROM leaves WHERE id = ?',
      args: [id]
    });

    if (leaveRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found', data: null, meta: null });
    }

    const leave = leaveRes.rows[0];

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave request is already processed', data: null, meta: null });
    }

    // 2. Fetch employee details
    const empRes = await db.execute({
      sql: `SELECT e.id as emp_id, u.name, u.email FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ?`,
      args: [leave.employee_id]
    });
    const employee = empRes.rows[0];

    // 3. Update status of leave to rejected
    await db.execute({
      sql: "UPDATE leaves SET status = 'rejected', reviewed_by = ?, remarks = ? WHERE id = ?",
      args: [req.user.id, reason, id]
    });

    // 4. Send Leave Rejected Email
    await sendLeaveRejected(employee.name, employee.email, reason).catch(err => {
      console.error('Rejected leave email failed:', err.message);
    });

    // 5. Audit log
    await db.execute({
      sql: 'INSERT INTO audit_log (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
      args: [req.user.id, 'reject_leave', 'leaves', id]
    });

    res.json({
      success: true,
      message: 'Leave request rejected successfully',
      data: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLeaves,
  approveLeave,
  rejectLeave
};
