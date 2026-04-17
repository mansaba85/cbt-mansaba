import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  MonitorOff, 
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Unlock,
  LogOut,
  Clock,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

interface ProctorStudent {
  id: string;
  name: string;
  nis: string;
  status: 'online' | 'warning' | 'locked' | 'finished' | 'offline';
  progress: number;
  questionNo: number;
  warnings: number;
  timeLeft: string;
  group: string;
  isExempt?: boolean;
}

function StudentCard({ 
  student, 
  openDropdown, 
  setOpenDropdown, 
  handleAction 
}: { 
  student: ProctorStudent, 
  openDropdown: string | null, 
  setOpenDropdown: (id: string | null) => void,
  handleAction: any
}) {
    const [localTime, setLocalTime] = useState(student.timeLeft);

    // Update local time when prop changes (from sync)
    React.useEffect(() => {
        setLocalTime(student.timeLeft || "00:00");
    }, [student.timeLeft]);

    // Local countdown effect
    React.useEffect(() => {
        if (student.status !== 'online' && student.status !== 'warning') return;

        const interval = setInterval(() => {
            setLocalTime(prev => {
                if (!prev || !prev.includes(':')) return prev;
                const parts = prev.split(':');
                let m = parseInt(parts[0]);
                let s = parseInt(parts[1]);
                
                if (isNaN(m) || isNaN(s)) return prev;
                if (m === 0 && s === 0) {
                    clearInterval(interval);
                    return "00:00";
                }
                
                if (s === 0) {
                    if (m > 0) {
                        m--;
                        s = 59;
                    } else {
                        return "00:00";
                    }
                } else {
                    s--;
                }
                
                return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [student.status]);

    let cardBg = "bg-white border-slate-200";
    let statusBadge = "bg-slate-100 text-slate-500";
    let statusText = "Offline";

    if (student.status === 'online') {
      cardBg = "bg-white border-indigo-200 shadow-sm shadow-indigo-100/50";
      statusBadge = "bg-indigo-100 text-indigo-700";
      statusText = "Mengerjakan";
    } else if (student.status === 'warning') {
      cardBg = "bg-amber-50 border-amber-300 shadow-md shadow-amber-200/50 ring-2 ring-amber-400/30";
      statusBadge = "bg-amber-200 text-amber-800";
      statusText = "Peringatan";
    } else if (student.status === 'locked') {
      cardBg = "bg-rose-50 border-rose-300 shadow-md shadow-rose-200/50 ring-2 ring-rose-500/50";
      statusBadge = "bg-rose-600 text-white shadow-sm animate-pulse";
      statusText = "TERKUNCI!";
    } else if (student.status === 'finished') {
      cardBg = "bg-slate-50 border-emerald-200 opacity-90";
      statusBadge = "bg-emerald-100 text-emerald-700";
      statusText = "Selesai";
    }

    return (
      <div className={`p-4 rounded-2xl border transition-all relative ${cardBg} ${openDropdown === student.id ? 'z-50' : 'z-0'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full font-black text-white flex items-center justify-center shadow-inner" 
              style={{ backgroundColor: `hsl(${(student?.name?.length || 0) * 20}, 70%, 60%)` }}
            >
              {student?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">{student?.name || 'Peserta'}</h3>
              <p className="text-xs font-semibold text-slate-500">{student?.nis || '-'}</p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === student.id ? null : student.id); }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {openDropdown === student.id && (
              <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                <button onClick={() => handleAction(student.id, 'unlock')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Unlock className="w-4 h-4 text-emerald-500" /> Buka Kunci (Reset Status)
                </button>
                <button onClick={() => handleAction(student.id, 'reset_finished')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <RotateCcw className="w-4 h-4 text-amber-500" /> Buka Akses Ujian Ulang
                </button>
                <button onClick={() => handleAction(student.id, 'add_time')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Clock className="w-4 h-4 text-indigo-500" /> Tambah Waktu (+10 Menit)
                </button>
                <div className="w-full h-px bg-slate-100 my-1"></div>
                <button onClick={() => handleAction(student.id, 'toggle_cheat_exempt')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ShieldAlert className={`w-4 h-4 ${student.isExempt ? 'text-rose-500' : 'text-emerald-500'}`} /> 
                  {student.isExempt ? 'Cabut Pengecualian Anti-Cheat' : 'Kecualikan dari Anti-Cheat'}
                </button>
                <div className="w-full h-px bg-slate-100 my-1"></div>
                <button onClick={() => handleAction(student.id, 'logout')} className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2 text-sm font-medium text-rose-600">
                  <LogOut className="w-4 h-4" /> Keluarkan Paksa (Kick)
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2 items-center">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusBadge}`}>
              {statusText}
            </span>
            {student.isExempt && (
              <span className="px-2 py-1 rounded-lg text-[9px] font-black text-rose-600 bg-rose-100 border border-rose-200">
                EXEMPTED
              </span>
            )}
          </div>
          {student.status !== 'finished' && student.status !== 'offline' && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg transition-all duration-300">
              <Clock className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
              {localTime}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500">Mengerjakan</span>
            <span className="text-indigo-600">Soal {student.questionNo}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${student.progress}%` }}></div>
          </div>
        </div>

        {student.warnings > 0 && student.status !== 'finished' && (
          <div className="mt-3 bg-amber-100/50 border border-amber-200 p-2 rounded-lg flex items-center gap-2">
             <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
             <p className="text-[10px] font-bold text-amber-700">Peringatan: {student.warnings} kali pindah tab!</p>
          </div>
        )}
      </div>
    );
}

export default function Proctoring() {
  const [students, setStudents] = useState<ProctorStudent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(25);

  const fetchLiveProctoring = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/proctoring');
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch(e) { 
      console.error("Fetch Live Proctoring failed", e);
    }
  };

  React.useEffect(() => {
    fetchLiveProctoring();
    const interval = setInterval(fetchLiveProctoring, 5000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  const availableGroups = Array.from(new Set(students.map(s => s?.group).filter(Boolean))).sort();
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const activeCount = students.filter(s => s.status === 'online' || s.status === 'warning').length;
  const finishedCount = students.filter(s => s.status === 'finished').length;
  const lockedCount = students.filter(s => s.status === 'locked').length;
  const totalCount = students.length;

  const handleAction = async (studentId: string, action: 'unlock' | 'logout' | 'reset_warnings' | 'reset_finished' | 'add_time' | 'toggle_cheat_exempt') => {
    setOpenDropdown(null);
    try {
      await fetch(`http://localhost:3001/api/proctoring/${studentId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      fetchLiveProctoring();
    } catch (e) {
      console.error("Gagal menjalankan aksi proktor");
    }
  };

  const filteredStudents = students.filter(s => {
    if (!s) return false;
    if (selectedGroup !== 'all' && s.group !== selectedGroup) return false;
    const sName = (s.name || '').toLowerCase();
    const sNis = (s.nis || '');
    const sStatus = (s.status || '');
    const matchSearch = sName.includes(searchTerm.toLowerCase()) || sNis.includes(searchTerm);
    const matchFilter = filterStatus === 'all' || sStatus === filterStatus;
    return matchSearch && matchFilter;
  });

  const paginatedStudents = itemsPerPage === 'all' ? filteredStudents : filteredStudents.slice(0, itemsPerPage);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Pengawasan Langsung</h1>
          <p className="text-slate-600 font-medium mt-1">Pantau progres pengerjaan ujian siswa secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative border-2 border-indigo-200 bg-indigo-50 rounded-xl overflow-hidden shadow-sm">
            <select 
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="appearance-none bg-transparent py-2.5 pl-4 pr-10 text-sm font-black text-indigo-800 outline-none w-full"
            >
              <option value="all">(!) SEMUA KELAS (Berat)</option>
              {availableGroups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
          </div>

          <button onClick={fetchLiveProctoring} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 shrink-0">
            <RefreshCw className="w-5 h-5" /> <span className="hidden sm:inline">REFRESH</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Total Peserta</p>
            <p className="text-2xl font-black text-slate-800">{totalCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <MonitorOff className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-600">Sedang Ujian</p>
            <p className="text-2xl font-black text-indigo-800">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-600">Selesai</p>
            <p className="text-2xl font-black text-emerald-800">{finishedCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-rose-600">Terkunci / Curang</p>
            <p className="text-2xl font-black text-rose-800">{lockedCount}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama atau NIS siswa..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>
        <div className="relative w-full sm:w-36">
           <select 
             value={itemsPerPage === 'all' ? 'all' : itemsPerPage}
             onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
             className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
           >
             <option value="10">Limit: 10</option>
             <option value="25">Limit: 25</option>
             <option value="50">Limit: 50</option>
             <option value="all">Semua</option>
           </select>
           <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
           {['all', 'online', 'warning', 'locked', 'finished'].map((status) => (
             <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide capitalize whitespace-nowrap transition-all ${
                  filterStatus === status 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
             >
                {status === 'all' ? 'Semua' : status}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
         {paginatedStudents.map(student => (
           <StudentCard 
             key={student.id} 
             student={student} 
             openDropdown={openDropdown}
             setOpenDropdown={setOpenDropdown}
             handleAction={handleAction}
           />
         ))}
      </div>
      
      {filteredStudents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
          <MonitorOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-500">Tidak ada siswa yang sesuai kriteria.</p>
        </div>
      )}
    </div>
  );
}
