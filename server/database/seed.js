const bcrypt = require('bcrypt');
const db = require('./db');
const fs = require('fs');
const path = require('path');

// Helper to chunk arrays for LibSQL batch inserts (prevents query limits)
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

async function seed() {
  console.log('Starting comprehensive enterprise database seeding to Turso...');
  const startTime = Date.now();

  const defaultPassword = 'password123';
  const passwordHash = bcrypt.hashSync(defaultPassword, 12);

  try {
    // 1. Ensure schema exists
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Loading schema...');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await db.executeMultiple(schema);
      console.log('Schema executed successfully.');
    }

    // 2. Clear existing data
    console.log('Cleaning old tables...');
    await db.executeMultiple(`
      DELETE FROM notifications;
      DELETE FROM audit_log;
      DELETE FROM performance;
      DELETE FROM documents;
      DELETE FROM announcement_seen;
      DELETE FROM announcements;
      DELETE FROM deals;
      DELETE FROM mails;
      DELETE FROM loans;
      DELETE FROM payroll;
      DELETE FROM leave_balances;
      DELETE FROM leaves;
      DELETE FROM attendance;
      DELETE FROM interns;
      DELETE FROM employees;
      DELETE FROM users;
      DELETE FROM departments;
    `);
    console.log('Old tables cleaned.');

    // 3. Define Departments
    const departmentsList = [
      'Engineering',
      'Sales',
      'Marketing',
      'HR',
      'Finance',
      'Operations'
    ];

    const deptIds = {};
    for (const deptName of departmentsList) {
      const res = await db.execute({
        sql: 'INSERT INTO departments (name) VALUES (?) RETURNING id',
        args: [deptName]
      });
      deptIds[deptName] = res.rows[0].id;
    }
    console.log('Inserted departments:', deptIds);

    // 4. Generate Users
    const usersData = [];
    
    // Super Admin User
    usersData.push({
      name: 'System Admin',
      email: 'admin@hrms.com',
      role: 'Super Admin'
    });

    // Department Heads
    const deptHeadRoles = {
      'Engineering': 'head.eng@hrms.com',
      'Sales': 'head.sales@hrms.com',
      'Marketing': 'head.marketing@hrms.com',
      'HR': 'head.hr@hrms.com',
      'Finance': 'head.finance@hrms.com',
      'Operations': 'head.ops@hrms.com'
    };

    for (const [dept, email] of Object.entries(deptHeadRoles)) {
      usersData.push({
        name: `${dept} Head`,
        email: email,
        role: dept === 'HR' ? 'HR Manager' : 'Department Head'
      });
    }

    // Generate remaining users (94 employees)
    const firstNamesMale = ['Aarav', 'Vihaan', 'Vivaan', 'Kabir', 'Sai', 'Aditya', 'Ishaan', 'Krishna', 'Arjun', 'Aryan', 'Reyansh', 'Aarush', 'Rohan', 'Rahul', 'Amit', 'Sanjay', 'Vikram', 'Anil', 'Dev', 'Raj'];
    const firstNamesFemale = ['Priya', 'Neha', 'Pooja', 'Aishwarya', 'Deepika', 'Kriti', 'Shraddha', 'Alia', 'Kiara', 'Kareena', 'Preity', 'Sushmita', 'Lara', 'Dia', 'Rani', 'Kajol', 'Madhuri', 'Juhi', 'Vidya', 'Ira'];
    const lastNames = ['Sharma', 'Verma', 'Gupta', 'Mehra', 'Joshi', 'Patel', 'Shah', 'Trivedi', 'Jha', 'Das', 'Roy', 'Nair', 'Pillai', 'Rao', 'Reddy', 'Singh', 'Yadav', 'Kumar', 'Choudhury', 'Sen'];

    const generatedEmails = new Set();
    generatedEmails.add('admin@hrms.com');
    Object.values(deptHeadRoles).forEach(e => generatedEmails.add(e));

    const totalEmployeesGoal = 100;
    const regularEmployeesCount = totalEmployeesGoal - Object.keys(deptHeadRoles).length; // 94 regular employees

    for (let i = 0; i < regularEmployeesCount; i++) {
      const isMale = Math.random() > 0.45;
      const firstName = isMale 
        ? firstNamesMale[Math.floor(Math.random() * firstNamesMale.length)]
        : firstNamesFemale[Math.floor(Math.random() * firstNamesFemale.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@hrms.com`;
      
      // Handle email collisions
      let counter = 1;
      while (generatedEmails.has(email)) {
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${counter}@hrms.com`;
        counter++;
      }
      generatedEmails.add(email);

      usersData.push({
        name,
        email,
        role: 'Employee'
      });
    }

    console.log(`Inserting ${usersData.length} Users...`);
    const userInsertQueries = usersData.map(u => ({
      sql: 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      args: [u.name, u.email, u.role === 'Super Admin' ? passwordHash : passwordHash, u.role]
    }));

    // Batch insert users in chunks of 50
    const userChunks = chunkArray(userInsertQueries, 50);
    for (const chunk of userChunks) {
      await db.batch(chunk);
    }

    // Fetch all users to map emails to IDs
    const usersListRes = await db.execute('SELECT id, name, email, role FROM users');
    const usersMap = {};
    usersListRes.rows.forEach(row => {
      usersMap[row.email] = { id: row.id, name: row.name, role: row.role };
    });
    console.log('Users inserted and mapped successfully.');

    // 5. Generate Employees
    const employeeInsertQueries = [];
    const empDetails = [];

    const designations = {
      'Engineering': ['Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'QA Engineer', 'DevOps Engineer'],
      'Sales': ['Sales Executive', 'Senior Sales Executive', 'Sales Manager', 'Account Manager'],
      'Marketing': ['Marketing Associate', 'Marketing Manager', 'SEO Specialist', 'Content Writer'],
      'HR': ['HR Associate', 'HR Specialist', 'HR Recruiter'],
      'Finance': ['Financial Analyst', 'Senior Accountant', 'Finance Associate'],
      'Operations': ['Operations Associate', 'Operations Manager', 'Logistics Coordinator']
    };

    const salaryRanges = {
      'Engineering': [60000, 150000],
      'Sales': [45000, 90000],
      'Marketing': [45000, 95000],
      'HR': [50000, 100000],
      'Finance': [55000, 120000],
      'Operations': [45000, 85000]
    };

    // Insert Department Heads first
    const deptHeadEmpIds = {};
    for (const [deptName, email] of Object.entries(deptHeadRoles)) {
      const user = usersMap[email];
      const deptId = deptIds[deptName];
      const designation = `${deptName} Head`;
      const salary = salaryRanges[deptName][1]; // Highest end for heads

      const phone = `98765${Math.floor(10000 + Math.random() * 90000)}`;
      const address = `${Math.floor(100 + Math.random() * 900)} Park St, City`;
      const dob = `198${Math.floor(Math.random() * 9)}-0${Math.floor(1 + Math.random() * 9)}-${Math.floor(10 + Math.random() * 18)}`;
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      const joiningDate = '2022-01-15';

      employeeInsertQueries.push({
        sql: `INSERT INTO employees (
                user_id, dept_id, designation, phone, address, dob, gender,
                joining_date, employment_type, contract_type, salary, bank_account, ifsc, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          user.id, deptId, designation, phone, address, dob, gender,
          joiningDate, 'Full-time', 'Permanent', salary, '99991234' + user.id, 'HDFC0001234', 'active'
        ]
      });

      empDetails.push({
        email,
        deptName,
        deptId,
        salary,
        isHead: true
      });
    }

    // Insert regular employees
    const departmentsArray = Object.keys(deptIds);
    let deptSelectorIndex = 0;

    for (const u of usersData) {
      if (u.role === 'Super Admin' || Object.values(deptHeadRoles).includes(u.email)) {
        continue; // Handled separately
      }

      const user = usersMap[u.email];
      const deptName = departmentsArray[deptSelectorIndex];
      const deptId = deptIds[deptName];
      
      const deptDesignations = designations[deptName];
      const designation = deptDesignations[Math.floor(Math.random() * deptDesignations.length)];
      
      const salRange = salaryRanges[deptName];
      const salary = Math.floor(salRange[0] + Math.random() * (salRange[1] - salRange[0]));

      const phone = `91234${Math.floor(10000 + Math.random() * 90000)}`;
      const address = `${Math.floor(10 + Math.random() * 900)} MG Road, City`;
      const dob = `199${Math.floor(Math.random() * 9)}-0${Math.floor(1 + Math.random() * 9)}-${Math.floor(10 + Math.random() * 18)}`;
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      const joiningDate = `2024-0${Math.floor(1 + Math.random() * 5)}-01`;

      employeeInsertQueries.push({
        sql: `INSERT INTO employees (
                user_id, dept_id, designation, phone, address, dob, gender,
                joining_date, employment_type, contract_type, salary, bank_account, ifsc, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          user.id, deptId, designation, phone, address, dob, gender,
          joiningDate, 'Full-time', 'Permanent', salary, '99992345' + user.id, 'ICIC0000888', 'active'
        ]
      });

      empDetails.push({
        email: u.email,
        deptName,
        deptId,
        salary,
        isHead: false
      });

      // Distribute employees evenly across departments
      deptSelectorIndex = (deptSelectorIndex + 1) % departmentsArray.length;
    }

    console.log(`Inserting ${employeeInsertQueries.length} Employees...`);
    const empChunks = chunkArray(employeeInsertQueries, 50);
    for (const chunk of empChunks) {
      await db.batch(chunk);
    }

    // Retrieve employees list to fetch their assigned IDs
    const empListRes = await db.execute(`
      SELECT e.id as emp_id, u.id as user_id, u.email, e.dept_id, e.salary, u.name 
      FROM employees e JOIN users u ON e.user_id = u.id
    `);

    const employeesMap = {};
    const employeesList = [];
    empListRes.rows.forEach(row => {
      employeesMap[row.email] = {
        empId: row.emp_id,
        userId: row.user_id,
        deptId: row.dept_id,
        salary: row.salary,
        name: row.name
      };
      employeesList.push({
        empId: row.emp_id,
        userId: row.user_id,
        deptId: row.dept_id,
        salary: row.salary,
        name: row.name,
        email: row.email
      });
    });
    console.log('Employees inserted and mapped.');

    // 6. Update Department Heads in DB
    console.log('Linking department heads...');
    for (const [deptName, email] of Object.entries(deptHeadRoles)) {
      const emp = employeesMap[email];
      await db.execute({
        sql: 'UPDATE departments SET head_id = ? WHERE id = ?',
        args: [emp.empId, emp.deptId]
      });
    }
    console.log('Department heads linked.');

    // 7. Generate Leave Balances
    console.log('Generating leave balances...');
    const currentYear = new Date().getFullYear();
    const leaveBalanceQueries = [];
    for (const emp of employeesList) {
      leaveBalanceQueries.push({
        sql: 'INSERT INTO leave_balances (employee_id, leave_type, total, used, year) VALUES (?, ?, ?, ?, ?)',
        args: [emp.empId, 'Casual', 12, Math.floor(Math.random() * 4), currentYear]
      });
      leaveBalanceQueries.push({
        sql: 'INSERT INTO leave_balances (employee_id, leave_type, total, used, year) VALUES (?, ?, ?, ?, ?)',
        args: [emp.empId, 'Sick', 10, Math.floor(Math.random() * 3), currentYear]
      });
      leaveBalanceQueries.push({
        sql: 'INSERT INTO leave_balances (employee_id, leave_type, total, used, year) VALUES (?, ?, ?, ?, ?)',
        args: [emp.empId, 'Earned', 15, Math.floor(Math.random() * 5), currentYear]
      });
    }

    const leaveChunks = chunkArray(leaveBalanceQueries, 100);
    for (const chunk of leaveChunks) {
      await db.batch(chunk);
    }
    console.log('Leave balances inserted.');

    // 8. Generate 90 Days of Attendance Records (Mon-Fri)
    console.log('Generating 90 days of attendance records for 100 employees...');
    const attendanceQueries = [];
    const today = new Date();
    
    // Generate dates for past 90 days
    const dates = [];
    for (let d = 90; d >= 0; d--) {
      const day = new Date();
      day.setDate(today.getDate() - d);
      const dayOfWeek = day.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Mon-Fri
        dates.push(day.toISOString().split('T')[0]);
      }
    }
    console.log(`Calculated ${dates.length} working days out of the past 90 days.`);

    for (const emp of employeesList) {
      for (const dateStr of dates) {
        const rand = Math.random();
        let status = 'Present';
        let tapIn = null;
        let tapOut = null;
        let totalHours = 0;
        let isOvertime = 0;

        if (rand > 0.08) {
          status = 'Present';
          const inHour = 8 + Math.floor(Math.random() * 2); // 8 AM or 9 AM
          const inMin = Math.floor(Math.random() * 60);
          const outHour = 17 + Math.floor(Math.random() * 2); // 5 PM or 6 PM
          const outMin = Math.floor(Math.random() * 60);

          tapIn = `${dateStr} ${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}:00`;
          tapOut = `${dateStr} ${String(outHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}:00`;
          
          const inTime = inHour + (inMin / 60);
          const outTime = outHour + (outMin / 60);
          totalHours = parseFloat((outTime - inTime).toFixed(2));
          
          if (totalHours > 9.0) {
            isOvertime = 1;
          }
        } else if (rand > 0.03) {
          status = 'Leave';
        } else {
          status = 'Absent';
        }

        attendanceQueries.push({
          sql: `INSERT INTO attendance (employee_id, date, tap_in, tap_out, total_hours, status, is_overtime)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [emp.empId, dateStr, tapIn, tapOut, totalHours, status, isOvertime]
        });
      }
    }

    console.log(`Inserting ${attendanceQueries.length} Attendance records in optimal chunks...`);
    const attChunks = chunkArray(attendanceQueries, 250); // 250 inserts per batch
    let completedChunks = 0;
    for (const chunk of attChunks) {
      await db.batch(chunk);
      completedChunks++;
      if (completedChunks % 5 === 0) {
        console.log(`Seeding progress: ${completedChunks} of ${attChunks.length} chunks uploaded...`);
      }
    }
    console.log('Attendance records inserted successfully.');

    // 9. Generate 3 Months of Payroll Records
    console.log('Generating 3 months of payroll (March, April, May)...');
    const payrollQueries = [];
    const months = [
      { num: 3, name: 'March', year: 2026 },
      { num: 4, name: 'April', year: 2026 },
      { num: 5, name: 'May', year: 2026 }
    ];

    for (const emp of employeesList) {
      for (const m of months) {
        const basic = parseFloat((emp.salary * 0.50).toFixed(2));
        const hra = parseFloat((basic * 0.40).toFixed(2));
        const ta = parseFloat((basic * 0.10).toFixed(2));
        const medical = 2000;
        const specialAllowance = parseFloat((emp.salary - (basic + hra + ta + medical)).toFixed(2));

        const pfEmployee = parseFloat((basic * 0.12).toFixed(2));
        const pfEmployer = parseFloat((basic * 0.12).toFixed(2));
        const professionalTax = 200;
        const tds = parseFloat((emp.salary * 0.05).toFixed(2));
        const esi = emp.salary > 21000 ? 0 : parseFloat((emp.salary * 0.0075).toFixed(2));

        const grossPay = basic + hra + ta + medical + specialAllowance;
        const totalDeductions = pfEmployee + professionalTax + tds + esi;
        const netPay = parseFloat((grossPay - totalDeductions).toFixed(2));

        payrollQueries.push({
          sql: `INSERT INTO payroll (
                  employee_id, month, year, basic, hra, ta, medical, special_allowance,
                  pf_employee, pf_employer, esi, professional_tax, tds, loans_deducted, net_pay, generated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, datetime('now'))`,
          args: [emp.empId, m.num, m.year, basic, hra, ta, medical, specialAllowance, pfEmployee, pfEmployer, esi, professionalTax, tds, netPay]
        });
      }
    }

    const payChunks = chunkArray(payrollQueries, 100);
    for (const chunk of payChunks) {
      await db.batch(chunk);
    }
    console.log('Payroll history generated.');

    // 10. Generate 40 Mail Records
    console.log('Generating 40 mail records...');
    const mailQueries = [];
    const mailSubjects = [
      'Query regarding HRA calculations',
      'Leave application request extension',
      'Missing tap-out for yesterday',
      'Reimbursement of medical bills',
      'Appreciation for the new HRMS portal',
      'Access issues to the DevOps dashboard',
      'Update bank account information',
      'Loan application request',
      'Performance review query',
      'Holiday list clarification'
    ];

    const mailBodies = [
      'Hi HR Team, my HRA does not seem to match my current tax declaration. Could you please look into it?',
      'Dear manager, I would like to extend my leaves by two more days due to a sudden family commitment.',
      'Hi, I forgot to punch out yesterday at 6:30 PM. Please regularize my attendance. Thank you.',
      'Attached are my medical claims and prescription slips for the month of April. Please process the claim.',
      'Just wanted to say that the new dashboard looks absolutely beautiful! Extremely modern and smooth.',
      'I am unable to access the internal deployment pipeline. Getting an authorization error. Please support.',
      'Please update my payroll bank account to the new ICICI account listed in the portal attachments.',
      'I want to apply for a personal loan of Rs 50,000 against my next three months salaries. Please advice.',
      'Can you clarify when my appraisal results will be published for Q1? Thanks.',
      'Is upcoming Friday a holiday for Holi? The list shows conflicting info.'
    ];

    const mailCategories = ['Payroll', 'HR', 'Support', 'General'];
    const adminUser = usersMap['admin@hrms.com'];

    for (let i = 0; i < 40; i++) {
      const sender = employeesList[Math.floor(Math.random() * employeesList.length)];
      const subject = mailSubjects[Math.floor(Math.random() * mailSubjects.length)];
      const body = mailBodies[Math.floor(Math.random() * mailBodies.length)];
      const category = mailCategories[Math.floor(Math.random() * mailCategories.length)];
      const status = Math.random() > 0.5 ? 'read' : 'unread';

      mailQueries.push({
        sql: `INSERT INTO mails (sender_name, sender_email, subject, body, category, status, assigned_to, received_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-${Math.floor(Math.random() * 20)} days'))`,
        args: [sender.name, sender.email, subject, body, category, status, adminUser.id]
      });
    }

    await db.batch(mailQueries);
    console.log('40 Mail records inserted.');

    // 11. Generate 15 Interns
    console.log('Generating 15 interns...');
    const internColleges = ['IIT Delhi', 'BITS Pilani', 'NIT Trichy', 'Delhi Technological University', 'VIT Vellore', 'RV College of Engineering'];
    const internProjects = ['Smart Attendance ML Model', 'Payroll Automation Script', 'Admin CRM Widgets', 'Vulnerability Scanner', 'Notification Queue Service'];
    const mentorCandidates = employeesList.filter(e => e.deptId === deptIds['Engineering']);

    const internQueries = [];
    for (let i = 1; i <= 15; i++) {
      const name = `Intern Candidate ${i}`;
      const email = `intern${i}@hrms.com`;
      const college = internColleges[Math.floor(Math.random() * internColleges.length)];
      const project = internProjects[Math.floor(Math.random() * internProjects.length)];
      const stipend = 15000 + Math.floor(Math.random() * 10) * 1000;
      const mentor = mentorCandidates[Math.floor(Math.random() * mentorCandidates.length)];

      internQueries.push({
        sql: `INSERT INTO interns (name, email, college, dept_id, mentor_id, project, stipend, start_date, end_date, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, '2026-01-01', '2026-06-30', 'active')`,
        args: [name, email, college, deptIds['Engineering'], mentor.empId, project, stipend]
      });
    }

    await db.batch(internQueries);
    console.log('15 Intern records inserted.');

    // 12. Generate 8 Announcements
    console.log('Generating 8 announcements...');
    const announcements = [
      { title: 'Launch of New ERP Portal', body: 'We are thrilled to officially launch the antigravity HRMS portal. Track your attendance, payroll, leaves, and notifications in real time.', priority: 'Important' },
      { title: 'Health Insurance Renewal', body: 'Annual health insurance policies are up for renewal. Please submit your revised nominee lists by the end of next week.', priority: 'Important' },
      { title: 'Quarterly Town Hall', body: 'Join us on Friday at 4 PM in the main cafeteria (or virtually via link) for our Q1 Town Hall. CEO will share crucial milestones and updates.', priority: 'Normal' },
      { title: 'New Cybersecurity Guidelines', body: 'Please set up 2FA for all internal repository logins. Do not share your passwords or credentials with anyone.', priority: 'High' },
      { title: 'Annual Sports Meet 2026', body: 'Nominations are open for cricket, football, and table tennis. Get in touch with the sports coordinator to register your team.', priority: 'Normal' },
      { title: 'Office Relocation Notice', body: 'Our Sales team will be moving to the newly renovated 4th Floor starting this Monday. Contact IT for machine migrations.', priority: 'High' },
      { title: 'Finance Department Training', body: 'All managers are requested to join the session on corporate expense management tools this Tuesday at 11 AM.', priority: 'Normal' },
      { title: 'Performance Reviews Open', body: 'Self appraisals are active in the system. Please submit your goals and self-ratings before the appraisal deadline.', priority: 'High' }
    ];

    const annQueries = [];
    for (const ann of announcements) {
      annQueries.push({
        sql: `INSERT INTO announcements (title, body, priority, author_id, publish_at)
              VALUES (?, ?, ?, ?, datetime('now', '-${Math.floor(Math.random() * 5)} days'))`,
        args: [ann.title, ann.body, ann.priority, adminUser.id]
      });
    }

    await db.batch(annQueries);
    console.log('8 Announcements inserted.');

    // 13. Generate Performance Records
    console.log('Generating performance records...');
    const performanceQueries = [];
    const reviewerList = [adminUser.id];
    // Add department head user IDs to reviewer list
    for (const email of Object.values(deptHeadRoles)) {
      reviewerList.push(usersMap[email].id);
    }

    const reviewPeriods = ['Q4 2025', 'Q1 2026'];
    const goalsList = [
      'Increase client acquisition rate by 15%',
      'Optimize database search queries reducing server latency by 20%',
      'Improve code test coverage to over 85%',
      'Implement structured onboarding program for HR recruits',
      'Resolve open support tickets within the 24-hour SLA window'
    ];

    const commentsList = [
      'Consistently meets expectations. Shows strong team collaboration skills and solves technical issues effectively.',
      'Exceptional performance. Exceeds goals regularly and demonstrates leadership characteristics in project handovers.',
      'Steady work ethic. Reliable performer, but could focus on improving technical skills and communications.',
      'Active contributor to the project. Highly responsive to changes and works diligently to solve client complaints.'
    ];

    // Give performance reviews to 35 random employees
    const selectEmpIds = [];
    while (selectEmpIds.length < 35) {
      const emp = employeesList[Math.floor(Math.random() * employeesList.length)];
      if (!selectEmpIds.includes(emp.empId)) {
        selectEmpIds.push(emp.empId);
      }
    }

    for (const empId of selectEmpIds) {
      const period = reviewPeriods[Math.floor(Math.random() * reviewPeriods.length)];
      const reviewerId = reviewerList[Math.floor(Math.random() * reviewerList.length)];
      const selfRating = 3 + Math.floor(Math.random() * 3); // 3, 4, 5
      const managerRating = 3 + Math.floor(Math.random() * 3);
      const goals = goalsList[Math.floor(Math.random() * goalsList.length)];
      const comments = commentsList[Math.floor(Math.random() * commentsList.length)];

      performanceQueries.push({
        sql: `INSERT INTO performance (employee_id, reviewer_id, period, self_rating, manager_rating, goals, comments, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [empId, reviewerId, period, selfRating, managerRating, goals, comments]
      });
    }

    await db.batch(performanceQueries);
    console.log(`${performanceQueries.length} Performance review records inserted.`);

    console.log('\n=============================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(` Elapsed Time: ${parseFloat(((Date.now() - startTime) / 1000).toFixed(2))} seconds`);
    console.log('=============================================\n');

  } catch (error) {
    console.error('CRITICAL: Error seeding database:', error);
  }
}

seed();
