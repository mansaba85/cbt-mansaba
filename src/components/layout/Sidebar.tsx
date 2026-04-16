import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  User,
  UserPlus,
  MonitorPlay, 
  Database, 
  ChevronDown,
  Layers,
  FilePlus,
  FileUp,
  ClipboardList,
  FileText,
  BarChart3,
  Edit3,
  X,
  Settings,
  LogOut,
  RotateCcw,
  SlidersHorizontal,
  HardDrive,
  Eye,
  CreditCard,
  Printer as PrinterIcon,
  TrendingUp
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

interface MenuItem {
  id: number;
  name: string;
  icon: any;
  path?: string;
  subItems?: { name: string; path: string; icon: any }[];
}

const menuItems: MenuItem[] = [
  { id: 1, name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { 
    id: 2, 
    name: 'Pengguna & Grup', 
    icon: Users, 
    subItems: [
      { name: 'Daftar Pengguna', path: '/admin/users', icon: User },
      { name: 'Grup / Kelas', path: '/admin/users/groups', icon: Users },
      { name: 'Cetak Kartu Peserta', path: '/admin/users/cards', icon: CreditCard },
      { name: 'Impor Pengguna', path: '/admin/users/import', icon: UserPlus },
    ]
  },
  { 
    id: 3, 
    name: 'Proctoring', 
    icon: MonitorPlay, 
    subItems: [
      { name: 'Pengawasan Langsung', path: '/admin/proctoring', icon: Eye },
      { name: 'Logout & Kunci Paksa', path: '/admin/exams/force-logout', icon: LogOut },
      { name: 'Reset Peserta', path: '/admin/exams/reset-participant', icon: RotateCcw },
    ]
  },
  { 
    id: 4, 
    name: 'Manajemen Modul', 
    icon: Database,
    subItems: [
      { name: 'Master Modul & Topik', path: '/admin/questions/master', icon: Layers },
      { name: 'Bank Soal', path: '/admin/questions', icon: FilePlus },
      { name: 'Import Soal Word', path: '/admin/questions/import', icon: FileUp },
    ]
  },
  { 
    id: 5, 
    name: 'Tes', 
    icon: ClipboardList, 
    subItems: [
      { name: 'Daftar Tes', path: '/admin/exams/list', icon: FileText },
      { name: 'Koreksi Essay', path: '/admin/exams/grading', icon: Edit3 },
      { name: 'Hasil Tes Semua User', path: '/admin/exams/results', icon: BarChart3 },
      { name: 'Analisis Butir Soal', path: '/admin/exams/analysis', icon: TrendingUp },
      { name: 'Hasil Tes per User', path: '/admin/exams/results/selector', icon: FileText },
      { name: 'Kehadiran Tes', path: '/admin/exams/attendance', icon: Users },
      { name: 'Cetak Daftar Hadir (Form)', path: '/admin/exams/attendance-form', icon: PrinterIcon },
    ]
  },
  {
    id: 7,
    name: 'Pengaturan',
    icon: Settings,
    subItems: [
      { name: 'General Settings', path: '/admin/settings/general', icon: SlidersHorizontal },
      { name: 'Backup & Restore', path: '/admin/settings/backup', icon: HardDrive },
      { name: 'Pemeliharaan', path: '/admin/maintenance', icon: Settings },
    ]
  },
  {
    id: 8,
    name: 'Tampilan Publik',
    icon: Eye,
    subItems: [
      { name: 'Simulasi/Ujicoba Halaman Tes', path: '/admin/exams/preview', icon: MonitorPlay }
    ]
  }
];

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(4);
  const [siteName, setSiteName] = useState('CBT MANSABA');
  const [adminName, setAdminName] = useState('Admin User');

  React.useEffect(() => {
    try {
        const savedSite = localStorage.getItem('cbt_site_settings');
        if (savedSite) {
          const site = JSON.parse(savedSite);
          if (site.siteName) setSiteName(site.siteName);
        }
        
        const savedUser = localStorage.getItem('cbt_user');
        if (savedUser && savedUser !== 'undefined') {
           const user = JSON.parse(savedUser);
           if (user.fullName) setAdminName(user.fullName);
        }
    } catch(e) {
        console.error("Sidebar UI Error:", e);
    }
  }, []);

  const toggleSubmenu = (id: number) => {
    setOpenSubmenu(openSubmenu === id ? null : id);
  };

  const handleLogout = () => {
    console.log("Logout triggered");
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login'; 
  };

  return (
    <div className="w-72 h-screen bg-gradient-to-b from-[#1e1b4b] via-[#0f172a] to-[#020617] text-slate-300 flex flex-col shadow-2xl relative border-r border-indigo-500/20 overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[40%] bg-indigo-500/15 blur-[80px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[40%] bg-purple-500/15 blur-[80px] pointer-events-none"></div>

      {/* Sidebar Header */}
      <div className="p-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
                <span className="text-indigo-400 font-black text-xl tracking-tighter">C</span>
             </div>
              <div className="flex flex-col">
                 <span className="text-xl font-black text-white tracking-tighter leading-none">{siteName}</span>
                 <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Admin Panel</span>
              </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 mt-4 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const hasSubmenu = item.subItems && item.subItems.length > 0;
          const isSubmenuOpen = openSubmenu === item.id;
          const Icon = item.icon;
          
          return (
            <div key={item.id} className="space-y-1">
              {hasSubmenu ? (
                <button
                  onClick={() => toggleSubmenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative ${
                    isSubmenuOpen ? 'bg-white/10 text-white shadow-lg shadow-black/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isSubmenuOpen ? 'text-indigo-500' : 'text-slate-500 group-hover:text-indigo-500'}`} />
                  <span className="font-semibold flex-1 text-left tracking-tight text-[13px]">{item.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSubmenuOpen ? 'rotate-180 text-indigo-500' : 'text-slate-600'}`} />
                </button>
              ) : (
                <NavLink
                  to={item.path || '#'}
                  onClick={onClose}
                  end
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative group
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-500/20 to-transparent text-white border-l-2 border-indigo-500 rounded-r-none' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-500' : 'text-slate-500 group-hover:text-indigo-500'}`} />
                      <span className="text-[13px] font-semibold tracking-tight">{item.name}</span>
                    </>
                  )}
                </NavLink>
              )}

              {hasSubmenu && isSubmenuOpen && (
                <div className="pl-4 space-y-0.5 mt-1 border-l border-white/5 ml-6 animate-in slide-in-from-left-1 duration-300">
                  {item.subItems?.map((sub, idx) => {
                    const SubIcon = sub.icon;
                    return (
                      <NavLink
                        key={idx}
                        to={sub.path}
                        onClick={onClose}
                        end
                        className={({ isActive }) => `
                          flex items-center gap-3 px-4 py-2 rounded-lg transition-all relative group
                          ${isActive 
                            ? 'bg-white/5 text-white' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                        `}
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500/60 rounded-full" />}
                            <SubIcon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-indigo-500' : 'text-slate-600 group-hover:text-indigo-500'}`} />
                            <span className="text-[12px] font-medium tracking-tight">{sub.name}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Profile & Logout Section */}
      <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 group transition-all">
          {/* Profile Link Area */}
          <button 
            onClick={() => {
              navigate('/admin/profile');
              if (onClose) onClose();
            }}
            className="flex flex-1 items-center gap-3 text-left hover:bg-white/5 p-1 rounded-xl transition-all cursor-pointer"
          >
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-800 flex items-center justify-center font-black text-white shadow-lg group-hover:scale-105 transition-transform">
              {adminName.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[12px] font-black tracking-tight text-slate-200 truncate group-hover:text-white transition-colors">{adminName}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Super Admin</p>
            </div>
          </button>

          <button 
            type="button"
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all shadow-sm cursor-pointer relative z-[50]"
            title="Keluar dari sistem"
          >
            <LogOut className="w-5 h-5 pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
