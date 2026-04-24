import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Code, Cpu, Hammer, ShieldCheck, Zap, Globe, Lock, BarChart3, Users } from 'lucide-react';
import { Navbar } from '../components/ui/Navbar';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

export function LandingPage() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  return (
    <div className="min-h-screen bg-navy text-slate font-sans selection:bg-cobalt/30 overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section ref={targetRef} className="relative pt-40 pb-20 px-6 min-h-screen flex items-center overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cobalt/20 rounded-full blur-[140px] pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" 
        />
        
        <motion.div 
          style={{ opacity, scale, y }}
          className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10"
        >
          <div className="flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass w-fit border-cobalt/30 bg-cobalt/10 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
            >
              <Zap size={16} className="text-cobalt-light" />
              <span className="text-sm font-bold uppercase tracking-widest text-cobalt-light">Next-Gen Academic Portal</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-7xl md:text-8xl font-extrabold tracking-tighter leading-[0.9]"
            >
              Master your <br />
              <span className="text-gradient">Potential.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl text-slate/60 max-w-lg leading-relaxed font-medium"
            >
              AcademiSync Pro orchestrates student projects across all departments. From code reviews to mechanical blueprints, experience seamless collaboration.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap items-center gap-6 pt-4"
            >
              <Link to="/register" className="group px-10 py-5 rounded-2xl bg-cobalt text-white font-bold text-lg hover:bg-cobalt-light transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)] flex items-center gap-2 active:scale-95">
                Start Project
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#features" className="px-10 py-5 rounded-2xl glass font-bold text-lg hover:bg-white/10 transition-all border-white/5 active:scale-95">
                Features
              </a>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            {/* Visual Dashboard Card */}
            <div className="glass-card p-2 rounded-[2rem] border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] overflow-hidden">
               <div className="bg-navy-dark rounded-[1.5rem] p-8 aspect-square lg:aspect-auto lg:h-[500px] relative overflow-hidden">
                  <div className="flex gap-2 mb-8">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  
                  <div className="space-y-6">
                    <div className="h-4 w-1/3 bg-white/10 rounded-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-32 rounded-2xl bg-white/5 border border-white/5" />
                      <div className="h-32 rounded-2xl bg-cobalt/20 border border-cobalt/30" />
                    </div>
                    <div className="h-4 w-2/3 bg-white/5 rounded-full" />
                    <div className="h-24 rounded-2xl bg-white/2 border border-white/5" />
                  </div>

                  {/* Floating Notification */}
                  <motion.div 
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-10 right-10 glass-card p-5 border-emerald-500/30 flex items-center gap-4 shadow-2xl"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <ShieldCheck className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Review Level 4</p>
                      <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">Gate Cleared</p>
                    </div>
                  </motion.div>
               </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="text-center mb-24"
          >
            <motion.h2 variants={itemVariants} className="text-5xl font-extrabold mb-6 tracking-tight">Core <span className="text-gradient">Capabilities.</span></motion.h2>
            <motion.p variants={itemVariants} className="text-slate/50 max-w-2xl mx-auto text-lg">Standardized review systems designed for modern academic institutions.</motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: Globe, title: "Real-time Auditing", desc: "Every action is logged for complete transparency across departments." },
              { icon: Users, title: "Smart Scheduling", desc: "Automated meeting coordination between guides and project teams." },
              { icon: BarChart3, title: "Version Control", desc: "Track project evolution with full history and versioned feedback." },
              { icon: Lock, title: "Academic Security", desc: "Secure multi-role access with role-based dashboard filtering." }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="glass-card p-8 border-white/5 hover:border-cobalt/30 transition-all hover:bg-white/[0.05]"
              >
                <div className="w-12 h-12 rounded-xl bg-cobalt/10 flex items-center justify-center mb-6">
                  <feature.icon size={24} className="text-cobalt-light" />
                </div>
                <h4 className="text-lg font-bold text-white mb-3">{feature.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Departments Section */}
      <section id="departments" className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <h2 className="text-5xl font-extrabold mb-6 tracking-tight">Unified <span className="text-gradient">Adaptability.</span></h2>
              <p className="text-slate/50 text-lg leading-relaxed">Whether you're developing software or building physical prototypes, AcademiSync adapts to your department's specific needs.</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-4"
            >
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-sm">3 Departments</div>
              <div className="p-4 rounded-2xl bg-cobalt/10 border border-cobalt/20 text-cobalt-light font-bold text-sm">Infinite Projects</div>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Code, title: "Software Group", desc: "CSE, IT, AI. Focused on code milestones and version-controlled review cycles.", color: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: Hammer, title: "Core Engineering", desc: "Mechanical, Civil. Integrated project tracking with registered department headers.", color: "text-orange-400", bg: "bg-orange-500/10" },
              { icon: Cpu, title: "Circuit Systems", desc: "ECE, EEE, Bio. Specialized review workflows for circuit and hardware systems.", color: "text-emerald-400", bg: "bg-emerald-500/10" }
            ].map((dept, i) => (
              <motion.div 
                key={dept.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-10 group relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/2 rounded-full blur-2xl group-hover:bg-white/5 transition-all" />
                <div className={`w-16 h-16 rounded-2xl ${dept.bg} flex items-center justify-center mb-8 shadow-inner`}>
                  <dept.icon className={dept.color} size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{dept.title}</h3>
                <p className="text-slate/50 leading-relaxed text-sm font-medium">{dept.desc}</p>
                <div className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-white transition-all">
                  Explore Domain <ArrowRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Gate Section */}
      <section id="gate" className="py-32 px-6 relative bg-navy-dark overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-navy via-navy-dark to-navy opacity-50" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="glass-card p-10 border-cobalt/20 shadow-[0_0_80px_rgba(37,99,235,0.1)] relative">
               <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-pulse" />
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">The Gate System</h3>
               </div>
               <div className="space-y-8">
                  {[0, 1, 2, 3, 4].map(i => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-6 group"
                    >
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-sm transition-all ${i === 4 ? 'bg-cobalt border-cobalt text-white shadow-lg' : 'border-white/10 text-slate-600 group-hover:border-white/30'}`}>
                        {i}
                      </div>
                      <div className="flex-1">
                        <div className={`h-2 rounded-full bg-white/5 overflow-hidden w-full`}>
                          {i === 4 && <motion.div initial={{ width: 0 }} whileInView={{ width: "100%" }} transition={{ duration: 1 }} className="h-full bg-cobalt" />}
                        </div>
                      </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-6xl font-black mb-8 leading-[0.85] tracking-tighter italic">Rigorous <br /><span className="text-gradient">Quality.</span></h2>
            <p className="text-xl text-slate/60 mb-10 leading-relaxed font-medium">
              Our proprietary review system ensures every project passes through five distinct quality gates. 
              From conceptualization to final validation, experience the most rigorous review workflow in academia.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-3xl font-black text-white mb-2">5</h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Levels of Review</p>
              </div>
              <div>
                <h4 className="text-3xl font-black text-white mb-2">100%</h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accountability</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer / CTA */}
      <section className="py-32 px-6 text-center bg-navy">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass-card p-20 border-cobalt/20 shadow-[0_0_100px_rgba(37,99,235,0.1)] relative overflow-hidden"
        >
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-cobalt/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
          
          <h2 className="text-5xl font-black mb-8 tracking-tighter text-white">Ready to sync?</h2>
          <p className="text-lg text-slate/60 mb-12 max-w-lg mx-auto font-medium">Join hundreds of students and guides in the next evolution of academic project management.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register" className="px-12 py-5 rounded-2xl bg-cobalt text-white font-black text-xl hover:bg-cobalt-light transition-all shadow-2xl active:scale-95">
              Get Started Now
            </Link>
            <Link to="/login" className="px-12 py-5 rounded-2xl glass text-white font-bold text-xl hover:bg-white/10 transition-all border-white/10 active:scale-95">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
