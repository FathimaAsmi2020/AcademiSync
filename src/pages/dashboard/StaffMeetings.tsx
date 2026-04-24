import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Loader2, Plus, X, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../../types';

interface Meeting {
  id: string;
  project_id: string;
  guide_id: string;
  title: string;
  scheduled_at: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export function StaffMeetings() {
  const { profile, isGuide } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [form, setForm] = useState({ project_id: '', title: '', scheduled_at: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchMeetings = async () => {
    if (!profile?.id) return;
    setLoading(true);

    if (isGuide) {
      const { data: projs } = await supabase
        .from('projects').select('*').eq('guide_id', profile.id);
      if (projs) setProjects(projs);

      const projectIds = projs?.map(p => p.id) ?? [];
      if (projectIds.length > 0) {
        const { data } = await supabase
          .from('meetings')
          .select('*')
          .in('project_id', projectIds)
          .order('scheduled_at', { ascending: true });
        if (data) setMeetings(data as Meeting[]);
      }
    } else {
      // Student view
      if (!profile?.team_id) { setLoading(false); return; }
      const { data } = await supabase
        .from('meetings')
        .select('*')
        .eq('project_id', profile.team_id)
        .order('scheduled_at', { ascending: true });
      if (data) setMeetings(data as Meeting[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMeetings(); }, [profile?.id]);

  const handleSchedule = async () => {
    if (!form.project_id || !form.title || !form.scheduled_at) return;
    setSaving(true);
    const { error } = await supabase.from('meetings').insert({
      project_id: form.project_id,
      guide_id: profile?.id,
      title: form.title,
      scheduled_at: form.scheduled_at,
      notes: form.notes,
      status: 'scheduled'
    });
    if (!error) {
      setForm({ project_id: '', title: '', scheduled_at: '', notes: '' });
      setShowForm(false);
      fetchMeetings();
    }
    setSaving(false);
  };

  const handleMarkCompleted = async (meetingId: string) => {
    setCompletingId(meetingId);
    const { error } = await supabase
      .from('meetings')
      .update({ status: 'completed' })
      .eq('id', meetingId);
    
    if (!error) {
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, status: 'completed' } : m));
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(prev => prev ? { ...prev, status: 'completed' } : null);
      }
    }
    setCompletingId(null);
  };

  const upcoming = meetings.filter(m => m.status === 'scheduled' && new Date(m.scheduled_at) >= new Date());
  const completed = meetings.filter(m => m.status === 'completed');
  const pastUnfinished = meetings.filter(m => m.status === 'scheduled' && new Date(m.scheduled_at) < new Date());

  const MeetingCard = ({ m }: { m: Meeting }) => {
    const dt = new Date(m.scheduled_at);
    const proj = projects.find(p => p.id === m.project_id);
    const isPast = dt < new Date();
    const isCompleted = m.status === 'completed';

    return (
      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setSelectedMeeting(m)}
        className={`glass-card p-5 border transition-all cursor-pointer group ${
          isCompleted 
            ? 'border-emerald-500/20 bg-emerald-500/5' 
            : isPast 
              ? 'border-red-500/20 opacity-80' 
              : 'border-cobalt/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white text-lg truncate group-hover:text-cobalt-light transition-colors">{m.title}</h3>
              {isCompleted && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  <CheckCircle2 size={10} /> Completed
                </span>
              )}
            </div>
            {proj && <p className="text-xs text-cobalt-light font-mono truncate">{proj.title}</p>}
            {m.notes && <p className="text-slate-400 text-sm mt-2 line-clamp-1 italic">"{m.notes}"</p>}
          </div>
          <div className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
            isCompleted 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : isPast 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : 'bg-cobalt/10 border-cobalt/30 text-cobalt-light'
          }`}>
            <Clock size={12} />
            {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cobalt/20 text-cobalt rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <Calendar size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Meeting Schedules</h2>
            <p className="text-slate-400 text-sm">
              {isGuide ? 'Schedule and manage review meetings with your teams.' : 'View meetings scheduled by your guide.'}
            </p>
          </div>
        </div>
        {isGuide && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cobalt hover:bg-cobalt-light text-white rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-95"
          >
            <Plus size={16} /> Schedule Meeting
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center p-20 gap-4">
          <Loader2 className="animate-spin text-cobalt" size={48} />
          <p className="text-slate-500 font-medium animate-pulse">Fetching schedule...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-4 bg-cobalt rounded-full" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming Sessions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map(m => <MeetingCard key={m.id} m={m} />)}
              </div>
            </div>
          )}

          {pastUnfinished.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-4 bg-red-500 rounded-full" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Completion</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastUnfinished.map(m => <MeetingCard key={m.id} m={m} />)}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed Reviews</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completed.map(m => <MeetingCard key={m.id} m={m} />)}
              </div>
            </div>
          )}

          {meetings.length === 0 && (
            <div className="glass-card p-20 text-center border-white/5 bg-white/2">
              <Calendar size={64} className="mx-auto mb-6 text-slate-700" />
              <h3 className="text-xl font-bold text-white mb-2">Clean Slate</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {isGuide ? 'You haven\'t scheduled any meetings yet. Use the button above to get started.' : 'Your guide has not scheduled any meetings yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Meeting Details Modal */}
      <AnimatePresence>
        {selectedMeeting && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg glass-card border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cobalt/20 text-cobalt rounded-lg">
                    <Calendar size={20} />
                  </div>
                  <h3 className="font-bold text-white text-xl">Meeting Details</h3>
                </div>
                <button onClick={() => setSelectedMeeting(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div>
                  <h4 className="text-2xl font-bold text-white mb-1">{selectedMeeting.title}</h4>
                  <p className="text-cobalt-light font-mono text-sm">Project: {projects.find(p => p.id === selectedMeeting.project_id)?.title || 'Assigned Project'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                      <Clock size={12} /> Scheduled At
                    </div>
                    <p className="text-white font-medium">
                      {new Date(selectedMeeting.scheduled_at).toLocaleDateString()}<br/>
                      {new Date(selectedMeeting.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                      <CheckCircle2 size={12} /> Status
                    </div>
                    <p className={`font-bold capitalize ${selectedMeeting.status === 'completed' ? 'text-emerald-400' : 'text-cobalt-light'}`}>
                      {selectedMeeting.status}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                    <MessageSquare size={12} /> Discussion Notes
                  </div>
                  <div className="p-4 rounded-xl bg-navy-dark border border-white/10 text-slate-300 text-sm leading-relaxed min-h-[100px] whitespace-pre-wrap">
                    {selectedMeeting.notes || 'No specific agenda or notes provided for this session.'}
                  </div>
                </div>

                {isGuide && selectedMeeting.status === 'scheduled' && (
                  <button 
                    onClick={() => handleMarkCompleted(selectedMeeting.id)}
                    disabled={!!completingId}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                  >
                    {completingId === selectedMeeting.id ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                    Mark as Completed & Notify Team
                  </button>
                )}

                {selectedMeeting.status === 'completed' && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 size={20} className="shrink-0" />
                    <p className="text-sm font-medium">This review session has been successfully completed and recorded.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Meeting Modal (Guide only) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md glass-card border-white/20 overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Plus size={18} className="text-cobalt-light" />
                  Schedule New Meeting
                </h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Team / Project</label>
                  <select value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))}
                    className="w-full bg-navy-dark border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cobalt outline-none appearance-none">
                    <option value="">Select a team...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Meeting Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                    placeholder="e.g. 30% Milestone Review"
                    className="w-full bg-navy-dark border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cobalt outline-none placeholder-slate-600" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Date & Time</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({...f, scheduled_at: e.target.value}))}
                    className="w-full bg-navy-dark border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cobalt outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Notes (optional)</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                    placeholder="Agenda, location, or instructions..."
                    rows={3}
                    className="w-full bg-navy-dark border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cobalt outline-none resize-none placeholder-slate-600" />
                </div>
                <button onClick={handleSchedule} disabled={saving || !form.project_id || !form.title || !form.scheduled_at}
                  className="w-full py-4 bg-cobalt hover:bg-cobalt-light text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                  {saving ? 'Scheduling...' : 'Confirm & Notify Team'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
