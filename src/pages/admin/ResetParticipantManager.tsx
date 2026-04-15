import React, { useState } from 'react';
import {
  RefreshCw,
  Search,
  ChevronDown,
  Lock,
  ShieldAlert,
  CheckSquare,
  Square,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  RotateCcw
} from 'lucide-react';

interface LockedStudent {
  id: number;
  username: string;
  name: string;
  group: string;
  testName: string;
  lockedAt: string;
  lockedReason: 'force' | 'cheat';
  progress: string; // misal: "23 / 50 soal"
  isReset: boolean;
}

const mockLockedStudents: LockedStudent[] = [
  { id: 1, username: 'MA0226304', name: 'AFIFAH SYAFAAT', group: 'LMP_12.2', testName: 'Sejarah Kebudayaan Islam', lockedAt: '2026-04-13 10:05:22', lockedReason: 'force', progress: '23 / 50 soal', isReset: false },
  { id: 2, username: 'MA0226310', name: 'BAGAS TRIADI SAPUTRA', group: 'IPS-1', testName: 'Bahasa Indonesia', lockedAt: '2026-04-13 09:48:11', lockedReason: 'cheat', progress: '18 / 40 soal', isReset: false },
  { id: 3, username: 'MA0226325', name: 'CITRA DEWI KUSUMA', group: 'IPA-2', testName: 'Matematika', lockedAt: '2026-04-13 10:12:33', lockedReason: 'cheat', progress: '30 / 45 soal', isReset: false },
  { id: 4, username: 'MA0226388', name: 'DENI FIRMANSYAH', group: 'LMP_12.1', testName: 'Sejarah Kebudayaan Islam', lockedAt: '2026-04-13 09:55:00', lockedReason: 'force', progress: '10 / 50 soal', isReset: false },
  { id: 5, username: 'MA0226340', name: 'AHMAD FIRMAN MAULANA', group: 'INFORM', testName: 'Biologi', lockedAt: '2026-04-13 10:20:44', lockedReason: 'force', progress: '35 / 50 soal', isReset: true },
];

