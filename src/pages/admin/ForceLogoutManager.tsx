import React, { useState } from 'react';
import {
  Lock,
  LogOut,
  Search,
  ChevronDown,
  AlertTriangle,
  CheckSquare,
  Square,
  User,
  ShieldAlert,
  Bell,
  X
} from 'lucide-react';

interface Student {
  id: number;
  username: string;
  name: string;
  level: number;
  groups: string[];
  testStatuses: string[];
  isLocked: boolean;
}

const mockStudents: Student[] = [
  { id: 1, username: 'MA0226303', name: 'ABDUL ROZAK', level: 1, groups: ['ALL', 'BIO', 'FISI', 'GEO', 'LMP', 'LMP_12.2', 'MTKTL'], testStatuses: ['Sedang Mengerjakan Sejarah', 'Sedang Mengerjakan Biologi'], isLocked: false },
  { id: 2, username: 'MA0226338', name: 'ADINIA SOVI ANANDA', level: 1, groups: ['ALL', 'GEO', 'INFORM', 'LMP', 'LMP_12.3', 'SOS'], testStatuses: ['Selesai Mengerjakan Sejarah', 'Sedang Mengerjakan Biologi'], isLocked: false },
  { id: 3, username: 'MA0476609', name: 'ADIRA PUTRI MAHARANI', level: 1, groups: ['ALL', 'ANTRO', 'BJPG', 'HASYIM', 'HASYIM_12.2', 'INDOTL'], testStatuses: ['Selesai Mengerjakan Sejarah', 'Selesai Mengerjakan Antropologi'], isLocked: false },
  { id: 4, username: 'MA0226304', name: 'AFIFAH SYAFAAT', level: 1, groups: ['ALL', 'BIO', 'FISI', 'GEO', 'LMP', 'LMP_12.2', 'MTKTL'], testStatuses: ['Selesai Mengerjakan Sejarah', 'Sedang Mengerjakan Biologi'], isLocked: true },
  { id: 5, username: 'MA0226305', name: 'AGUS ARDIYANTO', level: 1, groups: ['ALL', 'BIO', 'FISI', 'GEO', 'LMP', 'LMP_12.2', 'MTKTL'], testStatuses: ['Sedang Mengerjakan Sejarah', 'Sedang Mengerjakan Biologi'], isLocked: false },
];

