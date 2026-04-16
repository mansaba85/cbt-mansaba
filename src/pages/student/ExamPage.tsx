import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle2, 
  Menu, 
  X,
  AlertTriangle,
  Monitor,
  Plus,
  Minus,
  Loader2,
  Info,
  ShieldAlert,
  Lock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Option { id: string; text: string; }
interface Question { id: number; text: string; type: string; options: Option[]; }

const ExamPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isPreview = params.get('preview') === 'true';

  const cheatKey = `cbt_cheat_${id}`;
  const getStoredCheat = () => {
    try {
      const data = sessionStorage.getItem(cheatKey);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  };

  const stored = getStoredCheat();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [examInfo, setExamInfo] = useState<any>(null);
  
  const [isCheatLocked, setIsCheatLocked] = useState<boolean>(stored?.isCheatLocked || false);
  const [cheatViolationCount, setCheatViolationCount] = useState<number>(stored?.cheatViolationCount || 0);
  const [cheatLockTimer, setCheatLockTimer] = useState<number>(stored?.cheatLockTimer || 0);

  // Synchronize state to session storage
  useEffect(() => {
    if (isPreview) return;
    sessionStorage.setItem(cheatKey, JSON.stringify({
      isCheatLocked,
      cheatViolationCount,
      cheatLockTimer
    }));
  }, [isCheatLocked, cheatViolationCount, cheatLockTimer, isPreview]);
  const [testSettings, setTestSettings] = useState<any>({ 
    simpleCheatDetection: true, 
    cheatMaxViolations: '3',
    cheatLockWaitTime: '10',
    cheatWarningTitle: 'Pelanggaran Terdeteksi!',
    cheatWarningMessage: 'Mohon tidak berpindah halaman selama ujian berlangsung.'
  });

  const fetchQuestions = async (userIdInt?: number) => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');
      const uId = userIdInt || user.id;
      const url = isPreview 
        ? `http://localhost:3001/api/questions/${id}` 
        : `http://localhost:3001/api/exams/${id}/questions?userId=${uId}`;
        
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
          setQuestionsList(data.map((q: any) => ({
              id: q.id,
              text: q.content || '',
              type: (q.type || 'MCSA').toUpperCase(),
              options: (q.answers || []).map((ans: any, idx: number) => ({
                  id: String.fromCharCode(65 + idx),
                  text: ans.content || ''
              }))
          })));

          // AUTO-UNLOCK SYNC
          if (isCheatLocked) {
              const statusRes = await fetch(`http://localhost:3001/api/exams/active?userId=${uId}`);
              const activeExams = await statusRes.json();
              const thisExam = activeExams.find((e: any) => e.id === parseInt(id || '0'));
              if (thisExam && thisExam.status === 'ongoing') {
                  setIsCheatLocked(false);
                  setCheatViolationCount(0);
                  setCheatLockTimer(0);
                  sessionStorage.removeItem(cheatKey);
                  toast.success("Akses ujian telah dipulihkan oleh Proktor.");
              }
          }
      }
    } catch (e) { toast.error("Gagal memuat soal"); } finally { setIsLoading(false); }
  };

  const [isExempt, setIsExempt] = useState(false);
  const hasStarted = React.useRef(false);
  const [expiryTime, setExpiryTime] = useState<number | null>(null);

  // 1. Timer Engine
  useEffect(() => {
    let timer: any;
    if (expiryTime) {
      console.log("[TIMER] Started with expiry:", new Date(expiryTime).toLocaleTimeString());
      timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [expiryTime]);

  const fetchExamData = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/exams/${id}`);
      const data = await res.json();
      setExamInfo(data);
      
      const settingsRes = await fetch('http://localhost:3001/api/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.cbt_test_settings) {
        setTestSettings((prev: any) => ({ ...prev, ...settingsData.cbt_test_settings }));
      }

      const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');
      const proctorRes = await fetch('http://localhost:3001/api/proctoring');
      const proctorData = await proctorRes.json();
      const me = proctorData.find((p: any) => p.nis === user.username);
      if (me && me.isExempt) setIsExempt(true);
      
      return data;
    } catch (e) {
      return null;
    }
  };

  const startExamSession = async (durationMinutes: number) => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    try {
      if (isPreview) {
        fetchQuestions();
        const d = durationMinutes || 60;
        setExpiryTime(Date.now() + (d * 60 * 1000));
        setTimeLeft(d * 60);
        return;
      }

      const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');
      const res = await fetch(`http://localhost:3001/api/exams/${id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.answers) setAnswers(data.answers);
        
        const rSec = Number(data.remainingSeconds);
        let finalSec = !isNaN(rSec) ? rSec : (durationMinutes * 60);
        
        if (finalSec <= 0 && !isPreview) {
            console.warn("[TIMER] Server reported zero time remaining.");
            toast.warning("Sesi ujian berakhir atau waktu habis.");
            finalSec = 0;
        }

        console.log(`[TIMER] Final Sync: ${finalSec}s remaining.`);
        setExpiryTime(Date.now() + (finalSec * 1000));
        setTimeLeft(finalSec);
        fetchQuestions(user.id);
      } else {
        toast.error(data.error || "Akses Ujian Ditolak");
        setTimeout(() => navigate('/student'), 2500);
      }
    } catch (e) {
      toast.error("Gagal memulai sesi ujian");
      navigate('/student');
    }
  };

  useEffect(() => {
    const init = async () => {
      if (id) {
        const exam = await fetchExamData();
        if (exam) {
          await startExamSession(exam.duration || 60);
        }
      }
    };
    init();
  }, [id, isPreview]);

  useEffect(() => {
    const saveProgress = async () => {
        if (isPreview) return;
        try {
            const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');
            const res = await fetch(`http://localhost:3001/api/exams/${id}/save-progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user.id, 
                    answers: answersRef.current, 
                    timeLeft: timeRef.current 
                })
            });
            const data = await res.json();
            if (data.status && data.status !== 'ONGOING') {
                toast.error("Sesi ujian Anda telah dihentikan oleh Proktor.");
                setTimeout(() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/login?reason=suspended';
                }, 2000);
            }
        } catch (e) { console.error("Auto-save failed", e); }
    };
    
    const debounce = setTimeout(saveProgress, 2000); // Save every 2 seconds after last change
    return () => clearTimeout(debounce);
  }, [answers, id, isPreview]);

  const timeRef = React.useRef(timeLeft);
  const answersRef = React.useRef(answers);

  useEffect(() => { timeRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // PERIODIC TIME SYNC (Every 10 seconds)
  useEffect(() => {
    if (isPreview) return;
    const interval = setInterval(async () => {
        try {
            const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');
            const res = await fetch(`http://localhost:3001/api/exams/${id}/save-progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user.id, 
                    answers: answersRef.current, 
                    timeLeft: timeRef.current 
                })
            });
            const data = await res.json();
            if (data.status && data.status !== 'ONGOING') {
                toast.error("Sesi ujian Anda telah dihentikan oleh Proktor.");
                clearInterval(interval);
                setTimeout(() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/login?reason=suspended';
                }, 1500);
            }
        } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [id, isPreview]);

  // Force Sync Lock to Server
  useEffect(() => {
    if (isPreview || !isCheatLocked || cheatLockTimer !== -1) return;

    const syncLock = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');
            const userId = user.id;
            if (userId) {
                // Notifikasi server satu kali lagi untuk memastikan status SUSPENDED tercatat
                await fetch(`http://localhost:3001/api/proctoring/${userId}/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'suspend' })
                });
                await fetch(`http://localhost:3001/api/proctoring/${userId}/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'logout' })
                });
                console.log("Server sync check: Account marked as SUSPENDED");
            }
        } catch (e) { }
    };
    syncLock();
  }, [isCheatLocked, cheatLockTimer, isPreview]);

  // Anti-Cheat Logic
  useEffect(() => {
    if (isPreview || !testSettings || isExempt) return;
    const handleViolation = async () => {
        if (!testSettings.simpleCheatDetection || isCheatLocked) return;
        
        let shouldLockPermanently = false;

        setCheatViolationCount(prev => {
            const next = prev + 1;
            const max = parseInt(testSettings.cheatMaxViolations || '3');
            if (next >= max) {
              shouldLockPermanently = true;
              setIsCheatLocked(true);
              setCheatLockTimer(-1);
            } else {
              setIsCheatLocked(true);
              setCheatLockTimer(parseInt(testSettings.cheatLockWaitTime || '10'));
            }
            return next;
        });

        if (shouldLockPermanently) {
            try {
                const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');
                const userId = user.id;
                if (userId) {
                    await fetch(`http://localhost:3001/api/proctoring/${userId}/action`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'suspend', timeLeft })
                    });
                    await fetch(`http://localhost:3001/api/proctoring/${userId}/action`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'logout', timeLeft })
                    });
                    
                    toast.error("Akun Anda dikunci! Menuju halaman login...");
                    
                    setTimeout(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = '/login?reason=suspended';
                    }, 3000);
                }
            } catch (e) { console.error("Locking failed", e); }
        }
    };
    
    const visibilityHandler = () => { if (document.visibilityState === 'hidden') handleViolation(); };
    window.addEventListener('blur', handleViolation);
    document.addEventListener('visibilitychange', visibilityHandler);
    return () => {
        window.removeEventListener('blur', handleViolation);
        document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [isPreview, testSettings, id, navigate, isCheatLocked, isExempt]);

  useEffect(() => {
    if (isCheatLocked && cheatLockTimer > 0) {
        const t = setInterval(() => setCheatLockTimer(prev => prev - 1), 1000);
        return () => clearInterval(t);
    } else if (isCheatLocked && cheatLockTimer === 0) {
        setIsCheatLocked(false);
    }
  }, [isCheatLocked, cheatLockTimer]);

  const handleAnswerSelect = (optId: string) => {
    const q = questionsList[currentIndex];
    if (!q) return;
    if (q.type === 'MCMA') {
        const curr = answers[q.id] || [];
        setAnswers(prev => ({ ...prev, [q.id]: curr.includes(optId) ? curr.filter((i:any)=>i!==optId) : [...curr, optId] }));
    } else {
        setAnswers(prev => ({ ...prev, [q.id]: optId }));
    }
  };

  const handleOrderingMatchingChange = (optId: string, val: string) => {
    const q = questionsList[currentIndex];
    if (!q) return;
    setAnswers(prev => {
        const group = { ...(prev[q.id] || {}) };
        if (val === "") delete group[optId]; else group[optId] = val;
        return { ...prev, [q.id]: group };
    });
  };

  const handleSubmitExam = async () => {
    try {
        const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');
        const res = await fetch(`http://localhost:3001/api/exams/${id}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, answers: answersRef.current })
        });
        const data = await res.json();
        if (data.success) {
            toast.success("Ujian berhasil diselesaikan!");
            navigate('/student');
        } else {
            toast.error(data.error || "Gagal mengirim jawaban");
        }
    } catch (e) {
        toast.error("Terjadi kesalahan saat mengakhiri ujian");
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-indigo-600 uppercase tracking-widest">Memuat Soal...</div>;
  if (!questionsList.length) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400 uppercase tracking-widest">Soal tidak ditemukan</div>;

  const currentQ = questionsList[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / questionsList.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      {isCheatLocked && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[3rem] text-center max-w-md w-full shadow-2xl relative overflow-hidden border">
                <div className="absolute top-0 left-0 w-full h-2 bg-rose-500 font-bold uppercase tracking-widest text-[9px] text-white flex items-center justify-center">Security Lock</div>
                <ShieldAlert className="w-20 h-20 text-rose-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black uppercase mb-2">{testSettings.cheatWarningTitle}</h2>
                <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed italic">{testSettings.cheatWarningMessage}</p>
                <div className="bg-slate-50 p-6 rounded-3xl mb-4 border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase text-slate-400">Pelanggaran Terdeteksi</span>
                        <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black">{cheatViolationCount} / {testSettings.cheatMaxViolations}</span>
                    </div>
                    {cheatLockTimer === -1 ? (
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-rose-600 uppercase tracking-tighter">Sesi Terkunci Permanen</h3>
                            <button onClick={() => navigate('/student')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest">Dashboard</button>
                        </div>
                    ) : (cheatLockTimer > 0 ? (
                        <div className="py-4">
                            <div className="text-5xl font-mono font-black text-indigo-600">00:{cheatLockTimer.toString().padStart(2, '0')}</div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mt-2">Menunggu sinkronisasi keamanan...</p>
                        </div>
                    ) : (
                        <button onClick={() => setIsCheatLocked(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Simpan & Lanjutkan</button>
                    ))}
                </div>
            </div>
        </div>
      )}

      <header className="h-16 px-4 md:px-8 bg-white border-b flex items-center justify-between sticky top-0 z-50 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100"><Monitor className="w-5 h-5 text-white" /></div>
              <div className="hidden sm:block">
                  <h1 className="font-black uppercase text-[11px] text-slate-800 tracking-tight leading-none">{examInfo?.name || 'Sesi Ujian'}</h1>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ujian Berbasis Komputer</span>
              </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
              <button 
                onClick={() => fetchQuestions()} 
                title="Muat ulang soal"
                className={`w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-white border hover:border-indigo-300 transition-all active:scale-95 ${isLoading ? 'animate-spin text-indigo-600' : ''}`}
              >
                  <RefreshCw className="w-5 h-5" />
              </button>
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border">
                  <button onClick={() => setFontSize(Math.max(80, fontSize - 10))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-slate-500 transition-all active:scale-95"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="px-2 text-[10px] font-black text-slate-400 w-10 text-center">{fontSize}%</span>
                  <button onClick={() => setFontSize(Math.min(200, fontSize + 10))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-slate-500 transition-all active:scale-95"><Plus className="w-3.5 h-3.5" /></button>
              </div>
              <div className="px-4 py-2 bg-indigo-50 border-2 border-indigo-100 rounded-xl font-mono font-black text-indigo-700 text-sm shadow-sm">{formatTime(timeLeft)}</div>
              <button onClick={() => setSidebarOpen(true)} className="xl:hidden p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 transition-transform active:scale-95"><Menu className="w-5 h-5" /></button>
          </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
              <style>{`
                .question-content, .question-content * {
                  font-size: ${fontSize}% !important;
                }
              `}</style>
              <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-12 shadow-xl shadow-slate-200/50 min-h-[500px] mb-24 transition-all question-content">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl ring-4 ring-slate-50">{currentIndex+1}</div>
                          <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-1">Butir Soal</span>
                              <span className="text-xs font-black text-slate-700 uppercase">{currentIndex+1} / {questionsList.length}</span>
                          </div>
                      </div>
                      <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-indigo-100">{currentQ.type}</div>
                  </div>

                  <div className="text-xl md:text-2xl font-bold mb-12 leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: currentQ.text }}></div>

                  <div className="space-y-4">
                      {currentQ.type === 'ESSAY' ? (
                          <div className="relative group">
                              <div className="absolute top-4 right-6 text-[10px] font-black text-slate-300 uppercase tracking-widest group-focus-within:text-indigo-400 transition-colors">Lembar Jawaban</div>
                              <textarea 
                                value={answers[currentQ.id] || ''}
                                onChange={(e) => setAnswers(prev => ({...prev, [currentQ.id]: e.target.value}))}
                                className="w-full h-80 p-8 pt-12 bg-slate-50 border-2 border-slate-100 rounded-[3rem] outline-none focus:border-indigo-600 font-semibold text-lg transition-all focus:bg-white focus:shadow-inner" 
                                placeholder="Tuliskan jawaban lengkap Anda di sini..."
                              ></textarea>
                          </div>
                      ) : (currentQ.type === 'MATCHING' || currentQ.type === 'ORDERING') ? (
                          <div className="grid grid-cols-1 gap-2">
                              {currentQ.options.map((opt, i) => (
                                  <div key={i} className="group bg-white border border-slate-200 rounded-2xl p-3 hover:border-indigo-400 hover:shadow-md transition-all flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3 flex-1">
                                          <div className="w-8 h-8 shrink-0 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">{opt.id}</div>
                                          <div className="text-sm font-bold text-slate-700 leading-tight" dangerouslySetInnerHTML={{ __html: opt.text }}></div>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Pilih:</span>
                                          <select 
                                            value={answers[currentQ.id]?.[opt.id] || ''} 
                                            onChange={e => handleOrderingMatchingChange(opt.id, e.target.value)}
                                            className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-1.5 text-xs font-black text-indigo-600 outline-none cursor-pointer focus:border-indigo-500 focus:bg-white"
                                          >
                                              <option value="">-</option>
                                              {Array.from({length: currentQ.options.length}, (_, idx) => (idx+1).toString()).map(n => {
                                                  // Logika: Hilangkan jika sudah dipakai pernyataan LAIN
                                                  const currentQAns = answers[currentQ.id] || {};
                                                  const isUsedByOther = Object.entries(currentQAns).some(([oid, val]) => oid !== opt.id && val === n);
                                                  
                                                  if (isUsedByOther) return null;
                                                  
                                                  return <option key={n} value={n}>{n}</option>;
                                              })}
                                          </select>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 gap-3">
                              {currentQ.options.map(opt => {
                                  const isSelected = currentQ.type === 'MCMA' ? (answers[currentQ.id] || []).includes(opt.id) : answers[currentQ.id] === opt.id;
                                  return (
                                      <button 
                                        key={opt.id} 
                                        onClick={() => handleAnswerSelect(opt.id)} 
                                        className={`w-full p-4 border-2 rounded-2xl flex items-center gap-5 transition-all text-left group ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md ring-1 ring-indigo-500' : 'border-slate-100 hover:border-indigo-300 bg-slate-50/20 hover:bg-white'}`}
                                      >
                                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-100 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-400'}`}>{opt.id}</div>
                                          <div className={`font-bold transition-all ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`} dangerouslySetInnerHTML={{ __html: opt.text }}></div>
                                      </button>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              </div>

              <div className="max-w-4xl mx-auto flex flex-row items-center justify-between mt-8 gap-4 fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-full z-10 px-4">
                  <button 
                    onClick={() => setCurrentIndex(c => Math.max(0, c-1))} 
                    disabled={currentIndex === 0}
                    className="h-14 md:h-16 px-6 md:px-10 bg-white border-2 border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-3xl disabled:opacity-20 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-2xl active:scale-95"
                  >
                      <ChevronLeft className="w-5 h-5" /> <span className="hidden sm:inline">Kembali</span>
                  </button>
                  
                  <button 
                    onClick={() => setFlagged(prev => ({...prev, [currentQ.id]: !prev[currentQ.id]}))}
                    className={`h-14 md:h-16 flex-1 max-w-[200px] border-2 font-black text-xs uppercase tracking-[0.3em] rounded-3xl transition-all flex items-center justify-center gap-2 shadow-2xl active:scale-95 ${flagged[currentQ.id] ? 'bg-amber-100 border-amber-400 text-amber-700 shadow-amber-200' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                      <Flag className={`w-4 h-4 ${flagged[currentQ.id] ? 'fill-amber-700' : ''}`} /> <span className="hidden sm:inline">Ragu</span>
                  </button>

                  {currentIndex === questionsList.length - 1 ? (
                      <button 
                        onClick={() => setFinishModalOpen(true)} 
                        className="h-14 md:h-16 px-8 md:px-12 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-3xl shadow-2xl shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                          Selesai <CheckCircle2 className="w-5 h-5" />
                      </button>
                  ) : (
                      <button 
                        onClick={() => setCurrentIndex(c => Math.min(questionsList.length-1, c+1))} 
                        className="h-14 md:h-16 px-8 md:px-12 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-3xl shadow-2xl shadow-slate-300 hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                          Lanjut <ChevronRight className="w-5 h-5" />
                      </button>
                  )}
              </div>
          </div>

          <div className="w-[340px] bg-white border-l border-slate-200 hidden xl:flex flex-col shadow-inner">
              <div className="p-8 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2.5">
                          <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-lg shadow-indigo-100"></div>
                          <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">Navigasi Soal</span>
                      </div>
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black italic">{questionsList.length} BUTIR</div>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                      {questionsList.map((q, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => setCurrentIndex(idx)} 
                            className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center font-black text-[11px] transition-all relative group ${currentIndex === idx ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl scale-110 z-10' : flagged[q.id] ? 'bg-amber-500 border-amber-600 text-white shadow-md' : !!answers[q.id] ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm'}`}
                          >
                              {idx+1}
                              {currentIndex === idx && <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="flex-1 p-8 flex flex-col justify-end bg-slate-50/30">
                  <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Progress</span>
                          <span className="text-xs font-black text-indigo-600">{answeredCount} Terisi</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full mb-6 overflow-hidden ring-4 ring-slate-50">
                          <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-3 rounded-full transition-all duration-1000 ease-out shadow-inner" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pb-2 pt-2 border-t border-slate-50">
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Terjawab</span></div>
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm"></div><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ragu</span></div>
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white border border-slate-200"></div><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kosong</span></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {sidebarOpen && (
          <div className="fixed inset-0 z-[200] xl:hidden">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSidebarOpen(false)}></div>
              <div className="absolute right-0 w-[340px] max-w-[90%] h-full bg-white p-8 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
                      <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-2">Navigation</span>
                          <span className="text-xl font-black text-slate-800 tracking-tighter">Butir Soal</span>
                      </div>
                      <button onClick={() => setSidebarOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="grid grid-cols-5 gap-3 overflow-y-auto pr-2 pb-10">
                      {questionsList.map((q, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => {setCurrentIndex(idx); setSidebarOpen(false);}} 
                            className={`aspect-square border-2 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${currentIndex === idx ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl scale-110' : !!answers[q.id] ? 'bg-emerald-500 border-emerald-600 text-white shadow-md' : flagged[q.id] ? 'bg-amber-500 border-amber-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                          >
                              {idx+1}
                          </button>
                      ))}
                  </div>
                  <div className="mt-auto pt-8 border-t border-slate-50">
                      <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100">
                          <div className="flex justify-between mb-4 items-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status Progres</span>
                              <span className="text-2xl font-black">{answeredCount} / {questionsList.length}</span>
                          </div>
                          <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden ring-4 ring-white/10"><div className="bg-white h-3 rounded-full transition-all duration-1000 shadow-md" style={{ width: `${progressPercent}%` }}></div></div>
                          <p className="text-[9px] font-bold text-indigo-100 mt-4 uppercase tracking-widest text-center italic">Berdoa sebelum mengirim jawaban!</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {finishModalOpen && (
          <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="bg-white rounded-[4rem] p-12 max-w-sm w-full shadow-2xl text-center relative border border-slate-50">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-emerald-50/50"><CheckCircle2 className="w-12 h-12" /></div>
                  <h2 className="text-3xl font-black text-slate-800 mb-3 uppercase italic tracking-tighter">Selesaikan Ujian?</h2>
                  <p className="text-slate-400 font-medium mb-12 leading-relaxed">Seluruh jawaban akan disimpan secara permanen. Anda tidak dapat kembali setelah ini.</p>
                  <div className="flex flex-col gap-4">
                      <button onClick={handleSubmitExam} className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-600 hover:-translate-y-1 transition-all active:translate-y-0">Kirim Jawaban <ChevronRight className="w-4 h-4 ml-1 inline-block" /></button>
                      <button onClick={() => setFinishModalOpen(false)} className="w-full py-5 bg-white text-slate-400 rounded-3xl font-bold hover:bg-slate-50 transition-all border border-slate-100">Cek Kembali</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
export default ExamPage;
