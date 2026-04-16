import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Fingerprint,
  Camera,
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';

const AdminProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('cbt_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      setFullName(u.fullName || '');
      setUsername(u.username || '');
    }
    setIsLoading(false);
  }, []);

  const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(p => ({ ...p, show: false })), 3500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      showNotif('Nama dan Username tidak boleh kosong.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username })
      });

      if (res.ok) {
        const updatedUser = { ...user, fullName, username };
        localStorage.setItem('cbt_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        showNotif('✅ Profil berhasil diperbarui. Halaman akan dimuat ulang...');
        
        // Refresh sidebar
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const data = await res.json();
        showNotif(data.message || 'Gagal memperbarui profil.', 'error');
      }
    } catch (err) {
      showNotif('Koneksi server gagal.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      showNotif('Password baru tidak boleh kosong.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotif('Konfirmasi password tidak cocok.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      if (res.ok) {
        showNotif('✅ Password berhasil diubah.');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      } else {
        const data = await res.json();
        showNotif(data.message || 'Gagal mengubah password.', 'error');
      }
    } catch (err) {
      showNotif('Koneksi server gagal.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Memuat Profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Notifications */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold border animate-in slide-in-from-right duration-300 ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-rose-600 border-rose-500'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          {notification.message}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
         <div className="relative">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-200 rotate-3">
               {user?.fullName?.charAt(0) || 'A'}
            </div>
            <button className="absolute -bottom-2 -right-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-lg text-slate-600 hover:text-indigo-600 transition-all hover:scale-110">
               <Camera className="w-5 h-5" />
            </button>
         </div>
         <div className="text-center md:text-left">
            <div className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100">
               System Administrator
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{fullName}</h1>
            <p className="text-slate-500 font-medium">Username: <span className="text-indigo-600 font-bold">@{username}</span> • ID: #{user?.id}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Sidebar Settings Info */}
         <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
               <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" /> Keamanan Akun
               </h3>
               <p className="text-slate-400 text-xs leading-relaxed mb-6 font-medium">
                  Pastikan informasi profil Anda akurat untuk keperluan log audit dan autentikasi sistem. Gunakan password yang kuat dengan campuran huruf, angka, dan simbol.
               </p>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Fingerprint className="w-4 h-4 text-indigo-400" /></div>
                     <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Metode Login</p>
                        <p className="text-xs font-bold">Username & Password</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Hash className="w-4 h-4 text-emerald-400" /></div>
                     <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Level Akses</p>
                        <p className="text-xs font-bold">Super Admin (Lv. 10)</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Form Section */}
         <div className="md:col-span-2 space-y-8">
            {/* General Profile Form */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-black text-slate-800 tracking-tight uppercase text-sm">Informasi Dasar</h2>
               </div>
               <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                        <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                        <div className="relative">
                           <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                           />
                        </div>
                     </div>
                  </div>
                  <div className="flex justify-end pt-2">
                     <button 
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                     >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Menyimpan...' : 'Perbarui Profil'}
                     </button>
                  </div>
               </form>
            </div>

            {/* Password Change Form */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <Key className="w-5 h-5 text-rose-600" />
                  <h2 className="font-black text-slate-800 tracking-tight uppercase text-sm">Ubah Kata Sandi</h2>
               </div>
               <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Kata Sandi Baru</label>
                     <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                           type={showNewPassword ? 'text' : 'password'} 
                           placeholder="••••••••"
                           value={newPassword}
                           onChange={(e) => setNewPassword(e.target.value)}
                           className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all"
                        />
                        <button 
                           type="button" 
                           onClick={() => setShowNewPassword(!showNewPassword)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                        >
                           {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Konfirmasi Kata Sandi Baru</label>
                     <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                           type={showConfirmPassword ? 'text' : 'password'} 
                           placeholder="••••••••"
                           value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all"
                        />
                        <button 
                           type="button" 
                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                        >
                           {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                     </div>
                  </div>
                  <div className="flex justify-end pt-2">
                     <button 
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/20 transition-all disabled:opacity-50"
                     >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        {isSaving ? 'Memproses...' : 'Ubah Password'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminProfile;
