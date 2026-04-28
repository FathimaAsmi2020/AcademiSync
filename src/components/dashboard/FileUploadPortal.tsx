import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileUploadPortalProps {
  projectId: string;
}

export function FileUploadPortal({ projectId }: FileUploadPortalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [challengesOvercome, setChallengesOvercome] = useState('');
  const [overview, setOverview] = useState('');
  const [category, setCategory] = useState('project_file');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const getAcceptedFileTypes = () => {
    switch (category) {
      case 'project_file': return '.pdf,.zip';
      case 'ppt': return '.pptx';
      case 'journal': return '.pdf';
      case 'certification': return '.pdf';
      default: return '*/*';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage(null);

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication failed. Please sign in again.");

      // 2. Upload file (Sanitize filename to prevent "Failed to fetch" errors)
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${projectId}/${category}/${Date.now()}_${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from('academic_files')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage Error:", uploadError);
        throw new Error(`File Upload Failed: ${uploadError.message}. Check if "academic_files" bucket exists in Supabase Storage.`);
      }

      // 3. Get URL
      const { data: { publicUrl } } = supabase.storage.from('academic_files').getPublicUrl(filePath);

      // 4. Save metadata to database
      const { error: dbError } = await supabase.from('file_uploads').insert({
        project_id: projectId,
        student_id: user.id,
        category,
        file_path: filePath,
        file_url: publicUrl,
        file_name: file.name,
        size_bytes: file.size,
      });

      if (dbError) {
        console.error("Database Error (file_uploads):", dbError);
        throw new Error(`Database Error: Could not link file. ${dbError.message}`);
      }

      // 5. Update Project Metadata
      const updates: any = {};
      if (projectTitle.trim()) updates.title = projectTitle.trim();
      if (problemStatement.trim()) updates.problem_statement = problemStatement.trim();
      if (challengesOvercome.trim()) updates.challenges_overcome = challengesOvercome.trim();
      if (overview.trim()) updates.overview = overview.trim();

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', projectId);
        
        if (updateError) {
          console.error("Database Error (projects):", updateError);
          throw new Error(`Project Update Failed: ${updateError.message}. Did you run the ALTER TABLE SQL command?`);
        }
      }

      setMessage({ text: 'Project and files updated successfully!', type: 'success' });
      setFile(null);
      setProjectTitle('');
      setProblemStatement('');
      setChallengesOvercome('');
      setOverview('');
    } catch (err: any) {
      console.error("Detailed Upload Error:", err);
      setMessage({ text: err.message || "An unexpected error occurred", type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card p-8 border-cobalt/20 shadow-[0_0_30px_rgba(37,99,235,0.05)]"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
          <div className="p-2 bg-cobalt/20 rounded-lg text-cobalt-light">
            <UploadCloud size={24} />
          </div>
          Project Submission Center
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          Keep your project details updated for the public showcase and your guide reviews.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-8 flex items-start gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Project Metadata Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-black mb-2 text-slate-500 uppercase tracking-[0.2em]">Project Title</label>
            <input 
              type="text" 
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Smart Irrigation System using IoT"
              className="w-full bg-navy-dark border border-white/10 rounded-xl p-4 outline-none focus:border-cobalt-light focus:bg-white/5 transition-all text-white placeholder-slate-600 font-bold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black mb-2 text-slate-500 uppercase tracking-[0.2em]">Project Overview (Short Summary)</label>
            <textarea 
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="A brief high-level summary of your project..."
              className="w-full bg-navy-dark border border-white/10 rounded-xl p-4 outline-none focus:border-cobalt-light focus:bg-white/5 transition-all text-white placeholder-slate-600 text-sm min-h-[100px] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-2 text-slate-500 uppercase tracking-[0.2em]">Problem Statement</label>
            <textarea 
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="What specific problem are you solving?"
              className="w-full bg-navy-dark border border-white/10 rounded-xl p-4 outline-none focus:border-cobalt-light focus:bg-white/5 transition-all text-white placeholder-slate-600 text-sm min-h-[120px] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-2 text-slate-500 uppercase tracking-[0.2em]">Challenges & Solutions</label>
            <textarea 
              value={challengesOvercome}
              onChange={(e) => setChallengesOvercome(e.target.value)}
              placeholder="What challenges did you overcome?"
              className="w-full bg-navy-dark border border-white/10 rounded-xl p-4 outline-none focus:border-cobalt-light focus:bg-white/5 transition-all text-white placeholder-slate-600 text-sm min-h-[120px] resize-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <label className="block text-xs font-black mb-4 text-slate-500 uppercase tracking-[0.2em]">File Submission</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold mb-2 text-slate-500 uppercase">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-navy-dark border border-white/10 rounded-xl p-3 outline-none focus:border-cobalt-light transition-all text-white text-sm appearance-none"
              >
                <option value="project_file">Project Files (.pdf, .zip)</option>
                <option value="ppt">Slides (.pptx)</option>
                <option value="journal">Journal (.pdf)</option>
                <option value="certification">Certificate (.pdf)</option>
              </select>
            </div>

        <div className="relative group">
          <input 
            type="file" 
            accept={getAcceptedFileTypes()}
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center gap-4 ${
            file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/20 bg-white/5 group-hover:border-cobalt-light group-hover:bg-white/10'
          }`}>
            {file ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileText size={32} />
                </div>
                <div>
                  <p className="font-bold text-emerald-400">{file.name}</p>
                  <p className="text-sm text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-cobalt-light group-hover:bg-cobalt/10 transition-all">
                  <UploadCloud size={32} />
                </div>
                <div>
                  <p className="font-bold text-white mb-1">Click or drag file to upload</p>
                  <p className="text-sm text-slate-400">Maximum file size 50MB</p>
                </div>
              </>
            )}
          </div>
        </div>

        <button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="w-full py-4 mt-6 rounded-xl bg-cobalt text-white font-bold hover:bg-cobalt-light transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><Loader2 size={20} className="animate-spin" /> Uploading...</>
          ) : (
            <><UploadCloud size={20} /> Secure Upload</>
          )}
        </button>
      </div>
    </div>
  </div>
</motion.div>
  );
}
