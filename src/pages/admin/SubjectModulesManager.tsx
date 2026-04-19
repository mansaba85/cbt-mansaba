import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Box, 
  Layers, 
  Database,
  Loader2,
  ChevronRight,
  BookOpen,
  Settings2,
  Package
} from 'lucide-react';
import { useConfirm } from '../../components/ui/ConfirmContext';
import { toast } from 'sonner';

const SubjectModulesManager: React.FC = () => {
  const confirm = useConfirm();
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/modules`);
      const data = await res.json();
      setModules(data);
      if (data.length > 0 && !selectedModule) {
        setSelectedModule(data[0]);
      } else if (selectedModule) {
        // Refresh selected module data
        const updated = data.find((m: any) => m.id === selectedModule.id);
        if (updated) setSelectedModule(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteModule = async (id: number) => {
    const isConfirmed = await confirm({
        title: 'Hapus Modul',
        message: 'Apakah Anda yakin ingin menghapus modul ini? Semua topik dan soal di dalamnya akan dihapus secara permanen.',
        type: 'danger'
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/modules/${id}`, { method: 'DELETE' });
      if (res.ok) {
          toast.success("Modul dan seluruh isinya berhasil dihapus");
          fetchData();
      } else {
          toast.error("Gagal menghapus modul");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi server");
    }
  };

  const handleDeleteSubject = async (id: number) => {
    const isConfirmed = await confirm({
        title: 'Hapus Topik',
        message: 'Apakah Anda yakin ingin menghapus topik ini?',
        type: 'danger'
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/${id}`, { method: 'DELETE' });
      if (res.ok) {
          toast.success("Topik berhasil dihapus");
          fetchData();
      } else {
          toast.error("Gagal menghapus topik");
      }
    } catch (err) {
      toast.error("Gagal menghubungi server");
    }
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm text-indigo-600">
              <Package className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Master Modul</h1>
              <p className="text-slate-500 font-semibold text-xs mt-0.5">Kelola hierarki mata pelajaran dan topik ujian.</p>
           </div>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 text-sm">
          <Plus className="w-5 h-5" /> Tambah Modul
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel: Modules List */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari modul..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full neat-field pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {!isLoading ? filteredModules.map((m) => (
              <div 
                key={m.id}
                onClick={() => setSelectedModule(m)}
                className={`group p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  selectedModule?.id === m.id 
                    ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/30 text-white' 
                    : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                }`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedModule?.id === m.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {m.subjects?.length || 0} Topik Tersedia
                    </p>
                    <h3 className={`text-base font-bold tracking-tight ${selectedModule?.id === m.id ? 'text-white' : 'text-slate-800'}`}>
                      {m.name}
                    </h3>
                  </div>
                  <div className={`p-1.5 rounded-lg transition-all ${selectedModule?.id === m.id ? 'bg-indigo-500/30 text-white translate-x-1' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-100'}`}>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-black text-[10px] uppercase tracking-widest">Memuat...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Module Details and Topics */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden">
          {selectedModule ? (
            <div className="flex flex-col h-full">
              {/* Module Info Header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-white flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-bold text-slate-800 tracking-tight">{selectedModule.name}</h2>
                   <p className="text-sm text-slate-500 font-medium mt-0.5">{selectedModule.description || 'Tidak ada deskripsi modul ini.'}</p>
                </div>
                <div className="flex gap-2">
                   <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                      <Edit3 className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDeleteModule(selectedModule.id)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>

              {/* Topics Table Area */}
              <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-800">Daftar Topik / Mata Pelajaran</h3>
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95">
                    <Plus className="w-4 h-4" /> Tambah Topik
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-10 text-center">#</th>
                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Topik</th>
                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Soal</th>
                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedModule.subjects?.map((s: any, idx: number) => (
                        <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 text-xs font-bold text-slate-400 text-center">{idx + 1}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-700 text-sm italic">{s.name}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              {s._count?.questions || 0} Soal
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2 transition-all">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteSubject(s.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!selectedModule.subjects || selectedModule.subjects.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold italic text-sm">
                            Belum ada topik di dalam modul ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
               <div className="p-10 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                  <BookOpen className="w-20 h-20 text-slate-200" />
               </div>
               <p className="font-black text-[10px] uppercase tracking-[0.3em]">Silakan Pilih Modul di Samping</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectModulesManager;
