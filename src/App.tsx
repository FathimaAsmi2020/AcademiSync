import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { StudentMilestones } from './pages/dashboard/StudentMilestones';
import { VersionHistory } from './pages/dashboard/VersionHistory';
import { UploadPortalWrapper } from './pages/dashboard/UploadPortalWrapper';
import { AdminPortal } from './pages/admin/AdminPortal';
import { SubmissionReviews } from './pages/dashboard/SubmissionReviews';
import { StaffReviews } from './pages/dashboard/StaffReviews';
import { StaffMeetings } from './pages/dashboard/StaffMeetings';
import { GalleryPage } from './pages/GalleryPage';

import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes for authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="milestones" element={<StudentMilestones />} />
          <Route path="history" element={<VersionHistory />} />
          <Route path="uploads" element={<UploadPortalWrapper />} />
          <Route path="meetings" element={<StaffMeetings />} />
          <Route path="staff-meetings" element={<StaffMeetings />} />
          <Route path="staff-reviews" element={<StaffReviews />} />
          <Route path="reviews/:projectId" element={<SubmissionReviews />} />
        </Route>
      </Route>
      
      {/* Admin Only Route */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route path="/admin" element={<AdminPortal />} />
      </Route>
    </Routes>
  );
}

export default App;
