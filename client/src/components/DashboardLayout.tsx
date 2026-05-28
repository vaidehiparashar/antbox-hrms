import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, GraduationCap, Mail, Calendar, Fingerprint, Banknote, 
  Building2, Award, Megaphone, FileText, Settings, LogOut, Bell, Menu, Search 
} from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Employees', icon: Users, path: '/employees' },
    { name: 'Interns', icon: GraduationCap, path: '/interns' },
    { name: 'Mails', icon: Mail, path: '/mails' },
    { name: 'Leaves', icon: Calendar, path: '/leaves' },
    { name: 'Attendance', icon: Fingerprint, path: '/attendance' },
    { name: 'Payroll', icon: Banknote, path: '/payroll' },
    { name: 'Departments', icon: Building2, path: '/departments' },
    { name: 'Performance', icon: Award, path: '/performance' },
    { name: 'Announcements', icon: Megaphone, path: '/announcements' },
    { name: 'Documents', icon: FileText, path: '/documents' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-surface border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col z-20`}
      >
        <div className="h-16 flex items-center justify-center border-b border-white/5">
          {isSidebarOpen ? (
            <h1 className="text-xl font-heading font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">
              Enterprise HRMS
            </h1>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold">E</div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center px-3 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-text-secondary hover:bg-surface-hover hover:text-white'
                }`
              }
            >
              <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
              {isSidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-3 rounded-xl text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors group"
          >
            <LogOut className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'} group-hover:text-danger`} />
            {isSidebarOpen && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-surface/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-4 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Search employees, documents..." 
                className="pl-10 pr-4 py-2 bg-background border border-white/5 rounded-full text-sm text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 rounded-full text-text-secondary hover:bg-surface-hover hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3 border-l border-white/10 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-text-secondary capitalize">{user?.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
