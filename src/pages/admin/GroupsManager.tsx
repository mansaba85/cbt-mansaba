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
  const [searchTerm, setSearchTerm] = useState('');

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
        body: JSON.stringify({ name: newGroupName })
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Grup / Kelas</h1>
           <p className="text-slate-500 font-medium">Kelola rombongan belajar dan kelompok instruktur Anda.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-1 active:scale-95"
        >
          <Plus className="w-5 h-5" /> TAMBAH GRUP BARU
        </button>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
               <Users2 className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Grup</p>
               <h3 className="text-2xl font-black text-slate-800">{groups.length}</h3>
            </div>
         </div>

         <div className="md:col-span-2 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
               type="text"
               placeholder="Cari nama grup atau kelas..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-full bg-white border border-slate-200 rounded-3xl pl-14 pr-6 py-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
         </div>
      </div>

      {/* Add Form (Inline) */}
      {isAdding && (
        <form onSubmit={handleAddGroup} className="bg-slate-900 p-6 rounded-3xl shadow-xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex-1">
             <input 
                autoFocus
                type="text" 
                placeholder="Masukkan nama grup (misal: XII IPA 1)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500"
             />
          </div>
          <div className="flex gap-2">
             <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 text-slate-400 font-bold text-xs">BATAL</button>
             <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20">SIMPAN GRUP</button>
          </div>
        </form>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading && <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>}
        
        {!isLoading && filteredGroups.map((group) => (
          <div key={group.id} className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
               <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                     <Users className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                     <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                     <button onClick={() => handleDeleteGroup(group.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-800 truncate leading-tight">{group.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                     <Users2 className="w-3 h-3" />
                     <span className="text-[10px] font-black uppercase tracking-wider">{group._count.users} Siswa Terdaftar</span>
                  </div>
               </div>
            </div>
            
            <button 
              onClick={() => navigate(`/admin/users?groupId=${group.id}`)}
              className="mt-6 w-full py-2.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
            >
               Lihat Detail
            </button>
          </div>
        ))}

        {!isLoading && filteredGroups.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center text-slate-400 italic font-medium">
             <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
             Belum ada grup yang cocok dengan pencarian.
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsManager;
