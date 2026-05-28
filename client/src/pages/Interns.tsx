import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, UserPlus, GraduationCap, Calendar, DollarSign, Award, X, AlertCircle } from 'lucide-react';

const Interns: React.FC = () => {
  const { user } = useAuth();
  const [interns, setInterns] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<any>(null);

  // Add Intern Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [deptId, setDeptId] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [project, setProject] = useState('');
  const [stipend, setStipend] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Convert Intern Form State
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [contractType, setContractType] = useState('Permanent');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [internsRes, empRes, deptRes] = await Promise.all([
        api.get('/interns'),
        api.get('/employees'),
        api.get('/departments')
      ]);
      setInterns(internsRes.data.data);
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
      console.error('Failed to load interns data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name, email, college, 
        dept_id: deptId ? parseInt(deptId) : null, 
        mentor_id: mentorId ? parseInt(mentorId) : null, 
        project, 
        stipend: stipend ? parseFloat(stipend) : 0, 
        start_date: startDate, 
        end_date: endDate, 
        notes
      };

      await api.post('/interns', payload);
      setIsAddModalOpen(false);
      // Reset form
      setName(''); setEmail(''); setCollege(''); setDeptId(''); setMentorId(''); setProject(''); setStipend(''); setStartDate(''); setEndDate(''); setNotes('');
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add intern. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIntern = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this intern? This action cannot be undone.')) return;
    try {
      await api.delete(`/interns/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete intern:', err);
      alert('Error deleting intern request');
    }
  };

  const handleConvertIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload = {
        designation,
        salary: parseFloat(salary),
        employment_type: employmentType,
        contract_type: contractType
      };

      await api.put(`/interns/${selectedIntern.id}/convert`, payload);
      setIsConvertModalOpen(false);
      setSelectedIntern(null);
      setDesignation('');
      setSalary('');
      fetchData();
      alert('Intern successfully converted to Full-Time employee! Welcome email sent.');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to convert intern.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInterns = interns.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.email.toLowerCase().includes(search.toLowerCase()) ||
    (i.college && i.college.toLowerCase().includes(search.toLowerCase())) ||
    (i.project && i.project.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Internship Roster</h1>
          <p className="text-text-secondary text-sm mt-1">Track company interns, mentors, and conversions.</p>
        </div>
        
        {user?.role !== 'Employee' && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-primary/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Intern
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
        <input 
          type="text" 
          placeholder="Search by name, college, email, or project..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-surface border border-white/5 rounded-xl text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 text-text-secondary">Loading interns roster...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInterns.map((intern, index) => (
            <motion.div
              key={intern.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-white">{intern.name}</h3>
                    <p className="text-text-secondary text-xs">{intern.email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${intern.status === 'active' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-success/10 text-success border border-success/20'}`}>
                    {intern.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-text-secondary">
                    <GraduationCap className="w-4 h-4 mr-2 text-text-secondary/70" />
                    <span>{intern.college || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <Award className="w-4 h-4 mr-2 text-text-secondary/70" />
                    <span>Project: <strong className="text-white">{intern.project || 'None'}</strong></span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <DollarSign className="w-4 h-4 mr-2 text-text-secondary/70" />
                    <span>Stipend: <strong className="text-white">INR {intern.stipend?.toLocaleString()} /mo</strong></span>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <Calendar className="w-4 h-4 mr-2 text-text-secondary/70" />
                    <span className="text-xs">
                      {intern.start_date ? new Date(intern.start_date).toLocaleDateString() : 'Start'} - {intern.end_date ? new Date(intern.end_date).toLocaleDateString() : 'End'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 text-xs text-text-secondary flex justify-between">
                  <span>Mentor: <strong className="text-text-primary">{intern.mentor_name || 'Unassigned'}</strong></span>
                  <span>Dept: <strong className="text-text-primary">{intern.department_name || 'General'}</strong></span>
                </div>
              </div>

              {user?.role !== 'Employee' && (
                <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-white/5">
                  {intern.status === 'active' ? (
                    <button
                      onClick={() => { setSelectedIntern(intern); setIsConvertModalOpen(true); }}
                      className="flex-1 flex items-center justify-center py-2 bg-success hover:bg-success-hover text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" /> Convert
                    </button>
                  ) : (
                    <div className="flex-1 text-center py-2 text-xs font-medium text-success bg-success/5 rounded-lg border border-success/10">
                      Hired Full-Time
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteIntern(intern.id)}
                    className="p-2 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-lg transition-all"
                    title="Delete Intern"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          
          {filteredInterns.length === 0 && (
            <div className="col-span-full text-center py-12 text-text-secondary">No interns matched your query.</div>
          )}
        </div>
      )}

      {/* Add Intern Modal */}
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
                <h2 className="text-xl font-heading font-bold text-white">Add New Intern</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-text-secondary hover:text-white rounded-lg hover:bg-surface-hover">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-danger/10 border border-danger/20 text-danger p-3 rounded-lg mt-4 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" /> {formError}
                </div>
              )}

              <form onSubmit={handleAddIntern} className="overflow-y-auto py-4 space-y-4 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/55" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Email Address *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/55" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">College/University</label>
                    <input type="text" value={college} onChange={(e) => setCollege(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/55" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Project Name</label>
                    <input type="text" value={project} onChange={(e) => setProject(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/55" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Department</label>
                    <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/55">
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Mentor (Employee)</label>
                    <select value={mentorId} onChange={(e) => setMentorId(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/55">
                      <option value="">Select Mentor</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Stipend (INR/mo)</label>
                    <input type="number" value={stipend} onChange={(e) => setStipend(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/55" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/55" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/55" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Internship Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/55" placeholder="Achievements, comments..."></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-surface hover:bg-surface-hover border border-white/5 rounded-xl text-sm text-white">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold flex items-center">
                    {isSubmitting ? 'Adding...' : 'Add Intern'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Convert Intern Modal */}
      <AnimatePresence>
        {isConvertModalOpen && selectedIntern && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <h2 className="text-xl font-heading font-bold text-white">Convert to Full-Time</h2>
                <button onClick={() => setIsConvertModalOpen(false)} className="p-1 text-text-secondary hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-text-primary">
                Converting <strong className="text-white">{selectedIntern.name}</strong> will create a new Employee portal profile and email credentials details.
              </div>

              {formError && (
                <div className="bg-danger/10 border border-danger/20 text-danger p-3 rounded-lg mt-4 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleConvertIntern} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Corporate Designation *</label>
                  <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} required placeholder="e.g. Software Engineer" className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Annual CTC Salary (INR) *</label>
                  <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} required placeholder="e.g. 500000" className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Employment Type</label>
                    <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Contract Type</label>
                    <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary">
                      <option value="Permanent">Permanent</option>
                      <option value="Probationary">Probationary</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setIsConvertModalOpen(false)} className="px-4 py-2 bg-surface hover:bg-surface-hover border border-white/5 rounded-xl text-sm text-white">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-success hover:bg-success-hover text-white rounded-xl text-sm font-semibold">
                    {isSubmitting ? 'Converting...' : 'Hire Employee'}
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

export default Interns;
