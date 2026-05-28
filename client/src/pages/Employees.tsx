import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, User, Mail, Calendar, X, AlertCircle, Eye, Phone, MapPin } from 'lucide-react';

const Employees: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  // Add Employee Form (Multi-Step wizard)
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Personal
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const password = 'password123'; // default password
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Step 2: Job
  const [deptId, setDeptId] = useState('');
  const [designation, setDesignation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [contractType, setContractType] = useState('Permanent');
  const [joiningDate, setJoiningDate] = useState('');

  // Step 3: Salary & Bank
  const [salary, setSalary] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');

  // Termination State
  const [exitReason, setExitReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments')
      ]);
      setEmployees(empRes.data.data);
      
      if (deptRes.data?.data) {
        setDepartments(deptRes.data.data);
      } else {
        setDepartments([
          { id: 1, name: 'Engineering' },
          { id: 2, name: 'Sales' },
          { id: 3, name: 'Marketing' },
          { id: 4, name: 'HR' },
          { id: 5, name: 'Finance' },
          { id: 6, name: 'Operations' }
        ]);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNextStep = () => {
    if (step === 1) {
      if (!name || !email || !phone) {
        setFormError('Please fill out all mandatory personal fields (Name, Email, Phone).');
        return;
      }
    }
    if (step === 2) {
      if (!deptId || !designation || !joiningDate) {
        setFormError('Please fill out all mandatory job fields (Department, Designation, Joining Date).');
        return;
      }
    }
    if (step === 3) {
      if (!salary) {
        setFormError('Salary details are mandatory.');
        return;
      }
    }
    setFormError('');
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setFormError('');
    setStep(prev => prev - 1);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name, email, password, role: deptId === '4' ? 'HR Manager' : 'Employee',
        dept_id: parseInt(deptId),
        designation, phone, address, dob, gender,
        joining_date: joiningDate,
        employment_type: employmentType,
        contract_type: contractType,
        salary: parseFloat(salary),
        bank_account: bankAccount,
        ifsc
      };

      await api.post('/employees', payload);
      setIsAddModalOpen(false);
      // Reset form
      setStep(1);
      setName(''); setEmail(''); setDob(''); setPhone(''); setAddress(''); setDeptId(''); setDesignation(''); setSalary(''); setBankAccount(''); setIfsc('');
      fetchData();
      alert('Employee onboarded successfully! Welcome credentials email dispatched.');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTerminateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitReason) {
      alert('Exit reason is required.');
      return;
    }

    try {
      await api.delete(`/employees/${selectedEmployee.id}`, { data: { exit_reason: exitReason } });
      setIsDeleteModalOpen(false);
      setSelectedEmployee(null);
      setExitReason('');
      fetchData();
      alert('Employee profile soft-deleted and login disabled.');
    } catch (err) {
      console.error('Failed to terminate:', err);
      alert('Error terminating employee.');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase());
    
    const matchesDept = selectedDept ? emp.dept_id.toString() === selectedDept : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Employee Directory</h1>
          <p className="text-text-secondary text-sm mt-1">Manage official enterprise active/terminated employee records.</p>
        </div>
        
        {user?.role !== 'Employee' && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-primary/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Employee
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-surface/30 p-4 border border-white/5 rounded-2xl">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search by name, email, designation..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none"
          />
        </div>
        
        <select 
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-4 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none w-full md:w-56"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 text-text-secondary">Loading employees profiles...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp, index) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center font-bold text-primary text-xl">
                    {emp.photo_path ? (
                      <img src={emp.photo_path} alt={emp.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      emp.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-heading font-bold text-white line-clamp-1">{emp.name}</h3>
                    <p className="text-xs text-text-secondary line-clamp-1">{emp.designation}</p>
                    <span className={`inline-block text-[10px] px-2 py-0.5 mt-1 rounded-full font-medium ${emp.status === 'active' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                      {emp.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-text-secondary pt-3 border-t border-white/5">
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <strong className="text-white">{emp.department_name || 'General'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <strong className="text-white">{emp.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>CTC Salary:</span>
                    <strong className="text-white">INR {emp.salary?.toLocaleString()} /yr</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-white/5">
                <button
                  onClick={() => { setSelectedEmployee(emp); setIsProfileModalOpen(true); }}
                  className="flex-1 flex items-center justify-center py-2 bg-surface hover:bg-surface-hover border border-white/5 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Profile
                </button>

                {user?.role !== 'Employee' && emp.status === 'active' && (
                  <button
                    onClick={() => { setSelectedEmployee(emp); setIsDeleteModalOpen(true); }}
                    className="p-2 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-lg transition-all"
                    title="Terminate / Soft Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          
          {filteredEmployees.length === 0 && (
            <div className="col-span-full text-center py-12 text-text-secondary">No employees matched your criteria.</div>
          )}
        </div>
      )}

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {isProfileModalOpen && selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
                <h2 className="text-xl font-heading font-bold text-white">Employee Profile</h2>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-1 text-text-secondary hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center font-bold text-primary text-3xl">
                  {selectedEmployee.photo_path ? (
                    <img src={selectedEmployee.photo_path} alt={selectedEmployee.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    selectedEmployee.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-white">{selectedEmployee.name}</h3>
                  <p className="text-text-secondary text-sm">{selectedEmployee.designation}</p>
                  <p className="text-text-secondary text-xs mt-0.5">{selectedEmployee.department_name || 'General'} Department</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm pb-6 border-b border-white/5">
                <div>
                  <p className="text-xs text-text-secondary">Email Address</p>
                  <p className="text-white font-medium flex items-center mt-1"><Mail className="w-3.5 h-3.5 mr-1 text-primary/70" /> {selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Phone Number</p>
                  <p className="text-white font-medium flex items-center mt-1"><Phone className="w-3.5 h-3.5 mr-1 text-primary/70" /> {selectedEmployee.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Birth Date</p>
                  <p className="text-white font-medium flex items-center mt-1"><Calendar className="w-3.5 h-3.5 mr-1 text-primary/70" /> {selectedEmployee.dob || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Gender</p>
                  <p className="text-white font-medium flex items-center mt-1"><User className="w-3.5 h-3.5 mr-1 text-primary/70" /> {selectedEmployee.gender || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-text-secondary">Residential Address</p>
                  <p className="text-white font-medium flex items-center mt-1"><MapPin className="w-3.5 h-3.5 mr-1 text-primary/70" /> {selectedEmployee.address || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mt-6">
                <div>
                  <p className="text-xs text-text-secondary">Joining Date</p>
                  <p className="text-white font-semibold mt-0.5">{selectedEmployee.joining_date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Employment Type</p>
                  <p className="text-white font-semibold mt-0.5">{selectedEmployee.employment_type || 'N/A'} ({selectedEmployee.contract_type || 'N/A'})</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">CTC Salary</p>
                  <p className="text-white font-semibold mt-0.5">INR {selectedEmployee.salary?.toLocaleString()} /yr</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Bank Details</p>
                  <p className="text-white font-semibold mt-0.5">{selectedEmployee.bank_account ? `A/C: ${selectedEmployee.bank_account}` : 'N/A'}</p>
                  {selectedEmployee.ifsc && <p className="text-text-secondary text-xs mt-0.5">IFSC: {selectedEmployee.ifsc}</p>}
                </div>
              </div>

              {selectedEmployee.status === 'terminated' && (
                <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl mt-6 text-xs">
                  <strong>Termination Details:</strong><br />
                  Exit Date: {selectedEmployee.exit_date}<br />
                  Exit Reason: {selectedEmployee.exit_reason}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Employee wizard */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg p-6 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <h2 className="text-xl font-heading font-bold text-white">Add New Employee</h2>
                <button onClick={() => { setIsAddModalOpen(false); setStep(1); }} className="p-1 text-text-secondary hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Steps Indicator */}
              <div className="flex items-center justify-between mt-4 pb-4 border-b border-white/5 text-xs text-text-secondary">
                <span className={step === 1 ? "text-primary font-bold" : ""}>1. Personal</span>
                <span>➔</span>
                <span className={step === 2 ? "text-primary font-bold" : ""}>2. Job Role</span>
                <span>➔</span>
                <span className={step === 3 ? "text-primary font-bold" : ""}>3. Salary & Bank</span>
                <span>➔</span>
                <span className={step === 4 ? "text-primary font-bold" : ""}>4. Confirm</span>
              </div>

              {formError && (
                <div className="bg-danger/10 border border-danger/20 text-danger p-3 rounded-lg mt-4 text-sm flex items-center">
                  <AlertCircle className="w-4.5 h-4.5 mr-2" /> {formError}
                </div>
              )}

              <div className="overflow-y-auto py-4 pr-1 flex-1">
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white">Step 1: Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name *</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Email Address *</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Phone Number *</label>
                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Birth Date</label>
                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Gender</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none">
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Residential Address</label>
                      <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" placeholder="123 Park St, City..."></textarea>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white">Step 2: Corporate Job details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Department *</label>
                        <select value={deptId} onChange={(e) => setDeptId(e.target.value)} required className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none">
                          <option value="">Select Department</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Designation *</label>
                        <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} required placeholder="e.g. Associate Consultant" className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Employment Type</label>
                        <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none">
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Contract Type</label>
                        <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none">
                          <option value="Permanent">Permanent</option>
                          <option value="Probationary">Probationary</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Joining Date *</label>
                        <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white">Step 3: Compensation & Banking</h3>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Annual CTC Salary (INR) *</label>
                      <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} required placeholder="e.g. 600000" className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Bank Account Number</label>
                        <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="A/C Number" className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">Bank IFSC Code</label>
                        <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="IFSC Code" className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white">Step 4: Confirm Details</h3>
                    <div className="p-4 rounded-xl bg-surface-hover/30 border border-white/5 space-y-2 text-xs">
                      <p className="text-text-secondary">Please verify all data before submitting:</p>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-text-primary">
                        <span>Name: <strong className="text-white">{name}</strong></span>
                        <span>Email: <strong className="text-white">{email}</strong></span>
                        <span>Phone: <strong className="text-white">{phone}</strong></span>
                        <span>Designation: <strong className="text-white">{designation}</strong></span>
                        <span>CTC: <strong className="text-white">INR {parseInt(salary || '0').toLocaleString()}</strong></span>
                        <span>Joining: <strong className="text-white">{joiningDate}</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Nav buttons */}
              <div className="flex justify-between gap-3 pt-4 border-t border-white/5">
                {step > 1 ? (
                  <button type="button" onClick={handlePrevStep} className="px-4 py-2 bg-surface hover:bg-surface-hover border border-white/5 rounded-xl text-sm text-white">Back</button>
                ) : (
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-surface hover:bg-surface-hover border border-white/5 rounded-xl text-sm text-white">Cancel</button>
                )}

                {step < 4 ? (
                  <button type="button" onClick={handleNextStep} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold">Next</button>
                ) : (
                  <button type="button" onClick={handleAddEmployee} disabled={isSubmitting} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold">
                    {isSubmitting ? 'Onboarding...' : 'Confirm & Onboard'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete / Terminate Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <h2 className="text-xl font-heading font-bold text-white">Terminate Employee</h2>
                <button onClick={() => setIsDeleteModalOpen(false)} className="p-1 text-text-secondary hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger">
                Warning: Terminating <strong className="text-white">{selectedEmployee.name}</strong> will update their status to "terminated", set the exit date to today, and disable their portal credentials!
              </div>

              <form onSubmit={handleTerminateEmployee} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Reason for Termination/Exit *</label>
                  <textarea
                    required
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-danger/55"
                    placeholder="Enter reason for retirement, resignation, or termination..."
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-surface hover:bg-surface-hover border border-white/5 rounded-xl text-sm text-white">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-danger hover:bg-danger-hover text-white rounded-xl text-sm font-semibold">
                    Confirm Termination
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Employees;
