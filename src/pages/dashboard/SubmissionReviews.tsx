import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, FileText, Loader2, DownloadCloud, CheckCircle, 
  AlertCircle, AlertTriangle, Send, 
  Clock, History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';

const REVIEW_LEVELS = [
  { value: 0, label: 'Review 0', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
  { value: 1, label: 'Review 1', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  { value: 2, label: 'Review 2', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  { value: 3, label: 'Review 3', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { value: 4, label: 'Review 4', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
];

const CHANGE_TYPES = [
  { value: 'accepted', label: 'Accepted', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', icon: CheckCircle },
  { value: 'minor_changes', label: 'Minor Changes', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', icon: AlertCircle },
  { value: 'major_changes', label: 'Major Changes', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50', icon: AlertTriangle },
];

export function SubmissionReviews() {
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-file review state
  const [reviewStates, setReviewStates] = useState<Record<string, { 
    reviewLevel: number; 
    changeType: string; 
    comment: string; 
    saving: boolean; 
    saved: boolean 
  }>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      setLoading(true);

      const [{ data: proj }, { data: fileUploads }, { data: existingReviews }] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('file_uploads').select('*').eq('project_id', projectId).order('uploaded_at', { ascending: false }),
        supabase.from('submissions').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      ]);

      if (proj) setProject(proj);
      if (existingReviews) setHistory(existingReviews);
      
      if (fileUploads) {
        setUploads(fileUploads);
        const initStates: typeof reviewStates = {};
        fileUploads.forEach(f => {
          const existing = existingReviews?.find(r => r.file_upload_id === f.id);
          initStates[f.id] = {
            reviewLevel: existing?.review_level ?? 0,
            changeType: existing?.change_type ?? '',
            comment: existing?.guide_comments ?? '',
            saving: false,
            saved: !!existing,
          };
        });
        setReviewStates(initStates);
      }
      setLoading(false);
    };
    fetchData();
  }, [projectId]);

  const updateState = (fileId: string, field: string, value: any) => {
    setReviewStates(prev => ({ ...prev, [fileId]: { ...prev[fileId], [field]: value, saved: false } }));
  };

  const handleSaveReview = async (fileId: string) => {
    if (!profile || !projectId) return;
    const state = reviewStates[fileId];
    if (!state.changeType) { alert('Please select a change type before saving.'); return; }

    setReviewStates(prev => ({ ...prev, [fileId]: { ...prev[fileId], saving: true } }));

    const { error } = await supabase.from('submissions').upsert({
      project_id: projectId,
      file_upload_id: fileId,
      file_url: uploads.find(u => u.id === fileId)?.file_url ?? uploads.find(u => u.id === fileId)?.file_path ?? '',
      version: state.reviewLevel,
      milestone_title: `Review ${state.reviewLevel}`,
      guide_status: state.changeType === 'accepted' ? 'approved' : state.changeType === 'minor_changes' ? 'pending' : 'rejected',
      guide_comments: state.comment,
      review_level: state.reviewLevel,
      change_type: state.changeType,
    }, { onConflict: 'file_upload_id' });

    if (error) {
      alert(`Failed to save review: ${error.message}`);
    } else {
      // Refresh history
      const { data: newHistory } = await supabase.from('submissions').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (newHistory) setHistory(newHistory);
    }
    setReviewStates(prev => ({ ...prev, [fileId]: { ...prev[fileId], saving: false, saved: !error } }));
  };

  const reviewLevelInfo = (level: number) => REVIEW_LEVELS.find(r => r.value === level)!;
  const changeTypeInfo = (ct: string) => CHANGE_TYPES.find(c => c.value === ct);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const getDownloadUrl = (file: any): string | null => {
    if (file.file_url && file.file_url.startsWith('http')) return file.file_url;
    if (file.file_path) return `${SUPABASE_URL}/storage/v1/object/public/academic_files/${file.file_path}`;
    return null;
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-cobalt" size={48} /></div>;

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Project Review & Timeline</h1>
          <p className="text-slate-400 text-sm mt-1">{project?.title} — {project?.dept_category || 'General'} Department</p>
        </div>
      </div>

      {/* Track Indicator */}
      <div className="p-4 rounded-xl border bg-cobalt/10 border-cobalt/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cobalt/20 text-cobalt">
            <History size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Review Track</p>
            <p className="text-white font-bold">{project?.dept_category || 'General'} Project Progression</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Review Area and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column: Review Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-cobalt/20 text-cobalt rounded-lg"><FileText size={18} /></div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Active Submissions</h2>
          </div>

          {uploads.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-400 border-white/5">
              <FileText size={48} className="mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-bold text-white mb-2">No Files Found</h3>
              <p>Wait for the team to upload their project files.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {uploads.map((file, idx) => {
                const state = reviewStates[file.id] || { reviewLevel: 0, changeType: '', comment: '', saving: false, saved: false };
                const ctInfo = changeTypeInfo(state.changeType);

                return (
                  <motion.div key={file.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="glass-card border-white/10 overflow-hidden">
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-cobalt/20 text-cobalt flex items-center justify-center font-bold shrink-0">#{uploads.length - idx}</div>
                        <div>
                          <p className="font-bold text-white">{file.file_name}</p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-white/10 rounded capitalize">{file.category?.replace('_', ' ')}</span>
                            <span>{(file.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {state.saved && ctInfo && (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${ctInfo.bg} ${ctInfo.color} ${ctInfo.border} flex items-center gap-1`}>
                            <ctInfo.icon size={10} /> {ctInfo.label}
                          </span>
                        )}
                        <a href={getDownloadUrl(file) || '#'} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-cobalt text-white rounded-lg transition-all border border-white/10">
                          <DownloadCloud size={16} />
                        </a>
                      </div>
                    </div>

                    <div className="p-5 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Review Progression</label>
                          <select value={state.reviewLevel} onChange={e => updateState(file.id, 'reviewLevel', Number(e.target.value))} className="w-full bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cobalt transition-all">
                            {REVIEW_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Submission Status</label>
                          <div className="flex flex-wrap gap-2">
                            {CHANGE_TYPES.map(ct => (
                              <button key={ct.value} onClick={() => updateState(file.id, 'changeType', ct.value)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${state.changeType === ct.value ? `${ct.bg} ${ct.color} ${ct.border} shadow-lg` : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}>
                                <ct.icon size={14} /> {ct.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Guide Feedback & Comments</label>
                        <textarea value={state.comment} onChange={e => updateState(file.id, 'comment', e.target.value)} placeholder="Provide detailed feedback on this version..." rows={4} className="w-full bg-navy-dark border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-cobalt resize-none transition-all placeholder:text-slate-700" />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button onClick={() => handleSaveReview(file.id)} disabled={state.saving} className="flex items-center gap-2 px-8 py-3 bg-cobalt hover:bg-cobalt-light text-white rounded-xl font-bold text-sm transition-all shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.5)] disabled:opacity-50">
                          {state.saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                          {state.saving ? 'Saving...' : 'Publish Review'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Version History Timeline */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg"><History size={18} /></div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Version Timeline</h2>
          </div>

          <div className="relative pl-4 border-l-2 border-white/5 space-y-8">
            {history.length === 0 ? (
              <div className="p-6 text-center text-slate-500 italic text-sm">No review history available yet.</div>
            ) : (
              history.map((rev, idx) => {
                const rl = reviewLevelInfo(rev.review_level);
                const ct = changeTypeInfo(rev.change_type);
                return (
                  <motion.div key={rev.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="relative group">
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-navy-dark z-10 ${rl.color.replace('text', 'bg')}`} />
                    <div className="glass-card p-5 border-white/5 bg-white/2 hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${rl.bg} ${rl.color} ${rl.border}`}>{rl.label}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={10} /> {new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-white font-bold text-sm mb-2">{rev.milestone_title}</p>
                      {rev.guide_comments && <p className="text-slate-400 text-xs italic mb-4 line-clamp-3">"{rev.guide_comments}"</p>}
                      
                      {ct && (
                        <div className={`mt-4 pt-4 border-t border-white/5 flex items-center justify-between`}>
                          <span className={`text-[10px] font-bold ${ct.color} flex items-center gap-1`}>
                            <ct.icon size={10} /> {ct.label}
                          </span>
                          <span className="text-[10px] text-slate-600">v{rev.version}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
