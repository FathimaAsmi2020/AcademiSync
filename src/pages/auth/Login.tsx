import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { GraduationCap, ArrowRight, CheckCircle2, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed attempt
        await supabase.from('audit_logs').insert({
          action: 'Failed Login Attempt',
          details: { email, reason: error.message }
        });

        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Incorrect email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before logging in. Check your inbox.');
        } else {
          throw error;
        }
      }
      if (data.user) {
        // Log successful login
        await supabase.from('audit_logs').insert({
          action: 'Successful Login',
          user_id: data.user.id,
          details: { email }
        });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (profile?.role === 'admin') {
          navigate('/admin');
          return;
        }
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
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
          <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
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
            Welcome Back to Your Command Center
          </h1>
          <p className="text-slate/60 text-lg leading-relaxed max-w-md">
            Sign in to access your project timelines, submit your latest milestones, and review feedback from your department guides.
          </p>
        </div>

        <div className="relative z-10 glass-card p-6 border-white/5">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <CheckCircle2 size={20} />
            <span className="font-medium">Secure Connection</span>
          </div>
          <p className="text-sm text-slate/50">Your session is protected by enterprise-grade encryption.</p>
        </div>
      </div>

      {/* Login Form Right Side */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-6 lg:hidden">
              <LogIn size={24} className="text-cobalt-light" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-slate/50">Enter your credentials to access your dashboard.</p>
          </div>
          
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="new-password"
                className="w-full bg-navy-dark border border-white/20 rounded-xl p-3.5 outline-none focus:border-cobalt-light focus:bg-white/10 transition-all text-white placeholder-slate-500" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs text-cobalt-light hover:text-white transition-colors">Forgot password?</a>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                className="w-full bg-navy-dark border border-white/20 rounded-xl p-3.5 outline-none focus:border-cobalt-light focus:bg-white/10 transition-all text-white placeholder-slate-500" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 mt-4 rounded-xl bg-cobalt text-white font-bold text-lg hover:bg-cobalt-light transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] disabled:opacity-50 flex items-center justify-center gap-2 group">
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate/50">
            Don't have a team account yet? <Link to="/register" className="text-white hover:text-cobalt-light transition-colors font-medium">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
