import { Users, FileCheck, Calendar, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export function StaffSidebar() {
  const { profile } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { id: 'overview', path: '/dashboard', label: 'Team Overview', icon: Users },
    { id: 'reviews', path: '/dashboard/staff-reviews', label: 'Submission Reviews', icon: FileCheck },
    { id: 'meetings', path: '/dashboard/staff-meetings', label: 'Meeting Schedules', icon: Calendar },
  ];

  return (
    <div className="flex flex-col gap-2 mt-6">
      <div className="px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        Staff Controls
      </div>

      {navItems.map((item) => {
        const isActive = item.path === '/dashboard'
          ? currentPath === '/dashboard' || currentPath === '/dashboard/'
          : currentPath.startsWith(item.path);
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            to={item.path}
            className={`relative flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all ${
              isActive
                ? 'bg-cobalt/10 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="staff-active-nav-indicator"
                  className="absolute inset-0 bg-cobalt/20 rounded-xl border border-cobalt/30"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </AnimatePresence>

            <div className="relative z-10 flex items-center gap-3">
              <Icon size={18} className={isActive ? 'text-cobalt-light' : ''} />
              <span className="font-medium text-sm">{item.label}</span>
            </div>

            {isActive && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative z-10 text-cobalt-light"
              >
                <ChevronRight size={16} />
              </motion.div>
            )}
          </Link>
        );
      })}

      {profile?.role === 'admin' && (
        <>
          <div className="px-4 mt-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Admin Workspace
          </div>
          <Link
            to="/admin"
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 border border-transparent hover:border-purple-500/30"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} />
              <span className="font-medium text-sm">Admin Portal</span>
            </div>
            <ChevronRight size={16} />
          </Link>
        </>
      )}
    </div>
  );
}
