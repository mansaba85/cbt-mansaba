import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Monitor } from 'lucide-react';
import { useConfirm } from '../ui/ConfirmContext';

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Ambil data siswa asli dari localStorage
  const [currentStudent, setCurrentStudent] = React.useState({
    name: 'Student',
    username: '-',
    group: '-'
  });

  const [siteName, setSiteName] = React.useState('CBT MANSABA');

  React.useEffect(() => {
    // Site settings
    const savedSite = localStorage.getItem('cbt_site_settings');
    if (savedSite) {
      const site = JSON.parse(savedSite);
      if (site.siteName) setSiteName(site.siteName);
    }

    // User session
    const savedUser = localStorage.getItem('cbt_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentStudent({
            name: user.fullName || 'Student',
            username: user.username || '-',
            group: user.level || 'STUDENT'
        });
    }
  }, []);

  const handleLogout = async () => {
    const isConfirmed = await confirm({
        title: 'Konfirmasi Keluar',
        message: 'Apakah Anda yakin ingin keluar dari aplikasi ujian? Sesi Anda akan berakhir.',
        type: 'danger',
        confirmLabel: 'Keluar Sekarang',
        cancelLabel: 'Batal'
    });

    if (isConfirmed) {
        console.log("Student Logout triggered");
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Logo & App Name */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-md">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-slate-800 text-sm tracking-tighter hidden sm:block">{siteName}</span>
          </div>

          {/* Student Info & Logout */}
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-slate-100 rounded-xl overflow-hidden max-w-[180px] sm:max-w-none">
              <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-[10px] font-bold text-white uppercase italic">
                  {currentStudent.name.substring(0, 2)}
                </span>
              </div>
              <div className="leading-tight truncate">
                <p className="text-[10px] sm:text-[11px] font-black text-slate-800 uppercase truncate">{currentStudent.name}</p>
                <p className="text-[9px] text-slate-500 font-bold truncate">{currentStudent.username}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center sm:gap-1.5 w-10 sm:w-auto h-10 sm:h-auto px-2 sm:px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer relative z-50 shadow-sm active:scale-95"
              title="Logout"
            >
              <LogOut className="w-5 h-5 sm:w-3.5 sm:h-3.5" /> 
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
