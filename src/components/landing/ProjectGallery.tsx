import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, History, Calendar, ChevronRight, ChevronDown, CheckCircle2, Clock } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  dept_category: string;
  profiles?: any[];
  submissions?: any[];
  file_uploads?: any[];
  timeline?: any[];
  problem_statement?: string;
  challenges_overcome?: string;
  overview?: string;
}

export function ProjectGallery() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        // 1. Fetch all projects first
        const { data: projectsData, error: projError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (projError) throw projError;
        if (!projectsData) return;

        // 2. For each project, fetch its related data manually (more reliable than joins)
        const enrichedProjects = await Promise.all(
          projectsData.map(async (project) => {
            // Fetch team members
            const { data: profiles } = await supabase
              .from('profiles')
              .select('name, roll_number')
              .eq('team_id', project.id);

            // Fetch submissions (reviews)
            const { data: submissions } = await supabase
              .from('submissions')
              .select('*')
              .eq('project_id', project.id);

            // Fetch file uploads
            const { data: uploads } = await supabase
              .from('file_uploads')
              .select('*')
              .eq('project_id', project.id);

            // Create the unified timeline
            const timeline = [
              ...(submissions || []).map((s: any) => ({ ...s, type: 'review' })),
              ...(uploads || []).map((f: any) => ({ 
                id: f.id, 
                created_at: f.created_at || f.uploaded_at || project.created_at, 
                milestone_title: `File Uploaded: ${f.file_name}`, 
                summary: `Student uploaded a ${f.category?.replace('_', ' ') || 'document'}.`,
                type: 'upload',
                version: null
              }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            return { 
              ...project, 
              profiles: profiles || [], 
              timeline 
            };
          })
        );

        setProjects(enrichedProjects);
      } catch (err) {
        console.error("Gallery Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-cobalt border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-24 px-6 bg-navy-dark/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">
            Project <span className="text-cobalt-light">Showcase</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Live tracking of active academic projects and their evolution through the review system.
          </p>
        </div>

        <div className="space-y-4">
          {projects.map((project) => (
            <motion.div 
              key={project.id}
              layout
              className={`glass-card border-white/5 overflow-hidden transition-all duration-500 ${
                expandedId === project.id ? 'bg-white/[0.03] ring-1 ring-cobalt/30' : 'hover:bg-white/[0.02]'
              }`}
            >
              {/* Project Header - Minimalist */}
              <div 
                onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${
                    project.dept_category === 'software' ? 'bg-blue-500/10 text-blue-400' :
                    project.dept_category === 'core' ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {project.title?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Users size={12} /> {project.profiles?.length || 0} Members</span>
                      <span className="flex items-center gap-1.5"><History size={12} /> {project.submissions?.length || 0} Updates</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                   <div className="flex -space-x-2">
                    {project.profiles?.slice(0, 3).map((m, i) => (
                      <div key={i} title={m.name} className="w-8 h-8 rounded-full bg-navy border-2 border-navy-dark flex items-center justify-center text-[10px] font-bold text-white uppercase">
                        {m.name.charAt(0)}
                      </div>
                    ))}
                    {(project.profiles?.length || 0) > 3 && (
                      <div className="w-8 h-8 rounded-full bg-white/5 border-2 border-navy-dark flex items-center justify-center text-[10px] font-bold text-slate-400">
                        +{project.profiles!.length - 3}
                      </div>
                    )}
                  </div>
                  {expandedId === project.id ? <ChevronDown size={20} className="text-cobalt-light" /> : <ChevronRight size={20} className="text-slate-600" />}
                </div>
              </div>

              {/* Expanded Timeline View */}
              <AnimatePresence>
                {expandedId === project.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-navy-dark/40"
                  >
                    <div className="p-8">
                      {/* New Metadata Display */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        <div className="lg:col-span-2 space-y-8">
                          {project.overview && (
                            <div>
                              <h4 className="text-[10px] font-black text-cobalt-light uppercase tracking-[0.2em] mb-3">Overview</h4>
                              <p className="text-slate-300 leading-relaxed text-sm bg-white/5 p-6 rounded-2xl border border-white/5">{project.overview}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {project.problem_statement && (
                              <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Problem Statement</h4>
                                <p className="text-slate-400 text-xs leading-relaxed italic border-l-2 border-cobalt/30 pl-4">{project.problem_statement}</p>
                              </div>
                            )}
                            {project.challenges_overcome && (
                              <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Challenges Overcome</h4>
                                <p className="text-slate-400 text-xs leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">{project.challenges_overcome}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="lg:col-span-1">
                           <div className="bg-gradient-to-br from-cobalt/10 to-purple-500/10 p-6 rounded-3xl border border-white/5">
                             <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">Team Metadata</h4>
                             <div className="space-y-4">
                               <div className="flex items-center justify-between text-xs">
                                 <span className="text-slate-500">Domain</span>
                                 <span className="text-white font-bold capitalize">{project.dept_category}</span>
                               </div>
                               <div className="flex items-center justify-between text-xs">
                                 <span className="text-slate-500">Status</span>
                                 <span className="text-emerald-400 font-bold">Active Development</span>
                               </div>
                               <div className="flex items-center justify-between text-xs">
                                 <span className="text-slate-500">Members</span>
                                 <span className="text-white font-bold">{project.profiles?.length || 0} Students</span>
                               </div>
                             </div>
                           </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-8 pt-8 border-t border-white/5">
                        <History size={18} className="text-cobalt-light" />
                        <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Development Timeline</h4>
                      </div>

                      {project.timeline && project.timeline.length > 0 ? (
                        <div className="relative pl-6 space-y-8 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-cobalt/50 before:to-transparent">
                          {project.timeline.map((item: any, i: number) => (
                            <div key={item.id} className="relative">
                              <div className={`absolute -left-[27px] top-1.5 w-2 h-2 rounded-full ring-4 ring-navy ${
                                item.type === 'review' ? 'bg-cobalt' : 'bg-emerald-400'
                              }`} />
                              <div className="flex flex-col md:flex-row md:items-start gap-4">
                                <div className="min-w-[120px]">
                                  <div className="text-[10px] font-black text-cobalt-light uppercase tracking-widest mb-1">
                                    {item.type === 'review' ? `Version ${item.version}` : 'New Upload'}
                                  </div>
                                  <div className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={10} /> {new Date(item.created_at).toLocaleDateString()}</div>
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-bold text-white mb-2">{item.milestone_title}</h5>
                                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <p className="text-xs text-slate-400 leading-relaxed italic">
                                      {item.summary || "No details provided for this update."}
                                    </p>
                                  </div>
                                  {item.type === 'review' && (
                                    <div className="mt-3 flex items-center gap-3">
                                      <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-black tracking-widest ${
                                        item.guide_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        item.guide_status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-cobalt/10 text-cobalt-light border-cobalt/20'
                                      }`}>
                                        {item.guide_status}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-slate-600 italic text-sm">
                          No submissions recorded yet for this project.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
