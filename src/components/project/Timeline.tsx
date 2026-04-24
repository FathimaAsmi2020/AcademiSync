import { useState, useEffect } from 'react';
import { CheckCircle2, MessageSquare, X, Loader2, Calendar, AlertCircle, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Submission {
  id: string;
  version: number;
  milestone_title: string;
  guide_status: 'pending' | 'approved' | 'rejected';
  guide_comments?: string;
  review_level?: number;
  change_type?: string;
  created_at: string;
  file_url?: string;
}

const REVIEW_LEVELS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  0: { label: 'Review 0', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
  1: { label: 'Review 1', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  2: { label: 'Review 2', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  3: { label: 'Review 3', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  4: { label: 'Review 4', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
};

const CHANGE_TYPE_INFO: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  accepted: { label: 'Accepted', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', icon: CheckCircle },
  minor_changes: { label: 'Minor Changes', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', icon: AlertCircle },
  major_changes: { label: 'Major Changes', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50', icon: AlertTriangle },
};

export function Timeline() {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!profile?.team_id) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('project_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSubmissions(data);
      }
      setLoading(false);
    };
    fetchSubmissions();
  }, [profile]);

  return (
    <div className="glass-card p-8 border-white/5 relative">
      <h2 className="text-xl font-bold mb-8 tracking-tight text-white flex items-center gap-3 uppercase tracking-widest">
        <History className="text-cobalt-light" size={20} />
        Academic Gate Review System
      </h2>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-cobalt" /></div>
      ) : submissions.length === 0 ? (
        <div className="p-12 text-center text-slate-500 italic text-sm">
          No review versions recorded yet. Your guide will provide feedback once you upload your files.
        </div>
      ) : (
        <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
          {submissions.map((sub, index) => {
            const isApproved = sub.guide_status === 'approved';
            const isPending = sub.guide_status === 'pending';
            const rl = sub.review_level !== undefined ? REVIEW_LEVELS[sub.review_level] : null;
            const ct = sub.change_type ? CHANGE_TYPE_INFO[sub.change_type] : null;
            const Icon = ct?.icon;

            return (
              <motion.div 
                key={sub.id} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                {/* Timeline dot */}
                <div className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full border-4 border-navy flex items-center justify-center transition-all group-hover:scale-110 z-10
                  ${isApproved ? 'bg-emerald-500 border-emerald-500/30' : isPending ? 'bg-cobalt border-cobalt/30 animate-pulse' : 'bg-red-500 border-red-500/30'}`}
                >
                  {isApproved && <CheckCircle2 size={12} className="text-navy" />}
                </div>

                <div
                  onClick={() => setSelectedSub(sub)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer hover:bg-white/5 bg-white/2 ${isApproved ? 'border-emerald-500/20' : isPending ? 'border-cobalt/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'border-red-500/20'}`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white">{sub.milestone_title || `Version ${sub.version}`}</h3>
                      {rl && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold uppercase ${rl.bg} ${rl.color} ${rl.border}`}>
                          {rl.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {ct && (
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${ct.bg} ${ct.color} ${ct.border}`}>
                          <Icon size={10} /> {ct.label}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar size={10} /> {new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {sub.guide_comments && (
                    <p className="mt-3 text-xs text-slate-400 italic line-clamp-2">"{sub.guide_comments}"</p>
                  )}
                  
                  <div className="mt-3 text-[10px] font-bold text-slate-600 group-hover:text-cobalt-light transition-colors uppercase tracking-widest flex items-center gap-1">
                    Full Details <ExternalLink size={10} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      <AnimatePresence>
        {selectedSub && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-lg border-white/20 overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="text-cobalt-light" />
                  Review Details
                </h3>
                <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-2xl font-bold text-white">{selectedSub.milestone_title || `Version ${selectedSub.version}`}</h4>
                  {selectedSub.review_level !== undefined && REVIEW_LEVELS[selectedSub.review_level] && (
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-widest ${REVIEW_LEVELS[selectedSub.review_level].bg} ${REVIEW_LEVELS[selectedSub.review_level].color} ${REVIEW_LEVELS[selectedSub.review_level].border}`}>
                      {REVIEW_LEVELS[selectedSub.review_level].label}
                    </span>
                  )}
                </div>

                {/* Status & Change Type Row */}
                <div className="flex flex-wrap gap-3">
                   <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    selectedSub.guide_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    selectedSub.guide_status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {selectedSub.guide_status}
                  </div>
                  {selectedSub.change_type && CHANGE_TYPE_INFO[selectedSub.change_type] && (() => {
                    const ct = CHANGE_TYPE_INFO[selectedSub.change_type!]!;
                    return (
                      <span className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold border ${ct.bg} ${ct.color} ${ct.border}`}>
                        <ct.icon size={12} /> {ct.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guide Comments</h5>
                  <div className="bg-navy-dark rounded-2xl p-6 border border-white/5 min-h-[120px]">
                    {selectedSub.guide_comments ? (
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{selectedSub.guide_comments}</p>
                    ) : (
                      <p className="text-slate-600 italic text-sm text-center pt-8">No comments recorded.</p>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">Version {selectedSub.version} • Reviewed on {new Date(selectedSub.created_at).toLocaleString()}</p>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                <button onClick={() => setSelectedSub(null)} className="px-8 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-bold text-sm">
                  Close Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const History = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);
