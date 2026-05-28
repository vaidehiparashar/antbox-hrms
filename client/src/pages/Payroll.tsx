import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Banknote, Play, Download, CheckCircle, Search, FileText } from 'lucide-react';

const Payroll: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Selection
  const [month, setMonth] = useState('5'); // default May
  const [year, setYear] = useState('2026'); // default 2026

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Payroll History details state
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.data.filter((e: any) => e.status === 'active'));
    } catch (err) {
      console.error('Failed to load employees for payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGeneratePayslip = async (employeeId: number, employeeName: string) => {
    setProcessingId(employeeId);
    try {
      const response = await api.post(`/payroll/generate/${employeeId}`, {
        month: parseInt(month),
        year: parseInt(year)
      }, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthsList[parseInt(month) - 1] || 'May';
      const cleanEmpName = employeeName.replace(/\s+/g, '_');
      
      a.download = `payslip-${cleanEmpName}-${monthName}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`Payslip for ${employeeName} generated and downloaded successfully! An email copy has also been sent.`);

      // If we are currently viewing this employee, reload their history
      if (selectedEmployee && selectedEmployee.id === employeeId) {
        loadHistory(employeeId);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error generating and downloading payslip. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRunBulkPayroll = async () => {
    if (!window.confirm(`Are you sure you want to run bulk payroll calculations for ALL active employees for the month ${month}/${year}? This will generate and stream a ZIP containing all payslip PDFs.`)) return;
    setIsBulkProcessing(true);
    try {
      const response = await api.post('/payroll/run-all', {
        month: parseInt(month),
        year: parseInt(year)
      }, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslips-bulk-${month}-${year}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert(`Bulk payroll calculations complete! ${employees.length} payslips successfully generated, zipped, and downloaded to your computer.`);
      
      if (selectedEmployee) {
        loadHistory(selectedEmployee.id);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error executing bulk payroll and download.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const loadHistory = async (empId: number) => {
    setHistoryLoading(true);
    try {
      const response = await api.get(`/payroll/${empId}`);
      setHistory(response.data.data);
    } catch (err) {
      console.error('Failed to fetch payroll history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewHistory = (emp: any) => {
    setSelectedEmployee(emp);
    loadHistory(emp.id);
  };

  const months = [
    { value: '1', name: 'January' },
    { value: '2', name: 'February' },
    { value: '3', name: 'March' },
    { value: '4', name: 'April' },
    { value: '5', name: 'May' },
    { value: '6', name: 'June' },
    { value: '7', name: 'July' },
    { value: '8', name: 'August' },
    { value: '9', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ];

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    emp.designation.toLowerCase().includes(search.toLowerCase()) ||
    (emp.department_name && emp.department_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Payroll Engine</h1>
          <p className="text-text-secondary text-sm mt-1">Review compensation slabs, run monthly payroll, generate PDFs, and stream email payslips.</p>
        </div>

        {user?.role !== 'Employee' && (
          <button
            onClick={handleRunBulkPayroll}
            disabled={isBulkProcessing || loading}
            className="flex items-center justify-center px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary/20 self-start sm:self-auto disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" /> {isBulkProcessing ? 'Processing Bulk...' : 'Run Bulk Payroll'}
          </button>
        )}
      </div>

      {/* Date Select & Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-surface/30 p-4 border border-white/5 rounded-2xl">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search employees by name, designation..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none"
          />
        </div>
        
        <div className="flex gap-3">
          <select 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none w-36 font-semibold"
          >
            {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
          </select>

          <select 
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-4 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none w-28 font-semibold"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 text-text-secondary">Loading compensation roster...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compensation List */}
          <div className="lg:col-span-2 glass rounded-2xl border border-white/5 overflow-hidden h-[60vh] flex flex-col bg-surface/10">
            <div className="p-4 border-b border-white/5 bg-surface/20 flex items-center justify-between">
              <span className="text-sm font-semibold text-white flex items-center"><Banknote className="w-4 h-4 mr-2 text-primary" /> Employees CTC Slabs</span>
              <span className="text-xs text-text-secondary">{filteredEmployees.length} Active Records</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredEmployees.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => handleViewHistory(emp)}
                  className={`p-4 cursor-pointer hover:bg-white/[0.01] transition-colors flex items-center justify-between ${
                    selectedEmployee && selectedEmployee.id === emp.id ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center font-bold text-xs text-primary">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{emp.name}</h4>
                      <p className="text-[10px] text-text-secondary">{emp.designation} • {emp.department_name || 'General'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Annual CTC</p>
                      <p className="text-xs font-semibold text-white">INR {(emp.salary || 0).toLocaleString()}</p>
                    </div>

                    {user?.role !== 'Employee' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGeneratePayslip(emp.id, emp.name); }}
                        disabled={processingId === emp.id}
                        className="px-2.5 py-1.5 bg-success/20 hover:bg-success text-success hover:text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                      >
                        Generate
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredEmployees.length === 0 && (
                <p className="text-text-secondary text-sm text-center py-12">No active employees found matching query.</p>
              )}
            </div>
          </div>

          {/* Historical Slips Content */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden h-[60vh] flex flex-col bg-surface/10">
            {selectedEmployee ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-white/5 bg-surface/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedEmployee.name}</h3>
                    <p className="text-[10px] text-text-secondary">History & Dispatched Slips</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                    CTC: {(selectedEmployee.salary || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {historyLoading ? (
                    <div className="flex justify-center items-center py-12 text-text-secondary text-xs">Loading payroll history...</div>
                  ) : history.length > 0 ? (
                    history.map(slip => (
                      <div key={slip.id} className="p-3.5 rounded-xl bg-surface-hover/30 border border-white/5 space-y-2 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-white">Month: {months.find(m => m.value === slip.month.toString())?.name} {slip.year}</h4>
                            <p className="text-[10px] text-text-secondary mt-0.5">Net Pay: <strong>INR {slip.net_pay.toLocaleString()}</strong></p>
                          </div>

                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/15 border border-success/20 text-success font-medium flex items-center">
                            <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Dispatched
                          </span>
                        </div>

                        {slip.payslip_path && (
                          <div className="flex gap-2 pt-2 border-t border-white/5">
                            <a
                              href={slip.payslip_path}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 flex items-center justify-center py-1.5 bg-surface hover:bg-surface-hover border border-white/5 rounded text-[10px] font-semibold text-white transition-colors"
                            >
                              <Download className="w-3.5 h-3.5 mr-1 text-primary" /> Download PDF
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-text-secondary text-xs">
                      <FileText className="w-8 h-8 text-text-secondary/50 mb-2" />
                      No payroll logs found for this employee.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary text-sm p-6 text-center">
                <Banknote className="w-12 h-12 text-text-secondary/50 mb-3 animate-pulse" />
                Select an employee from the CTC list to view salary disbursements and download generated PDF payslips.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
