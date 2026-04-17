import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Layers, 
  Database,
  Loader2,
  Filter
} from 'lucide-react';
import { useConfirm } from '../../components/ui/ConfirmContext';
import { toast } from 'sonner';

const SubjectsManager = () => {
  const confirm = useConfirm();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const modRes = await fetch('http://localhost:3001/api/modules');
      const mods = await modRes.json();
      setModules(mods);

      // Extract all subjects from all modules
      const allSubjects: any[] = [];
      mods.forEach((m: any) => {
        m.subjects.forEach((s: any) => {
          allSubjects.push({ ...s, moduleName: m.name });
        });
      });
      setSubjects(allSubjects);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
        title: 'Hapus Topik',
        message: 'Apakah Anda yakin ingin menghapus topik ini? Semua soal di dalamnya akan terhapus secara permanen.',
        type: 'danger'
    });
    
    if (!isConfirmed) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/subjects/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        toast.success("Topik berhasil dihapus");
        fetchData();
      } else {
        toast.error(result.error || "Gagal menghapus topik");
      }
    } catch (err) {
      toast.error("Masalah koneksi ke server");
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModuleId === 'all' || s.moduleId === parseInt(selectedModuleId);
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Manajemen Topik</h1>
            <p className="text-sm text-slate-500">Kelola topik atau mata pelajaran di bawah modul.</p>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20">
          <Plus className="w-5 h-5" /> Tambah Topik
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari topik..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">Semua Modul</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Nama Topik</th>
                <th className="px-6 py-4">Induk Modul</th>
                <th className="px-6 py-4">Jumlah Soal</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic text-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                    <p className="mt-2">Memuat data topik...</p>
                  </td>
                </tr>
              ) : filteredSubjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">#{s.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{s.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                      {s.moduleName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900 dark:text-white bg-green-50 dark:bg-green-900/20 text-green-600 px-3 py-1 rounded-full border border-green-100 dark:border-green-800">
                      {s._count?.questions || 0} Soal
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-all">
                      <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {!isLoading && filteredSubjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic text-sm">
                    Topik tidak ditemukan.
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

export default SubjectsManager;
