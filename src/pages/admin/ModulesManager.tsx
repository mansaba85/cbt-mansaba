import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Box, 
  ChevronRight,
  Database,
  Loader2
} from 'lucide-react';
import { useConfirm } from '../../components/ui/ConfirmContext';
import { toast } from 'sonner';

const ModulesManager = () => {
  const confirm = useConfirm();
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/modules`);
      const data = await res.json();
      setModules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
        title: 'Hapus Modul',
        message: 'Apakah Anda yakin ingin menghapus modul ini? Semua topik dan soal di dalamnya juga akan terhapus secara permanen.',
        type: 'danger'
    });
    
    if (!isConfirmed) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/modules/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        toast.success("Modul berhasil dihapus");
        fetchModules();
      } else {
        toast.error(result.error || "Gagal menghapus modul");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi");
    }
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Modul</h1>
            <p className="text-sm text-slate-500">Kelola daftar modul ujian dan paket soal.</p>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
          <Plus className="w-5 h-5" /> Tambah Modul
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari modul..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Database className="w-4 h-4" /> Total: {modules.length} Modul
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Nama Modul</th>
                <th className="px-6 py-4">Jumlah Topik</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                    <p className="text-sm text-slate-400 mt-2 font-medium">Memuat data modul...</p>
                  </td>
                </tr>
              ) : filteredModules.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">#{m.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700 dark:text-slate-200">{m.name}</div>
                    <div className="text-[10px] text-slate-400">{m.description || 'Tidak ada deskripsi'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800">
                      {m.subjects.length} Topik
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase ${m.enabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${m.enabled ? 'bg-green-600' : 'bg-slate-400'}`} />
                      {m.enabled ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-all">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Modul">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                        title="Hapus Modul"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-900 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {!isLoading && filteredModules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic text-sm">
                    Modul tidak ditemukan.
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

export default ModulesManager;
