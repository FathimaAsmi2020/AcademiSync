import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { FileCheck, Loader2, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types';

export function StaffReviews() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('guide_id', profile.id)
        .order('created_at', { ascending: true });

      if (data) {
        const seen = new Set<string>();
        const seenTitles = new Set<string>();
        setProjects(data.filter(p => {
          if (seen.has(p.id) || seenTitles.has(p.title)) return false;
          seen.add(p.id); seenTitles.add(p.title);
          return true;
        }));
      }
      setLoading(false);
    };
    fetch();
  }, [profile?.id]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-cobalt/20 text-cobalt rounded-xl"><FileCheck size={22} /></div>
        <div>
          <h2 className="text-2xl font-bold text-white">Submission Reviews</h2>
          <p className="text-slate-400 text-sm">Select a team to review their uploaded documents.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-cobalt" size={40} /></div>
      ) : projects.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 border-white/5">
          <Users size={48} className="mx-auto mb-4 opacity-40" />
          <h3 className="text-xl font-bold text-white mb-2">No Teams Assigned</h3>
          <p>You have not been assigned as a guide to any projects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project, idx) => (
            <button
              key={project.id}
              onClick={() => navigate(`/dashboard/reviews/${project.id}`)}
              className="w-full glass-card p-5 border-white/10 hover:border-cobalt/50 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(37,99,235,0.15)] flex items-center justify-between group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-cobalt/20 text-cobalt-light flex items-center justify-center font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-bold text-white">{project.title}</p>
                  <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded capitalize text-slate-400">
                    {project.dept_category} Domain
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-500 group-hover:text-cobalt-light transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
