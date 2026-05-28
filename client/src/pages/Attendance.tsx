import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Fingerprint, Search, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionProcessingId, setActionProcessingId] = useState<number | null>(null);

  const fetchTodayAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance/today');
      setRoster(response.data.data);
    } catch (err) {
      console.error('Failed to load today attendance roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const handleTapIn = async (employeeId: number) => {
    setActionProcessingId(employeeId);
    try {
      await api.post(`/attendance/tapin/${employeeId}`);
      fetchTodayAttendance();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error tapping in employee');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleTapOut = async (employeeId: number) => {
    setActionProcessingId(employeeId);
    try {
      await api.post(`/attendance/tapout/${employeeId}`);
      fetchTodayAttendance();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error tapping out employee');
    } finally {
      setActionProcessingId(null);
    }
  };

  // Check if tap in is late (> 09:30 AM)
  const isLate = (tapInTime: string | null) => {
    if (!tapInTime) return false;
    const timePart = tapInTime.split(' ')[1]; // HH:MM:SS
    if (!timePart) return false;
    const [hour, min] = timePart.split(':').map(Number);
    const checkMin = hour * 60 + min;
    const lateThreshold = 9 * 60 + 30; // 09:30 AM
    return checkMin > lateThreshold;
  };

  const filteredRoster = roster.filter(r => 
    r.employee_name.toLowerCase().includes(search.toLowerCase()) || 
    r.designation.toLowerCase().includes(search.toLowerCase()) ||
    (r.department_name && r.department_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Daily Roster & Attendance</h1>
          <p className="text-text-secondary text-sm mt-1">Punch attendance logs, check in/out times, and review working hours.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
        <input 
          type="text" 
          placeholder="Search employees by name, designation, dept..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 text-text-secondary">Loading today's roster feed...</div>
      ) : (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-surface/20 flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center"><Fingerprint className="w-4 h-4 mr-2 text-primary" /> Today's Roster Logs</span>
            <span className="text-xs text-text-secondary">Date: {new Date().toLocaleDateString()}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs text-text-secondary uppercase bg-surface/10">
                  <th className="p-4 font-medium">Employee Name</th>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Tap In</th>
                  <th className="p-4 font-medium">Tap Out</th>
                  <th className="p-4 font-medium">Total Hours</th>
                  <th className="p-4 font-medium">Status Badge</th>
                  {user?.role !== 'Employee' && <th className="p-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-text-primary">
                {filteredRoster.map((emp) => {
                  const late = isLate(emp.tap_in);
                  
                  // Compute color status class
                  let statusClass = 'bg-danger/10 text-danger border-danger/20';
                  let statusLabel = 'Absent';

                  if (emp.status === 'Present') {
                    if (late) {
                      statusClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                      statusLabel = 'Late Entry';
                    } else {
                      statusClass = 'bg-success/10 text-success border-success/20';
                      statusLabel = 'Present';
                    }
                  } else if (emp.status === 'Leave') {
                    statusClass = 'bg-primary/10 text-primary border-primary/20';
                    statusLabel = 'On Leave';
                  }

                  return (
                    <tr key={emp.employee_id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 font-medium text-white flex items-center">
                        <div className="w-8 h-8 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center font-bold text-xs text-primary mr-3">
                          {emp.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{emp.employee_name}</p>
                          <p className="text-[10px] text-text-secondary">{emp.designation}</p>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-text-secondary">
                        {emp.department_name || 'General'}
                      </td>
                      <td className="p-4 text-xs font-mono text-text-secondary">
                        {emp.tap_in ? emp.tap_in.split(' ')[1] : '--:--:--'}
                      </td>
                      <td className="p-4 text-xs font-mono text-text-secondary">
                        {emp.tap_out ? emp.tap_out.split(' ')[1] : '--:--:--'}
                      </td>
                      <td className="p-4 text-xs font-mono font-semibold text-white">
                        {emp.total_hours ? `${emp.total_hours} hrs` : '0.00 hrs'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded border font-semibold ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      
                      {user?.role !== 'Employee' && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {/* Tap In Button */}
                            {!emp.tap_in && emp.status !== 'Leave' && (
                              <button
                                onClick={() => handleTapIn(emp.employee_id)}
                                disabled={actionProcessingId === emp.employee_id}
                                className="flex items-center px-2 py-1 bg-success hover:bg-success-hover text-white text-[10px] font-semibold rounded transition-colors disabled:opacity-50"
                              >
                                <LogIn className="w-3 h-3 mr-1" /> Tap In
                              </button>
                            )}

                            {/* Tap Out Button */}
                            {emp.tap_in && !emp.tap_out && (
                              <button
                                onClick={() => handleTapOut(emp.employee_id)}
                                disabled={actionProcessingId === emp.employee_id}
                                className="flex items-center px-2 py-1 bg-primary hover:bg-primary-hover text-white text-[10px] font-semibold rounded transition-colors disabled:opacity-50"
                              >
                                <LogOut className="w-3 h-3 mr-1" /> Tap Out
                              </button>
                            )}
                            
                            {emp.tap_out && (
                              <span className="text-[10px] text-text-secondary font-medium flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-success" /> Tapped Out
                              </span>
                            )}
                            
                            {emp.status === 'Leave' && (
                              <span className="text-[10px] text-text-secondary/70 italic">Leave Authorized</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredRoster.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-text-secondary">No employees matched your filter query.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
