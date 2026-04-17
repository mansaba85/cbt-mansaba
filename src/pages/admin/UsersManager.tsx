import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Plus,
  ChevronDown,
  Loader2,
  X,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  password: string;
  fullName: string;
  levelInt: number;
  createdAt: string;
  groups: { id: number; name: string; category: string }[];
}

interface UserForm {
  username: string;
  password: string;
  fullName: string;
  levelInt: number;
  groupIds: number[];
}

const emptyForm: UserForm = {
  username: '',
  password: '',
  fullName: '',
  levelInt: 4,
  groupIds: [],
};

const UsersManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User | 'groupName'; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'desc' });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const gid = searchParams.get('groupId');
    if (gid) setSelectedGroupId(gid);
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGroupId, itemsPerPage]);

  const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(p => ({ ...p, show: false })), 3500);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const gRes = await fetch('http://localhost:3001/api/groups');
      const groupsData = await gRes.json();
      setGroups(groupsData);

      const uUrl = selectedGroupId 
        ? `http://localhost:3001/api/users?groupId=${selectedGroupId}` 
        : 'http://localhost:3001/api/users';
      const uRes = await fetch(uUrl);
      const usersData = await uRes.json();
      setUsers(usersData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    setSelectedIds([]); // Clear selection when group filter changes
  }, [selectedGroupId]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedUsers.map(u => u.id));
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

  const openAdd = () => {
    setModalMode('add');
    setEditingUser(null);
    setForm(emptyForm);
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setModalMode('edit');
    setEditingUser(user);
    setForm({
      username: user.username,
      password: '',
      fullName: user.fullName,
      levelInt: user.levelInt,
      groupIds: (user.groups || []).map(g => g.id),
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.username.trim() || !form.fullName.trim()) {
      showNotif('Username dan Nama wajib diisi.', 'error');
      return;
    }
    if (modalMode === 'add' && !form.password.trim()) {
      showNotif('Password wajib diisi untuk user baru.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        levelInt: form.levelInt,
        groupIds: form.groupIds,
      };
      if (form.password.trim()) payload.password = form.password.trim();

      const url = modalMode === 'add'
        ? 'http://localhost:3001/api/users'
        : `http://localhost:3001/api/users/${editingUser?.id}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotif(modalMode === 'add' ? '✅ User berhasil ditambahkan.' : '✅ Data user berhasil diperbarui.');
        closeModal();
        fetchData();
      } else {
        const err = await res.json();
        showNotif(err.message || 'Gagal menyimpan data.', 'error');
      }
    } catch (e) {
      showNotif('Koneksi ke server gagal.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotif(`✅ User ${user.username} berhasil dihapus.`);
        setDeleteConfirm(null);
        fetchData();
      } else {
        showNotif('Gagal menghapus user.', 'error');
      }
    } catch {
      showNotif('Koneksi ke server gagal.', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    try {
      let count = 0;
      for (const id of selectedIds) {
        const res = await fetch(`http://localhost:3001/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) count++;
      }
      showNotif(`✅ Berhasil menghapus ${count} user.`);
      setSelectedIds([]);
      setBulkDeleteConfirmOpen(false);
      fetchData();
    } catch {
      showNotif('Gagal menghapus beberapa data.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const requestSort = (key: keyof User | 'groupName') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = React.useMemo(() => {
    let sortableItems = [...users];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        if (sortConfig.key === 'groupName') {
            aVal = a.groups.map(g => g.name).join(', ') || '';
            bVal = b.groups.map(g => g.name).join(', ') || '';
        } else {
            aVal = a[sortConfig.key];
            bVal = b[sortConfig.key];
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [users, sortConfig]);

  const filteredUsers = sortedUsers.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredUsers.length;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / (itemsPerPage as number));
  const paginatedUsers = itemsPerPage === 'all' 
    ? filteredUsers 
    : filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * (itemsPerPage as number));

  const SortIndicator = ({ column }: { column: keyof User | 'groupName' }) => {
    if (sortConfig?.key !== column) return <ChevronDown className="ml-1 w-3 h-3 text-slate-300 opacity-20 group-hover:opacity-100" />;
    return sortConfig.direction === 'asc' ? <ChevronDown className="ml-1 w-3 h-3 text-indigo-600 rotate-180" /> : <ChevronDown className="ml-1 w-3 h-3 text-indigo-600" />;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().split(' ')[0],
    };
  };

  const levelOptions = [
    { value: 1,  label: 'Level 1  — Siswa' },
    { value: 4,  label: 'Level 4  — Orangtua Siswa' },
    { value: 5,  label: 'Level 5  — Pengawas' },
    { value: 6,  label: 'Level 6  — Panitia' },
    { value: 7,  label: 'Level 7  — Guru' },
    { value: 10, label: 'Level 10 — Admin' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white text-sm font-bold border animate-in slide-in-from-right duration-300 ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-rose-600 border-rose-500'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          {notification.message}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {modalMode === 'add' ? '➕ Tambah User Baru' : `✏️ Edit User: ${editingUser?.username}`}
              </h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Username <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    placeholder="Contoh: MA0226401"
                    className="w-full h-9 px-3 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Password {modalMode === 'edit' && <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span>}
                    {modalMode === 'add' && <span className="text-rose-500"> *</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder={modalMode === 'edit' ? '••••••••' : 'Masukkan password'}
                      className="w-full h-9 px-3 pr-9 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Nama Lengkap <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Nama lengkap peserta"
                  className="w-full h-9 px-3 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Level</label>
                  <div className="relative">
                    <select
                      value={form.levelInt}
                      onChange={e => setForm(p => ({ ...p, levelInt: Number(e.target.value) }))}
                      className="w-full h-9 pl-3 pr-8 border border-slate-300 rounded text-sm outline-none appearance-none bg-white focus:border-indigo-500"
                    >
                      {levelOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Penempatan Grup (Multi-Select)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
                    {groups.map(g => (
                        <label key={g.id} className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="checkbox"
                                checked={form.groupIds.includes(g.id)}
                                onChange={(e) => {
                                    if (e.target.checked) setForm(p => ({ ...p, groupIds: [...p.groupIds, g.id] }));
                                    else setForm(p => ({ ...p, groupIds: p.groupIds.filter(id => id !== g.id) }));
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                            />
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] font-bold text-slate-700">{g.name}</span>
                                <span className="text-[7px] text-slate-400 font-black uppercase">{g.category}</span>
                            </div>
                        </label>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 italic italic italic">Pilih Sekolah, Kelas, dan Mapel Pilihan siswa ini.</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0"><Trash2 className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Hapus User?</h3>
                  <p className="text-sm text-slate-600">
                    Anda akan menghapus <strong>{deleteConfirm.fullName}</strong> ({deleteConfirm.username}) secara permanen. Tindakan ini tidak bisa dibatalkan.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-5 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50">Batal</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      {bulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center animate-bounce"><Trash2 className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Hapus Masal?</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Anda akan menghapus <span className="text-rose-600 font-black">{selectedIds.length} pengguna</span> yang dipilih sekaligus. Data tidak dapat dipulihkan!
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-8">
                <button 
                  onClick={handleBulkDelete}
                  disabled={isSaving}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  YA, HAPUS SEMUANYA
                </button>
                <button 
                  onClick={() => setBulkDeleteConfirmOpen(false)} 
                  className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                    BATALKAN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
           <div className="flex-1 relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari user atau nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
              />
           </div>
           
           {/* Bulk Actions Button */}
           {selectedIds.length > 0 && (
              <button 
                onClick={() => setBulkDeleteConfirmOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all animate-in slide-in-from-left-4 duration-300"
              >
                 <Trash2 className="w-4 h-4" /> Hapus Terpilih ({selectedIds.length})
              </button>
           )}

           <div className="w-64 relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-10 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="">Semua Group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           </div>
           <div className="w-40 relative">
              <select 
                value={itemsPerPage === 'all' ? 'all' : itemsPerPage}
                onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer shadow-sm text-slate-600"
              >
                <option value="10">Limit: 10</option>
                <option value="25">Limit: 25</option>
                <option value="50">Limit: 50</option>
                <option value="100">Limit: 100</option>
                <option value="all">Semua</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           </div>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => window.location.href = '/admin/users/import'}
             className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
           >
              IMPOR DATA
           </button>
           <button
             onClick={openAdd}
             className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
           >
              <Plus className="w-4 h-4" /> TAMBAH USER
           </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8fafc] border-b border-slate-200">
              <tr className="select-none">
                <th className="px-4 py-4 w-10">
                   <input 
                      type="checkbox" 
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={paginatedUsers.length > 0 && selectedIds.length === paginatedUsers.length}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                   />
                </th>
                <th 
                  className="px-2 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100/50 group"
                  onClick={() => requestSort('id')}
                >
                  <div className="flex items-center justify-center"># <SortIndicator column="id" /></div>
                </th>
                <th 
                  className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 group"
                  onClick={() => requestSort('username')}
                >
                  <div className="flex items-center">Username <SortIndicator column="username" /></div>
                </th>
                <th className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider">Password</th>
                <th 
                  className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 group"
                  onClick={() => requestSort('fullName')}
                >
                  <div className="flex items-center">Nama Lengkap <SortIndicator column="fullName" /></div>
                </th>
                <th 
                  className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100/50 group"
                  onClick={() => requestSort('levelInt')}
                >
                  <div className="flex items-center justify-center">Level <SortIndicator column="levelInt" /></div>
                </th>
                <th 
                  className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100/50 group"
                  onClick={() => requestSort('createdAt')}
                >
                  <div className="flex items-center justify-center">Registrasi <SortIndicator column="createdAt" /></div>
                </th>
                <th className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider">Madrasah</th>
                <th className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider">Kelas</th>
                <th className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider">Peminatan</th>
                <th className="px-4 py-4 font-black text-rose-500 text-[11px] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                   <td colSpan={11} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data...</span>
                      </div>
                   </td>
                </tr>
              )}

              {!isLoading && paginatedUsers.map((u, idx) => {
                const { date, time } = formatDate(u.createdAt);
                const displayIndex = itemsPerPage === 'all' 
                  ? idx + 1 
                  : (currentPage - 1) * itemsPerPage + idx + 1;
                  
                return (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-4 py-4 text-center">
                       <input 
                          type="checkbox" 
                          checked={selectedIds.includes(u.id)}
                          onChange={(e) => handleSelectOne(u.id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                       />
                    </td>
                    <td className="px-2 py-4 text-center font-black text-slate-800">{displayIndex}</td>
                    <td className="px-4 py-4 text-blue-600 font-bold hover:underline cursor-pointer">{u.username}</td>
                    <td className="px-4 py-4 text-slate-500 font-mono tracking-tighter text-[11px]">{u.password}</td>
                    <td className="px-4 py-4 font-bold text-slate-700 uppercase">{u.fullName}</td>
                    <td className="px-4 py-4 text-center">
                       {(() => {
                         const levelMap: Record<number, { label: string; color: string }> = {
                           0:  { label: '🔒 Terkunci', color: 'bg-slate-700' },
                           1:  { label: '1 · Siswa',    color: 'bg-indigo-500' },
                           4:  { label: '4 · Ortu',     color: 'bg-purple-500' },
                           5:  { label: '5 · Pengawas', color: 'bg-cyan-600' },
                           6:  { label: '6 · Panitia',  color: 'bg-amber-500' },
                           7:  { label: '7 · Guru',     color: 'bg-emerald-600' },
                           10: { label: '10 · Admin',   color: 'bg-rose-600' },
                         };
                         const lv = levelMap[u.levelInt] ?? { label: String(u.levelInt), color: 'bg-slate-500' };
                         return (
                           <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-black text-white text-[9px] ${lv.color}`}>
                             {lv.label}
                           </span>
                         );
                       })()}
                    </td>
                    <td className="px-4 py-4 text-center leading-tight">
                       <div className="text-slate-500 font-bold text-[11px]">{date}</div>
                       <div className="text-[9px] text-slate-400 font-bold">{time}</div>
                    </td>
                    <td className="px-4 py-4">
                        <span className="text-[10px] font-bold text-slate-700">{u.groups.find(g => g.category === 'SCHOOL')?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                        <span className="text-[10px] font-bold text-slate-700">{u.groups.find(g => g.category === 'CLASS')?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                       <div className="flex flex-wrap gap-1">
                          {u.groups.filter(g => g.category === 'SUBJECT' || g.category === 'GENERAL').map(g => (
                            <span key={g.id} className="px-2 py-0.5 rounded text-[8px] font-black uppercase border bg-emerald-50 text-emerald-600 border-emerald-100">
                               {g.name}
                            </span>
                          ))}
                          {u.groups.filter(g => g.category === 'SUBJECT' || g.category === 'GENERAL').length === 0 && <span className="text-slate-300 text-[10px]">-</span>}
                       </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                       <div className="flex items-center justify-end gap-1 ">
                          <button 
                            title="Edit Pengguna"
                            onClick={() => openEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          >
                             <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            title="Hapus Pengguna"
                            onClick={() => setDeleteConfirm(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              
              {!isLoading && filteredUsers.length === 0 && (
                <tr>
                   <td colSpan={11} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                      Data tidak ditemukan.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Controls --- */}
        {!isLoading && itemsPerPage !== 'all' && totalItems > 0 && (
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Menampilkan <span className="text-slate-900">{(currentPage - 1) * (itemsPerPage as number) + 1}</span> sampai <span className="text-slate-900">{Math.min(currentPage * (itemsPerPage as number), totalItems)}</span> dari <span className="text-slate-900">{totalItems}</span> User
             </div>
             
             <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
                >
                   <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1 mx-2">
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Logic to show pages around current page
                      let pageNum = currentPage;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-black transition-all border ${
                            currentPage === pageNum 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                   })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
                >
                   <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManager;
