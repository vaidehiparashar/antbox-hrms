const PDFDocument = require('pdfkit');
const { cloudinary } = require('../utils/cloudinary');

const drawPayslipContent = (doc, payrollData, employeeData) => {
  // 1. Diagonal Watermark in background
  doc.save();
  doc.opacity(0.035);
  doc.fontSize(70);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0F172A');
  doc.rotate(-30, { origin: [300, 350] });
  doc.text('ANT BOX', 120, 300, { align: 'center', width: 350 });
  doc.restore();

  // 2. Navy Header Banner (#0F172A)
  doc.rect(50, 45, 500, 75).fill('#0F172A');
  
  // Header Text
  doc.fillColor('#FFFFFF');
  doc.font('Helvetica-Bold').fontSize(22).text('ANT BOX', 70, 60);
  doc.font('Helvetica').fontSize(11).fillColor('#A0AEC0').text('HR Management System', 70, 85);
  
  doc.fillColor('#FFFFFF').font('Helvetica').fontSize(10);
  doc.text('Mumbai, Maharashtra, India', 350, 75, { align: 'right', width: 180 });

  // 3. Subheader Title Block
  const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthsList[parseInt(payrollData.month) - 1] || 'May';

  doc.moveDown(2);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#6366F1').text(`SALARY SLIP - ${monthName} ${payrollData.year}`, 50, 140);
  doc.font('Helvetica').fontSize(10).fillColor('#718096').text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 350, 140, { align: 'right', width: 180 });
  
  doc.moveTo(50, 160).lineTo(550, 160).lineWidth(1).strokeColor('#E2E8F0').stroke();

  // 4. Employee Details Section
  let y = 175;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('EMPLOYEE DETAILS', 50, y);
  doc.font('Helvetica').fontSize(10).fillColor('#4A5568');
  y += 20;

  doc.text('Name:', 50, y);
  doc.font('Helvetica-Bold').fillColor('#1A202C').text(employeeData.name, 150, y);
  doc.font('Helvetica').fillColor('#4A5568').text('Department:', 300, y);
  doc.font('Helvetica-Bold').fillColor('#1A202C').text(employeeData.department_name || 'General', 400, y);
  y += 18;

  doc.font('Helvetica').fillColor('#4A5568').text('Email:', 50, y);
  doc.font('Helvetica-Bold').fillColor('#1A202C').text(employeeData.email, 150, y);
  doc.font('Helvetica').fillColor('#4A5568').text('Designation:', 300, y);
  doc.font('Helvetica-Bold').fillColor('#1A202C').text(employeeData.designation || 'Staff', 400, y);
  y += 18;

  doc.font('Helvetica').fillColor('#4A5568').text('Joining Date:', 50, y);
  doc.font('Helvetica-Bold').fillColor('#1A202C').text(employeeData.joining_date || 'N/A', 150, y);
  doc.font('Helvetica').fillColor('#4A5568').text('Bank Account:', 300, y);
  doc.font('Helvetica-Bold').fillColor('#1A202C').text(employeeData.bank_account ? `A/C: ${employeeData.bank_account}` : 'N/A', 400, y);
  y += 25;

  doc.moveTo(50, y).lineTo(550, y).lineWidth(1).strokeColor('#E2E8F0').stroke();
  y += 15;

  // 5. Earnings & Deductions Tables
  const tableTop = y;
  doc.rect(50, tableTop, 240, 20).fill('#6366F1');
  doc.rect(310, tableTop, 240, 20).fill('#6366F1');
  
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10);
  doc.text('EARNINGS', 60, tableTop + 5);
  doc.text('Amount', 200, tableTop + 5, { align: 'right', width: 80 });
  doc.text('DEDUCTIONS', 320, tableTop + 5);
  doc.text('Amount', 460, tableTop + 5, { align: 'right', width: 80 });

  y = tableTop + 25;
  doc.font('Helvetica').fontSize(9.5).fillColor('#2D3748');

  const drawRow = (earningName, earningVal, deductionName, deductionVal, rowY) => {
    doc.font('Helvetica').fillColor('#2D3748');
    doc.text(earningName, 60, rowY);
    doc.text(`INR ${earningVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, rowY, { align: 'right', width: 110 });
    doc.text(deductionName, 320, rowY);
    doc.text(`INR ${deductionVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 430, rowY, { align: 'right', width: 110 });
    
    doc.moveTo(50, rowY + 14).lineTo(290, rowY + 14).lineWidth(0.5).strokeColor('#EDF2F7').stroke();
    doc.moveTo(310, rowY + 14).lineTo(550, rowY + 14).lineWidth(0.5).strokeColor('#EDF2F7').stroke();
  };

  drawRow('Basic Salary', payrollData.basic, 'Provident Fund (PF)', payrollData.pf_employee, y); y += 18;
  drawRow('HRA', payrollData.hra, 'ESI Contribution', payrollData.esi, y); y += 18;
  drawRow('Transport Allowance (TA)', payrollData.ta, 'Professional Tax', payrollData.professional_tax, y); y += 18;
  drawRow('Medical Allowance', payrollData.medical, 'TDS (Tax Deductions)', payrollData.tds, y); y += 18;
  drawRow('Special Allowance', payrollData.special_allowance, 'Loans Repayment', payrollData.loans_deducted, y); y += 22;

  const totalEarnings = payrollData.basic + payrollData.hra + payrollData.ta + payrollData.medical + payrollData.special_allowance;
  const totalDeductions = payrollData.pf_employee + payrollData.esi + payrollData.professional_tax + payrollData.tds + payrollData.loans_deducted;

  // Gross Pay & Total Deductions
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A');
  doc.text('GROSS PAY:', 60, y);
  doc.text(`INR ${totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, y, { align: 'right', width: 110 });
  doc.text('TOTAL DEDUCTIONS:', 320, y);
  doc.text(`INR ${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 430, y, { align: 'right', width: 110 });

  y += 20;
  doc.moveTo(50, y).lineTo(550, y).lineWidth(1.5).strokeColor('#A0AEC0').stroke();
  y += 10;

  // 6. Net Take-Home Pay Banner
  doc.rect(50, y, 500, 30).fill('#0F172A');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12);
  doc.text('NET TAKE-HOME PAY:', 70, y + 9);
  doc.text(`INR ${payrollData.net_pay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 330, y + 9, { align: 'right', width: 200 });

  y += 45;

  // 7. Remarks & Signatory Seal Block
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#4A5568').text('REMARKS & DISCLAIMERS', 50, y);
  y += 15;
  doc.font('Helvetica').fontSize(8.5).fillColor('#718096');
  doc.text(`• Salary successfully credited for the month of ${monthName} ${payrollData.year}.`, 50, y);
  y += 12;
  doc.text('• This is a system-generated secure payroll slip and does not require an ink signature.', 50, y);

  // Signatory Stamp
  doc.font('Helvetica').fontSize(9.5).fillColor('#1A202C');
  doc.text('Authorized Signatory', 380, y - 5, { align: 'right', width: 150 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#6366F1');
  doc.text('ANT BOX HR Department', 380, y + 8, { align: 'right', width: 150 });

  // Border Seal box
  doc.rect(400, y - 20, 150, 42).lineWidth(1).strokeColor('#CBD5E0').stroke();
};

const generatePayslipPDFBuffer = (payrollData, employeeData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      drawPayslipContent(doc, payrollData, employeeData);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const generatePayslipPDFAndUpload = async (payrollData, employeeData) => {
  const buffer = await generatePayslipPDFBuffer(payrollData, employeeData);
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'hrms/payslips',
        resource_type: 'raw',
        format: 'pdf',
        public_id: `payslip_${employeeData.id}_${payrollData.month}_${payrollData.year}`
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

module.exports = { 
  generatePayslipPDFBuffer, 
  generatePayslipPDFAndUpload 
};
