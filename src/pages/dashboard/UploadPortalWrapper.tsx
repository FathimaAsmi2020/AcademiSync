import { useState, useEffect } from 'react';
import { FileUploadPortal } from '../../components/dashboard/FileUploadPortal';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function UploadPortalWrapper() {
  const { profile, loading } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.team_id) {
      setProjectId(profile.team_id);
    }
  }, [profile]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-cobalt" /></div>;
  }

  if (!projectId) {
    return (
      <div className="animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Secure File Upload</h2>
        <div className="glass-card p-12 text-center text-slate-400 border-white/5">
          <h3 className="text-xl font-bold text-white mb-2">No Active Project</h3>
          <p>You cannot upload files because you are not currently assigned to a project. Please contact your guide.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold tracking-tight mb-6">Secure File Upload</h2>
      <FileUploadPortal projectId={projectId} />
    </div>
  );
}
