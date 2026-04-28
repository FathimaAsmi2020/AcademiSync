import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const { user } = useAuth();

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed w-full top-0 z-50 p-4"
    >
      <div className="max-w-7xl mx-auto glass px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cobalt-light to-cobalt flex items-center justify-center">
            <GraduationCap className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold text-slate tracking-tight">Academi<span className="text-cobalt-light">Sync</span></span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link to="/gallery" className="hover:text-white transition-colors">Project Gallery</Link>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#gate" className="hover:text-white transition-colors text-nowrap">Academic Gate</a>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard" className="px-6 py-2 rounded-lg bg-cobalt text-white font-medium hover:bg-cobalt-light transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-2 text-slate/90 hover:text-white transition-colors px-4 py-2 font-medium">
                <LogIn size={18} />
                Sign In
              </Link>
              <Link to="/register" className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cobalt text-white font-medium hover:bg-cobalt-light transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                <UserPlus size={18} />
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
