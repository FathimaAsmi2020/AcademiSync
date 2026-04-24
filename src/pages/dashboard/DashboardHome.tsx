import { useState, useEffect } from 'react';
import { AdaptiveDashboard } from '../../components/dashboard/AdaptiveDashboard';
import { GuideDashboard } from '../../components/dashboard/GuideDashboard';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Code, CheckCircle, X, Calendar, Bell } from 'lucide-react';
import type { Project, Profile } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  notes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
}

export function DashboardHome() {
  const { profile, isGuide } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [guide, setGuide] = useState<Profile | null>(null);
  const [showGuideAlert, setShowGuideAlert] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);

  // Meeting notification state
  const [pendingMeetings, setPendingMeetings] = useState<Meeting[]>([]);
  const [showMeetingAlert, setShowMeetingAlert] = useState(false);
  const [currentMeetingIdx, setCurrentMeetingIdx] = useState(0);

  useEffect(() => {
    const fetchProject = async () => {
      if (isGuide) { setLoadingProject(false); return; }

      // Auto-Sync: link profile to project if admin created it
      if (!profile?.team_id) {
        if (profile?.team_number || profile?.name) {
          const expectedTitle = `Project: Team ${profile.team_number || profile.name}`;
          const { data: foundProjects } = await supabase
            .from('projects').select('*').eq('title', expectedTitle)
            .order('created_at', { ascending: false }).limit(1);
          if (foundProjects && foundProjects.length > 0) {
            await supabase.from('profiles').update({ team_id: foundProjects[0].id }).eq('id', profile.id);
            window.location.reload();
            return;
          }
        }
        setLoadingProject(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects').select('*').eq('id', profile.team_id).single();

      if (!error && data) {
        setProject(data);
        if (data.guide_id) {
          const { data: guideData } = await supabase.from('profiles').select('*').eq('id', data.guide_id).single();
          if (guideData) setGuide(guideData);
          if (!localStorage.getItem(`guide_notified_${data.id}`)) {
            setShowGuideAlert(true);
          }
        }

        // --- Meeting notifications ---
        const { data: meetings } = await supabase
          .from('meetings')
          .select('*')
          .eq('project_id', data.id)
          .order('scheduled_at', { ascending: true });

        if (meetings && meetings.length > 0) {
          // Filter to only meetings the student hasn't been notified about yet
          // For 'scheduled', show if in future
          // For 'completed', show even if in past
          const unseen = meetings.filter((m: Meeting) => {
            const notifiedKey = `meeting_notified_${m.id}_${m.status}`;
            if (localStorage.getItem(notifiedKey)) return false;
            
            if (m.status === 'completed') return true;
            if (m.status === 'scheduled' && new Date(m.scheduled_at) >= new Date()) return true;
            return false;
          });

          if (unseen.length > 0) {
            setPendingMeetings(unseen);
            setCurrentMeetingIdx(0);
            setShowMeetingAlert(true);
          }
        }
      }
      setLoadingProject(false);
    };
    fetchProject();
  }, [profile]);

  const dismissGuideAlert = () => {
    if (project) {
      localStorage.setItem(`guide_notified_${project.id}`, 'true');
      setShowGuideAlert(false);
    }
  };

  const dismissMeetingAlert = () => {
    // Mark current meeting as seen with its specific status
    if (pendingMeetings[currentMeetingIdx]) {
      const m = pendingMeetings[currentMeetingIdx];
      localStorage.setItem(`meeting_notified_${m.id}_${m.status}`, 'true');
    }
    // If there are more unseen meetings, advance; otherwise close
    if (currentMeetingIdx + 1 < pendingMeetings.length) {
      setCurrentMeetingIdx(i => i + 1);
    } else {
      setShowMeetingAlert(false);
    }
  };

  const currentMeeting = pendingMeetings[currentMeetingIdx];

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.name || 'Student'}!</h1>
          <p className="text-slate-400 mt-1">Here's the current status of your project.</p>
        </div>
      </header>

      {/* Guide Allocation Notification */}
      <AnimatePresence>
        {showGuideAlert && guide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 right-8 z-50 glass-card p-6 border-emerald-500/30 shadow-[0_10px_40px_rgba(16,185,129,0.2)] max-w-sm"
          >
            <button onClick={dismissGuideAlert} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle className="text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Guide Allocated!</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <span className="font-semibold text-emerald-400">{guide.name}</span> has been assigned as your project guide.
                </p>
                <button onClick={dismissGuideAlert} className="mt-4 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-bold rounded-lg transition-colors w-full">
                  Got it, Thanks!
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meeting Scheduled Notification */}
      <AnimatePresence>
        {showMeetingAlert && currentMeeting && (
          <motion.div
            key={currentMeeting.id}
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`fixed bottom-8 left-8 z-50 glass-card p-6 border shadow-2xl max-w-sm w-full ${
              currentMeeting.status === 'completed' ? 'border-emerald-500/40 shadow-emerald-500/20' : 'border-cobalt/40 shadow-cobalt/25'
            }`}
          >
            {/* Bell pulse */}
            <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-pulse ${
              currentMeeting.status === 'completed' ? 'bg-emerald-500 shadow-emerald-500/60' : 'bg-cobalt shadow-cobalt/60'
            }`}>
              <Bell size={14} className="text-white" />
            </div>

            <button onClick={dismissMeetingAlert} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>

            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                currentMeeting.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-cobalt/20 border-cobalt/30'
              }`}>
                {currentMeeting.status === 'completed' ? <CheckCircle className="text-emerald-400" size={24} /> : <Calendar className="text-cobalt-light" size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                  currentMeeting.status === 'completed' ? 'text-emerald-400' : 'text-cobalt-light'
                }`}>
                  {currentMeeting.status === 'completed' ? 'Review Completed' : 'Meeting Scheduled'}
                </p>
                <h3 className="text-lg font-bold text-white mb-1 leading-tight">{currentMeeting.title}</h3>
                {currentMeeting.status === 'completed' ? (
                  <p className="text-sm text-slate-300 mt-1">This review session has been marked as finished by your guide.</p>
                ) : (
                  <p className="text-sm text-slate-300 flex items-center gap-1.5 mt-1">
                    <Calendar size={13} className="text-slate-500 shrink-0" />
                    {new Date(currentMeeting.scheduled_at).toLocaleString([], {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
                {currentMeeting.notes && (
                  <p className="text-xs text-slate-400 mt-1.5 italic line-clamp-2">{currentMeeting.notes}</p>
                )}

                {/* Multiple meeting counter */}
                {pendingMeetings.length > 1 && (
                  <p className="text-xs text-slate-500 mt-2">
                    {currentMeetingIdx + 1} of {pendingMeetings.length} new meetings
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => { dismissMeetingAlert(); navigate('/dashboard/meetings'); }}
                    className="flex-1 px-3 py-2 bg-cobalt hover:bg-cobalt-light text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    View Schedule
                  </button>
                  <button
                    onClick={dismissMeetingAlert}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 text-sm rounded-lg transition-colors"
                  >
                    {currentMeetingIdx + 1 < pendingMeetings.length ? 'Next →' : 'Dismiss'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dashboard Content */}
      {isGuide && profile ? (
        <GuideDashboard profile={profile} />
      ) : loadingProject ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-cobalt" /></div>
      ) : project ? (
        <AdaptiveDashboard project={project} />
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 border-white/5">
          <Code size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No Active Project</h3>
          <p>Your team has not been assigned a project repository yet. Please contact your guide.</p>
        </div>
      )}
    </div>
  );
}
