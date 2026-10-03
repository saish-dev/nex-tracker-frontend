
import React from 'react';
import { NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context';
import { 
  LayoutDashboard, 
  Clock, 
  LogOut, 
  Menu, 
  Shield,
  Settings,
  FileBarChart
} from 'lucide-react';
import { UserRole } from '../types';
import { cn } from '../utils';

const SidebarLink = ({ to, icon: Icon, children }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150',
          isActive
            ? 'bg-white/15 text-white'
            : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
        )
      }
    >
      <Icon className="mr-3 h-4.5 w-4.5 flex-shrink-0 opacity-80 group-hover:opacity-100" />
      <span>{children}</span>
    </NavLink>
  );
};

export const Layout = ({ children }) => {
  const { state, dispatch } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Work Status Dashboard';
      case '/worklogs': return 'Work Logs & Timesheet';
      case '/reports': return 'Reports';
      case '/settings': return 'System Settings';
      default: return 'Work Tracker';
    }
  };

  const hasPermission = (permission) => {
    return state.auth.user?.role === UserRole.ADMIN || state.auth.permissions.includes(permission);
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <div className="app-shell h-screen overflow-hidden bg-slate-50 flex font-sans text-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "print:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:flex-col border-r border-white/5",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Zone */}
        <div className="flex items-center h-16 flex-shrink-0 px-5 border-b border-white/10">
          <div className="p-1.5 rounded-xl mr-3 bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-sm shadow-black/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-base font-bold text-white tracking-tight block leading-tight font-display">
              NexTracker
            </span>
            <span className="text-[10px] font-mono tracking-wider block text-emerald-100/60">
              Enterprise Work Hub
            </span>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto px-3.5 py-5 space-y-5">
          <div>
            <div className="text-[11px] font-semibold text-emerald-100/50 tracking-wider uppercase px-2 mb-2">Tracking</div>
            <nav className="space-y-1">
              <SidebarLink to="/" icon={LayoutDashboard}>Dashboard</SidebarLink>
              <SidebarLink to="/worklogs" icon={Clock}>Work Logs</SidebarLink>
              {(state.auth.user?.role === UserRole.ADMIN || state.auth.user?.role === UserRole.MANAGER) && (
                <SidebarLink to="/reports" icon={FileBarChart}>Reports</SidebarLink>
              )}
            </nav>
          </div>

          {hasPermission('manage_settings') && (
            <div>
              <div className="text-[11px] font-semibold text-emerald-100/50 tracking-wider uppercase px-2 mb-2">Administration</div>
              <nav className="space-y-1">
                <SidebarLink to="/settings" icon={Settings}>Settings</SidebarLink>
              </nav>
            </div>
          )}
        </div>

        {/* User Footer Profile */}
        <div className="flex-shrink-0 p-3 m-3 rounded-2xl bg-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0">
                <img 
                  className="h-8 w-8 rounded-full ring-2 ring-white/20 object-cover" 
                  src={state.auth.user?.avatarUrl} 
                  alt="" 
                />
              </div>
              <div className="ml-2.5 min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{state.auth.user?.name}</p>
                <p className="text-[10px] font-medium text-emerald-100/60 capitalize truncate">
                  {state.auth.user?.role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="ml-2 p-1.5 rounded-lg text-emerald-100/60 hover:text-rose-300 hover:bg-white/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="print:hidden bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Breadcrumb Trail */}
            <div className="flex items-center text-xs text-slate-500">
              <span className="font-medium text-slate-400">NexTracker</span>
              <span className="mx-2 text-slate-300">/</span>
              <h1 className="text-sm font-semibold text-slate-900 truncate">{getPageTitle()}</h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Today Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayFormatted}</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="app-main flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export const ProtectedRoute = ({ children }) => {
  const { state } = useAppContext();
  
  if (!state.auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};
