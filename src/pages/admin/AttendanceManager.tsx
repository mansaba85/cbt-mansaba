import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Search, 
  FileDown, 
  UserX, 
  ChevronDown,
  Loader2,
  AlertCircle,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

const AttendanceManager: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'single' | 'recap'>('single');
  const [exams, setExams] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [recapData, setRecapData] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Exam and Group list on Mount
  useEffect(() => {
    const fetchBaseData = async () => {
        setIsLoadingInitial(true);
        try {
            const [eRes, gRes, sRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/exams`),
                fetch(`${API_BASE_URL}/api/groups`),
                fetch(`${API_BASE_URL}/api/settings`)
            ]);
            setExams(await eRes.json());
            setGroups(await gRes.json());

            const settings = await sRes.json();
            if (settings.cbt_institution_settings) setInstitution(settings.cbt_institution_settings);
            if (settings.cbt_logo_preview) setLogo(settings.cbt_logo_preview);
        } catch (err) {
            console.error("Gagal memuat filter:", err);
        } finally {
            setIsLoadingInitial(false);
        }
    };
    fetchBaseData();
  }, []);

  const handleSearch = async () => {
    if (activeMode === 'single') {
        if (!selectedExam) return;
        setIsFetching(true);
        setShowResults(false);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (selectedGroup) params.append('groupId', selectedGroup);
            const res = await fetch(`${API_BASE_URL}/api/exams/${selectedExam}/attendance?${params.toString()}`);
            const data = await res.json();
            if (data.error) setError(data.error);
            else {
                setAttendanceData(data);
                setShowResults(true);
            }
        } catch (err) { setError("Gagal menghubungi server"); }
        finally { setIsFetching(false); }
    } else {
        if (selectedExams.length === 0) return toast.warning("Pilih minimal 1 ujian untuk rekap");
        setIsFetching(true);
        setShowResults(false);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('examIds', selectedExams.join(','));
            if (selectedGroup) params.append('groupId', selectedGroup);
            const res = await fetch(`${API_BASE_URL}/api/attendance/recap?${params.toString()}`);
            const data = await res.json();
            if (data.error) setError(data.error);
            else {
                setRecapData(data);
                setShowResults(true);
            }
        } catch (err) { setError("Gagal menghubungi server"); }
        finally { setIsFetching(false); }
    }
  };

  const toggleExamSelection = (id: string) => {
    setSelectedExams(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllExams = () => {
    setSelectedExams(exams.map(e => e.id.toString()));
  };

  const deselectAllExams = () => {
    setSelectedExams([]);
  };

  const [onlyAbsentees, setOnlyAbsentees] = useState(false);

  const exportRecapToExcel = () => {
    if (!recapData) return;
    const XLSX = (window as any).XLSX;
    if (!XLSX) return toast.error("Library XLSX tidak ditemukan");

    // Prepare Headers
    const headers = ['No', 'ID Peserta', 'Nama Lengkap', 'Grup'];
    recapData.exams.forEach((e: any) => headers.push(e.name));
    headers.push('Total Absen');

    // Prepare Rows
    const rows = recapData.matrix.map((s: any, i: number) => {
        const rowData: any[] = [i + 1, s.username, s.name, s.group];
        recapData.exams.forEach((e: any) => {
            rowData.push(s.attendance[e.id] ? 'HADIR' : 'ABSEN');
        });
        rowData.push(s.missedCount);
        return rowData;
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap_Kehadiran");
    XLSX.writeFile(wb, `Rekap_Kehadiran_Multi_Mapel.xlsx`);
  };

  const exportSingleToExcel = () => {
    if (!attendanceData || !attendanceData.absentStudents.length) return;
    const data = attendanceData.absentStudents.map((student: any, index: number) => ({
      'No': index + 1, 'ID Peserta': student.username, 'Nama Lengkap': student.name, 'Grup / Rombel': student.group, 'Status': 'TIDAK HADIR'
    }));
    const XLSX = (window as any).XLSX;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Absen");
    XLSX.writeFile(wb, `Data_Absen_${attendanceData.examName.replace(/ /g, '_')}.xlsx`);
  };

  const handlePrintSingle = () => {
    if (!attendanceData) return;
    const groupName = selectedGroup ? groups.find(g => g.id.toString() === selectedGroup)?.name : 'Semua Grup';
    const html = `
      <div class="header">
        ${logo ? `<img src="${logo}" alt="Logo" />` : '<div class="header-spacer"></div>'}
        <div class="header-text">
            <h1>${institution?.name || 'DAFTAR KEHADIRAN'}</h1>
            <p>${institution?.address1 || ''} ${institution?.address2 || ''}</p>
        </div>
        <div class="header-spacer"></div>
      </div>
      <div class="title-area">
        <h2>REKAPITULASI KEHADIRAN PESERTA UJIAN</h2>
      </div>
      <div class="meta-grid">
        <div><p>Mata Pelajaran: ${attendanceData.examName}</p><p>Filter Grup: ${groupName}</p></div>
        <div class="meta-right"><p>Hadir: ${attendanceData.presentCount}</p><p>Absen: ${attendanceData.absentCount}</p></div>
      </div>
      <table>
        <thead><tr><th>No</th><th>ID</th><th>Nama Lengkap</th><th>Grup</th><th>Status</th></tr></thead>
        <tbody>
          ${attendanceData.absentStudents.map((s: any, i: number) => `
            <tr><td class="text-center">${i + 1}</td><td>${s.username}</td><td class="font-bold">${s.name}</td><td>${s.group}</td><td class="text-center" color="red">ABSEN</td></tr>
          `).join('')}
        </tbody>
      </table>
    `;
    import('../../utils/printReport').then(m => m.printReport(`Absen_${attendanceData.examName}`, html));
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
      <div className="no-print space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-600 rounded text-white shadow-lg shadow-indigo-200"><Users className="w-5 h-5" /></div>
            <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manajemen Kehadiran</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Laporan partisipasi & rekap mingguan</p>
            </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border">
            <button 
                onClick={() => {setActiveMode('single'); setShowResults(false);}}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                Per Mapel
            </button>
            <button 
                onClick={() => {setActiveMode('recap'); setShowResults(false);}}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'recap' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                Rekap Multi-Mapel
            </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-xl shadow-slate-200/50">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className={`${activeMode === 'single' ? 'md:col-span-6' : 'md:col-span-8'}`}>
            <div className="flex items-center justify-between mb-1.5 pl-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {activeMode === 'single' ? 'Pilih Nama Ujian' : 'Pilih Daftar Ujian'}
                </label>
                {activeMode === 'recap' && (
                    <div className="flex gap-3">
                        <button onClick={selectAllExams} className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase">Pilih Semua</button>
                        <button onClick={deselectAllExams} className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase">Reset</button>
                    </div>
                )}
            </div>
            
            {activeMode === 'single' ? (
                <div className="relative">
                    <select 
                        className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all appearance-none"
                        value={selectedExam}
                        onChange={(e) => setSelectedExam(e.target.value)}
                    >
                    <option value="">-- Pilih Ujian Tunggal --</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            ) : (
                <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-2 shadow-inner">
                    {exams.map(e => (
                        <label key={e.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${selectedExams.includes(e.id.toString()) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:border-slate-100'}`}>
                            <input 
                                type="checkbox" 
                                checked={selectedExams.includes(e.id.toString())}
                                onChange={() => toggleExamSelection(e.id.toString())}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-0" 
                            />
                            <span className={`text-[11px] font-bold truncate ${selectedExams.includes(e.id.toString()) ? 'text-indigo-700' : 'text-slate-600'}`}>{e.name}</span>
                        </label>
                    ))}
                </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Grup / Kelas</label>
            <div className="relative">
               <select 
                 className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all appearance-none"
                 value={selectedGroup}
                 onChange={(e) => setSelectedGroup(e.target.value)}
               >
                 <option value="">Semua Grup</option>
                 {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button 
              onClick={handleSearch}
              disabled={isFetching}
              className="w-full h-11 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-30"
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} {isFetching ? 'Memuat...' : 'Proses'}
            </button>
          </div>
        </div>
      </div>

      {showResults && (
        <div className="space-y-6">
            {activeMode === 'single' && attendanceData && (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-2">Hadir</p><p className="text-2xl font-black text-emerald-600">{attendanceData.presentCount}</p></div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-2">Absen</p><p className="text-2xl font-black text-rose-600">{attendanceData.absentCount}</p></div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-2">Persentase</p><p className="text-2xl font-black text-indigo-600">{attendanceData.presentPercentage}</p></div>
                    </div>
                    <div className="bg-white border rounded-[2rem] overflow-hidden shadow-lg">
                        <div className="p-6 bg-slate-50/50 border-b flex justify-between items-center">
                            <h3 className="text-sm font-black uppercase tracking-tight">Daftar Tidak Hadir</h3>
                            <div className="flex gap-2">
                                <button onClick={exportSingleToExcel} className="p-2 bg-white border rounded-lg hover:bg-slate-50 transition-all"><FileSpreadsheet className="w-4 h-4" /></button>
                                <button onClick={handlePrintSingle} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"><Printer className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                                <tr><th className="px-6 py-4">No</th><th className="px-6 py-4">Nama Peserta</th><th className="px-6 py-4">Grup</th><th className="px-6 py-4 text-center">Status</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {attendanceData.absentStudents.map((s:any, i:number) => (
                                    <tr key={s.id} className="hover:bg-rose-50/30 font-bold text-sm">
                                        <td className="px-6 py-4">{i+1}</td><td className="px-6 py-4 uppercase">{s.name}</td><td className="px-6 py-4">{s.group}</td><td className="px-6 py-4 text-center text-[9px] text-rose-600">ABSEN</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeMode === 'recap' && recapData && (
                <div className="space-y-6">
                    <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-8 bg-slate-50/50 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Matriks Rekap Kehadiran Terintegrasi</h3>
                                <p className="text-xs font-bold text-slate-400">Menampilkan status kehadiran siswa di seluruh mata pelajaran terpilih</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-10 h-5 rounded-full p-1 transition-all ${onlyAbsentees ? 'bg-indigo-600' : 'bg-slate-300'}`} onClick={() => setOnlyAbsentees(!onlyAbsentees)}>
                                        <div className={`w-3 h-3 bg-white rounded-full transition-all ${onlyAbsentees ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hanya Tampilkan Yang Absen</span>
                                </label>
                                <button 
                                    onClick={exportRecapToExcel}
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                                >
                                    <FileSpreadsheet className="w-4 h-4" /> Export Laporan Recap
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 sticky top-0 z-10 border-b">
                                    <tr>
                                        <th className="px-6 py-5 bg-slate-100 min-w-[200px]">Nama Peserta</th>
                                        <th className="px-6 py-5 bg-slate-100">Grup</th>
                                        {recapData.exams.map((e:any) => (
                                            <th key={e.id} className="px-4 py-5 text-center min-w-[120px] border-l border-slate-200/50">
                                                <div className="truncate max-w-[110px]" title={e.name}>{e.name}</div>
                                            </th>
                                        ))}
                                        <th className="px-6 py-5 text-center bg-slate-200/30 border-l border-slate-300">Total Absen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-bold text-xs uppercase text-slate-700">
                                    {recapData.matrix
                                      .filter((s:any) => !onlyAbsentees || s.missedCount > 0)
                                      .map((s:any) => (
                                        <tr key={s.id} className={`hover:bg-slate-50 transition-all ${s.missedCount > 0 ? 'bg-amber-50/30' : ''}`}>
                                            <td className="px-6 py-4 bg-white/50">{s.name}</td>
                                            <td className="px-6 py-4">{s.group}</td>
                                            {recapData.exams.map((e:any) => (
                                                <td key={e.id} className="px-4 py-4 text-center border-l border-slate-100/50">
                                                    {s.attendance[e.id] ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-rose-500 mx-auto" />
                                                    )}
                                                </td>
                                            ))}
                                            <td className={`px-6 py-4 text-center font-black border-l border-slate-200 ${s.missedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                {s.missedCount} / {recapData.exams.length}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-slate-900 flex justify-between items-center text-white">
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span className="text-[10px] font-black uppercase tracking-widest opacity-60">Hadir</span></div>
                                <div className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-rose-400" /><span className="text-[10px] font-black uppercase tracking-widest opacity-60">Absen / Susulan</span></div>
                            </div>
                            <p className="text-[9px] font-bold opacity-40 uppercase tracking-[0.3em]">CBT Integrated Reporting System</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
     </div>
    </div>
  );
};

export default AttendanceManager;
