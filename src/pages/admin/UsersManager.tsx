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
  AlertTriangle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  password: string;
  fullName: string;
  levelInt: number;
  createdAt: string;
  group?: { id: number; name: string };
}

interface UserForm {
  username: string;
  password: string;
  fullName: string;
  levelInt: number;
  groupId: string;
}

const emptyForm: UserForm = {
  username: '',
  password: '',
  fullName: '',
  levelInt: 4,
  groupId: '',
};

const UsersManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  useEffect(() => {
    const gid = searchParams.get('groupId');
    if (gid) setSelectedGroupId(gid);
  }, [searchParams]);

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

  useEffect(() => { fetchData(); }, [selectedGroupId]);

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
      password: '',            // Kosongkan, hanya diupdate jika diisi
      fullName: user.fullName,
      levelInt: user.levelInt,
      groupId: String(user.group?.id || ''),
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
        groupId: form.groupId || null,
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

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = itemsPerPage === 'all' ? filteredUsers : filteredUsers.slice(0, itemsPerPage);

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
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Group / Kelas</label>
                  <div className="relative">
                    <select
                      value={form.groupId}
                      onChange={e => setForm(p => ({ ...p, groupId: e.target.value }))}
                      className="w-full h-9 pl-3 pr-8 border border-slate-300 rounded text-sm outline-none appearance-none bg-white focus:border-indigo-500"
                    >
                      <option value="">-- Pilih Group --</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
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

      {/* Search & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex gap-3">
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
           {/* Items Per Page Selector */}
           <div className="w-40 relative">
              <select 
                value={itemsPerPage === 'all' ? 'all' : itemsPerPage}
                onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer shadow-sm text-slate-600"
              >
                <option value="10">Limit: 10</option>
                <option value="25">Limit: 25</option>
                <option value="50">Limit: 50</option>
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
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                   <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="px-2 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider text-center w-10">#</th>
                <th className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider">User</th>
                <th className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider">Password</th>
                <th className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider">Nama</th>
                <th className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider text-center">Level</th>
                <th className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider text-center">Tanggal Registrasi</th>
                <th className="px-4 py-4 font-black text-[#5c72b2] text-[11px] uppercase tracking-wider">Group</th>
                <th className="px-4 py-4 font-black text-rose-500 text-[11px] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                   <td colSpan={9} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data...</span>
                      </div>
                   </td>
                </tr>
              )}

              {!isLoading && paginatedUsers.map((u, idx) => {
                const { date, time } = formatDate(u.createdAt);
                return (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-4 py-4 text-center">
                       <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-2 py-4 text-center font-black text-slate-800">{idx + 1}</td>
                    <td className="px-4 py-4 text-blue-600 font-medium hover:underline cursor-pointer">{u.username}</td>
                    <td className="px-4 py-4 text-slate-500 font-mono tracking-tighter">{u.password?.substring(0, 10)}*</td>
                    <td className="px-4 py-4 font-bold text-slate-700 uppercase">{u.fullName}</td>
                    <td className="px-4 py-4 text-center">
                       {(() => {
                         const levelMap: Record<number, { label: string; color: string }> = {
                           0:  { label: '🔒 Terkunci', color: 'bg-slate-700' },
                           1:  { label: '1 · Siswa',    color: 'bg-blue-500' },
                           4:  { label: '4 · Ortu',     color: 'bg-purple-500' },
                           5:  { label: '5 · Pengawas', color: 'bg-cyan-600' },
                           6:  { label: '6 · Panitia',  color: 'bg-amber-500' },
                           7:  { label: '7 · Guru',     color: 'bg-emerald-600' },
                           10: { label: '10 · Admin',   color: 'bg-rose-600' },
                         };
                         const lv = levelMap[u.levelInt] ?? { label: String(u.levelInt), color: 'bg-slate-500' };
                         return (
                           <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-black text-white text-[10px] ${lv.color}`}>
                             {lv.label}
                           </span>
                         );
                       })()}
                    </td>
                    <td className="px-4 py-4 text-center leading-tight">
                       <div className="text-slate-500 font-medium">{date}</div>
                       <div className="text-[10px] text-slate-400 font-bold">{time}</div>
                    </td>
                    <td className="px-4 py-4">
                       <div className="flex flex-wrap gap-1">
                          <span className="bg-[#5c72b2] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">
                             {u.group?.name || 'DEFAULT'}
                          </span>
                       </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                       <div className="flex items-center justify-end gap-1">
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
                   <td colSpan={9} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                      Data tidak ditemukan.
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

export default UsersManager;
