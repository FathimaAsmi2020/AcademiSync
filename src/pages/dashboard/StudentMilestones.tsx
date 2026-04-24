import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Loader2, MessageSquare, X, CheckCircle,
  AlertCircle, AlertTriangle, Clock, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const REVIEW_LEVELS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  0: { label: 'Review 0', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
  1: { label: 'Review 1', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  2: { label: 'Review 0', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  3: { label: 'Review 3', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  4: { label: 'Review 4', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
};

const CHANGE_TYPE_INFO: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  accepted: { label: 'Accepted', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', icon: CheckCircle },
  minor_changes: { label: 'Minor Changes', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', icon: AlertCircle },
  major_changes: { label: 'Major Changes', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50', icon: AlertTriangle },
};

interface Review {
  id: string;
  file_upload_id?: string;
  milestone_title: string;
  guide_status: 'pending' | 'approved' | 'rejected';
  guide_comments?: string;
  review_level?: number;
  change_type?: string;
  created_at: string;
  // joined from file_uploads
  file_name?: string;
  file_category?: string;
}

export function StudentMilestones() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Review | null>(null);
  const [projectCategory, setProjectCategory] = useState<string>('General');

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.team_id) { setLoading(false); return; }

      // Fetch project category
      const { data: proj } = await supabase.from('projects').select('dept_category').eq('id', profile.team_id).single();
      if (proj?.dept_category) setProjectCategory(proj.dept_category);

      // Fetch all guide submissions for this project
      const { data: subs, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('project_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (error || !subs) { setLoading(false); return; }

      // Enrich with file names from file_uploads table
      const enriched: Review[] = await Promise.all(
        subs.map(async (s) => {
          if (s.file_upload_id) {
            const { data: f } = await supabase
              .from('file_uploads')
              .select('file_name, category')
              .eq('id', s.file_upload_id)
              .single();
            return {
              ...s,
              file_name: f?.file_name,
              file_category: f?.category,
            };
          }
          return s;
        })
      );

      setReviews(enriched);
      setLoading(false);
    };
    fetchData();
  }, [profile?.team_id]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
          <MessageSquare size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Project Timeline & Reviews</h2>
          <p className="text-slate-400 text-sm">
            Complete history of reviews and comments for your {projectCategory} project.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-purple-500" size={40} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 border-white/5">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-bold text-white mb-2">No Reviews Yet</h3>
          <p>Your guide hasn't submitted any reviews on your uploads yet.</p>
        </div>
      ) : (
        <div className="relative pl-8 border-l-2 border-white/5 space-y-6">
          {reviews.map((review, idx) => {
            const rl = review.review_level !== undefined ? REVIEW_LEVELS[review.review_level] : null;
            const ct = review.change_type ? CHANGE_TYPE_INFO[review.change_type] : null;
            const CtIcon = ct?.icon;

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelected(review)}
                className="relative group"
              >
                {/* Timeline Dot */}
                <div className={`absolute -left-[41px] top-6 w-4 h-4 rounded-full border-4 border-navy-dark z-10 transition-transform group-hover:scale-125 ${
                  review.guide_status === 'approved' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                  review.guide_status === 'rejected' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                  'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                }`} />

                <div className="glass-card p-6 border-white/10 hover:border-white/20 transition-all cursor-pointer bg-white/2 hover:bg-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-lg">
                          {review.file_name ?? review.milestone_title}
                        </h3>
                        {rl && (
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold uppercase tracking-wider ${rl.bg} ${rl.color} ${rl.border}`}>
                            {rl.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock size={12} />
                        {new Date(review.created_at).toLocaleString()}
                        {review.file_category && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{review.file_category.replace('_', ' ')}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {ct && (
                        <span className={`flex items-center gap-1 text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-wider ${ct.bg} ${ct.color} ${ct.border}`}>
                          <CtIcon size={12} /> {ct.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment snippet */}
                  {review.guide_comments && (
                    <div className="mt-4 p-4 rounded-xl bg-white/2 border border-white/5">
                      <p className="text-sm text-slate-400 italic leading-relaxed line-clamp-3">
                        "{review.guide_comments}"
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-white transition-colors flex items-center gap-1">
                    Click to view full feedback <ExternalLink size={10} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full Review Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-2xl border-white/20 overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                    <MessageSquare size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Detailed Review Feedback</h3>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                  <X size={22} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-1">
                      {selected.file_name ?? selected.milestone_title}
                    </h4>
                    <p className="text-slate-500 text-sm flex items-center gap-2">
                      <Clock size={14} />
                      Reviewed on {new Date(selected.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.review_level !== undefined && (
                      <span className="text-[10px] px-3 py-1 rounded bg-white/10 text-white font-bold uppercase tracking-widest border border-white/10">
                        Level {selected.review_level}
                      </span>
                    )}
                    {selected.change_type && CHANGE_TYPE_INFO[selected.change_type] && (() => {
                      const ct = CHANGE_TYPE_INFO[selected.change_type!];
                      return (
                        <span className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-widest ${ct.bg} ${ct.color} ${ct.border}`}>
                          {ct.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guide Comments</h5>
                  <div className="bg-navy-dark rounded-2xl p-6 border border-white/5 shadow-inner">
                    {selected.guide_comments ? (
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{selected.guide_comments}</p>
                    ) : (
                      <p className="text-slate-600 italic text-sm">No specific comments provided for this review level.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                <button onClick={() => setSelected(null)}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all active:scale-95">
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