const ForceLogoutManager: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; student: any | null; bulk: boolean }>({ open: false, student: null, bulk: false });
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const fetchProctoringData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/proctoring');
      const data = await res.json();
      setStudents(data);
    } catch (e) {
      console.error("Gagal memuat data proctoring");
    }
  };

  React.useEffect(() => {
    fetchProctoringData();
    const t = setInterval(fetchProctoringData, 5000);
    return () => clearInterval(t);
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3500);
  };

  const handleLock = async (student: any) => {
    setIsLoading(true);
    try {
        await fetch(`http://localhost:3001/api/proctoring/${student.id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'suspend' })
        });
        setConfirmModal({ open: false, student: null, bulk: false });
        showNotification(`✅ ${student.name} berhasil dikunci paksa.`);
        fetchProctoringData();
    } catch(e) { }
    setIsLoading(false);
  };

  const handleBulkLock = async () => {
    setIsLoading(true);
    try {
        for (const id of selectedIds) {
            await fetch(`http://localhost:3001/api/proctoring/${id}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'suspend' })
            });
        }
        setConfirmModal({ open: false, student: null, bulk: false });
        showNotification(`✅ ${selectedIds.length} siswa berhasil dikunci sekaligus.`);
        setSelectedIds([]);
        fetchProctoringData();
    } catch(e) { }
    setIsLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const listIds = filteredStudents.filter(s => s.status !== 'locked').map(s => s.id);
    if (selectedIds.length === listIds.length) setSelectedIds([]);
    else setSelectedIds(listIds);
  };

  const filteredStudents = students.filter(s => {
    const matchGroup = selectedGroup ? s.group === selectedGroup : true;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGroup && matchSearch;
  });

  const allGroups = Array.from(new Set(students.map(s => s.group))).sort();

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white text-sm font-bold border animate-in slide-in-from-right duration-300 ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-rose-600 border-rose-500'}`}>
          <Bell className="w-5 h-5" />
          {notification.message}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 mb-1">Konfirmasi Kunci Paksa</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {confirmModal.bulk
                    ? `Anda akan mengunci paksa ${selectedIds.length} siswa sekaligus. Mereka akan menerima pemberitahuan di layar dan tidak bisa melanjutkan ujian.`
                    : `Anda akan mengunci paksa <strong>${confirmModal.student?.name}</strong>. Siswa akan menerima pemberitahuan di layar dan tidak bisa melanjutkan ujian.`
                  }
                </p>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Tindakan ini tidak dapat dibatalkan secara otomatis.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setConfirmModal({ open: false, student: null, bulk: false })}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => confirmModal.bulk ? handleBulkLock() : handleLock(confirmModal.student!)}
                className="px-5 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <Lock className="w-4 h-4" /> Ya, Kunci Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-600 rounded text-white">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Logout & Kunci Paksa</h1>
          <p className="text-xs text-slate-500">Kunci paksa siswa yang sedang aktif ujian</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row gap-3">
        <div className="relative w-full md:w-56">
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="w-full h-9 pl-3 pr-8 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-indigo-500 appearance-none"
          >
            <option value="">Semua Grup</option>
            {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa atau username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <button
          disabled={selectedIds.length === 0}
          onClick={() => setConfirmModal({ open: true, student: null, bulk: true })}
          className="flex items-center gap-2 px-4 h-9 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" /> Kunci {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} Terpilih
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                  {selectedIds.length === filteredStudents.length && filteredStudents.length > 0
                    ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                    : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="px-3 py-3 font-bold text-slate-600 w-10 text-center">#</th>
              <th className="px-3 py-3 font-bold text-indigo-600">User</th>
              <th className="px-3 py-3 font-bold text-indigo-600">Nama</th>
              <th className="px-3 py-3 font-bold text-slate-600 text-center w-14">Level</th>
              <th className="px-3 py-3 font-bold text-slate-600">Group</th>
              <th className="px-3 py-3 font-bold text-slate-600">Status Tes</th>
              <th className="px-3 py-3 font-bold text-slate-600 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((student, idx) => (
              <tr
                key={student.id}
                className={`transition-colors ${student.isLocked ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50/50'} ${selectedIds.includes(student.id) ? 'bg-indigo-50/40' : ''}`}
              >
                <td className="px-4 py-3">
                  {!student.isLocked && (
                    <button onClick={() => toggleSelect(student.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                      {selectedIds.includes(student.id)
                        ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                        : <Square className="w-4 h-4" />}
                    </button>
                  )}
                </td>
                <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                <td className="px-3 py-3 font-mono text-xs text-indigo-600 font-bold">{student.nis}</td>
                <td className="px-3 py-3 font-bold text-slate-800 uppercase text-xs">{student.name}</td>
                <td className="px-3 py-3 text-center">
                  <span className="w-8 h-8 inline-flex items-center justify-center bg-indigo-600 text-white text-[10px] font-black rounded-lg">
                    {student.group.split('.')[0] || 'ST'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">{student.group}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded w-fit ${student.status === 'online' ? 'bg-amber-500' : student.status === 'finished' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                      {student.status === 'online' ? `Sedang: ${student.testName}` : student.status === 'finished' ? `Selesai: ${student.testName}` : 'TERKUNCI'}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  {student.status === 'locked' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-lg border border-rose-200">
                      <Lock className="w-3 h-3" /> Akun Terkunci
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmModal({ open: true, student, bulk: false })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95"
                    >
                      <Lock className="w-3 h-4" /> Kunci Paksa
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 font-medium italic">
                  Tidak ada data siswa yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Menampilkan <strong>{filteredStudents.length}</strong> siswa
            {selectedIds.length > 0 && <> • <strong className="text-indigo-600">{selectedIds.length} dipilih</strong></>}
          </p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full inline-block"></span> Sedang Mengerjakan</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-600 rounded-full inline-block"></span> Selesai</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForceLogoutManager;
