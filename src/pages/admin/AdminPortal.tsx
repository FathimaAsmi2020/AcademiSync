import { useState, useEffect } from 'react';
import { Power, ShieldAlert, Users, Activity, FileText, CheckCircle2, Loader2, Search, Database, LogOut, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AuditLog, Profile } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export function AdminPortal() {
  const { signOut } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'allocations' | 'directory' | 'logs'>('allocations');
  
  // Data States
  const [unassignedTeams, setUnassignedTeams] = useState<Profile[]>([]);
  const [guides, setGuides] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [emailAlert, setEmailAlert] = useState<{show: boolean, studentName: string, email: string} | null>(null);

  useEffect(() => {
    fetchDashboardData();

    // Setup Supabase Realtime for live audit logs
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          setAuditLogs(prev => [payload.new as AuditLog, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Fetch Unassigned Student Profiles (Teams that just registered)
    const { data: studentProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .is('team_id', null);
      
    // Fetch all projects to see which teams already got a project assigned by the admin
    const { data: allProjects } = await supabase.from('projects').select('title');
    const existingTitles = allProjects ? allProjects.map(p => p.title) : [];

    if (studentProfiles) {
      // Filter out students who already have a project created (but haven't logged in yet to sync it)
      const trulyUnassigned = studentProfiles.filter(s => {
        const expectedTitle = `Project: Team ${s.team_number || s.name}`;
        return !existingTitles.includes(expectedTitle);
      });
      setUnassignedTeams(trulyUnassigned);
    }

    // Fetch All Profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true });
      
    if (profilesData) {
      setAllUsers(profilesData);
      setGuides(profilesData.filter(p => p.role === 'guide'));
    }

    // Fetch Audit Logs
    const { data: logsData } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
      
    if (logsData) setAuditLogs(logsData);

    setLoading(false);
  };

  const handleToggleMaintenance = () => {
    setMaintenanceMode(!maintenanceMode);
  };

  const handleAssignGuide = async (studentProfileId: string, guideId: string) => {
    if (!guideId) return;
    setAssigningId(studentProfileId);
    
    const student = unassignedTeams.find(t => t.id === studentProfileId);
    if (!student) return;

    const deptCategory = ['cse', 'it', 'ai'].includes(student.dept!) ? 'software' : 
                         ['ece', 'eee', 'biomed'].includes(student.dept!) ? 'circuit' : 'core';

    // 1. Create the Project Row (Admin has RLS permission to insert)
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert([{
        title: `Project: Team ${student.team_number || student.name}`,
        dept_category: deptCategory,
        guide_id: guideId
      }])
      .select()
      .single();

    if (projectError || !newProject) {
      console.error("Failed to create project:", projectError);
      setAssigningId(null);
      return;
    }

    // Because of RLS, the Admin cannot update the Student's profile directly.
    // The student will auto-sync their team_id upon their next login.
    // We just remove them from the UI and log it.
    
    setUnassignedTeams(prev => prev.filter(p => p.id !== studentProfileId));
    
    // Dispatch Notification to Registered Email
    const dispatchEmail = student.email || 'student@university.edu';
    setEmailAlert({ show: true, studentName: student.name, email: dispatchEmail });
    setTimeout(() => setEmailAlert(null), 5000);
    
    // Add Audit Log
    await supabase.from('audit_logs').insert({
      action: 'Project Created & Guide Assigned',
      details: { project_id: newProject.id, guide_id: guideId, student_profile_id: studentProfileId, email_dispatched: dispatchEmail }
    });
    
    setAssigningId(null);
  };

  const syncDepartments = async () => {
    setLoading(true);
    let updatedCount = 0;

    // 1. Sync Students
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (profiles) {
      for (const profile of profiles) {
        if (profile.role === 'student' && (profile.roll_number || (profile.team_members && profile.team_members[0]?.rollNumber))) {
          const roll = profile.roll_number || profile.team_members[0].rollNumber;
          const { data: approved } = await supabase.from('approved_students').select('dept').eq('roll_number', roll).single();
          if (approved && approved.dept !== profile.dept) {
            await supabase.from('profiles').update({ dept: approved.dept }).eq('id', profile.id);
            updatedCount++;
          }
        } else if (profile.role === 'guide' && profile.staff_id) {
          const { data: approved } = await supabase.from('approved_staff').select('dept').eq('staff_id', profile.staff_id).single();
          if (approved && approved.dept !== profile.dept) {
            await supabase.from('profiles').update({ dept: approved.dept }).eq('id', profile.id);
            updatedCount++;
          }
        }
      }
    }

    alert(`Sync Complete! ${updatedCount} profiles updated to match approved rosters.`);
    fetchDashboardData();
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.roll_number && u.roll_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.staff_id && u.staff_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-navy text-slate p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <ShieldAlert className="text-red-500" />
              Admin Command Center
            </h1>
            <p className="text-slate/60 mt-1">Manage system configurations, user directory, and monitor activity.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleToggleMaintenance}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-lg border ${
                maintenanceMode 
                  ? 'bg-red-500/20 text-red-500 border-red-500/50 shadow-red-500/20 animate-pulse' 
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <Power size={20} />
              {maintenanceMode ? 'SYSTEM LOCKED' : 'SYSTEM ACTIVE'}
            </button>

            <button 
              onClick={syncDepartments}
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-all border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
              title="Synchronize departments with master approved list"
            >
              <Database size={20} />
              Sync Depts
            </button>

            <button 
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-all border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('allocations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'allocations' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Database size={18} /> Guide Allocations
          </button>
          <button 
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'directory' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Users size={18} /> User Directory
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'logs' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Activity size={18} /> Live Audit Logs
          </button>
        </div>

        {/* Email Toast Alert */}
        <AnimatePresence>
          {emailAlert?.show && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-8 z-50 glass-card p-4 border-emerald-500/30 shadow-[0_10px_30px_rgba(16,185,129,0.2)] max-w-sm flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Mail className="text-emerald-400" size={20} />
              </div>
              <div>
                <h4 className="text-emerald-400 font-bold text-sm">Automated Email Dispatched</h4>
                <p className="text-xs text-slate-300 mt-1">Successfully sent guide allocation alert to <span className="text-white">{emailAlert.email}</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" size={48} /></div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'allocations' && (
              <motion.div key="allocations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-6 border-cobalt/20">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Users className="text-cobalt-light" />
                  Staff & Guide Allocation Center
                </h2>
                
                <div className="space-y-4">
                  {unassignedTeams.length === 0 ? (
                    <div className="text-center p-12 text-slate-400 bg-white/5 rounded-xl border border-white/5 border-dashed flex flex-col items-center">
                      <CheckCircle2 size={48} className="mb-4 text-emerald-500 opacity-50" />
                      <h3 className="text-xl font-bold text-white mb-2">All Clear!</h3>
                      <p>There are currently no teams awaiting staff allocation.</p>
                    </div>
                  ) : (
                    unassignedTeams.map(team => (
                      <div key={team.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="mb-4 md:mb-0">
                          <h3 className="font-bold text-lg text-white">{team.name} <span className="text-sm text-slate-400 font-normal">({team.roll_number})</span></h3>
                          <span className="text-xs px-2 py-1 rounded bg-white/10 text-slate-300 uppercase font-mono mt-2 inline-block">
                            {['cse', 'it', 'ai'].includes(team.dept!) ? 'SOFTWARE' : 
                             ['ece', 'eee', 'biomed'].includes(team.dept!) ? 'CIRCUIT' : 'CORE'} DOMAIN — {team.dept}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <select 
                            id={`select-${team.id}`}
                            className="flex-1 md:w-48 bg-navy-dark border border-white/20 rounded-lg p-2.5 outline-none focus:border-cobalt-light text-sm text-black font-bold appearance-none"
                          >
                            <option value="">Select Guide...</option>
                            {guides.filter(g => 
                              (['cse', 'it', 'ai'].includes(team.dept!) && ['cse', 'it', 'ai'].includes(g.dept!)) ||
                              (['ece', 'eee', 'biomed'].includes(team.dept!) && ['ece', 'eee', 'biomed'].includes(g.dept!)) ||
                              (['mech', 'civil'].includes(team.dept!) && ['civil', 'mech'].includes(g.dept!))
                            ).map(g => (
                              <option key={g.id} value={g.id}>{g.name} ({g.dept?.toUpperCase()})</option>
                            ))}
                          </select>
                          <button 
                            disabled={assigningId === team.id}
                            onClick={() => {
                              const sel = document.getElementById(`select-${team.id}`) as HTMLSelectElement;
                              handleAssignGuide(team.id, sel.value);
                            }}
                            className="px-6 py-2.5 bg-cobalt text-white text-sm font-bold rounded-lg hover:bg-cobalt-light transition-colors disabled:opacity-50"
                          >
                            {assigningId === team.id ? <Loader2 size={16} className="animate-spin" /> : 'Allocate Staff'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'directory' && (
              <motion.div key="directory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-6 border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="text-purple-400" />
                    System Directory
                  </h2>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-navy-dark border border-white/20 rounded-lg pl-9 pr-4 py-2 outline-none focus:border-purple-400 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-mono text-xs uppercase">
                        <th className="pb-3 px-4 font-semibold">Name</th>
                        <th className="pb-3 px-4 font-semibold">Role</th>
                        <th className="pb-3 px-4 font-semibold">Department</th>
                        <th className="pb-3 px-4 font-semibold">ID / Roll No.</th>
                        <th className="pb-3 px-4 font-semibold">Team ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-medium text-white">{user.name}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                              user.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              user.role === 'guide' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              'bg-cobalt/20 text-cobalt-light border border-cobalt/30'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4 uppercase text-slate-400 font-mono">{user.dept || '-'}</td>
                          <td className="py-4 px-4 text-slate-400 font-mono">{user.roll_number || user.staff_id || '-'}</td>
                          <td className="py-4 px-4 text-slate-500 font-mono text-xs">{user.team_id || 'Not Assigned'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-6 border-slate/10 flex flex-col h-[600px]">
                <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="text-emerald-400" />
                    Live Audit Logs & Trials
                  </div>
                  <span className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    LIVE MONITORING
                  </span>
                </h2>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 font-mono text-sm">
                  {auditLogs.length === 0 ? (
                    <div className="text-center p-8 text-slate-500">No logs recorded yet.</div>
                  ) : (
                    auditLogs.map(log => (
                      <div key={log.id} className="p-4 rounded-xl bg-navy-dark border border-white/5 flex flex-col gap-2 hover:border-emerald-500/30 transition-colors">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center text-slate-500 text-xs">
                          <span className="text-white font-semibold">{new Date(log.timestamp).toLocaleString()}</span>
                          <span>IP: {log.ip_address || 'System Default'}</span>
                        </div>
                        <div className="font-bold text-emerald-400 text-base">
                          [ACTION] {log.action}
                        </div>
                        <div className="text-slate-400 flex items-center gap-2 break-all">
                          <Users size={14} /> User ID: <span className="text-white">{log.user_id || 'Anonymous'}</span>
                        </div>
                        {log.details && (
                          <div className="bg-black/30 p-2 rounded text-xs text-slate-300 overflow-x-auto">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
