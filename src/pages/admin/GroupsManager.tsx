import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Loader2, 
  Users2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../../components/ui/ConfirmContext';
import { toast } from 'sonner';

const GroupsManager: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('CLASS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('CLASS');

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/groups');
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch('http://localhost:3001/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, category: newGroupCategory })
      });
      if (res.ok) {
        setNewGroupName('');
        setIsAdding(false);
        toast.success(`Grup "${newGroupName}" berhasil ditambahkan`);
        fetchGroups();
      } else {
        toast.error("Gagal menambahkan grup");
      }
    } catch (err) {
      toast.error("Masalah koneksi ke server");
    }
  };

  const handleDeleteGroup = async (id: number) => {
    const isConfirmed = await confirm({
        title: 'Hapus Grup',
        message: 'Apakah Anda yakin ingin menghapus grup ini? Pengguna di dalamnya akan kehilangan keterhubungan dengan grup ini.',
        type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:3001/api/groups/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Grup berhasil dihapus");
        fetchGroups();
      } else {
        toast.error(result.error || "Gagal menghapus grup");
      }
    } catch (err) {
      toast.error("Server sedang sibuk atau tidak merespons");
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { id: 'SCHOOL', label: 'Madrasah / Sekolah', color: 'bg-rose-500' },
    { id: 'CLASS', label: 'Kelas / Rombel', color: 'bg-indigo-600' },
    { id: 'SUBJECT', label: 'Mata Pelajaran', color: 'bg-emerald-600' },
    { id: 'GENERAL', label: 'Grup Umum', color: 'bg-slate-500' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4">
           <div className="p-3.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100"><Users2 className="w-6 h-6" /></div>
           <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Manajemen Grup & Kategori</h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1.5 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 Hierarki & Manajemen Institusi
              </p>
           </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 bg-blue-600 text-white px-5 py-3 rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest active:scale-95"
        >
          <Plus className="w-4 h-4 border border-white/20 rounded-full" /> TAMBAH GRUP
        </button>
      </div>

      {/* Stats & Search */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[180px]">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
               <Users2 className="w-4 h-4" />
            </div>
            <div>
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none">Total Grup</p>
               <h3 className="text-xl font-bold text-slate-800">{groups.length}</h3>
            </div>
         </div>

         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input 
               type="text"
               placeholder="Cari nama grup atau kategori..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-xs font-semibold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm placeholder:text-slate-400"
            />
         </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-1">
          <button 
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${selectedCategory === 'ALL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${selectedCategory === cat.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {cat.label}
            </button>
          ))}
      </div>
      {isAdding && (
        <form onSubmit={handleAddGroup} className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex-1 w-full">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Nama Grup</label>
             <input 
                autoFocus
                type="text" 
                placeholder="Misal: MA NU 01 Limpung atau XII.1"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
             />
          </div>
          <div className="w-full md:w-64">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Kategori</label>
             <select 
                value={newGroupCategory}
                onChange={(e) => setNewGroupCategory(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
             >
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
             </select>
          </div>
          <div className="flex gap-2 mt-4 md:mt-5">
             <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-3 text-slate-400 font-black text-xs uppercase tracking-widest">BATAL</button>
             <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">SIMPAN</button>
          </div>
        </form>
      )}

      {/* Main Grid organized by Category */}
      <div className="space-y-8">
        {categories
          .filter(cat => selectedCategory === 'ALL' || selectedCategory === cat.id)
          .map(cat => {
            const catGroups = filteredGroups.filter(g => g.category === cat.id);
            if (catGroups.length === 0 && !searchTerm) return null;
            
            return (
              <div key={cat.id} className="space-y-3">
                  {selectedCategory === 'ALL' && (
                    <div className="flex items-center gap-3 px-2">
                        <div className={`w-1.5 h-4 ${cat.color} rounded-full`}></div>
                        <h2 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{cat.label}</h2>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{catGroups.length}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {catGroups.map((group) => (
                      <div key={group.id} className="group bg-white rounded-2xl border border-slate-200 p-3 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between relative overflow-hidden">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <div className={`w-7 h-7 bg-slate-50 text-slate-300 rounded-lg flex items-center justify-center group-hover:${cat.color} group-hover:text-white transition-all shadow-sm`}>
                                    <Users className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex items-center gap-1 transition-all">
                                    <button onClick={() => { setNewGroupName(group.name); setNewGroupCategory(group.category); setIsAdding(true); }} className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 text-slate-300 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 truncate leading-none mb-1.5">{group.name}</h3>
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Users2 className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-medium tracking-tight">{group._count.users} Siswa</span>
                                </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => navigate(`/admin/users?groupId=${group.id}`)}
                            className="mt-3 w-full py-1.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-wider group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all transform group-hover:scale-[1.02]"
                          >
                            Lihat Siswa
                          </button>
                      </div>
                      ))}
                  </div>
              </div>
            );
        })}
      </div>

        {!isLoading && filteredGroups.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center text-slate-400 italic font-medium">
             <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
             Belum ada grup yang cocok dengan pencarian.
          </div>
        )}
      </div>
  );
};

export default GroupsManager;
