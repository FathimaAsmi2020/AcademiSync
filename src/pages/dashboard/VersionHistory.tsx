import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { FileText, Loader2 } from 'lucide-react';

export function VersionHistory() {
  const { profile } = useAuth();
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUploads = async () => {
      if (!profile?.team_id) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('project_id', profile.team_id)
        .order('uploaded_at', { ascending: false });
        
      if (!error && data) {
        setUploads(data);
      }
      setLoading(false);
    };
    fetchUploads();
  }, [profile]);

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold tracking-tight mb-6">Version History</h2>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-cobalt" /></div>
      ) : uploads.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No files have been uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {uploads.map((file, idx) => (
            <div key={file.id} className="glass-card p-4 flex items-center justify-between border-white/5 hover:border-cobalt/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-cobalt/10 text-cobalt-light flex items-center justify-center font-bold">
                  #{uploads.length - idx}
                </div>
                <div>
                  <p className="font-bold text-white">{file.file_name}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    Category: {file.category.replace('_', ' ')} • Size: {(file.size_bytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="text-sm text-slate-500 font-mono">
                {new Date(file.uploaded_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
