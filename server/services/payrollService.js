const db = require('../database/db');

// In a real application, tax slabs and component % would be configurable.
// For this ERP, we'll use standard approximate Indian payroll rules.
const calculatePayroll = async (employeeId, month, year) => {
  // 1. Fetch employee details
  const empRes = await db.execute({
    sql: 'SELECT * FROM employees WHERE id = ?',
    args: [employeeId]
  });
  
  const employee = empRes.rows[0];
  if (!employee) throw new Error('Employee not found');

  const ctc = employee.salary;
  
  // 2. Attendance & Leave Calculation
  // Determine working days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const monthStr = month.toString().padStart(2, '0');
  const attRes = await db.execute({
    sql: `SELECT COUNT(*) as present_days FROM attendance WHERE employee_id = ? AND date LIKE ? AND status = 'Present'`,
    args: [employeeId, `${year}-${monthStr}-%`]
  });
  const presentDays = Number(attRes.rows[0].present_days || 0);

  const leaveRes = await db.execute({
    sql: `SELECT * FROM leaves WHERE employee_id = ? AND status = 'approved' AND from_date LIKE ?`,
    args: [employeeId, `${year}-${monthStr}-%`]
  });
  
  // Very simplistic LWP calculation (Loss of Pay)
  // If presentDays + paid leaves < daysInMonth, we deduct
  // For simplicity here, assuming full payout if active, else pro-rated.
  const payableDays = presentDays; // this would normally be present + weekends + holidays + paid leaves
  const lwpDays = Math.max(0, daysInMonth - presentDays - 8); // Assuming 8 weekend days
  const prorationFactor = (daysInMonth - lwpDays) / daysInMonth;

  // 3. Components Breakdown (Monthly)
  const monthlyGross = (ctc / 12) * prorationFactor;
  
  const basic = monthlyGross * 0.40; // 40% of Gross
  const hra = basic * 0.50; // 50% of Basic
  const ta = 1600 * prorationFactor; 
  const medical = 1250 * prorationFactor;
  const special_allowance = monthlyGross - (basic + hra + ta + medical);

  // 4. Deductions
  const pf_employee = basic * 0.12;
  const pf_employer = basic * 0.12; // (Not deducted from net_pay, but part of CTC)
  const esi = monthlyGross <= 21000 ? monthlyGross * 0.0075 : 0;
  const professional_tax = 200; // standard approx
  
  // TDS Calculation (Simplified 10% flat above 5L)
  const annualGross = ctc;
  const tds = annualGross > 500000 ? (monthlyGross * 0.10) : 0;

  // 5. Loan Deductions
  const loanRes = await db.execute({
    sql: 'SELECT id, monthly_deduction, balance_remaining FROM loans WHERE employee_id = ? AND balance_remaining > 0',
    args: [employeeId]
  });
  
  let loans_deducted = 0;
  for (const loan of loanRes.rows) {
    const deduction = Math.min(loan.monthly_deduction, loan.balance_remaining);
    loans_deducted += deduction;
    
    // Update loan balance
    await db.execute({
      sql: 'UPDATE loans SET balance_remaining = balance_remaining - ? WHERE id = ?',
      args: [deduction, loan.id]
    });
  }

  // 6. Net Pay
  const totalDeductions = pf_employee + esi + professional_tax + tds + loans_deducted;
  const net_pay = monthlyGross - totalDeductions;

  return {
    basic,
    hra,
    ta,
    medical,
    special_allowance,
    pf_employee,
    pf_employer,
    esi,
    professional_tax,
    tds,
    loans_deducted,
    net_pay
  };
};

module.exports = { calculatePayroll };
