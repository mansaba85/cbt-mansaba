import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Search, 
  Filter, 
  Download, 
  Users, 
  Calendar, 
  Clock, 
  Lock, 
  Unlock, 
  MessageSquare, 
  ChevronDown,
  BarChart2,
  FileDown,
  User as UserIcon,
  ChevronUp,
  ArrowUpDown,
  FileSpreadsheet,
  FileJson,
  FileText,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useConfirm } from '../../components/ui/ConfirmContext';
import { toast } from 'sonner';

const ResultsManager: React.FC = () => {
  const confirm = useConfirm();
  const [results, setResults] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(50);
  
  // Filters
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [dateStart, setDateStart] = useState('2026-01-01T00:00');
  const [dateEnd, setDateEnd] = useState('2026-12-31T23:59');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [eRes, gRes, sRes] = await Promise.all([
        fetch('http://localhost:3001/api/exams'),
        fetch('http://localhost:3001/api/groups'),
        fetch('http://localhost:3001/api/settings')
      ]);
      setExams(await eRes.json());
      setGroups(await gRes.json());
      
      const settings = await sRes.json();
      if (settings.cbt_institution_settings) setInstitution(settings.cbt_institution_settings);
      if (settings.cbt_logo_preview) setLogo(settings.cbt_logo_preview);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilter = async () => {
    if (!selectedExam) return toast.warning('Silakan pilih tes terlebih dahulu');
    setIsLoading(true);
    setResults([]); 
    try {
      const params = new URLSearchParams();
      if (selectedExam) params.append('examId', selectedExam);
      
      // Use prioritized filter if selected
      if (selectedSchool) params.append('groupId', selectedSchool);
      else if (selectedClass) params.append('groupId', selectedClass);
      else if (selectedGroup) params.append('groupId', selectedGroup);
      
      if (dateStart) params.append('dateStart', dateStart);
      if (dateEnd) params.append('dateEnd', dateEnd);

      const res = await fetch(`http://localhost:3001/api/results?${params.toString()}`);
      let data = await res.json();
      
      // Secondary filter in frontend for combined criteria (School + Class)
      if (selectedSchool && selectedClass) {
         const schoolGroup = groups.find(g => g.id.toString() === selectedSchool)?.name;
         const classGroup = groups.find(g => g.id.toString() === selectedClass)?.name;
         data = data.filter((r: any) => 
            r.groups.includes(schoolGroup) && r.groups.includes(classGroup)
         );
      } else if (selectedSchool) {
         const schoolGroup = groups.find(g => g.id.toString() === selectedSchool)?.name;
         data = data.filter((r: any) => r.groups.includes(schoolGroup));
      } else if (selectedClass) {
         const classGroup = groups.find(g => g.id.toString() === selectedClass)?.name;
         data = data.filter((r: any) => r.groups.includes(classGroup));
      }

      setResults(data);
      setSelectedIds([]); 
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data dari server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return toast.info('Pilih minimal satu data yang ingin dihapus');
    const isConfirmed = await confirm({
        title: 'Hapus Hasil Ujian',
        message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} data hasil ujian yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
        type: 'danger'
    });
    if (!isConfirmed) return;

    try {
      await Promise.all(selectedIds.map(id => 
        fetch(`http://localhost:3001/api/results/${id}`, { method: 'DELETE' })
      ));
      toast.success('Data hasil ujian berhasil dihapus');
      handleFilter();
    } catch (e) {
      toast.error('Gagal menghapus beberapa data, silakan coba lagi');
    }
  };

  const handleRegrade = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/results/${id}/regrade`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
          toast.success("Skor berhasil dikalkulasi ulang: " + data.newScore);
          handleFilter();
      } else {
          toast.error(data.error || "Gagal melakukan kalkulasi ulang");
      }
    } catch (e) {
      toast.error("Kesalahan server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (action: 'lock' | 'unlock' | 'add_time_5') => {
    if (selectedIds.length === 0) return toast.info('Pilih minimal satu data');
    setIsLoading(true);
    try {
      let count = 0;
      for (const id of selectedIds) {
        const res = await fetch(`http://localhost:3001/api/results/${id}/action`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        if (res.ok) count++;
      }
      toast.success(`${count} data berhasil diproses (${action})`);
      handleFilter();
    } catch (e) {
      toast.error("Beberapa data gagal diproses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(results.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = React.useMemo(() => {
    let sortableItems = [...results];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [results, sortConfig]);

  // --- Export Functions ---
  const exportToExcel = () => {
    const targetData = selectedIds.length > 0 ? sortedResults.filter(r => selectedIds.includes(r.id)) : sortedResults;
    if (targetData.length === 0) return toast.warning('Tidak ada data tersedia untuk diekspor!');

    toast.info("Menyiapkan file Excel...", { duration: 2000 });
    const dataToExport = targetData.map((r, i) => ({
      'No.': i + 1,
      'Waktu Mulai': r.startTime,
      'Nama Ujian / Test': r.testName,
      'User / NIS': r.username,
      'Nama Peserta Asli': r.fullName,
      'Group / Kelas': r.groups.join(', '),
      'Poin Diperoleh': r.points,
      'Persentase Skor (%)': r.score,
      'Status': r.status === 'COMPLETED' ? 'SELESAI' : (r.status === 'ONGOING' ? 'MENGERJAKAN' : 'TERKUNCI')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    // Autofit column widths
    const colWidths = [
      { wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
      { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Ujian");
    
    // Generate file asli (.xlsx)
    XLSX.writeFile(workbook, "Laporan_Hasil_Ujian_CBT.xlsx");
  };

  const exportToJSON = () => {
    const targetData = selectedIds.length > 0 ? sortedResults.filter(r => selectedIds.includes(r.id)) : sortedResults;
    if (targetData.length === 0) return toast.warning('Tidak ada data untuk diekspor!');
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(targetData, null, 2));
    const downloadNode = document.createElement('a');
    downloadNode.setAttribute("href", dataStr);
    downloadNode.setAttribute("download", "Laporan_Hasil_Ujian_CBT.json");
    document.body.appendChild(downloadNode);
    downloadNode.click();
    downloadNode.remove();
  };

  const exportToPDF = () => {
    const targetData = selectedIds.length > 0 ? sortedResults.filter(r => selectedIds.includes(r.id)) : sortedResults;
    if (targetData.length === 0) return toast.warning('Tidak ada data untuk dicetak!');

    const examName = exams.find(e => e.id.toString() === selectedExam)?.name || '-';
    const groupName = groups.find(g => g.id.toString() === selectedGroup)?.name || 'Semua Group';

    const html = `
      <div class="header">
        ${logo ? `<img src="${logo}" alt="Logo" />` : '<div class="header-spacer"></div>'}
        <div class="header-text">
          <h1>${institution?.name || 'LAPORAN HASIL UJIAN'}</h1>
          <p>${institution?.address1 || ''} ${institution?.address2 || ''}</p>
          <p style="font-style: italic; font-size: 8px;">${institution?.address3 || ''}</p>
        </div>
        <div class="header-spacer"></div>
      </div>

      <div class="title-area">
        <h2>LAPORAN HASIL UJIAN BERBASIS KOMPUTER (CBT)</h2>
      </div>

      <div class="meta-grid">
        <div>
          <p>Nama Ujian: ${examName}</p>
          <p>Tanggal Cetak: ${new Date().toLocaleString('id-ID')}</p>
        </div>
        <div class="meta-right">
          <p>Filter Group: ${groupName}</p>
          <p>Total Peserta: ${targetData.length}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px">No</th>
            <th>Nama Peserta</th>
            <th>Username</th>
            <th>Grup/Kelas</th>
            <th>Waktu Mulai</th>
            <th class="text-right">Poin</th>
            <th class="text-right">Skor (%)</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${targetData.map((res, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td class="uppercase font-bold">${res.fullName}</td>
              <td style="font-family: monospace">${res.username}</td>
              <td>${res.groups.join(', ')}</td>
              <td>${res.startTime}</td>
              <td class="text-right">${res.points.toFixed(2)}</td>
              <td class="text-right font-bold">${res.score}</td>
              <td class="text-center">${res.status === 'COMPLETED' ? 'SELESAI' : (res.status === 'ONGOING' ? 'MENGERJAKAN' : 'TERKUNCI')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer-sign">
        <div class="sign-box">
          <p>Mengetahui/Mengesahkan,</p>
          <p>Admin CBT System</p>
          <div class="sign-space"></div>
          <div class="sign-line"></div>
          <p style="font-size: 9px; margin-top: 5px; font-style: italic;">NIP/NIPPK. ..............................</p>
        </div>
      </div>
    `;

    import('../../utils/printReport').then(m => {
      m.printReport(`Laporan_${examName}`, html, { landscape: true });
    });
  };

  const schoolGroups = groups.filter(g => g.category === 'SCHOOL');
  const classGroups = groups.filter(g => g.category === 'CLASS');
  const otherGroups = groups.filter(g => g.category !== 'SCHOOL' && g.category !== 'CLASS');

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      <div className="no-print space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-rose-500">
          <Trophy className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">Hasil Test & Filter Lanjutan</h1>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">1. Pilih Test Utama</label>
            <select 
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full neat-field h-12 text-blue-600 font-bold"
            >
              <option value="">- Silakan Pilih Jenis Ujian -</option>
              {exams.map(e => <option key={e.id} value={e.id}>{format(new Date(e.startTime), 'yyyy-MM-dd')} | {e.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">2. Filter Sekolah</label>
               <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} className="w-full neat-field h-12">
                 <option value="">- Semua Sekolah -</option>
                 {schoolGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
               </select>
            </div>
            <div>
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">3. Filter Kelas</label>
               <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full neat-field h-12">
                 <option value="">- Semua Kelas -</option>
                 {classGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
               </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-50 pt-4">
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-0.5 block">Waktu Mulai</label>
            <input type="datetime-local" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full neat-field" />
          </div>
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-0.5 block">Waktu Selesai</label>
            <input type="datetime-local" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full neat-field" />
          </div>
          <div>
             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-0.5 block">Group Lain (Opsional)</label>
             <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-full neat-field">
               <option value="">- Semua Group -</option>
               {otherGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
             </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4 items-end">
             <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-0.5 block">Status Pengerjaan</label>
                <select className="w-full neat-field">
                  <option value="none">Semua Status</option>
                  <option value="active">Sedang Mengerjakan</option>
                  <option value="completed">Sudah Selesai</option>
                </select>
             </div>
             <div className="flex items-center gap-2 pb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0" />
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors uppercase tracking-wider">Grafik Analisa</span>
                </label>
             </div>
             <div className="flex items-center justify-end gap-3">
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Per Halaman:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="h-8 pl-2 pr-6 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value="all">Semua</option>
                  </select>
                </div>
                <button 
                  onClick={handleFilter}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Filter className="w-3.5 h-3.5" /> Tampilkan
                </button>
             </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 italic">
                <th className="px-4 py-4"><input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0" /></th>
                <th className="px-2 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">#</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left cursor-pointer hover:text-indigo-600 transition-colors group/h" onClick={() => requestSort('startTime')}>
                  <div className="flex items-center gap-1">
                    Waktu Mulai
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === 'startTime' ? 'text-indigo-600' : 'text-slate-300 opacity-0 group-hover/h:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left cursor-pointer hover:text-indigo-600 transition-colors group/h" onClick={() => requestSort('testName')}>
                  <div className="flex items-center gap-1">
                    Test
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === 'testName' ? 'text-indigo-600' : 'text-slate-300 opacity-0 group-hover/h:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left cursor-pointer hover:text-indigo-600 transition-colors group/h" onClick={() => requestSort('username')}>
                  <div className="flex items-center gap-1">
                    User
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === 'username' ? 'text-indigo-600' : 'text-slate-300 opacity-0 group-hover/h:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left cursor-pointer hover:text-indigo-600 transition-colors group/h" onClick={() => requestSort('fullName')}>
                  <div className="flex items-center gap-1">
                    Nama Peserta
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === 'fullName' ? 'text-indigo-600' : 'text-slate-300 opacity-0 group-hover/h:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Group</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-indigo-600 transition-colors group/h" onClick={() => requestSort('points')}>
                  <div className="flex items-center justify-end gap-1">
                    Poin
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === 'points' ? 'text-indigo-600' : 'text-slate-300 opacity-0 group-hover/h:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-indigo-600 transition-colors group/h" onClick={() => requestSort('score')}>
                  <div className="flex items-center justify-end gap-1">
                    Skor (%)
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === 'score' ? 'text-indigo-600' : 'text-slate-300 opacity-0 group-hover/h:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:text-indigo-600 transition-colors group/h" onClick={() => requestSort('status')}>
                  <div className="flex items-center justify-center gap-1">
                    Status
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === 'status' ? 'text-indigo-600' : 'text-slate-300 opacity-0 group-hover/h:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center tracking-tighter">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic">
              {selectedExam === '' ? (
                <tr>
                  <td colSpan={12} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                         <Trophy className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Silakan pilih jenis tes di atas untuk menampilkan hasil</p>
                    </div>
                  </td>
                </tr>
              ) : sortedResults.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-20 text-center text-slate-400 italic font-medium">Belum ada data pengerjaan untuk tes ini.</td>
                </tr>
              ) : (
                sortedResults
                .slice(0, itemsPerPage === 'all' ? sortedResults.length : itemsPerPage)
                .map((res, idx) => (
                <tr key={res.id} className={`transition-colors group ${selectedIds.includes(res.id) ? 'bg-indigo-50/50' : 'hover:bg-blue-50/30'}`}>
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                      checked={selectedIds.includes(res.id)}
                      onChange={(e) => handleSelectOne(res.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-2 py-4 text-[13px] font-black text-center">
                    <Link to={`/admin/exams/results/review/${res.id}`} className="text-blue-500 hover:text-blue-400 hover:underline transition-all">
                      {idx + 1}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-600 leading-tight">
                       {res.startTime.split(' ')[0]}<br/>
                       <span className="text-slate-400 font-medium">{res.startTime.split(' ')[1]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[12px] font-bold text-slate-800">{res.testName}</td>
                  <td className="px-6 py-4 text-[12px] font-bold text-slate-800">{res.username}</td>
                  <td className="px-6 py-4 text-[12px] font-black text-slate-700 uppercase">{res.fullName}</td>
                  <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1">
                        {res.groups.map((g: string) => (
                          <span key={g} className="px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-black">{g}</span>
                        ))}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-black text-slate-700 text-right">{res.points.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                     <span className={`text-sm font-black ${res.score >= 15 ? 'text-green-600' : 'text-slate-800'}`}>{res.score}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {res.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-black uppercase tracking-tighter">
                        <CheckCircle2 className="w-2.5 h-2.5" /> SELESAI
                      </span>
                    ) : res.status === 'ONGOING' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded text-[9px] font-black uppercase tracking-tighter">
                        <Clock className="w-2.5 h-2.5" /> MENGERJAKAN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-600 text-white rounded text-[9px] font-black uppercase tracking-tighter">
                        <Lock className="w-2.5 h-2.5" /> TERKUNCI
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center flex items-center justify-center gap-1">
                    <button 
                      onClick={() => handleRegrade(res.id)}
                      title="Kalkulasi Ulang"
                      className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    >
                       <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                       <FileDown className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-4">
        <div className="flex items-center gap-6 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
             <input type="radio" name="selectAllRadio" checked={selectedIds.length === results.length && results.length > 0} onChange={() => handleSelectAll(true)} className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
             <span className="text-sm font-medium text-slate-600">tandai semua</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
             <input type="radio" name="selectAllRadio" checked={selectedIds.length === 0} onChange={() => handleSelectAll(false)} className="w-4 h-4 md:w-5 md:h-5 text-slate-600 focus:ring-slate-500 border-slate-300" />
             <span className="text-sm font-medium text-slate-600">bersihkan semua tanda</span>
          </label>
        </div>

        <div>
          <p className="text-sm font-black text-slate-700 mb-3">dengan semua yang ditandai diatas:</p>
          <div className="flex flex-wrap items-center gap-2">
             <button 
                onClick={() => {
                   if (selectedIds.length === 0) return toast.info('Pilih minimal satu data');
                   const bulkRegrade = async () => {
                       setIsLoading(true);
                       try {
                           let count = 0;
                           for (const id of selectedIds) {
                               const res = await fetch(`http://localhost:3001/api/results/${id}/regrade`, { method: 'POST' });
                               if (res.ok) count++;
                           }
                           toast.success(`${count} data berhasil dikalkulasi ulang`);
                           handleFilter();
                       } catch (e) { toast.error("Gagal regrade"); }
                       finally { setIsLoading(false); }
                   };
                   bulkRegrade();
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded shadow-sm transition-colors shrink-0 flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Kalkulasi Ulang (Regrade)
             </button>
             <button 
               onClick={handleDelete}
               className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded shadow-sm transition-colors shrink-0"
             >
               hapus
             </button>
             <button 
                onClick={() => handleBulkAction('lock')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded shadow-sm transition-colors shrink-0"
              >
                Kunci
             </button>
             <button 
                onClick={() => handleBulkAction('unlock')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded border border-slate-200 shadow-sm transition-colors shrink-0"
              >
                Buka Kunci
             </button>
             <button 
                onClick={() => handleBulkAction('add_time_5')}
                className="px-4 py-2 text-white text-sm font-bold rounded shadow-sm transition-colors shrink-0" style={{ backgroundColor: '#7a3e8c' }}
             >
                +5 Min
             </button>
          </div>
        </div>
      </div>

      {/* Export Action Bar */}
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between bg-slate-50 border border-slate-200 p-5 rounded-2xl no-print">
        <div>
          <p className="text-sm font-black text-slate-700">Export Laporan Hasil (Unduh File)</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Mengekspor {selectedIds.length > 0 ? `${selectedIds.length} data terpilih` : 'seluruh data yg difilter'}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          <button onClick={exportToExcel} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/20 uppercase tracking-wider rounded-xl transition-all flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Unduh Excel (.xlsx)
          </button>
          <button onClick={exportToPDF} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/20 uppercase tracking-wider rounded-xl transition-all flex items-center gap-2">
            <FileText className="w-4 h-4" /> Cetak / PDF
          </button>
          <button onClick={exportToJSON} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black shadow-lg shadow-slate-800/20 uppercase tracking-wider rounded-xl transition-all flex items-center gap-2">
            <FileJson className="w-4 h-4" /> Unduh JSON
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

// Simple date formatter function as a placeholder
const format = (date: Date, pattern: string) => {
  const d = new Date(date);
  if (pattern === 'yyyy-MM-dd') {
    return d.toISOString().split('T')[0];
  }
  return d.toLocaleString();
}

export default ResultsManager;
