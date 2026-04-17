import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  AlertCircle,
  Play,
  CalendarDays,
  AlertTriangle,
  Eye,
  Database
} from 'lucide-react';

interface StudentDashboardProps {
  isAdminView?: boolean;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ isAdminView = false }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentName, setStudentName] = useState('Siswa');

  useEffect(() => {
    const user = localStorage.getItem('cbt_user');
    if (user && user !== 'undefined') {
      try {
        const data = JSON.parse(user);
        if (data.fullName) setStudentName(data.fullName);
      } catch (e) { console.error("Session corrupt"); }
    }
  }, []);

  // Ambil Data Asli dari Database jika Admin, atau Mock jika Siswa (sementara)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userJson = localStorage.getItem('cbt_user');
        let userId = '0';
        if (userJson && userJson !== 'undefined') {
          try { userId = JSON.parse(userJson).id || '0'; } catch(e){}
        }

        const url = isAdminView 
          ? 'http://localhost:3001/api/exams/active?all=true'
          : `http://localhost:3001/api/exams/active?userId=${userId}`;

        const res = await fetch(url);
        const data = await res.json();
        
        setItems(Array.isArray(data) ? data.map((e: any) => ({
          ...e,
          // Server already processed these fields correctly
          subject: e.subject || (e.topicRules?.[0]?.subject?.name || 'Materi Campuran'),
          totalQuestions: e.totalQuestions || (e.topicRules?.reduce((acc: number, r: any) => acc + (r.questionCount || 0), 0) || 0)
        })) : []);
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAdminView]);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedExam, setSelectedExam] = useState<any>(null);

  const handleKerjakan = (item: any) => {
    if (isAdminView) {
      navigate(`/student/exam/${item.id}?preview=true`);
      return;
    }

    // Jika ada token/password DAN belum pernah mulai (status != ongoing)
    if (item.token && item.token.trim() !== "" && item.status !== 'ongoing') {
      setSelectedExam(item);
      setPasswordInput('');
      setPasswordModalOpen(true);
    } else {
      navigate(`/student/exam/${item.id}`);
    }
  };

  const confirmPassword = () => {
    if (!selectedExam) return;
    if (passwordInput === selectedExam.token) {
       navigate(`/student/exam/${selectedExam.id}`, { state: { examPassword: passwordInput } });
       setPasswordModalOpen(false);
    } else {
       alert("Kata sandi ujian (Token) yang Anda masukkan salah.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Simulation Banner for Admin */}
      {isAdminView && (
        <div className="bg-indigo-600 text-white px-6 py-4 rounded-[2rem] flex items-center justify-between shadow-lg shadow-indigo-200 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight">Database Real-time Terhubung</h2>
              <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Pilih bank soal di bawah untuk melakukan simulasi pengerjaan</p>
            </div>
          </div>
        </div>
      )}

      {!isAdminView && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
             <div className="relative z-10">
                <p className="text-indigo-200 font-bold uppercase tracking-[0.3em] text-[10px] mb-3">Selamat Datang di Panel Ujian</p>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-4 uppercase italic">
                   HALO, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-300">{studentName}</span>!
                </h1>
                <div className="h-1 w-24 bg-white/30 rounded-full mb-6"></div>
                <p className="text-sm md:text-base text-indigo-100/80 font-medium max-w-xl leading-relaxed">
                   Pastikan koneksi internet stabil dan gunakan perangkat yang nyaman. 
                   Selamat mengerjakan ujian, semoga mendapatkan hasil terbaik!
                </p>
             </div>
             <div className="absolute bottom-[-20%] right-10 opacity-10 rotate-12">
                <Play className="w-64 h-64" />
             </div>
          </div>

          <div className="py-2 flex items-center gap-4">
             <div className="w-1.5 h-10 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200" />
             <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">DAFTAR UJIAN AKTIF</h2>
          </div>
        </div>
      )}

      {isAdminView && (
        <div className="py-2">
           <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
             <Eye className="w-6 h-6 text-indigo-600" />
             DAFTAR BANK SOAL (TOPIC)
           </h1>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gunakan ini untuk memverifikasi hasil import soal Bapak</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
           <Play className="w-12 h-12 text-indigo-200 animate-pulse mb-4" />
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Mengambil Data Bank Soal...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="group relative bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-200/50 hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="bg-indigo-50 p-4 rounded-3xl group-hover:bg-indigo-600 group-hover:rotate-[360deg] transition-all duration-700">
                  <BookOpen className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter mb-1">
                    {item.totalQuestions} Soal
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                    item.status === 'completed' ? 'bg-rose-100 text-rose-600' :
                    item.status === 'ongoing' ? 'bg-amber-100 text-amber-600' :
                    item.status === 'suspended' ? 'bg-rose-600 text-white' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    Status: {
                      item.status === 'completed' ? 'Selesai' :
                      item.status === 'ongoing' ? 'Sedang Dikerjakan' :
                      item.status === 'suspended' ? 'Ditangguhkan' :
                      'Tersedia'
                    }
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{item.subject}</p>
                <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.name}</h3>
              </div>

              <div className="flex items-center gap-4 py-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">{item.duration} Menit</span>
                </div>
              </div>

              <button
                disabled={!isAdminView && (item.status === 'completed' || item.status === 'suspended')}
                onClick={() => handleKerjakan(item)}
                className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 overflow-hidden relative ${
                  !isAdminView && (item.status === 'completed' || item.status === 'suspended')
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-slate-900 group-hover:bg-indigo-600 text-white shadow-slate-200'
                }`}
              >
                <span className="relative z-10">
                  {isAdminView ? 'UJI COBA SEKARANG' : 
                   item.status === 'completed' ? 'Ujian Selesai' :
                   item.status === 'ongoing' ? 'Lanjutkan Ujian' :
                   item.status === 'suspended' ? 'Sesi Terkunci' :
                   'KERJAKAN'}
                </span>
                <Play className="w-4 h-4 relative z-10" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- PASSWORD MODAL --- */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl border border-slate-50 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-indigo-50/50">
                 <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase italic tracking-tighter text-center">Butuh Kata Sandi</h2>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8 text-center">Silakan masukkan Token / Mata Sandi untuk mengakses ujian ini</p>
              
              <div className="space-y-4">
                 <div className="relative group">
                    <input 
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Masukkan Token Sesi"
                      className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-indigo-600 tracking-[0.5em] outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:tracking-normal placeholder:font-bold placeholder:text-slate-300"
                    />
                 </div>
                 <div className="flex flex-col gap-3 pt-4">
                    <button 
                      onClick={confirmPassword}
                      className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:translate-y-0"
                    >
                      Konfirmasi
                    </button>
                    <button 
                      onClick={() => setPasswordModalOpen(false)}
                      className="w-full h-14 bg-white text-slate-400 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100"
                    >
                      Batal
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
