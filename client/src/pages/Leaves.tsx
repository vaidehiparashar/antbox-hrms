import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Calendar, AlertCircle } from 'lucide-react';

const Leaves: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leaves');
      setLeaves(response.data.data);
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm('Are you sure you want to APPROVE this leave request?')) return;
    try {
      await api.put(`/leaves/${id}/approve`);
      fetchLeaves();
      alert('Leave request approved! Notification email sent.');
    } catch (err) {
      console.error('Failed to approve leave:', err);
      alert('Error approving leave.');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason) {
      alert('Rejection reason is required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/leaves/${selectedLeave.id}/reject`, { reason: rejectionReason });
      setRejectModalOpen(false);
      setSelectedLeave(null);
      setRejectionReason('');
      fetchLeaves();
      alert('Leave request rejected! Notification email sent.');
    } catch (err) {
      console.error('Failed to reject leave:', err);
      alert('Error rejecting leave.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const approvedLeaves = leaves.filter(l => l.status === 'approved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white">Leaves Management</h1>
        <p className="text-text-secondary text-sm mt-1">Review leave applications, manage allocations, and track calendar absences.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 text-text-secondary">Loading leave requests...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Leave Requests */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-heading font-semibold text-white mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-amber-500" /> Pending Requests
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-text-secondary uppercase">
                      <th className="pb-3 font-medium">Employee Name</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Dates</th>
                      <th className="pb-3 font-medium">Reason</th>
                      {user?.role !== 'Employee' && <th className="pb-3 font-medium text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-text-primary">
                    {pendingLeaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 font-medium text-white flex items-center">
                          <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center font-bold text-xs text-primary mr-2">
                            {leave.employee_name?.charAt(0)}
                          </div>
                          {leave.employee_name}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded text-xs bg-surface-hover border border-white/10 text-white font-medium">
                            {leave.type}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs">
                          {new Date(leave.from_date).toLocaleDateString()} - {new Date(leave.to_date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-xs text-text-secondary max-w-xs truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        {user?.role !== 'Employee' && (
                          <td className="py-3.5 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApprove(leave.id)}
                                className="p-1.5 bg-success/20 hover:bg-success text-success hover:text-white rounded-lg transition-all"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedLeave(leave); setRejectModalOpen(true); }}
                                className="p-1.5 bg-danger/20 hover:bg-danger text-danger hover:text-white rounded-lg transition-all"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {pendingLeaves.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-text-secondary">No pending leave requests.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Leave Calendar View */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-heading font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" /> Leave Calendar (Approved)
              </h3>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {approvedLeaves.map((leave) => (
                  <div key={leave.id} className="p-4 rounded-xl bg-surface-hover/30 border border-white/5 flex items-start space-x-3">
                    <div className="w-8 h-8 bg-success/15 border border-success/30 rounded-xl flex items-center justify-center font-bold text-success text-sm shrink-0">
                      {leave.employee_name?.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-white">{leave.employee_name}</h4>
                      <p className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 border border-success/20 text-success inline-block font-medium">
                        {leave.type} Leave
                      </p>
                      <p className="text-xs text-text-secondary mt-1 flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-primary" />
                        {new Date(leave.from_date).toLocaleDateString()} to {new Date(leave.to_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {approvedLeaves.length === 0 && (
                  <p className="text-text-secondary text-sm text-center py-6">No approved leaves active at this time.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Leave Request Modal */}
      <AnimatePresence>
        {rejectModalOpen && selectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <h2 className="text-lg font-heading font-bold text-white">Reject Leave Request</h2>
                <button onClick={() => { setRejectModalOpen(false); setSelectedLeave(null); }} className="p-1 text-text-secondary hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger">
                Please enter a reason for rejecting <strong className="text-white">{selectedLeave.employee_name}</strong>'s request. This comment will be emailed to the employee.
              </div>

              <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Reason for Rejection *</label>
                  <textarea
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-background border border-white/5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-danger/55"
                    placeholder="Enter reason (e.g. Project critical requirements, shortage of team members...)"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => { setRejectModalOpen(false); setSelectedLeave(null); }} className="px-4 py-2 bg-surface hover:bg-surface-hover border border-white/5 rounded-xl text-sm text-white">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-danger hover:bg-danger-hover text-white rounded-xl text-sm font-semibold">
                    {submitting ? 'Rejecting...' : 'Reject Request'}
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

export default Leaves;
