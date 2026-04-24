import { LayoutDashboard, History, UploadCloud, Calendar, ChevronRight, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export function StudentSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { id: 'overview', path: '/dashboard', label: 'Project Overview', icon: LayoutDashboard },
    { id: 'milestones', path: '/dashboard/milestones', label: 'Review Milestones', icon: CheckSquare },
    { id: 'history', path: '/dashboard/history', label: 'Version History', icon: History },
    { id: 'uploads', path: '/dashboard/uploads', label: 'File Uploads', icon: UploadCloud },
    { id: 'meetings', path: '/dashboard/meetings', label: 'Scheduled Meetings', icon: Calendar },
  ];

  return (
    <div className="flex flex-col gap-2 mt-6">
      <div className="px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        Student Workspace
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
                  layoutId="student-active-nav-indicator"
                  className="absolute inset-0 bg-cobalt/20 rounded-xl border border-cobalt/30"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
    </div>
  );
}
