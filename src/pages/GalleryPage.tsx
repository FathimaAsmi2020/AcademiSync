import { ProjectGallery } from '../components/landing/ProjectGallery';
import { Navbar } from '../components/ui/Navbar';
import { motion } from 'framer-motion';
import { LayoutGrid, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function GalleryPage() {
  return (
    <div className="min-h-screen bg-navy text-slate font-sans selection:bg-cobalt/30">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-12"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group">
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                  <LayoutGrid className="text-cobalt-light" size={40} />
                  Public <span className="text-cobalt-light">Gallery</span>
                </h1>
                <p className="text-slate-400 mt-4 max-w-xl text-lg">
                  Explore the full archive of projects. Monitor progress, version history, and student updates in real-time.
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="glass-card px-6 py-4 border-white/5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-emerald-400 font-black tracking-tight">LIVE UPDATES</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Render the Gallery Component */}
          <div className="rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            <ProjectGallery />
          </div>
        </div>
      </div>
    </div>
  );
}
