import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Check, X, Archive, Calendar, User, Inbox, FolderArchive } from 'lucide-react';

const Mails: React.FC = () => {
  const { user } = useAuth();
  const [mails, setMails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMail, setActiveMail] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchMails = async () => {
    setLoading(true);
    try {
      const response = await api.get('/mails');
      setMails(response.data.data);
      if (response.data.data.length > 0) {
        setActiveMail(response.data.data[0]); // default to first mail
      }
    } catch (err) {
      console.error('Failed to load mails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMails();
  }, []);

  const handleAccept = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(id);
    try {
      await api.put(`/mails/${id}/accept`);
      // Update local state
      setMails(prev => prev.map(m => m.id === id ? { ...m, status: 'accepted' } : m));
      if (activeMail && activeMail.id === id) {
        setActiveMail((prev: any) => ({ ...prev, status: 'accepted' }));
      }
      alert('Inquiry accepted successfully! Confirmation email dispatched to sender.');
    } catch (err) {
      console.error('Failed to accept mail:', err);
      alert('Error accepting inquiry.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(id);
    try {
      await api.put(`/mails/${id}/reject`);
      // Update local state
      setMails(prev => prev.map(m => m.id === id ? { ...m, status: 'rejected' } : m));
      if (activeMail && activeMail.id === id) {
        setActiveMail((prev: any) => ({ ...prev, status: 'rejected' }));
      }
      alert('Inquiry rejected. Rejection email dispatched to sender.');
    } catch (err) {
      console.error('Failed to reject mail:', err);
      alert('Error rejecting inquiry.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleArchive = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Archive this mail item?')) return;
    try {
      // For this HRMS, archiving just marks as read or we delete it from active display
      setMails(prev => prev.filter(m => m.id !== id));
      if (activeMail && activeMail.id === id) {
        setActiveMail(null);
      }
      alert('Mail item archived.');
    } catch (err) {
      console.error('Failed to archive:', err);
    }
  };

  const categories = ['All', 'Payroll', 'HR', 'Support', 'General'];

  const filteredMails = mails.filter(m => {
    if (categoryFilter === 'All') return true;
    return m.category?.toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">HR Inquiry Inbox</h1>
          <p className="text-text-secondary text-sm mt-1">Review internal employees questions, payroll requests, and applications.</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 pb-2 border-b border-white/5 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border ${
              categoryFilter === cat 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10' 
                : 'bg-surface text-text-secondary border-white/5 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 text-text-secondary">Loading inquiries...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[72vh]">
          {/* Inbox Mail List */}
          <div className="lg:col-span-2 glass rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-white/5 bg-surface/20 flex items-center justify-between">
              <span className="text-sm font-semibold text-white flex items-center"><Inbox className="w-4 h-4 mr-2 text-primary" /> Active Inquiries</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">{filteredMails.length} Total</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredMails.map(mail => (
                <div
                  key={mail.id}
                  onClick={() => setActiveMail(mail)}
                  className={`p-4 cursor-pointer hover:bg-white/[0.02] transition-colors relative ${
                    activeMail && activeMail.id === mail.id ? 'bg-white/[0.03]' : ''
                  }`}
                >
                  {/* Unread indicator */}
                  {mail.status === 'unread' && (
                    <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  )}
                  
                  <div className="space-y-1.5 pl-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white line-clamp-1">{mail.sender_name}</span>
                      <span className="text-[10px] text-text-secondary shrink-0">{new Date(mail.received_at).toLocaleDateString()}</span>
                    </div>
                    
                    <h4 className="text-sm font-semibold text-text-primary line-clamp-1">{mail.subject}</h4>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-white/5 text-text-secondary font-medium">
                        {mail.category}
                      </span>
                      <span className={`text-[10px] font-semibold capitalize ${
                        mail.status === 'accepted' ? 'text-success' : mail.status === 'rejected' ? 'text-danger' : 'text-primary'
                      }`}>
                        {mail.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredMails.length === 0 && (
                <p className="text-text-secondary text-sm text-center py-12">No mail matches this category.</p>
              )}
            </div>
          </div>

          {/* Mail Content Reader */}
          <div className="lg:col-span-3 glass rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full bg-surface/10">
            {activeMail ? (
              <div className="p-6 flex flex-col justify-between h-full">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-4">
                    <div className="space-y-1.5">
                      <h2 className="text-lg font-heading font-bold text-white">{activeMail.subject}</h2>
                      <div className="flex items-center text-xs text-text-secondary gap-4">
                        <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1 text-primary/70" /> {activeMail.sender_name} ({activeMail.sender_email})</span>
                        <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-primary/70" /> {new Date(activeMail.received_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary font-semibold capitalize">
                      {activeMail.category} Inquiry
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="text-sm text-text-primary leading-relaxed bg-surface/20 border border-white/5 p-4 rounded-xl max-h-[35vh] overflow-y-auto whitespace-pre-line">
                    {activeMail.body}
                  </div>
                </div>

                {/* Accept/Reject Operations */}
                {user?.role !== 'Employee' && (
                  <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/5 mt-auto">
                    {activeMail.status === 'unread' || activeMail.status === 'read' ? (
                      <div className="flex gap-3 flex-1">
                        <button
                          onClick={(e) => handleAccept(activeMail.id, e)}
                          disabled={processingId === activeMail.id}
                          className="flex-1 flex items-center justify-center py-2.5 bg-success hover:bg-success-hover text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-success/15 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 mr-1.5" /> Accept Inquiry
                        </button>
                        <button
                          onClick={(e) => handleReject(activeMail.id, e)}
                          disabled={processingId === activeMail.id}
                          className="flex-1 flex items-center justify-center py-2.5 bg-danger hover:bg-danger-hover text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-danger/15 disabled:opacity-50"
                        >
                          <X className="w-4 h-4 mr-1.5" /> Reject Inquiry
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 text-center py-2.5 rounded-xl border text-xs font-bold capitalize bg-surface-hover/30 border-white/5">
                        Status: <span className={activeMail.status === 'accepted' ? 'text-success' : 'text-danger'}>{activeMail.status}</span> (Transaction complete)
                      </div>
                    )}

                    <button
                      onClick={(e) => handleArchive(activeMail.id, e)}
                      className="p-2.5 bg-surface hover:bg-surface-hover border border-white/5 rounded-xl text-text-secondary hover:text-white transition-all"
                      title="Archive Inquiry"
                    >
                      <Archive className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary text-sm">
                <FolderArchive className="w-12 h-12 text-text-secondary/50 mb-3 animate-bounce" />
                Select an inquiry from the roster list to read and process.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mails;
