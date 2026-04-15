import React, { useState, useRef } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  Database,
  FileArchive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Shield,
  FolderOpen
} from 'lucide-react';

interface BackupRecord {
  id: number;
  filename: string;
  type: 'full' | 'database' | 'files';
  size: string;
  createdAt: string;
  status: 'success' | 'failed';
}

const mockBackups: BackupRecord[] = [
  { id: 1, filename: 'backup_full_20260413_090000.zip', type: 'full', size: '48.2 MB', createdAt: '2026-04-13 09:00:00', status: 'success' },
  { id: 2, filename: 'backup_db_20260412_180000.sql', type: 'database', size: '3.1 MB', createdAt: '2026-04-12 18:00:00', status: 'success' },
  { id: 3, filename: 'backup_full_20260411_090000.zip', type: 'full', size: '47.8 MB', createdAt: '2026-04-11 09:00:00', status: 'success' },
  { id: 4, filename: 'backup_db_20260410_180000.sql', type: 'database', size: '3.0 MB', createdAt: '2026-04-10 18:00:00', status: 'failed' },
];

const typeLabel: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  full: { label: 'Full Backup', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <FileArchive className="w-3 h-3" /> },
  database: { label: 'Database', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Database className="w-3 h-3" /> },
  files: { label: 'Files Only', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <FolderOpen className="w-3 h-3" /> },
};

