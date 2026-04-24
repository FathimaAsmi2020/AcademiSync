import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { GraduationCap, Briefcase, Plus, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Register() {
  const [role, setRole] = useState<'student' | 'guide'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  
  // Student specific state
  const [teamNumber, setTeamNumber] = useState('');
  const [members, setMembers] = useState([{ name: '', rollNumber: '' }]);
  
  // Staff specific state
  const [staffId, setStaffId] = useState('');
  const [staffName, setStaffName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAddMember = () => {
    if (members.length < 4) {
      setMembers([...members, { name: '', rollNumber: '' }]);
    }
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: 'name' | 'rollNumber', value: string) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const validateRollNumber = (roll: string) => {
    const regex = /^[A-Za-z0-9]{5,15}$/;
    return regex.test(roll);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. VERIFY AGAINST DATABASE ROSTERS
      if (role === 'student') {
        for (const member of members) {
          if (!validateRollNumber(member.rollNumber)) {
            throw new Error(`Invalid format for roll number ${member.rollNumber}. Must be alphanumeric.`);
          }
          
          const { data: studentData, error: studentError } = await supabase
            .from('approved_students')
            .select('*')
            .eq('roll_number', member.rollNumber)
            .single();
            
          if (studentError || !studentData) {
            throw new Error(`Roll number ${member.rollNumber} is not recognized in the university database.`);
          }
          if (studentData.is_registered) {
            throw new Error(`Roll number ${member.rollNumber} is already registered to a team.`);
          }
        }
      } else {
        const { data: staffData, error: staffError } = await supabase
          .from('approved_staff')
          .select('*')
          .eq('staff_id', staffId)
          .single();
          
        if (staffError || !staffData) {
          throw new Error(`Staff ID ${staffId} is not recognized in the system.`);
        }
        if (staffData.is_registered) {
          throw new Error(`Staff ID ${staffId} has already registered an account.`);
        }
      }

      // 2. CREATE AUTH ACCOUNT
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // 3. CREATE PROFILE
        const profileData: any = {
          id: data.user.id,
          role: role,
          dept: department,
          name: role === 'student' ? `Team ${teamNumber}` : staffName,
        };

        if (role === 'student') {
          profileData.team_number = teamNumber;
          profileData.roll_number = members[0]?.rollNumber;
          profileData.team_members = members;
        } else {
          profileData.staff_id = staffId;
        }

        const { error: profileError } = await supabase.from('profiles').insert([profileData]);
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
          throw new Error(`Database Error: ${profileError.message} (Hint: Make sure you ran the ALTER TABLE command in Supabase)`);
        }

        // 4. MARK AS REGISTERED IN MASTER ROSTERS
        if (role === 'student') {
          for (const member of members) {
            await supabase.from('approved_students')
              .update({ is_registered: true })
              .eq('roll_number', member.rollNumber);
          }
        } else {
          await supabase.from('approved_staff')
            .update({ is_registered: true })
            .eq('staff_id', staffId);
        }
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-navy text-slate font-sans selection:bg-cobalt/30">
      
      {/* Decorative Left Side */}
      <div className="hidden lg:flex w-5/12 bg-navy-dark relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-cobalt/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cobalt-light to-cobalt flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Academi<span className="text-cobalt-light">Sync</span></span>
          </Link>
          
          <h1 className="text-4xl font-bold leading-tight mb-6 text-white">
            Join the Next Generation of Academic Innovation
          </h1>
          <p className="text-slate/60 text-lg leading-relaxed max-w-md">
            Whether you are building the next big software application or tracking complex civil blueprints, AcademiSync Pro adapts to your workflow.
          </p>
        </div>

        <div className="relative z-10 glass-card p-6 border-white/5">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <CheckCircle2 size={20} />
            <span className="font-medium">Strict Verification Enabled</span>
          </div>
          <p className="text-sm text-slate/50">All registrations are cross-referenced with the university's master records.</p>
        </div>
      </div>

      {/* Registration Form Right Side */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Create an Account</h2>
            <p className="text-slate/50">Register your team or staff profile to get started.</p>
          </div>
          
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-6" autoComplete="off">
            
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4 p-1.5 bg-white/5 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${role === 'student' ? 'bg-cobalt text-white shadow-lg shadow-cobalt/20' : 'text-slate-400 hover:text-white'}`}
              >
                <GraduationCap size={18} /> Student Team
              </button>
              <button
                type="button"
                onClick={() => setRole('guide')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${role === 'guide' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-white'}`}
              >
                <Briefcase size={18} /> Staff / Guide
              </button>
            </div>

            {/* Common Auth Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="new-password"
                  className="w-full bg-navy-dark border border-white/20 rounded-xl p-3 outline-none focus:border-cobalt-light focus:bg-white/10 transition-all text-white placeholder-slate-500" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password"
                  className="w-full bg-navy-dark border border-white/20 rounded-xl p-3 outline-none focus:border-cobalt-light focus:bg-white/10 transition-all text-white placeholder-slate-500" />
              </div>
              <div className="md:col-span-2 relative z-50">
                <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider">Select Department</label>
                <select 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)} 
                  required
                  className={`w-full border rounded-xl p-3 outline-none transition-all appearance-none font-bold shadow-lg ${
                    department 
                      ? 'bg-cobalt text-white border-cobalt-light' 
                      : 'bg-navy-dark text-slate-400 border-white/20'
                  }`}
                >
                  <option value="" disabled>-- Choose Department --</option>
                  <option value="it">Information Technology (IT)</option>
                  <option value="cse">Computer Science (CSE)</option>
                  <option value="ai">Artificial Intelligence (AI)</option>
                  <option value="mech">Mechanical Engineering</option>
                  <option value="civil">Civil Engineering</option>
                  <option value="ece">Electronics & Communication (ECE)</option>
                  <option value="eee">Electrical & Electronics (EEE)</option>
                  <option value="biomed">Bio-Medical</option>
                </select>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Dynamic Role Fields */}
            <AnimatePresence mode="wait">
              {role === 'student' ? (
                <motion.div key="student" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                  <div>
                    <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider">Team Number / ID</label>
                    <input type="text" value={teamNumber} onChange={(e) => setTeamNumber(e.target.value)} required placeholder="e.g. T-104" autoComplete="off"
                      className="w-full bg-navy-dark border border-white/20 rounded-xl p-3 outline-none focus:border-cobalt-light focus:bg-white/10 transition-all text-white placeholder-slate-500" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Team Members</label>
                      {members.length < 4 && (
                        <button type="button" onClick={handleAddMember} className="text-xs text-cobalt-light flex items-center gap-1 hover:text-white transition-colors">
                          <Plus size={14} /> Add Member
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {members.map((member, idx) => (
                        <div key={idx} className="flex gap-3 items-start group">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <input type="text" value={member.name} onChange={(e) => handleMemberChange(idx, 'name', e.target.value)} required placeholder="Full Name" autoComplete="off"
                              className="w-full bg-navy-dark border border-white/20 rounded-xl p-2.5 text-sm outline-none focus:border-cobalt-light focus:bg-white/10 transition-all text-white placeholder-slate-500" />
                            <input type="text" value={member.rollNumber} onChange={(e) => handleMemberChange(idx, 'rollNumber', e.target.value)} required placeholder="Roll Number" autoComplete="off"
                              className="w-full bg-navy-dark border border-white/20 rounded-xl p-2.5 text-sm outline-none focus:border-cobalt-light focus:bg-white/10 transition-all text-white placeholder-slate-500" />
                          </div>
                          {members.length > 1 && (
                            <button type="button" onClick={() => handleRemoveMember(idx)} className="p-2.5 rounded-xl border border-transparent text-slate/60 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="guide" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                  <div>
                    <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider">Full Name with Title</label>
                    <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} required placeholder="e.g. Dr. Jane Smith" autoComplete="off"
                      className="w-full bg-navy-dark border border-white/20 rounded-xl p-3 outline-none focus:border-cobalt-light focus:bg-white/10 transition-all text-white placeholder-slate-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider">Staff ID / Roll Number</label>
                    <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} required placeholder="e.g. STF-2024" autoComplete="off"
                      className="w-full bg-navy-dark border border-white/20 rounded-xl p-3 outline-none focus:border-cobalt-light focus:bg-white/10 transition-all text-white placeholder-slate-500" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading} className="w-full py-4 mt-8 rounded-xl bg-cobalt text-white font-bold text-lg hover:bg-cobalt-light transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] disabled:opacity-50 flex items-center justify-center gap-2 group">
              {loading ? 'Verifying & Processing...' : 'Complete Registration'}
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate/50">
            Already have an account? <Link to="/login" className="text-white hover:text-cobalt-light transition-colors font-medium">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
