import { Calendar } from 'lucide-react';

export function StudentMeetings() {
  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold tracking-tight mb-6">Scheduled Meetings</h2>
      <div className="glass-card p-12 text-center text-slate-400 border-white/5">
        <Calendar size={48} className="mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2">No Meetings Scheduled</h3>
        <p>Your guide has not scheduled any review meetings yet.</p>
      </div>
    </div>
  );
}
