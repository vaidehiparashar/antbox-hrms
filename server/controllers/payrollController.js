const db = require('../database/db');
const { sendPayslipGenerated } = require('../services/mailService');

// Helper to draw and generate PDF Buffer
const drawPDFBuffer = (emp, month, year, components) => {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const { basic, hra, ta, medical, special, gross, pf, esi, pt, tds, net } = components;

      // Header
      doc.fontSize(24).fillColor('#0F172A').text('ANT BOX', 50, 50);
      doc.fontSize(10).fillColor('#6366F1').text('HR Management System', 50, 80);
      doc.fontSize(9).fillColor('#64748B').text('Mumbai, Maharashtra, India', 50, 95);
      
      doc.moveTo(50, 115).lineTo(550, 115).strokeColor('#6366F1').stroke();
      
      // Payslip title
      doc.fontSize(16).fillColor('#0F172A')
         .text(`SALARY SLIP - ${month}/${year}`, 50, 125);
      doc.fontSize(9).fillColor('#64748B')
         .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 400, 130);
      
      // Employee details
      doc.fontSize(11).fillColor('#0F172A').text('EMPLOYEE DETAILS', 50, 160);
      doc.moveTo(50, 175).lineTo(550, 175).strokeColor('#E2E8F0').stroke();
      
      doc.fontSize(9).fillColor('#374151');
      doc.text(`Name: ${emp.name}`, 50, 185);
      doc.text(`Email: ${emp.email}`, 50, 200);
      doc.text(`Department: ${emp.dept_name || emp.department_name || 'General'}`, 50, 215);
      doc.text(`Designation: ${emp.designation}`, 300, 185);
      doc.text(`Joining Date: ${emp.joining_date}`, 300, 200);
      
      doc.moveTo(50, 235).lineTo(550, 235).strokeColor('#E2E8F0').stroke();
      
      // Earnings and Deductions table
      doc.fontSize(11).fillColor('#0F172A');
      doc.text('EARNINGS', 50, 250);
      doc.text('DEDUCTIONS', 310, 250);
      
      doc.fontSize(9).fillColor('#374151');
      const items = [
        ['Basic Salary', basic, 'Provident Fund', pf],
        ['HRA', hra, 'ESI', esi],
        ['Travel Allowance', ta, 'Professional Tax', pt],
        ['Medical Allowance', medical, 'TDS', tds],
        ['Special Allowance', special, '', ''],
      ];
      
      let y = 270;
      items.forEach(([e1, v1, e2, v2]) => {
        doc.text(e1, 50, y);
        doc.text(`INR ${v1.toLocaleString('en-IN')}`, 200, y);
        if (e2) doc.text(e2, 310, y);
        if (v2 !== '') doc.text(`INR ${v2.toLocaleString('en-IN')}`, 460, y);
        y += 18;
      });
      
      doc.moveTo(50, y+5).lineTo(550, y+5).strokeColor('#6366F1').stroke();
      y += 15;
      
      // Totals
      doc.fontSize(10).fillColor('#0F172A');
      doc.text(`Gross Pay: INR ${gross.toLocaleString('en-IN')}`, 50, y);
      doc.text(`Total Deductions: INR ${(pf+esi+pt+tds).toLocaleString('en-IN')}`, 310, y);
      y += 20;
      
      doc.fontSize(13).fillColor('#6366F1');
      doc.text(`NET PAY: INR ${net.toLocaleString('en-IN')}`, 50, y);
      
      doc.moveTo(50, y+25).lineTo(550, y+25).strokeColor('#E2E8F0').stroke();
      y += 40;
      
      // Remarks
      doc.fontSize(9).fillColor('#64748B');
      doc.text('REMARKS:', 50, y);
      doc.text(`Salary credited for ${month}/${year}. This is a system generated payslip.`, 50, y+15);
      doc.text('ANT BOX HR Department | Authorized Signatory', 50, y+30);
      
      // Watermark
      doc.save();
      doc.fontSize(60).fillColor('#E2E8F0').opacity(0.15);
      doc.rotate(-45, { origin: [300, 400] })
      doc.text('ANT BOX', 100, 300);
      doc.restore();
      
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const generateSinglePayslip = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    // Get employee data from Turso
    const empResult = await db.execute({
      sql: `SELECT e.*, u.name, u.email, d.name as dept_name 
            FROM employees e 
            JOIN users u ON e.user_id = u.id 
            JOIN departments d ON e.dept_id = d.id 
            WHERE e.id = ?`,
      args: [employeeId]
    });
    
    if (!empResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    const emp = empResult.rows[0];
    const salary = emp.salary || 50000;
    
    // Calculate salary components
    const basic = Math.round(salary * 0.40);
    const hra = Math.round(salary * 0.20);
    const ta = Math.round(salary * 0.10);
    const medical = Math.round(salary * 0.05);
    const special = Math.round(salary * 0.15);
    const gross = basic + hra + ta + medical + special;
    const pf = Math.round(basic * 0.12);
    const esi = salary < 21000 ? Math.round(salary * 0.0075) : 0;
    const pt = 200;
    const tds = salary > 50000 ? Math.round(salary * 0.10) : 0;
    const net = gross - pf - esi - pt - tds;

    const components = { basic, hra, ta, medical, special, gross, pf, esi, pt, tds, net };
    
    // Generate PDF Buffer
    const pdfBuffer = await drawPDFBuffer(emp, month, year, components);
    
    const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthsList[parseInt(month) - 1] || 'May';
    const cleanEmpName = emp.name.replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="payslip-${cleanEmpName}-${monthName}-${year}.pdf"`);
    
    res.send(pdfBuffer);

    // Trigger background process
    (async () => {
      try {
        const existingRes = await db.execute({
          sql: 'SELECT id FROM payroll WHERE employee_id = ? AND month = ? AND year = ?',
          args: [employeeId, month, year]
        });

        if (existingRes.rows.length === 0) {
          // Upload to Cloudinary
          const { cloudinary } = require('../utils/cloudinary');
          const pdfUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'hrms/payslips',
                resource_type: 'raw',
                format: 'pdf',
                public_id: `payslip_${employeeId}_${month}_${year}`
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
              }
            );
            uploadStream.end(pdfBuffer);
          });

          // Insert into DB
          const insertSql = `
            INSERT INTO payroll (
              employee_id, month, year, basic, hra, ta, medical, special_allowance,
              pf_employee, pf_employer, esi, professional_tax, tds, loans_deducted, net_pay, payslip_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const insertArgs = [
            employeeId, month, year, basic, hra, ta, medical, special,
            pf, pf, esi, pt, tds, 0, net, pdfUrl
          ];

          const result = await db.execute({ sql: insertSql, args: insertArgs });
          const recordId = result.lastInsertRowid ? Number(result.lastInsertRowid) : 1;

          // Send Email
          const monthLabel = `${monthName} ${year}`;
          try {
            await sendPayslipGenerated(emp.name, emp.email, monthLabel, pdfUrl);
          } catch (mailErr) {
            console.error('Background payslip email dispatch failed:', mailErr.message);
          }

          // Audit Log
          await db.execute({
            sql: 'INSERT INTO audit_log (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
            args: [req.user?.id || 1, 'generate_payroll', 'payroll', recordId]
          });
        }
      } catch (bgError) {
        console.error(`Background payroll generation failed for employee ${employeeId}:`, bgError.message);
      }
    })();

  } catch (err) {
    console.error('Payslip error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

const runPayrollForAll = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    // Get all active employees
    const empsRes = await db.execute(`
      SELECT e.*, u.name, u.email, d.name as dept_name 
      FROM employees e 
      JOIN users u ON e.user_id = u.id 
      LEFT JOIN departments d ON e.dept_id = d.id 
      WHERE e.status = 'active'
    `);
    
    const activeEmployees = empsRes.rows;
    if (activeEmployees.length === 0) {
      return res.status(400).json({ success: false, message: 'No active employees found to generate payroll' });
    }

    const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthsList[parseInt(month) - 1] || 'May';
    let processedCount = 0;

    for (const emp of activeEmployees) {
      try {
        // Check if payroll already exists
        const existingRes = await db.execute({
          sql: 'SELECT id FROM payroll WHERE employee_id = ? AND month = ? AND year = ?',
          args: [emp.id, month, year]
        });

        if (existingRes.rows.length === 0) {
          const salary = emp.salary || 50000;
          
          // Calculate components
          const basic = Math.round(salary * 0.40);
          const hra = Math.round(salary * 0.20);
          const ta = Math.round(salary * 0.10);
          const medical = Math.round(salary * 0.05);
          const special = Math.round(salary * 0.15);
          const gross = basic + hra + ta + medical + special;
          const pf = Math.round(basic * 0.12);
          const esi = salary < 21000 ? Math.round(salary * 0.0075) : 0;
          const pt = 200;
          const tds = salary > 50000 ? Math.round(salary * 0.10) : 0;
          const net = gross - pf - esi - pt - tds;

          const components = { basic, hra, ta, medical, special, gross, pf, esi, pt, tds, net };

          // Generate PDF Buffer
          const pdfBuffer = await drawPDFBuffer(emp, month, year, components);

          // Upload to Cloudinary
          const { cloudinary } = require('../utils/cloudinary');
          const pdfUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'hrms/payslips',
                resource_type: 'raw',
                format: 'pdf',
                public_id: `payslip_${emp.id}_${month}_${year}`
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
              }
            );
            uploadStream.end(pdfBuffer);
          });

          // Insert into DB
          const insertSql = `
            INSERT INTO payroll (
              employee_id, month, year, basic, hra, ta, medical, special_allowance,
              pf_employee, pf_employer, esi, professional_tax, tds, loans_deducted, net_pay, payslip_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const insertArgs = [
            emp.id, month, year, basic, hra, ta, medical, special,
            pf, pf, esi, pt, tds, 0, net, pdfUrl
          ];

          const result = await db.execute({ sql: insertSql, args: insertArgs });
          const recordId = result.lastInsertRowid ? Number(result.lastInsertRowid) : 1;

          // Send Email
          const monthLabel = `${monthName} ${year}`;
          try {
            await sendPayslipGenerated(emp.name, emp.email, monthLabel, pdfUrl);
          } catch (mailErr) {
            console.error(`Background bulk email dispatch failed for ${emp.name}:`, mailErr.message);
          }

          // Audit Log
          await db.execute({
            sql: 'INSERT INTO audit_log (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
            args: [req.user?.id || 1, 'generate_payroll', 'payroll', recordId]
          });

          processedCount++;
        } else {
          // Count as processed even if already existing so user knows everyone is up-to-date
          processedCount++;
        }
      } catch (empError) {
        console.error(`Failed to process bulk payroll for employee ID ${emp.id}:`, empError.message);
      }
    }

    res.json({
      success: true,
      message: `Bulk payroll calculations completed successfully for ${processedCount} employees`,
      data: { count: processedCount },
      meta: null
    });

  } catch (error) {
    next(error);
  }
};

const getEmployeePayrollHistory = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    // Auth Check
    if (req.user.role === 'Employee' && req.user.employee_id != employeeId) {
        return res.status(403).json({ success: false, message: 'Forbidden to view others history', data: null, meta: null });
    }

    const sql = `
      SELECT p.*, e.designation, u.name as employee_name
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE p.employee_id = ?
      ORDER BY p.year DESC, p.month DESC
    `;
    const historyRes = await db.execute({ sql, args: [employeeId] });

    res.json({
      success: true,
      message: 'Payroll history fetched successfully',
      data: historyRes.rows,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateSinglePayslip,
  runPayrollForAll,
  getEmployeePayrollHistory
};
