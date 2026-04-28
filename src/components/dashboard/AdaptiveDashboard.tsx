import { Timeline } from '../project/Timeline';
import type { Project, Profile } from '../../types';
import { UploadCloud, MessageSquare, ShieldCheck, Clock, Users, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdaptiveDashboard({ project, members }: { project: Project; members: Profile[] }) {
  if (!project) {
    return <div className="glass-card p-8 text-center text-slate/60 animate-pulse">Loading Project Data...</div>;
  }

  const category = project.dept_category?.toLowerCase() || 'general';

  return (
    <div className="mt-8 space-y-8 animate-in fade-in duration-700">
      {/* Project Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">{project.title}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-cobalt/20 border border-cobalt/30 text-cobalt-light text-xs font-bold uppercase tracking-widest">
              {project.dept_category || 'General'}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={14} /> Created {new Date(project.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <ShieldCheck size={14} /> Active Project
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/dashboard/uploads" className="flex items-center gap-2 px-5 py-3 bg-cobalt hover:bg-cobalt-light transition-all text-white rounded-xl text-sm font-bold shadow-[0_8px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.4)] active:scale-95">
            <UploadCloud size={18} /> Upload Documents
          </Link>
          <Link to="/dashboard/milestones" className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white rounded-xl text-sm font-bold active:scale-95">
            <MessageSquare size={18} /> Review Feedback
          </Link>
        </div>
      </div>

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {members.map((member) => (
          <div key={member.id} className="glass-card p-4 border-white/5 flex items-center gap-4 hover:bg-white/5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cobalt/10 flex items-center justify-center text-cobalt-light group-hover:bg-cobalt group-hover:text-white transition-all shadow-inner">
              <User size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none mb-1">{member.name}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{member.roll_number || 'Member'}</p>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="lg:col-span-4 p-4 text-center text-slate-500 italic text-xs">
            Fetching team member data...
          </div>
        )}
      </div>

      {/* Primary Content: Project Progression Timeline */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-1.5 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight uppercase tracking-widest">Version History & Review Timeline</h3>
            <p className="text-xs text-slate-500 mt-1">Track every iteration and guide feedback for your {category} project.</p>
          </div>
        </div>
        
        <Timeline />
      </div>
    </div>
  );
}
