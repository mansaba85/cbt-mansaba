import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, MonitorSmartphone, GraduationCap, Eye, EyeOff, Loader2, Info } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [siteName, setSiteName] = useState('CBT MANSABA');

  React.useEffect(() => {
    // Check if already logged in
    const userJson = localStorage.getItem('cbt_user');
    if (userJson && userJson !== 'undefined') {
        try {
            const user = JSON.parse(userJson);
            if (user && user.levelInt >= 7) {
                navigate('/admin');
                return;
            } else if (user) {
                navigate('/student');
                return;
            }
        } catch (e) {
            console.error("Session check failed", e);
        }
    }

    const fetchBranding = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/settings');
            const data = await res.json();
            if (data.cbt_site_settings && data.cbt_site_settings.siteName) {
                setSiteName(data.cbt_site_settings.siteName);
            }
        } catch(e) {
            const saved = localStorage.getItem('cbt_site_settings');
            if (saved) {
                const site = JSON.parse(saved);
                if (site.siteName) setSiteName(site.siteName);
            }
        }
    };
    fetchBranding();

    // Check for suspended error from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'suspended') {
        setErrorText('AKUN TERKUNCI! Sesi Anda dihentikan paksa karena pelanggaran aturan. Silakan hubungi proktor.');
    } else if (params.get('error') === 'multi_login') {
        setErrorText('SESI BERAKHIR! Akun Anda baru saja login di perangkat/browser lain. Satu akun hanya boleh aktif di satu tempat.');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorText('Username dan Password wajib diisi!');
      return;
    }

    setErrorText('');
    setIsLoading(true);

    try {
      const resp = await fetch('http://localhost:3001/api/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ username, password })
      });
      const data = await resp.json();
      
      if (data.success) {
         // Save user config and session locally
         localStorage.setItem('cbt_user', JSON.stringify(data.user));
         localStorage.setItem('cbt_session_token', data.sessionToken);
         
         // Route based on role
         if (data.user.levelInt >= 7) {
            navigate('/admin');
         } else {
            navigate('/student');
         }
      } else {
         setErrorText(data.error || 'Login gagal.');
      }
    } catch (err) {
      setErrorText('Server tidak merespons. Pastikan server berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10 min-h-[600px]">
        
        {/* Left Side - Poster/Banner */}
        <div className="w-full md:w-5/12 bg-indigo-600 relative overflow-hidden p-10 flex flex-col justify-between items-start text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800"></div>
          
          {/* Glass Overlay Elements */}
          <div className="absolute top-1/4 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl"></div>

          <div className="relative z-10 w-full mb-12 mt-4">
            <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-xl">
               <GraduationCap className="w-8 h-8 text-indigo-100" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight mb-4">
               {siteName.split(' ')[0]}<br/>{siteName.split(' ').slice(1).join(' ')}
            </h1>
            <p className="text-indigo-200 text-sm lg:text-base font-medium leading-relaxed max-w-xs">
               Platform evaluasi komprehensif, cepat, dan aman. Kini dengan pengawasan *Real-time* dan *Smart Layout*.
            </p>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex items-start gap-4">
            <MonitorSmartphone className="w-8 h-8 text-indigo-200 shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Multi-Device Ready</h4>
              <p className="text-xs text-indigo-200 font-medium">Tes dapat diakses mulus lewat Komputer, Tablet, maupun Ponsel Pintar.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative bg-white">
           <div className="max-w-md mx-auto w-full">
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Selamat Datang 👋</h2>
                <p className="text-slate-500 text-sm font-medium mt-2">Silakan masuk dengan akun yang telah diberikan.</p>
              </div>

              {errorText && (
                 <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                    <Info className="w-4 h-4 shrink-0" />
                    {errorText}
                 </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-600 tracking-wide uppercase px-1">Username / NIS</label>
                   <input 
                     type="text" 
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     placeholder="contoh: MA0226411"
                     className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-semibold outline-none text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                   />
                </div>

                <div className="space-y-1.5">
                   <div className="flex justify-between items-end px-1">
                      <label className="text-xs font-bold text-slate-600 tracking-wide uppercase">Kata Sandi</label>
                   </div>
                   <div className="relative">
                     <input 
                       type={showPassword ? 'text' : 'password'}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••"
                       className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-semibold outline-none text-slate-800 placeholder:text-slate-400"
                     />
                     <button 
                       type="button" 
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                     >
                       {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                   </div>
                </div>

                <div className="pt-2">
                   <button 
                     type="submit" 
                     disabled={isLoading}
                     className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 relative overflow-hidden group"
                   >
                     <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                     {isLoading ? (
                       <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                       <Fingerprint className="w-5 h-5" />
                     )}
                     <span>{isLoading ? 'Memverifikasi...' : 'Masuk Sistem'}</span>
                   </button>
                </div>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <p className="text-xs font-medium text-slate-400 text-center md:text-left">
                    &copy; 2026 TCEXAM {siteName}.
                 </p>
                 <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 text-center md:text-right hover:underline">
                    Hubungi Admin Sekolah
                 </a>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
