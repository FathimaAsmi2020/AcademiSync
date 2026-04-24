import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileUploadPortalProps {
  projectId: string;
}

export function FileUploadPortal({ projectId }: FileUploadPortalProps) {
  const [file, setFile] = useState<File | null>(null);
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
      if (!user) throw new Error("Not authenticated");

      // 2. Upload file to Supabase storage bucket
      const filePath = `${projectId}/${category}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('academic_files')
        .upload(filePath, file);

      if (uploadError) {
        // Provide a clear message if the bucket doesn't exist
        if (uploadError.message?.includes('bucket') || uploadError.statusCode === '404') {
          throw new Error('Storage bucket not found. Please ask your admin to create the "academic_files" bucket in Supabase Storage.');
        }
        throw uploadError;
      }

      // 3. Get a signed URL (valid 10 years) for reliable staff downloads
      const { data: signedData } = await supabase.storage
        .from('academic_files')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10-year expiry

      // Fallback to public URL if signed URL fails
      const { data: { publicUrl } } = supabase.storage.from('academic_files').getPublicUrl(filePath);
      const fileUrl = signedData?.signedUrl || publicUrl;

      // 4. Save metadata to database
      const { error: dbError } = await supabase.from('file_uploads').insert({
        project_id: projectId,
        student_id: user.id,
        category,
        file_path: filePath,
        file_url: fileUrl,
        file_name: file.name,
        size_bytes: file.size,
      });

      if (dbError) {
        console.error("DB Error:", dbError);
        throw new Error("File uploaded, but failed to link to database. Ensure file_uploads table schema exists.");
      }

      setMessage({ text: 'File uploaded and linked successfully!', type: 'success' });
      setFile(null);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UploadCloud className="text-cobalt-light" />
          Multi-Category Upload Portal
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Upload project files, journals, and certifications directly to your guide.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider">File Category</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-navy-dark border border-white/20 rounded-xl p-3 outline-none focus:border-cobalt-light focus:bg-white/10 transition-all text-white shadow-lg appearance-none"
          >
            <option value="project_file">Project Files (.pdf, .zip)</option>
            <option value="ppt">Presentation Slide Deck (.pptx)</option>
            <option value="journal">Journal Report (.pdf)</option>
            <option value="certification">Course Certification (.pdf)</option>
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
          className="w-full py-4 rounded-xl bg-cobalt text-white font-bold hover:bg-cobalt-light transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><Loader2 size={20} className="animate-spin" /> Uploading...</>
          ) : (
            <><UploadCloud size={20} /> Secure Upload</>
          )}
        </button>
      </div>
    </motion.div>
  );
}
