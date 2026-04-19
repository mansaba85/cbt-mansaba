import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import InstallWizard from './pages/InstallWizard';
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import QuestionsHub from './pages/admin/QuestionsHub';
import ModulesManager from './pages/admin/ModulesManager';
import SubjectsManager from './pages/admin/SubjectsManager';
import UserImportWizard from './components/admin/users/UserImportWizard';
import UsersManager from './pages/admin/UsersManager';
import GroupsManager from './pages/admin/GroupsManager';
import ExamsManager from './pages/admin/ExamsManager';
import ResultsManager from './pages/admin/ResultsManager';
import ItemAnalysis from './pages/admin/ItemAnalysis';

import SubjectModulesManager from './pages/admin/SubjectModulesManager';

import GradingManager from './pages/admin/GradingManager';
import AttendanceManager from './pages/admin/AttendanceManager';
import UserResultDetail from './pages/admin/UserResultDetail';
import UserResultSelector from './pages/admin/UserResultSelector';
import ForceLogoutManager from './pages/admin/ForceLogoutManager';
import ResetParticipantManager from './pages/admin/ResetParticipantManager';
import GeneralSettings from './pages/admin/GeneralSettings';
import BackupRestore from './pages/admin/BackupRestore';
import Proctoring from './pages/admin/Proctoring';
import ParticipantCards from './pages/admin/ParticipantCards';
import AttendanceFormPage from './pages/admin/AttendanceFormPage';
import AdminProfile from './pages/admin/AdminProfile';
import StudentLayout from './components/layout/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import ExamPage from './pages/student/ExamPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from 'sonner';
import { ConfirmProvider } from './components/ui/ConfirmContext';

import { API_BASE_URL } from './config/api';

function App() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = () => {
      fetch(`${API_BASE_URL}/api/install/status`)
        .then(res => res.json())
        .then(data => setIsInstalled(data.installed))
        .catch(err => {
          console.error("Gagal memeriksa status instalasi, mencoba kembali dalam 2 detik...", err);
          setTimeout(checkStatus, 2000);
        });
    };
    checkStatus();
  }, []);

  if (isInstalled === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isInstalled) {
    return <InstallWizard />;
  }

  // Helper component untuk redirect halaman root
  const HomeRedirect = () => {
    const userJson = localStorage.getItem('cbt_user');
    if (!userJson || userJson === 'undefined') {
      return <Navigate to="/login" replace />;
    }
    try {
      const user = JSON.parse(userJson);
      if (user.levelInt >= 7) {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/student" replace />;
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  };

  return (
    <ConfirmProvider>
      <Toaster position="top-right" richColors expand={false} closeButton />
      <Router>
        <Routes>
          {/* Auth Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Home Redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Student Routes */}
          <Route element={<ProtectedRoute requiredLevel={1} />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
            </Route>
            <Route path="/student/exam/:id" element={<ExamPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute requiredLevel={7} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardHome />} />
              
              {/* Sub-menu Pengguna */}
              <Route path="users">
                <Route index element={<UsersManager />} />
                <Route path="groups" element={<GroupsManager />} />
                <Route path="cards" element={<ParticipantCards />} />
                <Route path="import" element={<div className="p-4"><UserImportWizard onComplete={() => window.location.href = '/admin/users'} /></div>} />
              </Route>

              {/* Sub-menu Tes */}
              <Route path="exams">
                <Route path="list" element={<ExamsManager />} />
                <Route path="grading" element={<GradingManager />} />
                <Route path="results" element={<ResultsManager />} />
                <Route path="analysis" element={<ItemAnalysis />} />
                <Route path="results/review/:id" element={<UserResultDetail />} />
                <Route path="results/selector" element={<UserResultSelector />} />
                <Route path="attendance" element={<AttendanceManager />} />
                <Route path="attendance-form" element={<AttendanceFormPage />} />
                <Route path="force-logout" element={<ForceLogoutManager />} />
                <Route path="reset-participant" element={<ResetParticipantManager />} />
                <Route path="preview" element={<StudentDashboard isAdminView={true} />} />
              </Route>

              <Route path="proctoring" element={<Proctoring />} />
              
              {/* Sub-menu Modul (Terpadu) */}
              <Route path="questions">
                 <Route index element={<QuestionsHub />} />
                 <Route path="master" element={<SubjectModulesManager />} />
                 <Route path="import" element={<QuestionsHub initialImport={true} />} />
              </Route>

              <Route path="grades" element={<div className="p-8"><h1 className="text-2xl font-bold">Pusat Nilai</h1><p className="mt-4 text-slate-500">Akan hadir pada Fase 5.</p></div>} />
              <Route path="tools" element={<div className="p-8"><h1 className="text-2xl font-bold">Alat Administrasi</h1><p className="mt-4 text-slate-500">Segera hadir.</p></div>} />
              <Route path="maintenance" element={<div className="p-8"><h1 className="text-2xl font-bold">Pemeliharaan</h1><p className="mt-4 text-slate-500">Segera hadir.</p></div>} />
              <Route path="settings/general" element={<GeneralSettings />} />
              <Route path="settings/backup" element={<BackupRestore />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<div className="h-screen flex items-center justify-center">404 - Halaman Tidak Ditemukan</div>} />
        </Routes>
      </Router>
    </ConfirmProvider>
  );
}

export default App;
