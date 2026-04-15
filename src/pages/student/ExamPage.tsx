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
  Search,
  Loader2,
  Info,
  ShieldAlert,
  Lock,
  Edit3,
  RefreshCw
} from 'lucide-react';

import { toast } from 'sonner';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: number;
  text: string;
  type: string;
  options: Option[];
}

const ExamPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState(110);
  const [examInfo, setExamInfo] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // ─── Cheat Detection: restore from sessionStorage on every mount ───
  const cheatKey = `cbt_cheat_${id}`;
  const getCheatSession = () => {
    try { return JSON.parse(sessionStorage.getItem(cheatKey) || 'null'); } catch { return null; }
  };
  const savedCheat = getCheatSession();

  const [isCheatLocked, setIsCheatLockedRaw] = useState<boolean>(savedCheat?.isCheatLocked ?? false);
  const [cheatViolationCount, setCheatViolationCountRaw] = useState<number>(savedCheat?.cheatViolationCount ?? 0);
  const [cheatLockTimer, setCheatLockTimerRaw] = useState<number>(savedCheat?.cheatLockTimer ?? 0);
  const [testSettings, setTestSettings] = useState<any>({
    simpleCheatDetection: true,
    forceFullscreen: true,
    cheatLockWaitTime: '60',
    cheatMaxViolations: '3'
  });
  const [isExempt, setIsExempt] = useState(false);

  // Wrappers that also persist to sessionStorage
  const persistCheat = (locked: boolean, count: number, timer: number) => {
    sessionStorage.setItem(cheatKey, JSON.stringify({ isCheatLocked: locked, cheatViolationCount: count, cheatLockTimer: timer }));
  };
  const setIsCheatLocked = (v: boolean) => {
    setIsCheatLockedRaw(v);
    setCheatViolationCountRaw(prev => { persistCheat(v, prev, cheatLockTimer); return prev; });
  };
  const setCheatViolationCount = (v: number | ((p: number) => number)) => {
    setCheatViolationCountRaw(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      persistCheat(isCheatLocked, next, cheatLockTimer);
      return next;
    });
  };
  const setCheatLockTimer = (v: number | ((p: number) => number)) => {
    setCheatLockTimerRaw(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      persistCheat(isCheatLocked, cheatViolationCount, next);
      return next;
    });
  };

  // Detect refresh via beforeunload — record a flag so restore logic knows
  useEffect(() => {
    if (isPreview) return;
    const onUnload = () => {
      // Only mark if still locked or has violations (don't mark on normal exit)
      const cur = getCheatSession();
      if (cur) {
        sessionStorage.setItem(`${cheatKey}_refreshed`, '1');
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [id, isPreview]);

  useEffect(() => {
    // Selalu ambil settings terbaru dari server, bypass browser cache
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/settings', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });
        const data = await res.json();
        if (data.cbt_test_settings) {
            setTestSettings(data.cbt_test_settings);
            // Selalu update localStorage agar fallback juga segar
            localStorage.setItem('cbt_test_settings', JSON.stringify(data.cbt_test_settings));
        }

        // Check if user is exempt from anti-cheat
        const userJson = localStorage.getItem('cbt_user');
        const userId = userJson ? JSON.parse(userJson).id : null;
        if (data.cbt_cheat_exempt_users && userId) {
            const exemptList = Array.isArray(data.cbt_cheat_exempt_users) ? data.cbt_cheat_exempt_users : [];
            const exemptStatus = exemptList.includes(userId);
            setIsExempt(exemptStatus);
            
            // Auto-unlock if exempted
            if (exemptStatus && isCheatLocked) {
                setIsCheatLocked(false);
                setCheatLockTimer(0);
            }
        }
      } catch (e) {
        // Fallback ke localStorage hanya jika server benar-benar tidak bisa dijangkau
        const savedTest = localStorage.getItem('cbt_test_settings');
        if (savedTest) setTestSettings(JSON.parse(savedTest));
      }
    };
    
    fetchSettings();

    // Polling: refresh settings setiap 60 detik agar perubahan admin langsung berlaku
    // (misal: admin mengubah durasi kuncian, pesan peringatan, dll)
    const settingsInterval = setInterval(fetchSettings, 60_000);
    
    
    const fetchExamData = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/exams/${id}`);
        const data = await res.json();
        setExamInfo(data);
        if (data.duration) setTimeLeft(data.duration * 60);

        // START/RESUME SESSION
        if (!isPreview) {
            const userJson = localStorage.getItem('cbt_user');
            const userId = userJson ? JSON.parse(userJson).id : '0';
            
            const startExamSession = async (retries = 3) => {
                try {
                    const startRes = await fetch(`http://localhost:3001/api/exams/${id}/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId })
                    });
                    
                    const startData = await startRes.json();
                    
                    // IF BUSY (429), wait and retry
                    if (startRes.status === 429 && retries > 0) {
                        console.warn(`Server busy, retrying... (${retries} retries left)`);
                        setTimeout(() => startExamSession(retries - 1), 1000);
                        return;
                    }

                    if (startData.success) {
                        if (startData.answers) setAnswers(startData.answers);
                        console.log("Exam session active:", startData.resultId);
                    } else {
                        toast.error(startData.error || "Gagal masuk ke sesi ujian");
                        navigate('/student');
                    }
                } catch (err) {
                    if (retries > 0) {
                        setTimeout(() => startExamSession(retries - 1), 1000);
                    } else {
                        toast.error("Masalah koneksi saat memulai ujian.");
                        navigate('/student');
                    }
                }
            };

            startExamSession();
        }
      } catch (e) {
          console.error("Exam init error:", e);
      }
    };
    if (!id) return;
    fetchExamData();

    // 4. PERIODIC SESSION CHECK (Multi-login Prevention)
    const sessionToken = localStorage.getItem('cbt_session_token');
    const userJson = localStorage.getItem('cbt_user');
    const user = userJson ? JSON.parse(userJson) : null;

    if (sessionToken && user && !isPreview) {
        const checkInterval = setInterval(async () => {
            try {
                const res = await fetch('http://localhost:3001/api/auth/check-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, token: sessionToken })
                });
                const data = await res.json();
                if (data.success === false && data.error === 'invalid_session') {
                    // LOGOUT IMMEDIATELY
                    clearInterval(checkInterval);
                    localStorage.removeItem('cbt_user');
                    localStorage.removeItem('cbt_session_token');
                    navigate('/login?error=multi_login');
                    toast.error("SESI BERAKHIR: Akun ini telah login di perangkat lain.");
                }
            } catch (err) {
                // Silent network failure check
            }
        }, 15000); // Check every 15 seconds

        return () => {
          clearInterval(checkInterval);
          clearInterval(settingsInterval);
        };
    }

    // Jika tidak ada sesi (preview mode), tetap cleanup settingsInterval
    return () => clearInterval(settingsInterval);
  }, [id, isPreview]);

  // Handle Fullscreen & Anti-Cheat
  useEffect(() => {
    if (!testSettings) return;
    
    console.log("Anti-Cheat System Initialized:", testSettings);

    // 1. Initial State Check (Force Fullscreen on load)
    // Skip jika state sudah direstorasi dari sessionStorage (isCheatLocked=true)
    if (testSettings.forceFullscreen && !document.fullscreenElement && !isCheatLocked && !isExempt) {
        setIsCheatLocked(true);
        setCheatLockTimer(0);
        persistCheat(true, cheatViolationCount, 0);
        console.warn("Security Trigger: INITIAL_FULLSCREEN_CHECK_FAILED");
    }

    // 2. Forced Fullscreen Monitoring
    const handleFullscreenMonitor = () => {
        if (testSettings.forceFullscreen && !document.fullscreenElement && !isCheatLocked && !isExempt) {
            console.warn("Security Trigger: FULLSCREEN_EXIT_DETECTED");
            setIsCheatLocked(true);
            setCheatLockTimer(0);
        }
    };
    document.addEventListener('fullscreenchange', handleFullscreenMonitor);

    // 3. Cheat Detection (Tab Switching)
    const handleViolation = () => {
        if (!testSettings.simpleCheatDetection || isExempt) return;
        
        if (isCheatLocked && cheatLockTimer > 0) return;

        console.warn("Security Trigger: TAB_SWITCH_OR_BLUR_DETECTED");
        const newViolationCount = cheatViolationCount + 1;
        setCheatViolationCount(newViolationCount);
        
        const maxViolations = parseInt(testSettings.cheatMaxViolations || '3');
        if (newViolationCount >= maxViolations) {
            console.error("Security Trigger: MAX_VIOLATIONS_REACHED. Suspending account.");
            setIsCheatLocked(true);
            setCheatLockTimer(-1);
            
            const userJson = localStorage.getItem('cbt_user');
            const userId = userJson ? JSON.parse(userJson).id : '0';

            fetch(`http://localhost:3001/api/proctoring/${userId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'suspend' })
            }).then(() => {
                setTimeout(() => {
                    if (!isPreview) {
                        localStorage.removeItem('cbt_user');
                        window.location.href = '/login?error=suspended';
                    } else {
                        toast.warning("PREVIEW: Akun ini seharusnya tersuspensi sekarang.");
                        setIsCheatLocked(false);
                        setCheatViolationCount(0);
                    }
                }, 3000);
            });
            return;
        }

        setIsCheatLocked(true);
        setCheatLockTimer(parseInt(testSettings.cheatLockWaitTime || '10'));
    };

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') handleViolation();
    };

    const handleBlur = () => {
        handleViolation();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenMonitor);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
    };
  }, [testSettings, isCheatLocked, cheatViolationCount, isPreview]);

  const clearCheatSession = () => {
    sessionStorage.removeItem(cheatKey);
    sessionStorage.removeItem(`${cheatKey}_refreshed`);
  };

  const enterFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
      }
      setIsCheatLockedRaw(false);
      persistCheat(false, cheatViolationCount, 0);
  };

  // Cheat Lock Timer Countdown
  useEffect(() => {
    if (isCheatLocked && cheatLockTimer > 0) {
        const t = setInterval(() => {
            setCheatLockTimer(prev => prev - 1);
        }, 1000);
        return () => clearInterval(t);
    } else if (isCheatLocked && cheatLockTimer === 0) {
        // If forceFullscreen is ON, we only unlock if they ARE in fullscreen
        if (testSettings?.forceFullscreen && !document.fullscreenElement) {
             return; // Keep locked
        }
        // Unlock dan hapus dari sessionStorage
        setIsCheatLockedRaw(false);
        persistCheat(false, cheatViolationCount, 0);
    }
  }, [isCheatLocked, cheatLockTimer, testSettings]);

  // Efek untuk menangkap klik gambar di dalam soal/jawaban (Zoom)
  useEffect(() => {
     const handleImgClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
           setSelectedImage((target as HTMLImageElement).src);
        }
     };
     document.addEventListener('click', handleImgClick);
     return () => document.removeEventListener('click', handleImgClick);
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const userJson = localStorage.getItem('cbt_user');
      const userId = userJson ? JSON.parse(userJson).id : '0';
      const url = isPreview 
        ? `http://localhost:3001/api/questions/${id}` 
        : `http://localhost:3001/api/exams/${id}/questions?userId=${userId}`;
        
      const res = await fetch(url);
      const data = await res.json();
      
      const mappedQuestions = data.map((q: any) => {
          const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
          return {
              id: q.id,
              text: q.content || 'Isi soal tidak terbaca',
              type: (q.type || 'MCSA').toUpperCase(),
              options: (q.answers || []).map((ans: any, idx: number) => ({
                  id: labels[idx] || ans.position?.toString() || (idx + 1).toString(),
                  text: ans.content || ''
              }))
          };
      });

      setQuestionsList(mappedQuestions);
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [id, isPreview]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // AUTO-SAVE ANSWERS
  useEffect(() => {
      if (isPreview || Object.keys(answers).length === 0) return;
      
      const saveProgress = async () => {
          const userJson = localStorage.getItem('cbt_user');
          const userId = userJson ? JSON.parse(userJson).id : '0';
          
          try {
              await fetch(`http://localhost:3001/api/exams/${id}/save-progress`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId, answers })
              });
          } catch (e) {}
      };

      const t = setTimeout(saveProgress, 2000); // Debounce save
      return () => clearTimeout(t);
  }, [answers, id, isPreview]);

  const handleSubmitExam = async () => {
      if (isPreview) {
          navigate('/admin/questions');
          return;
      }

      setIsLoading(true);
      const userJson = localStorage.getItem('cbt_user');
      const userId = userJson ? JSON.parse(userJson).id : '0';

      try {
          const res = await fetch(`http://localhost:3001/api/exams/${id}/submit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, answers })
          });
          const data = await res.json();
          if (data.success) {
              clearCheatSession(); // ← bersihkan state cheat saat ujian selesai
              toast.success("Ujian berhasil diselesaikan! Skor Anda: " + Math.round(data.score));
              
              if (examInfo?.autoLogout) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login?msg=exam_finished';
              } else {
                navigate('/student');
              }
          } else {
              toast.error(data.error || "Gagal mengirim jawaban.");
              setIsLoading(false);
          }
      } catch (e) {
          toast.error("Masalah koneksi saat mengirim jawaban.");
          setIsLoading(false);
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questionsList[currentIndex];

  const handleAnswerSelect = (optionId: string) => {
    if (currentQ.type === 'MCMA') {
      const currentAns = answers[currentQ.id] || [];
      const newAns = currentAns.includes(optionId) ? currentAns.filter((i:any) => i !== optionId) : [...currentAns, optionId];
      setAnswers(prev => ({ ...prev, [currentQ.id]: newAns }));
    } else {
      setAnswers(prev => ({ ...prev, [currentQ.id]: optionId }));
    }
  };

  const handleOrderingMatchingChange = (optId: string, val: string) => {
    const qId = currentQ.id;
    setAnswers(prev => {
        const currentGroup = { ...(prev[qId] || {}) };
        if (val === "") {
            delete currentGroup[optId];
        } else {
            currentGroup[optId] = val;
        }
        return { ...prev, [qId]: currentGroup };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
         <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
         <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data Database...</p>
      </div>
    );
  }

  if (!questionsList.length || !currentQ) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
           <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
           <h2 className="text-2xl font-black text-slate-800 uppercase mb-2 font-black tracking-tight">Soal Tidak Terbaca</h2>
           <button onClick={() => navigate(isPreview ? '/admin/questions' : '/student')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase shadow-lg shadow-slate-200">Kembali</button>
        </div>
      );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Zoom Modal */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
        >
           <img src={selectedImage} alt="Zoom" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" />
           <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
              <X className="w-10 h-10" />
           </button>
        </div>
      )}

      {/* Cheat Detection Overlay (Elegant Light Mode) */}
      {isCheatLocked && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white/95 backdrop-blur-2xl rounded-[3.5rem] p-12 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.3)] border border-white text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
                {/* Decorative Accents */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-50 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>

                <div className="relative z-10">
                    <div className="mb-10">
                       <div className="relative inline-block">
                          <div className="absolute inset-0 bg-rose-200 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                          <div className="relative w-24 h-24 bg-rose-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-rose-200 group-hover:scale-105 transition-transform">
                              <ShieldAlert className="w-12 h-12 text-white" />
                          </div>
                       </div>
                    </div>
                    
                    <h2 className="text-3xl font-black mb-4 uppercase italic tracking-tighter text-slate-900 leading-tight">
                        {testSettings?.cheatWarningTitle || 'Pelanggaran Terdeteksi!'}
                    </h2>
                    
                    <p className="text-slate-500 font-medium mb-12 leading-relaxed">
                        {testSettings?.cheatWarningMessage || 'Mohon fokus pada halaman ujian. Perpindahan tab atau aplikasi tidak diperbolehkan demi integritas ujian.'}
                    </p>

                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 mb-10">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pelanggaran</span>
                            <span className="bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-rose-200">{cheatViolationCount} <span className="opacity-40">/ {testSettings?.cheatMaxViolations || 3}</span></span>
                        </div>
                        
                        {cheatLockTimer === -1 ? (
                            <div className="py-4">
                                <div className="inline-block px-4 py-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg mb-3">Locked</div>
                                <p className="text-2xl font-black text-rose-600 uppercase italic tracking-tighter mb-4">AKUN DIKUNCI PERMANEN</p>
                                <button 
                                    onClick={() => navigate('/student')}
                                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                                >
                                    Dashboard
                                </button>
                            </div>
                        ) : cheatLockTimer > 0 ? (
                            <div className="py-2">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Selesaikan Hukuman Waktu</p>
                                 <div className="text-6xl font-mono font-black text-indigo-600 tracking-tighter">
                                    00:{cheatLockTimer.toString().padStart(2, '0')}
                                 </div>
                                 <div className="mt-8 flex items-center justify-center gap-3 text-slate-400">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Sinkronisasi Keamanan</span>
                                 </div>
                            </div>
                        ) : testSettings?.forceFullscreen && !document.fullscreenElement ? (
                            <div className="py-4">
                                <p className="text-indigo-600 font-black uppercase tracking-widest text-[11px] mb-6 flex items-center justify-center gap-2">
                                   <Monitor className="w-4 h-4" /> Mode Layar Penuh Wajib
                                </p>
                                <button 
                                    onClick={enterFullscreen}
                                    className="w-full py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    AKTIFKAN FULLSCREEN
                                </button>
                                <p className="text-[9px] text-slate-400 mt-6 font-bold uppercase tracking-widest leading-none">Klik tombol di atas untuk melanjutkan</p>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-4 justify-center text-slate-300">
                         <div className="w-8 h-[1px] bg-slate-200"></div>
                         <Lock className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Safe Exam Browser v2</span>
                         <div className="w-8 h-[1px] bg-slate-200"></div>
                    </div>
                </div>
            </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block overflow-hidden">
            <h1 className="font-extrabold text-slate-800 text-sm md:text-base uppercase tracking-tight truncate max-w-[200px] md:max-w-xs leading-tight">
               {isPreview ? 'Verifikasi Bank Soal' : (examInfo?.name || 'Ujian Berlangsung')}
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">
               {isPreview ? `ID Topik: ${id} · Preview` : `Sesi ID: ${id}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
           {/* Refresh Questions Button */}
           <button 
              onClick={fetchQuestions}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black hover:bg-slate-50 hover:text-indigo-600 transition-all active:scale-95 shadow-sm disabled:opacity-50"
              title="Refresh Soal"
           >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline uppercase tracking-widest">REFRESH SOAL</span>
           </button>

           {/* Text Size Controls */}
           <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button 
                    onClick={() => setFontSize(Math.max(80, fontSize - 10))}
                    className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-all active:scale-95"
                    title="Kecilkan Teks"
                >
                    <div className="flex items-center gap-1"><span className="text-[10px] font-bold">A</span><Minus className="w-3 h-3" /></div>
                </button>
                <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                <button 
                    onClick={() => setFontSize(Math.min(200, fontSize + 10))}
                    className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-all active:scale-95"
                    title="Besarkan Teks"
                >
                    <div className="flex items-center gap-1"><span className="text-[14px] font-bold">A</span><Plus className="w-3 h-3" /></div>
                </button>
           </div>

           <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border-2 border-indigo-100 font-extrabold text-indigo-700 shadow-sm">
             <Clock className="w-4 h-4 text-indigo-400" />
             <span className="font-mono text-sm tracking-tighter">{formatTime(timeLeft)}</span>
           </div>

           {/* Mobile Navigation Toggle - only visible below xl and if menu is enabled */}
           {examInfo?.showMenu !== false && (
             <button
               onClick={() => setSidebarOpen(true)}
               className="xl:hidden flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all"
               title="Navigasi Soal"
             >
               <Menu className="w-4 h-4" />
               <span className="hidden sm:inline uppercase tracking-widest">Navigasi</span>
             </button>
           )}
        </div>
      </header>

      <div className="flex-1 max-w-[1600px] w-full mx-auto flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-10 max-w-4xl mx-auto min-h-[500px]">
            
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                   <div className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-slate-100">{currentIndex + 1}</div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Nomor Soal</span>
                      <span className="text-xs font-black text-slate-600 uppercase tracking-tight mt-1">{currentIndex + 1} dari {questionsList.length}</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-indigo-100">
                    {currentQ.type}
                    </div>
                </div>
            </div>

            {/* TEXT SOAL */}
            <div 
                className="text-lg md:text-2xl text-slate-800 font-bold leading-relaxed mb-10 prose prose-slate max-w-none prose-img:rounded-3xl prose-img:shadow-xl prose-img:cursor-zoom-in prose-img:hover:brightness-95 transition-all" 
                style={{ fontSize: `${fontSize}%` }}
                dangerouslySetInnerHTML={{ __html: currentQ.text }} 
            />

            {/* OPSI JAWABAN */}
            <div className="space-y-4">
               {(currentQ.type === 'MCSA' || currentQ.type === 'MCMA') && currentQ.options.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                  {currentQ.options.map(opt => {
                    const isSelected = currentQ.type === 'MCMA' ? (answers[currentQ.id] || []).includes(opt.id) : answers[currentQ.id] === opt.id;
                    return (
                      <button 
                        key={opt.id} 
                        onClick={() => handleAnswerSelect(opt.id)} 
                        className={`w-full flex items-center p-3 rounded-xl border-2 transition-all text-left group-option ${isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100/50' : 'border-slate-100 bg-slate-50/20 hover:bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-slate-200/50'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 mr-3 transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border-2 border-slate-100'}`}>{opt.id}</div>
                        <div className="font-semibold text-slate-700 leading-snug prose prose-slate max-w-none prose-img:rounded-lg prose-img:max-h-32 prose-img:cursor-zoom-in text-sm" style={{ fontSize: `${fontSize-20}%` }} dangerouslySetInnerHTML={{ __html: opt.text }} />
                      </button>
                    );
                  })}
                  </div>
               ) : (currentQ.type === 'MCSA' || currentQ.type === 'MCMA') && (
                  <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-600 text-sm font-bold flex items-center gap-4">
                     <AlertTriangle className="w-6 h-6 shrink-0" /> 
                     <div>
                        <p className="uppercase tracking-widest text-[10px] mb-1">Database Warning</p>
                        <p>Opsi jawaban tidak ditemukan untuk butir soal ini. Mohon hubungi proktor.</p>
                     </div>
                  </div>
               )}

               {currentQ.type === 'ESSAY' && (
                  <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-400 px-4">
                          <Edit3 className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Lembar Jawaban Esei</span>
                      </div>
                      <textarea 
                        value={answers[currentQ.id] || ''} 
                        onChange={e => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))} 
                        className="w-full h-80 p-10 border-2 border-slate-100 rounded-[3rem] bg-slate-50 outline-none focus:border-indigo-600 font-semibold text-lg md:text-xl shadow-inner transition-all focus:bg-white" 
                        placeholder="Ketik uraian jawaban secara lengkap di sini..." 
                      />
                  </div>
               )}

               {(currentQ.type === 'MATCHING' || currentQ.type === 'ORDERING') && (
                  <div className="space-y-8 animate-in fade-in duration-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {currentQ.options.map((opt, i) => {
                              const matchCount = (currentQ.text.match(/\d+\./g) || []).length || 5;
                              const maxItems = Math.max(matchCount, currentQ.options.length);
                              const selectedByOthers = Object.entries(answers[currentQ.id] || {})
                                  .filter(([key]) => key !== opt.id)
                                  .map(([_, val]) => val.toString());

                              const currentVal = answers[currentQ.id]?.[opt.id] || '';

                              return (
                                  <div key={i} className="group relative bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500">
                                      <div className="flex items-center gap-4 mb-5">
                                          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-indigo-50 group-hover:scale-110 transition-transform">{opt.id}</div>
                                          <div className="flex-1 overflow-hidden">
                                              <div className="text-[13px] font-bold text-slate-700 leading-snug prose prose-slate prose-img:rounded-xl prose-img:max-h-32" dangerouslySetInnerHTML={{ __html: opt.text }} />
                                          </div>
                                      </div>
                                      
                                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Pasangan Target:</span>
                                          <select 
                                              key={`${currentQ.id}-${opt.id}-${currentVal || 'empty'}`}
                                              value={currentVal} 
                                              onChange={e => handleOrderingMatchingChange(opt.id, e.target.value)}
                                              className="bg-indigo-50 border-2 border-indigo-100 rounded-xl px-4 py-2 text-sm font-black text-indigo-600 outline-none focus:border-indigo-600 transition-all cursor-pointer min-w-[100px] hover:bg-indigo-100 shadow-sm"
                                          >
                                              <option value="">-</option>
                                              {Array.from({ length: maxItems }, (_, idx) => (idx + 1).toString()).map(num => (
                                                  <option key={num} value={num} disabled={selectedByOthers.includes(num)} className={selectedByOthers.includes(num) ? 'text-slate-300' : ''}>
                                                      {num} {selectedByOthers.includes(num) ? '(Dipakai)' : ''}
                                                  </option>
                                              ))}
                                          </select>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>

                      <div className="p-8 bg-indigo-50/50 border-2 border-indigo-100 rounded-3xl flex items-center gap-5">
                         <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                            <CheckCircle2 className="w-7 h-7 text-white" />
                         </div>
                         <div>
                            <p className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-1">Ketentuan Menjodohkan</p>
                            <p className="text-sm text-indigo-600 font-semibold leading-relaxed">
                               Pasangkan setiap pilihan di atas dengan urutan angka yang sesuai menurut Bapak. Angka yang sudah digunakan tidak dapat dipilih kembali untuk opsi lain.
                            </p>
                         </div>
                      </div>
                  </div>
               )}
            </div>
          </div>

         <div className="flex flex-row items-center justify-between mt-6 max-w-4xl mx-auto gap-2">
            {examInfo?.showPrevious !== false && (
              <button 
                 onClick={() => currentIndex > 0 && setCurrentIndex(c => c - 1)} 
                 disabled={currentIndex === 0} 
                 className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm rounded-xl disabled:opacity-30 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm shrink-0"
              >
                 <ChevronLeft className="w-4 h-4" /> Kembali
              </button>
            )}
             
             <button 
                onClick={() => setFlagged(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))} 
                className={`px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 ${flagged[currentQ.id] ? 'bg-amber-100 border-amber-400 text-amber-700 shadow-amber-100' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                title="Ragu-ragu"
             >
                <Flag className={`w-4 h-4 ${flagged[currentQ.id] ? 'fill-amber-700' : ''}`} /> Ragu
             </button>

             {currentIndex === questionsList.length - 1 ? (
                <div className="flex-1">
                    {(() => {
                        const totalSec = (examInfo?.duration || 0) * 60;
                        const elapsedSec = totalSec - timeLeft;
                        const targetPercent = parseInt(testSettings?.allowTerminateAfterPercent || '0');
                        const targetSec = (targetPercent / 100) * totalSec;
                        const isTimeMet = elapsedSec >= targetSec;

                        if (!isTimeMet) {
                            const waitSec = Math.ceil(targetSec - elapsedSec);
                            const waitMin = Math.floor(waitSec / 60);
                            const waitS = waitSec % 60;
                            return (
                                <button disabled className="w-full py-2.5 bg-slate-300 text-white font-bold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-1">
                                    <span className="text-xs">Selesai dalam {waitMin > 0 ? `${waitMin}m ` : ''}{waitS}d</span>
                                </button>
                            );
                        }

                        return (
                            <button onClick={() => setFinishModalOpen(true)} className="w-full py-2.5 bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                                Selesai <CheckCircle2 className="w-4 h-4" />
                            </button>
                        );
                    })()}
                </div>
             ) : (
                <button onClick={() => setCurrentIndex(c => c + 1)} className="flex-1 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-md shadow-slate-200 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-1.5">Berikutnya <ChevronRight className="w-4 h-4" /></button>
             )}
          </div>
        </div>

        {/* Sidebar Navigasi Soal - Desktop (xl+) */}
        {examInfo?.showMenu !== false && (
          <div className="w-[340px] bg-slate-100/50 h-full hidden xl:flex flex-col border-l border-slate-200">
            <div className="p-8 bg-white border-b border-slate-200">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1">Navigasi</span>
                      <span className="text-lg font-black text-slate-800 tracking-tight">Daftar Nomor</span>
                  </div>
                  <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[11px] font-black shadow-lg shadow-indigo-100">{questionsList.length} BUTIR</div>
               </div>
               
               <div className="grid grid-cols-5 gap-2.5">
                  {questionsList.map((q, idx) => {
                     const isCurrent = currentIndex === idx;
                     const isAnswered = !!answers[q.id];
                     const isFlagged = flagged[q.id];
                     
                     return (
                        <button 
                          key={idx} 
                          onClick={() => setCurrentIndex(idx)} 
                          className={`group relative w-full aspect-square rounded-xl flex items-center justify-center font-black text-xs border-2 transition-all duration-300
                            ${isCurrent 
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-200 z-10 scale-110' 
                                : isFlagged
                                    ? 'bg-amber-500 border-amber-600 text-white shadow-md'
                                    : isAnswered 
                                        ? 'bg-emerald-500 border-emerald-600 text-white' 
                                        : 'bg-white text-slate-400 border-white hover:border-indigo-300 hover:text-indigo-600 shadow-sm'}
                          `}
                        >
                           {idx + 1}
                           {isFlagged && !isCurrent && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce"><Flag className="w-2.5 h-2.5 text-amber-600 fill-amber-600" /></div>}
                        </button>
                     );
                  })}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                 {/* Legend */}
                 <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/60">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 border-b pb-2">Keterangan Panel</p>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-indigo-600 rounded-md shadow-sm"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Posisi Saat Ini</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-emerald-500 rounded-md shadow-sm"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Sudah Dijawab</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-amber-500 rounded-md shadow-sm"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Ragu-ragu</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-white border border-slate-200 rounded-md shadow-sm"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Belum Dikerjakan</span>
                        </div>
                     </div>
                 </div>

                 {/* Help Card */}
                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-indigo-400 mb-3">
                            <Info className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Pusat Bantuan</span>
                        </div>
                        <p className="text-[11px] font-bold leading-relaxed text-slate-300">
                           Jika soal atau gambar tidak muncul, klik tombol **REFRESH SOAL** di bagian atas (Header) tanpa harus keluar dari mode Fullscreen.
                        </p>
                    </div>
                 </div>
            </div>
        </div>
        )}
      </div>

      {/* Mobile Navigation Drawer (below xl) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[200] xl:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

          {/* Drawer Panel */}
          <div
            className="absolute right-0 top-0 h-full w-[320px] max-w-[90vw] bg-white shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none block mb-1">Navigasi</span>
                <span className="text-lg font-black text-slate-800 tracking-tight">Daftar Nomor</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[11px] font-black shadow-lg shadow-indigo-100">{questionsList.length} BUTIR</div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Question Grid */}
            <div className="p-5 border-b border-slate-100">
              <div className="grid grid-cols-5 gap-2.5">
                {questionsList.map((q, idx) => {
                  const isCurrent = currentIndex === idx;
                  const isAnswered = !!answers[q.id];
                  const isFlagged = flagged[q.id];
                  return (
                    <button
                      key={idx}
                      onClick={() => { setCurrentIndex(idx); setSidebarOpen(false); }}
                      className={`group relative w-full aspect-square rounded-xl flex items-center justify-center font-black text-xs border-2 transition-all duration-300
                        ${isCurrent
                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-200 scale-110'
                            : isFlagged
                                ? 'bg-amber-500 border-amber-600 text-white shadow-md'
                                : isAnswered
                                    ? 'bg-emerald-500 border-emerald-600 text-white'
                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}
                      `}
                    >
                      {idx + 1}
                      {isFlagged && !isCurrent && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                          <Flag className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend & Help */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Keterangan Panel</p>
                <div className="space-y-3">
                  {[
                    { color: 'bg-indigo-600', label: 'Posisi Saat Ini' },
                    { color: 'bg-emerald-500', label: 'Sudah Dijawab' },
                    { color: 'bg-amber-500', label: 'Ragu-ragu' },
                    { color: 'bg-white border border-slate-300', label: 'Belum Dikerjakan' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-5 h-5 ${item.color} rounded-md shadow-sm shrink-0`}></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-xl">
                <div className="flex items-center gap-2 text-indigo-400 mb-3">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pusat Bantuan</span>
                </div>
                <p className="text-[11px] font-bold leading-relaxed text-slate-300">
                  Jika soal atau gambar tidak muncul, klik tombol **REFRESH SOAL** di bagian atas (Header) tanpa harus keluar dari mode Fullscreen.
                </p>
              </div>

              {/* Progress summary */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Progres Ujian</p>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${questionsList.length > 0 ? (Object.keys(answers).length / questionsList.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs font-black text-slate-600">
                  {Object.keys(answers).length} <span className="text-slate-400 font-medium">dari</span> {questionsList.length} <span className="text-slate-400 font-medium">terjawab</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {finishModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-[3.5rem] p-12 max-w-sm w-full shadow-2xl text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase italic tracking-tighter">Verified!</h2>
              <p className="text-xs text-slate-400 font-bold mb-10 uppercase tracking-widest">Proses Pengetesan Selesai</p>
              <button 
                onClick={handleSubmitExam}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-black shadow-2xl transition-all hover:-translate-y-1"
              >
                 {isPreview ? 'Keluar Preview' : 'Selesaikan & Kirim'}
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default ExamPage;
