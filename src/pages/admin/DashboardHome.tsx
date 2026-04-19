import { API_BASE_URL } from '../../config/api';
import React from 'react';
import { 
  Users, 
  BookOpen, 
  Activity, 
  CheckCircle, 
  CreditCard, 
  ClipboardList,
  PlusCircle,
  MonitorPlay,
  FileText,
  BarChart3,
  ShieldAlert,
  RotateCcw,
  LayoutGrid,
  Zap,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardHome: React.FC = () => {
  const [siteName, setSiteName] = React.useState('CBT MANSABA');
  const [dashboardStats, setDashboardStats] = React.useState([
    { label: 'Peserta Ujian Aktif', value: '...', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Total Modul Soal', value: '...', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'Siswa Terdaftar', value: '...', icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'Siswa Login Aktif', value: '...', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { label: 'Ujian Selesai', value: '...', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  ]);

  React.useEffect(() => {
    const saved = localStorage.getItem('cbt_site_settings');
    if (saved) {
      const site = JSON.parse(saved);
      if (site.siteName) setSiteName(site.siteName);
    }

    fetch(`${API_BASE_URL}/api/stats`)
      .then(res => res.json())
      .then(data => {
         setDashboardStats([
           { label: 'Peserta Ujian Aktif', value: (data.activeExams || 0).toString(), icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
           { label: 'Total Modul Soal', value: (data.totalModules || 0).toString(), icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
           { label: 'Siswa Terdaftar', value: (data.students || 0).toString(), icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
           { label: 'Siswa Login Aktif', value: (data.activeSessions || 0).toString(), icon: Zap, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
           { label: 'Ujian Selesai', value: (data.completedExams || 0).toString(), icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
         ]);
      })
      .catch(err => console.error(err));
  }, []);

  const quickActions = [
    { name: 'Bank Soal', path: '/admin/questions', icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Daftar Tes', path: '/admin/exams/list', icon: FileText, color: 'bg-indigo-500' },
    { name: 'Proctoring', path: '/admin/proctoring', icon: MonitorPlay, color: 'bg-rose-500' },
    { name: 'Hasil Tes', path: '/admin/exams/results', icon: BarChart3, color: 'bg-emerald-500' },
    { name: 'Reset Peserta', path: '/admin/exams/reset-participant', icon: RotateCcw, color: 'bg-amber-500' },
    { name: 'Tambah Siswa', path: '/admin/users', icon: PlusCircle, color: 'bg-violet-500' },
  ];

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full -ml-32 -mb-32 blur-[100px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Sistem Aktif
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Halo, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Administrator</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Panel kendali utama <span className="text-white font-bold">{siteName}</span>. Pantau aktivitas dan kelola ujian secara real-time.
            </p>
          </div>
          <div className="hidden lg:block">
             <div className="w-24 h-24 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-inner">
                <LayoutGrid className="w-10 h-10 text-indigo-400" />
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {dashboardStats.map((stat, i) => (
          <div key={i} className={`group relative p-6 rounded-3xl bg-white dark:bg-slate-900 border ${stat.border} shadow-sm transition-all hover:shadow-xl hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Growth</span>
                <span className="text-xs font-bold text-green-500">+12%</span>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black mt-1 text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Shortcuts & Quick Actions Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Quick Shortcuts */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between uppercase tracking-widest">
            <h2 className="text-xs font-black text-slate-500 flex items-center gap-2">
               <Zap className="w-4 h-4 text-amber-500" /> Akses Cepat
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                to={action.path}
                className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-lg transition-all flex flex-col items-center text-center gap-3"
              >
                <div className={`w-12 h-12 rounded-xl ${action.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{action.name}</span>
              </Link>
            ))}
          </div>

          {/* Main Visual Section */}
          <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white overflow-hidden group shadow-2xl shadow-indigo-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Analisis Data Cerdas</h3>
              <p className="text-indigo-100 max-w-md">Lihat performa siswa dan efektivitas soal secara mendalam dengan modul analisis butir soal terbaru kami.</p>
              <Link to="/admin/exams/analysis" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">
                Buka Analisis <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts & Activity */}
        <div className="space-y-6">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <ShieldAlert className="w-4 h-4 text-rose-500" /> Peringatan Keamanan
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-500/10 flex items-center justify-center">
                   <ShieldAlert className="w-5 h-5 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">Siswa terdeteksi keluar tab</p>
                  <p className="text-xs text-slate-500 mt-1">Siswa: Rahmat Hidayat • 2m lalu</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
            <button className="w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors">
              Lihat Semua Log
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Print Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          to="/admin/users/cards"
          className="group relative overflow-hidden p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200/50 transition-all hover:scale-[1.02] active:scale-95"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Cetak Kartu Peserta</h3>
              <p className="text-indigo-100 text-sm font-medium mt-1">Generate kartu login siswa per kelas</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/admin/exams/attendance-form"
          className="group relative overflow-hidden p-8 rounded-[2.5rem] bg-emerald-600 text-white shadow-2xl shadow-emerald-200/50 transition-all hover:scale-[1.02] active:scale-95"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Cetak Daftar Hadir</h3>
              <p className="text-emerald-100 text-sm font-medium mt-1">Hasilkan form tanda tangan proktor</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardHome;
