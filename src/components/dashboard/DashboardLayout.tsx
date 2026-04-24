import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import { StaffSidebar } from './StaffSidebar';
import { StudentSidebar } from './StudentSidebar';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-navy text-slate flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 glass border-r border-white/10 p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-bold tracking-tight">Academi<span className="text-cobalt-light">Sync</span></h2>
          <div className="mt-2 text-sm text-slate/60 px-3 py-1 rounded-full bg-white/5 inline-block">
            {profile?.role?.toUpperCase() || 'USER'}
          </div>
        </div>
        
        <nav className="flex-1">
          {/* Staff Navigation */}
          {(profile?.role === 'guide' || profile?.role === 'admin') && <StaffSidebar />}
          
          {/* Student Navigation */}
          {profile?.role === 'student' && <StudentSidebar />}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">{profile?.name || 'Loading...'}</p>
              <p className="text-slate/50 text-xs">{profile?.dept?.toUpperCase()}</p>
            </div>
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate/70 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
