import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Search, 
  FileDown, 
  UserX, 
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react';

const AttendanceManager: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Exam and Group list on Mount
  useEffect(() => {
    const fetchBaseData = async () => {
        setIsLoadingInitial(true);
        try {
            const [eRes, gRes] = await Promise.all([
                fetch('http://localhost:3001/api/exams'),
                fetch('http://localhost:3001/api/groups')
            ]);
            setExams(await eRes.json());
            setGroups(await gRes.json());
        } catch (err) {
            console.error("Gagal memuat filter:", err);
        } finally {
            setIsLoadingInitial(false);
        }
    };
    fetchBaseData();
  }, []);

  const handleSearch = async () => {
    if (!selectedExam) return;
    
    setIsFetching(true);
    setShowResults(false);
    setError(null);

    try {
        const params = new URLSearchParams();
        if (selectedGroup) params.append('groupId', selectedGroup);
        
        const res = await fetch(`http://localhost:3001/api/exams/${selectedExam}/attendance?${params.toString()}`);
        const data = await res.json();
        
        if (data.error) {
            setError(data.error);
        } else {
            setAttendanceData(data);
            setShowResults(true);
        }
    } catch (err) {
        setError("Gagal menghubungi server");
    } finally {
        setIsFetching(false);
    }
  };

  const exportToExcel = () => {
    if (!attendanceData || !attendanceData.absentStudents.length) return;

    // 1. Prepare Data
    const data = attendanceData.absentStudents.map((student: any, index: number) => ({
      'No': index + 1,
      'ID Peserta': student.username,
      'Nama Lengkap': student.name,
      'Grup / Rombel': student.group,
      'Status': 'TIDAK HADIR'
    }));

    // 2. Build XLSX
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
        console.error("Library XLSX tidak ditemukan");
        return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Absen");

    // Fix column widths
    ws['!cols'] = [
        { wch: 5 },  { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 15 }
    ];

    XLSX.writeFile(wb, `Data_Absen_${attendanceData.examName.replace(/ /g, '_')}.xlsx`);
  };

  if (isLoadingInitial) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Kehadiran...</p>
        </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Simple */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-indigo-600 rounded text-white shadow-lg shadow-indigo-200">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Rekap Kehadiran Test</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Laporan partisipasi peserta ujian</p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-xl shadow-slate-200/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Pilih Nama Ujian</label>
            <div className="relative">
               <select 
                 className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all appearance-none"
                 value={selectedExam}
                 onChange={(e) => setSelectedExam(e.target.value)}
               >
                 <option value="">-- Cari dan Pilih Ujian --</option>
                 {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                 ))}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Filter Grup</label>
            <div className="relative">
               <select 
                 className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all appearance-none"
                 value={selectedGroup}
                 onChange={(e) => setSelectedGroup(e.target.value)}
               >
                 <option value="">Semua Grup</option>
                 {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                 ))}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-end">
            <button 
              onClick={handleSearch}
              disabled={!selectedExam || isFetching}
              className="w-full h-11 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-30 disabled:hover:bg-slate-900"
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} {isFetching ? 'Memuat...' : 'Tampilkan'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600 animate-in zoom-in-95 duration-300">
            <AlertCircle className="w-8 h-8" />
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Terjadi Masalah</p>
                <p className="text-sm font-bold">{error}</p>
            </div>
        </div>
      )}

      {showResults && attendanceData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Peserta</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{attendanceData.totalStudents}</p>
             </div>
             <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-100/40 text-center">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Hadir</p>
                <p className="text-3xl font-black text-emerald-700 tracking-tighter leading-none">{attendanceData.presentCount}</p>
             </div>
             <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 shadow-xl shadow-rose-100/40 text-center">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-[0.2em] mb-2">Absen</p>
                <p className="text-3xl font-black text-rose-700 tracking-tighter leading-none">{attendanceData.absentCount}</p>
             </div>
             <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 shadow-xl shadow-indigo-100/40 text-center">
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Presensi</p>
                <p className="text-3xl font-black text-indigo-700 tracking-tighter leading-none">{attendanceData.presentPercentage}</p>
             </div>
          </div>

          {/* Absent Students Table */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-300/40">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <UserX className="w-5 h-5 text-rose-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Peserta Tidak Hadir (Absen)</h3>
               </div>
               <button 
                 onClick={exportToExcel}
                 disabled={attendanceData.absentStudents.length === 0}
                 className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:scale-100"
               >
                  <FileDown className="w-4 h-4" /> Export Excel
               </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-slate-400 border-b border-slate-100">
                  <tr className="text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-4 w-12 text-center">No</th>
                    <th className="px-8 py-4">ID / Username</th>
                    <th className="px-8 py-4">Nama Lengkap</th>
                    <th className="px-8 py-4">Grup / Rombel</th>
                    <th className="px-8 py-4 text-center">Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceData.absentStudents.map((student: any, index: number) => (
                    <tr key={student.id} className="hover:bg-rose-50/20 transition-all duration-300 group">
                      <td className="px-8 py-5 text-center text-slate-400 font-black text-xs">{index + 1}</td>
                      <td className="px-8 py-5 font-mono text-xs text-indigo-600 font-bold tracking-tighter">{student.username}</td>
                      <td className="px-8 py-5 font-black text-slate-700 uppercase tracking-tight group-hover:text-rose-600 transition-colors">{student.name}</td>
                      <td className="px-8 py-5 text-slate-500 font-bold text-xs">{student.group}</td>
                      <td className="px-8 py-5 text-center">
                         <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[9px] font-black rounded-full border border-rose-200 italic ring-4 ring-rose-50">BELUM HADIR</span>
                      </td>
                    </tr>
                  ))}
                  {attendanceData.absentStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h4 className="text-xl font-black text-slate-800 uppercase mb-2">Semua Peserta Hadir!</h4>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">Luar biasa! Tidak ada data peserta yang absen untuk filter ini.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-4 bg-slate-900 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Monitoring System active</span>
               </div>
               <span className="text-[10px] font-black text-slate-600 uppercase">CBT System 2026</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;