const BackupRestore: React.FC = () => {
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [backupType, setBackupType] = useState<'full' | 'database' | 'files'>('database');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState<BackupRecord | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  // Fetch Backups from API
  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/backups');
      const data = await res.json();
      setBackups(data);
    } catch (err) {
      showNotif('Gagal memuat riwayat backup', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBackups();
  }, []);

  const showNotif = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(p => ({ ...p, show: false })), 4000);
  };

  const handleBackup = async () => {
    if (backupType === 'files' || backupType === 'full') {
        showNotif('Maaf, saat ini hanya Database Backup yang didukung.', 'warning');
        return;
    }

    setIsBackingUp(true);
    try {
        const res = await fetch('http://localhost:3001/api/backups', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: backupType })
        });
        const result = await res.json();
        if (result.success) {
            showNotif(`✅ Backup berhasil: ${result.filename}`);
            fetchBackups();
        } else {
            showNotif(result.error || 'Gagal membuat backup', 'error');
        }
    } catch (err) {
        showNotif('Masalah koneksi ke server', 'error');
    } finally {
        setIsBackingUp(false);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setRestoreFile(file);
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setConfirmRestore(false);
    setIsRestoring(true);

    const formData = new FormData();
    formData.append('backupFile', restoreFile);

    try {
        const res = await fetch('http://localhost:3001/api/backups/restore', {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        if (result.success) {
            showNotif('✅ Restore berhasil! Database telah dipulihkan.', 'success');
            setRestoreFile(null);
            fetchBackups();
        } else {
            showNotif(result.error || 'Gagal restore database', 'error');
        }
    } catch (err) {
        showNotif('Masalah koneksi ke server', 'error');
    } finally {
        setIsRestoring(false);
    }
  };

  const handleDownload = (filename: string) => {
    window.open(`http://localhost:3001/api/backups/download/${filename}`, '_blank');
  };

  const handleDelete = async (filename: string) => {
    try {
        const res = await fetch(`http://localhost:3001/api/backups/${filename}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showNotif('File backup berhasil dihapus.', 'warning');
            fetchBackups();
        }
    } catch (err) {
        showNotif('Gagal menghapus file', 'error');
    } finally {
        setConfirmDelete(null);
    }
  };


  const notifColor = {
    success: 'bg-emerald-600 border-emerald-500',
    error: 'bg-rose-600 border-rose-500',
    warning: 'bg-amber-500 border-amber-400',
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">

      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white text-sm font-bold border animate-in slide-in-from-right duration-300 ${notifColor[notification.type]}`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {notification.message}
        </div>
      )}

      {/* Confirm Restore Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Konfirmasi Restore</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Anda akan mengembalikan sistem dari file: <strong className="text-indigo-600">{restoreFile?.name}</strong>.
                </p>
                <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                  <p className="text-xs font-bold text-rose-700">⚠️ Semua data yang ada saat ini akan ditimpa oleh data dari file backup. Tindakan ini tidak bisa dibatalkan.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setConfirmRestore(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50">Batal</button>
              <button onClick={handleRestore} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                <RefreshCw className="w-4 h-4" /> Ya, Restore Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><Trash2 className="w-5 h-5" /></div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Hapus Backup?</h3>
                <p className="text-sm text-slate-500">File backup ini akan dihapus secara permanen.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50">Batal</button>
              <button onClick={() => handleDelete(confirmDelete.filename)} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded text-white"><HardDrive className="w-5 h-5" /></div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Backup & Restore</h1>
          <p className="text-xs text-slate-500">Kelola cadangan data dan pemulihan sistem</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Panel */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200">
            <Download className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Buat Backup</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-3 block">Pilih Tipe Backup</label>
              <div className="space-y-2">
                {[
                  { value: 'full', label: 'Full Backup', desc: 'Backup seluruh database dan file sistem (Direkomendasikan)', icon: FileArchive },
                  { value: 'database', label: 'Database Only', desc: 'Hanya backup database (soal, user, hasil tes)', icon: Database },
                  { value: 'files', label: 'Files Only', desc: 'Hanya backup file unggahan dan aset media', icon: FolderOpen },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${backupType === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <input type="radio" name="backupType" value={opt.value} checked={backupType === opt.value} onChange={() => setBackupType(opt.value as any)} className="text-indigo-600 focus:ring-indigo-500" />
                    <opt.icon className={`w-4 h-4 shrink-0 ${backupType === opt.value ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div>
                      <p className={`text-sm font-bold ${backupType === opt.value ? 'text-indigo-800' : 'text-slate-700'}`}>{opt.label}</p>
                      <p className="text-[11px] text-slate-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4 flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">Disarankan untuk membuat backup rutin setiap hari, terutama sebelum dan sesudah pelaksanaan ujian besar.</p>
              </div>
              <button
                onClick={handleBackup}
                disabled={isBackingUp}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isBackingUp ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Membuat Backup...</>
                ) : (
                  <><Download className="w-4 h-4" /> Buat Backup Sekarang</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Restore Panel */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200">
            <Upload className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Restore dari File</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-2 block">Upload File Backup</label>
              <input ref={restoreInputRef} type="file" accept=".zip,.sql,.gz" className="hidden" onChange={handleRestoreFile} />
              <div
                onClick={() => restoreInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${restoreFile ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                {restoreFile ? (
                  <div className="space-y-1">
                    <FileArchive className="w-8 h-8 text-indigo-600 mx-auto" />
                    <p className="text-sm font-bold text-indigo-700">{restoreFile.name}</p>
                    <p className="text-xs text-slate-500">{(restoreFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-[11px] text-indigo-500 mt-1">Klik untuk ganti file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-medium text-slate-500">Klik atau drag & drop file backup</p>
                    <p className="text-xs text-slate-400">Format yang didukung: .zip, .sql, .gz</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Peringatan:</strong> Proses restore akan <strong>menimpa seluruh data</strong> sistem yang ada saat ini. Pastikan Anda sudah membuat backup terbaru sebelum melakukan restore.
              </p>
            </div>

            <button
              onClick={() => restoreFile && setConfirmRestore(true)}
              disabled={!restoreFile || isRestoring}
              className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRestoring ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Memulihkan Sistem...</>
              ) : (
                <><RefreshCw className="w-4 h-4" /> Mulai Restore</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Riwayat Backup</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">{backups.length} file</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-bold text-slate-600 w-10 text-center">#</th>
                <th className="px-5 py-3 font-bold text-slate-600">Nama File</th>
                <th className="px-5 py-3 font-bold text-slate-600">Tipe</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-right">Ukuran</th>
                <th className="px-5 py-3 font-bold text-slate-600">Dibuat Pada</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-center">Status</th>
                <th className="px-5 py-3 font-bold text-slate-600 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backups.map((b, idx) => {
                const t = typeLabel[b.type];
                return (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileArchive className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-mono text-xs text-slate-700 font-medium">{b.filename}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border ${t.color}`}>
                        {t.icon} {t.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-600 text-xs">{b.size}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 font-medium">{b.createdAt}</td>
                    <td className="px-5 py-3 text-center">
                      {b.status === 'success'
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded"><CheckCircle2 className="w-3 h-3" /> Sukses</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded"><AlertTriangle className="w-3 h-3" /> Gagal</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                          <button
                            title="Download"
                            onClick={() => handleDownload(b.filename)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            title="Hapus"
                            onClick={() => setConfirmDelete(b)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {backups.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 italic text-sm">
                    Belum ada riwayat backup.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
