import { API_BASE_URL } from '../config/api';
import React, { useState } from 'react';
import { Database, User, CheckCircle, Loader2, Server, Key, UserPlus } from 'lucide-react';

export default function InstallWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    dbname: 'cbtmansaba',
  });

  const [adminConfig, setAdminConfig] = useState({
    fullName: 'Administrator',
    username: 'admin',
    password: '1234',
  });

  const handleDbSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/install/setup-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengatur database');
      }

      setStep(2); // Go to Admin Setup
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/install/setup-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminConfig),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal membuat admin');
      }

      setStep(3); // Go to Success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 flex items-center justify-center p-4">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
        
        {/* Header / Stepper Progress */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-8 py-6">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Server className="text-indigo-600" /> CBT Modern Installer
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Selesaikan instalasi aplikasi dengan langkah mudah di bawah ini.</p>
          
          <div className="flex items-center gap-4 mt-8">
            <StepIndicator current={step} stepNumber={1} icon={<Database size={16} />} label="Database" />
            <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            <StepIndicator current={step} stepNumber={2} icon={<UserPlus size={16} />} label="Administrator" />
            <div className={`flex-1 h-1 rounded ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            <StepIndicator current={step} stepNumber={3} icon={<CheckCircle size={16} />} label="Selesai" />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex font-medium">
              ⚠️ {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleDbSetup} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-2 gap-5">
                <InputGroup label="Database Host" value={dbConfig.host} onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})} icon={<Server size={18} className="text-slate-400"/>} required />
                <InputGroup label="Database Port" value={dbConfig.port} onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})} type="number" required />
              </div>
              <InputGroup label="Database Username" value={dbConfig.user} onChange={(e) => setDbConfig({...dbConfig, user: e.target.value})} icon={<User size={18} className="text-slate-400"/>} required />
              <InputGroup label="Database Password" value={dbConfig.password} onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})} icon={<Key size={18} className="text-slate-400"/>} type="password" />
              <InputGroup label="Database Name" value={dbConfig.dbname} onChange={(e) => setDbConfig({...dbConfig, dbname: e.target.value})} icon={<Database size={18} className="text-slate-400"/>} required />

              <div className="pt-4 flex justify-end">
                <button disabled={loading} type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <><Loader2 className="animate-spin" size={20}/> Menghubungkan & Migrasi...</> : 'Hubungkan Database'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleAdminSetup} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <InputGroup label="Nama Lengkap" value={adminConfig.fullName} onChange={(e) => setAdminConfig({...adminConfig, fullName: e.target.value})} icon={<User size={18} className="text-slate-400"/>} required />
              <InputGroup label="Username" value={adminConfig.username} onChange={(e) => setAdminConfig({...adminConfig, username: e.target.value})} icon={<UserPlus size={18} className="text-slate-400"/>} required />
              <InputGroup label="Password" value={adminConfig.password} onChange={(e) => setAdminConfig({...adminConfig, password: e.target.value})} icon={<Key size={18} className="text-slate-400"/>} type="password" required />

              <div className="pt-4 flex justify-end">
                <button disabled={loading} type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <><Loader2 className="animate-spin" size={20}/> Memproses...</> : 'Buat Akun Administrator'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-10 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-500 w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Instalasi Selesai!</h2>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">Database telah dikonfigurasi dan akun administrator berhasil dibuat. Aplikasi siap digunakan.</p>
              
              <button onClick={() => window.location.href = '/login'} className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg">
                Masuk ke Aplikasi
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Komponen Pendukung
const StepIndicator = ({ current, stepNumber, icon, label }: any) => {
  const isPast = current > stepNumber;
  const isCurrent = current === stepNumber;
  const colorClass = isPast || isCurrent ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-300';
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${colorClass}`}>
        {icon}
      </div>
      <span className={`text-sm font-semibold hidden sm:block ${isPast || isCurrent ? 'text-indigo-900' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
};

const InputGroup = ({ label, icon, ...props }: any) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
      <input 
        {...props} 
        className={`w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${icon ? 'pl-11' : ''}`}
      />
    </div>
  </div>
);
