import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Project, Profile } from '../../types';
import { Users, FileText, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface GuideDashboardProps {
  profile: Profile;
}

export function GuideDashboard({ profile }: GuideDashboardProps) {
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('guide_id', profile.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Deduplicate
        const seen = new Set<string>();
        const seenTitles = new Set<string>();
        const unique = data.filter(p => {
          if (seen.has(p.id) || seenTitles.has(p.title)) return false;
          seen.add(p.id);
          seenTitles.add(p.title);
          return true;
        });

        if (unique.length > 0) {
          setTotalAssigned(unique.length);
          const counts: Record<string, number> = {};
          const activeProjects: Project[] = [];

          await Promise.all(unique.map(async p => {
            const { data: uploads } = await supabase.from('file_uploads').select('id').eq('project_id', p.id);
            const { data: reviews } = await supabase.from('submissions').select('file_upload_id').eq('project_id', p.id);
            
            const reviewedIds = new Set(reviews?.map(r => r.file_upload_id) || []);
            const pendingCount = uploads?.filter(u => !reviewedIds.has(u.id)).length || 0;
            
            if (pendingCount > 0) {
              counts[p.id] = pendingCount;
              activeProjects.push(p);
            }
          }));
          
          setPendingCounts(counts);
          setAssignedProjects(activeProjects);
        } else {
          setTotalAssigned(0);
          setAssignedProjects([]);
        }
      }
      setLoading(false);
    };

    fetchProjects();
  }, [profile.id]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-cobalt" size={48} /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-cobalt/20 text-cobalt rounded-xl">
          <Users size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Project Review Center</h2>
          <p className="text-slate-400 text-sm">
            {totalAssigned} team{totalAssigned !== 1 ? 's' : ''} total — {assignedProjects.length} pending review{assignedProjects.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {assignedProjects.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 border-white/5">
          <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No Pending Reviews</h3>
          <p>All clear! You have reviewed all submissions for your assigned teams. New uploads will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedProjects.map((project, idx) => {
            const count = pendingCounts[project.id] ?? 0;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="glass-card p-6 border-white/10 hover:border-cobalt/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(37,99,235,0.15)] flex flex-col h-full"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{project.title}</h3>
                  <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono uppercase text-slate-300 mb-4">
                    {project.dept_category} Domain
                  </span>
                  <p className="text-sm text-slate-400">
                    Allocated: {new Date(project.created_at).toLocaleDateString()}
                  </p>

                  {/* Pending count badge */}
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    <FileText size={12} />
                    {count} pending submission{count !== 1 ? 's' : ''}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/dashboard/reviews/${project.id}`)}
                  className="mt-6 w-full py-3 bg-white/5 hover:bg-cobalt/20 text-white rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/10 hover:border-cobalt/50 text-sm font-bold group"
                >
                  <FileText size={16} />
                  Review Submissions
                  <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
