const db = require('../database/db');

const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total Employees
    const totalEmployeesRes = await db.execute({
      sql: "SELECT COUNT(*) FROM employees WHERE status='active'",
      args: []
    });
    const totalEmployees = totalEmployeesRes.rows[0]['COUNT(*)'];

    // 2. Active Interns
    const activeInternsRes = await db.execute({
      sql: "SELECT COUNT(*) FROM interns WHERE status='active'",
      args: []
    });
    const activeInterns = activeInternsRes.rows[0]['COUNT(*)'];

    // 3. Open Leaves
    const openLeavesRes = await db.execute({
      sql: "SELECT COUNT(*) FROM leaves WHERE status='pending'",
      args: []
    });
    const openLeaves = openLeavesRes.rows[0]['COUNT(*)'];

    // 4. Pending Mails
    const pendingMailsRes = await db.execute({
      sql: "SELECT COUNT(*) FROM mails WHERE status='unread'",
      args: []
    });
    const pendingMails = pendingMailsRes.rows[0]['COUNT(*)'];

    // 5. Today's Attendance Ring Chart (Present vs Absent/On-leave)
    const today = new Date().toISOString().split('T')[0];
    const presentRes = await db.execute({
      sql: "SELECT COUNT(*) FROM attendance WHERE date = ? AND status = 'Present'",
      args: [today]
    });
    const presentCount = presentRes.rows[0]['COUNT(*)'];
    const absentCount = totalEmployees - presentCount;

    // 6. Department Headcount Bar Chart
    const deptHeadcountRes = await db.execute({
      sql: `
        SELECT d.name, COUNT(e.id) as headcount 
        FROM departments d 
        LEFT JOIN employees e ON d.id = e.dept_id AND e.status = 'active'
        GROUP BY d.id
      `,
      args: []
    });
    const departmentHeadcount = deptHeadcountRes.rows;

    // 7. Recent Activity Feed (Hires, Exits, Approvals) - from Audit Log
    const recentActivityRes = await db.execute({
      sql: 'SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 5',
      args: []
    });
    const recentActivity = recentActivityRes.rows;

    // 8. Announcements
    const announcementsRes = await db.execute({
      sql: 'SELECT * FROM announcements ORDER BY created_at DESC LIMIT 5',
      args: []
    });
    const announcements = announcementsRes.rows;

    res.json({
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: {
        kpis: {
          totalEmployees,
          activeInterns,
          openLeaves,
          pendingMails
        },
        attendanceToday: {
          present: presentCount,
          absentOrLeave: absentCount
        },
        departmentHeadcount,
        recentActivity,
        announcements
      },
      meta: null
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
