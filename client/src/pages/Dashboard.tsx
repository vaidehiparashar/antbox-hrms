import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Calendar, TrendingUp } from 'lucide-react';
import api from '../api/axios';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data?.data || null);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Load fallback empty structure
        setStats({
          kpis: { totalEmployees: 0, activeInterns: 0, openLeaves: 0, pendingMails: 0 },
          recentActivity: [],
          announcements: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-text-secondary">Loading dashboard...</div>;
  }

  const kpis = stats?.kpis || {};
  const kpiCards = [
    { title: 'Total Employees', value: kpis.totalEmployees || 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Active Interns', value: kpis.activeInterns || 0, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Open Leaves', value: kpis.openLeaves || 0, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Pending Mails', value: kpis.pendingMails || 0, icon: Mail, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Overview</h1>
          <p className="text-text-secondary text-sm mt-1">Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-2xl p-6 relative overflow-hidden group"
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${card.bg} blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-text-secondary text-sm font-medium mb-1">{card.title}</p>
                <h3 className="text-3xl font-heading font-bold text-white">{card.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-heading font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {stats?.recentActivity?.length > 0 ? stats.recentActivity.map((log: any) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-surface-hover/50 transition-colors">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary"></div>
                <div>
                  <p className="text-sm text-white"><span className="capitalize">{log.action}</span> on {log.target_table} (ID: {log.target_id})</p>
                  <p className="text-xs text-text-secondary">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )) : <p className="text-text-secondary text-sm">No recent activity.</p>}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-heading font-semibold text-white mb-4">Announcements</h3>
          <div className="space-y-4">
            {stats?.announcements?.length > 0 ? stats.announcements.map((ann: any) => (
              <div key={ann.id} className="p-4 rounded-xl bg-surface-hover/30 border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-semibold text-white">{ann.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded border ${ann.priority === 'Important' ? 'border-danger/30 text-danger bg-danger/10' : 'border-primary/30 text-primary bg-primary/10'}`}>
                    {ann.priority}
                  </span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2">{ann.body}</p>
              </div>
            )) : <p className="text-text-secondary text-sm">No announcements.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
