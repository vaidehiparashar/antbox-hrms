const nodemailer = require('nodemailer');

const createTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Using Ethereal for dev testing fallback
  let testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendMail = async ({ to, subject, text, html, attachments }) => {
  try {
    const transporter = await createTransporter();
    const fromSender = process.env.SMTP_USER 
      ? `"Enterprise HRMS" <${process.env.SMTP_USER}>`
      : '"Enterprise HRMS" <hr@hrms.com>';
    
    let info = await transporter.sendMail({
      from: fromSender,
      to,
      subject,
      text,
      html,
      attachments
    });

    console.log("Message sent: %s", info.messageId);
    if (!process.env.SMTP_HOST) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};

// 1. Leave Approved Email Template
const sendLeaveApproved = async (employeeName, email, fromDate, toDate) => {
  const subject = 'Your Leave Request Has Been APPROVED';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #10B981;">Leave Request Approved</h2>
      <p>Dear <strong>${employeeName}</strong>,</p>
      <p>We are pleased to inform you that your leave request for the period from <strong>${fromDate}</strong> to <strong>${toDate}</strong> has been <strong>APPROVED</strong>.</p>
      <p>Please ensure all pending handovers are completed before your leave starts.</p>
      <br>
      <p>Best Regards,</p>
      <p><strong>HR Operations Team</strong><br>Enterprise HRMS</p>
    </div>
  `;
  return sendMail({ to: email, subject, html, text: `Dear ${employeeName}, your leave from ${fromDate} to ${toDate} has been APPROVED.` });
};

// 2. Leave Rejected Email Template
const sendLeaveRejected = async (employeeName, email, reason) => {
  const subject = 'Leave Request Update';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #EF4444;">Leave Request Update</h2>
      <p>Dear <strong>${employeeName}</strong>,</p>
      <p>We regret to inform you that your leave request has been <strong>REJECTED</strong>.</p>
      <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 12px; margin: 15px 0; border-radius: 4px;">
        <strong>Reason for Rejection:</strong> ${reason}
      </div>
      <p>If you have any queries, please reach out to your department head or the HR team.</p>
      <br>
      <p>Best Regards,</p>
      <p><strong>HR Operations Team</strong><br>Enterprise HRMS</p>
    </div>
  `;
  return sendMail({ to: email, subject, html, text: `Dear ${employeeName}, your leave has been REJECTED. Reason: ${reason}` });
};

// 3. Mail Inquiry Accepted Template
const sendMailAccepted = async (senderEmail, senderName) => {
  const subject = 'Inquiry Received and Accepted';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #3B82F6;">Inquiry Accepted</h2>
      <p>Dear <strong>${senderName}</strong>,</p>
      <p>Thank you for reaching out to us. We have received your inquiry and it has been <strong>ACCEPTED</strong> for further review.</p>
      <p>An HR representative will get in touch with you shortly to assist you further.</p>
      <br>
      <p>Best Regards,</p>
      <p><strong>HR Operations Team</strong><br>Enterprise HRMS</p>
    </div>
  `;
  return sendMail({ to: senderEmail, subject, html, text: `Dear ${senderName}, your inquiry has been accepted.` });
};

// 4. Mail Inquiry Rejected Template
const sendMailRejected = async (senderEmail, senderName) => {
  const subject = 'Inquiry Status Update';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #6B7280;">Inquiry Update</h2>
      <p>Dear <strong>${senderName}</strong>,</p>
      <p>We have received and reviewed your request. Unfortunately, we are unable to process your request at this time.</p>
      <p>If you think this is in error, feel free to submit a fresh request with supporting details.</p>
      <br>
      <p>Best Regards,</p>
      <p><strong>HR Operations Team</strong><br>Enterprise HRMS</p>
    </div>
  `;
  return sendMail({ to: senderEmail, subject, html, text: `Dear ${senderName}, we are unable to process your request at this time.` });
};

// 5. Payslip Generated Template
const sendPayslipGenerated = async (employeeName, email, month, pdfPath) => {
  const subject = `Payslip Generated for ${month}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #10B981;">Salary Payslip Ready</h2>
      <p>Dear <strong>${employeeName}</strong>,</p>
      <p>Your salary payslip for the month of <strong>${month}</strong> has been successfully generated.</p>
      <p>You can view/download your digital payslip from Cloudinary directly: <a href="${pdfPath}" target="_blank" style="color: #3B82F6; font-weight: bold; text-decoration: underline;">Download Payslip</a>.</p>
      <p>The copy is also attached to this email.</p>
      <br>
      <p>Best Regards,</p>
      <p><strong>Finance & Payroll Team</strong><br>Enterprise HRMS</p>
    </div>
  `;
  return sendMail({
    to: email,
    subject,
    html,
    text: `Dear ${employeeName}, your payslip for ${month} is ready. Download it here: ${pdfPath}`,
    attachments: [
      {
        filename: `Payslip_${month.replace(' ', '_')}.pdf`,
        path: pdfPath
      }
    ]
  });
};

// 6. Welcome Email Template
const sendWelcomeEmail = async (name, email, password) => {
  const subject = 'Welcome to the Enterprise HRMS Portal!';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #E5E7EB; border-radius: 8px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; border-bottom: 1px solid #E5E7EB; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #3B82F6; margin: 0;">Enterprise HRMS</h1>
        <p style="color: #6B7280; font-size: 14px; margin: 5px 0 0 0;">Your Employee Portal Access</p>
      </div>
      <h2 style="color: #111827; margin-top: 0;">Welcome aboard, ${name}!</h2>
      <p>Your official employee profile has been created successfully in our system. You can now access your payroll, leaves, attendance, and team directories through the self-service portal.</p>
      
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #374151;">Your Sign-In Credentials:</h4>
        <p style="margin: 5px 0;"><strong>Portal URL:</strong> <a href="http://localhost:5173" style="color: #3B82F6;">http://localhost:5173</a></p>
        <p style="margin: 5px 0;"><strong>Email Address:</strong> <code style="background-color: #E5E7EB; padding: 2px 6px; border-radius: 4px;">${email}</code></p>
        <p style="margin: 5px 0;"><strong>Initial Password:</strong> <code style="background-color: #E5E7EB; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
      </div>

      <p style="color: #6B7280; font-size: 13px;">Please log in to the portal as soon as possible and change your password in Settings to ensure your account security.</p>
      
      <br>
      <p style="color: #374151; margin-bottom: 0;">Best Regards,</p>
      <p style="color: #111827; font-weight: bold; margin-top: 5px;">Human Resources Team</p>
    </div>
  `;
  return sendMail({
    to: email,
    subject,
    html,
    text: `Welcome ${name}! Log in to HRMS with Email: ${email} and Password: ${password}`
  });
};

module.exports = {
  sendMail,
  sendLeaveApproved,
  sendLeaveRejected,
  sendMailAccepted,
  sendMailRejected,
  sendPayslipGenerated,
  sendWelcomeEmail
};