const reasonLabel: Record<string, { label: string; color: string }> = {
  force: { label: 'Kunci Paksa Admin', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  cheat: { label: 'Deteksi Kecurangan', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const ResetParticipantManager: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; student: any | null; bulk: boolean }>({ open: false, student: null, bulk: false });
  const [notification, setNotification] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const fetchLockedStudents = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/proctoring');
      const data = await res.json();
      // Hanya ambil yang statusnya 'locked'
      setStudents(data.filter((s: any) => s.status === 'locked'));
    } catch (e) {
      console.error("Gagal memuat data peserta terkunci");
    }
  };

  React.useEffect(() => {
    fetchLockedStudents();
    const t = setInterval(fetchLockedStudents, 5000);
    return () => clearInterval(t);
  }, []);

  const showNotification = (message: string) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: '' }), 3500);
  };

  const handleReset = async (student: any) => {
    setIsLoading(true);
    try {
        await fetch(`http://localhost:3001/api/proctoring/${student.id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unlock' })
        });
        setConfirmModal({ open: false, student: null, bulk: false });
        showNotification(`✅ ${student.name} berhasil direset. Siswa dapat login kembali.`);
        fetchLockedStudents();
    } catch(e) { }
    setIsLoading(false);
  };

  const handleBulkReset = async () => {
    setIsLoading(true);
    try {
        for (const id of selectedIds) {
            await fetch(`http://localhost:3001/api/proctoring/${id}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'unlock' })
            });
        }
        setConfirmModal({ open: false, student: null, bulk: false });
        showNotification(`✅ ${selectedIds.length} siswa berhasil direset sekaligus.`);
        setSelectedIds([]);
        fetchLockedStudents();
    } catch(e) { }
    setIsLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const listIds = filteredStudents.map(s => s.id);
    if (selectedIds.length === listIds.length) setSelectedIds([]);
    else setSelectedIds(listIds);
  };

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const pendingCount = students.length;
  const resetCount = 0; // Halaman ini fokus ke yang butuh reset saja

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white text-sm font-bold border border-emerald-500 bg-emerald-600 animate-in slide-in-from-right duration-300">
          <CheckCircle2 className="w-5 h-5" />
          {notification.message}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 mb-1">Konfirmasi Reset Peserta</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {confirmModal.bulk
                    ? `Anda akan mereset <strong>${selectedIds.length} siswa</strong> sekaligus. Mereka akan bisa melanjutkan ujian dari soal sebelumnya.`
                    : `Anda akan mereset <strong>${confirmModal.student?.name}</strong>. Siswa akan dapat melanjutkan ujian pada bagian: `
                  }
                  {!confirmModal.bulk && (
                    <span className="font-bold text-indigo-700">{confirmModal.student?.testName} ({confirmModal.student?.progress})</span>
                  )}
                </p>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pastikan situasi sudah kondusif sebelum mereset peserta.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setConfirmModal({ open: false, student: null, bulk: false })}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => confirmModal.bulk ? handleBulkReset() : handleReset(confirmModal.student!)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded text-white">
          <RefreshCw className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reset Peserta</h1>
          <p className="text-xs text-slate-500">Daftar peserta terkunci yang perlu direset agar bisa melanjutkan ujian</p>
        </div>
      </div>

      {/* Status Summary Bar */}
      <div className="grid grid-cols-3 gap-0 bg-white border border-slate-200 rounded-lg divide-x divide-slate-100">
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Terkunci</p>
          <p className="text-2xl font-bold text-slate-800">{students.length}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Menunggu Reset</p>
          <p className="text-2xl font-bold text-rose-600">{pendingCount}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sudah Direset</p>
          <p className="text-2xl font-bold text-emerald-600">{resetCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row gap-3">
        <div className="relative w-full md:w-52">
          <select
            value={filterReason}
            onChange={e => setFilterReason(e.target.value)}
            className="w-full h-9 pl-3 pr-8 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none appearance-none"
          >
            <option value="">Semua Alasan Kunci</option>
            <option value="force">Kunci Paksa Admin</option>
            <option value="cheat">Deteksi Kecurangan</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau username peserta..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <button
          disabled={selectedIds.length === 0}
          onClick={() => setConfirmModal({ open: true, student: null, bulk: true })}
          className="flex items-center gap-2 px-4 h-9 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4" /> Reset {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} Terpilih
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                  {selectedIds.length > 0 && selectedIds.length === filteredStudents.filter(s => !s.isReset).length
                    ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                    : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="px-3 py-3 font-bold text-slate-600 w-10 text-center">#</th>
              <th className="px-3 py-3 font-bold text-indigo-600">Username</th>
              <th className="px-3 py-3 font-bold text-indigo-600">Nama Peserta</th>
              <th className="px-3 py-3 font-bold text-slate-600">Grup / Kelas</th>
              <th className="px-3 py-3 font-bold text-slate-600">Ujian</th>
              <th className="px-3 py-3 font-bold text-slate-600">Progress</th>
              <th className="px-3 py-3 font-bold text-slate-600">Waktu Kunci</th>
              <th className="px-3 py-3 font-bold text-slate-600">Alasan</th>
              <th className="px-3 py-3 font-bold text-slate-600 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((student, idx) => (
              <tr
                key={student.id}
                className={`transition-colors hover:bg-slate-50/50 ${selectedIds.includes(student.id) ? 'bg-indigo-50/30' : ''}`}
              >
                <td className="px-4 py-3">
                  <button onClick={() => toggleSelect(student.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {selectedIds.includes(student.id)
                      ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                      : <Square className="w-4 h-4" />}
                  </button>
                </td>
                <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                <td className="px-3 py-3 font-mono text-xs text-indigo-600 font-bold">{student.nis}</td>
                <td className="px-3 py-3 font-bold text-slate-800 uppercase text-xs">{student.name}</td>
                <td className="px-3 py-3 text-slate-600 text-xs">{student.group}</td>
                <td className="px-3 py-3 text-slate-700 font-medium text-xs">{student.testName}</td>
                <td className="px-3 py-3">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-400" /> {student.progress}%
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {student.lockedAt}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border bg-rose-100 text-rose-700 border-rose-200`}>
                    Auto-Lock Cheat
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => setConfirmModal({ open: true, student, bulk: false })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded transition-all shadow-sm active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    <p className="font-bold text-slate-600">Semua Peserta Aktif</p>
                    <p className="text-sm italic">Tidak ada peserta yang sedang terkunci saat ini.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Menampilkan <strong>{filteredStudents.length}</strong> data
            {selectedIds.length > 0 && <> • <strong className="text-indigo-600">{selectedIds.length} dipilih</strong></>}
          </p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Kecurangan
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-500" /> Kunci Paksa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetParticipantManager;
