import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings2, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  Save, 
  Database,
  ArrowRight,
  Shield,
  Monitor,
  Loader2,
  Search,
  X,
  ClipboardList,
  Calendar,
  Clock,
  BookOpen,
  School,
  GraduationCap,
  Globe,
  CheckSquare,
  Square,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useConfirm } from '../../components/ui/ConfirmContext';
import { toast } from 'sonner';

const ExamsManager: React.FC = () => {
  const confirm = useConfirm();
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [exams, setExams] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupMappings, setGroupMappings] = useState<Record<number, number[]>>({});
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [examSearchTerm, setExamSearchTerm] = useState('');
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);

  // Target State
  const [targetType, setTargetType] = useState<'GLOBAL' | 'SPECIFIC'>('SPECIFIC');
  const [globalSubjectIds, setGlobalSubjectIds] = useState<number[]>([]);
  const [schoolTargets, setSchoolTargets] = useState<any[]>([]);
  const [topicRules, setTopicRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({ subjectId: '', questionCount: 1 });

  useEffect(() => {
    fetchExams();
    fetchSubjects();
    fetchGroups();
  }, []);

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/exams');
      const data = await res.json();
      setExams(data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (err) { console.error(err); }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/groups');
      const data = await res.json();
      setGroups(data);
      const mRes = await fetch('http://localhost:3001/api/groups/mappings');
      const mData = await mRes.json();
      setGroupMappings(mData);
    } catch (err) { console.error(err); }
  };

  const availableSchools = groups.filter(g => g.category === 'SCHOOL');
  const availableClasses = groups.filter(g => g.category === 'CLASS');
  const availablePeminatans = groups.filter(g => g.category === 'SUBJECT' || g.category === 'GENERAL');

  const formatDateTimeLocal = (dateStr?: any) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    startTime: formatDateTimeLocal(),
    endTime: formatDateTimeLocal(new Date(Date.now() + 86400000)),
    duration: 60,
    basePoints: '1.0',
    wrongPoints: '0.0',
    noAnswerPoints: '0.0',
    minScore: '0.0',
    token: '',
    shuffleQuestions: true,
    shuffleAnswers: true,
    showPrevious: true,
    showNext: true,
    showMenu: true,
    showResultToUser: false,
    canRepeat: false,
    autoLogout: true,
  });

  const handleEditClick = (exam: any) => {
    setSelectedExamId(exam.id);
    setFormData({ 
      ...exam, 
      startTime: formatDateTimeLocal(exam.startTime), 
      endTime: formatDateTimeLocal(exam.endTime),
      basePoints: exam.basePoints.toString(),
      wrongPoints: exam.wrongPoints.toString(),
      noAnswerPoints: exam.noAnswerPoints.toString(),
      minScore: exam.minScore.toString()
    });
    setTopicRules(exam.topicRules?.map((r: any) => ({ 
      subjectId: r.subjectId.toString(), 
      subjectName: r.subject?.name, 
      questionCount: r.questionCount,
      questionType: r.questionType || 'all',
      difficulty: r.difficulty || 1,
      answerCount: r.answerCount || 4
    })) || []);
    
    try {
      const parsed = JSON.parse(exam.targetRulesJson || '[]');
      const globals = parsed.filter((p: any) => !p.schoolId && p.subjectIds?.length > 0);
      const specials = parsed.filter((p: any) => p.schoolId);
      
      if (globals.length > 0) {
         setTargetType('GLOBAL');
         setGlobalSubjectIds([...new Set(globals.flatMap((p: any) => p.subjectIds))]);
         setSchoolTargets([]);
      } else {
         setTargetType('SPECIFIC');
         setSchoolTargets(specials.map((s: any) => ({ id: Math.random().toString(36).substr(2, 9), schoolId: s.schoolId, classIds: s.classIds || [] })));
         setGlobalSubjectIds([]);
      }
    } catch (e) {
      setTargetType('GLOBAL');
      setGlobalSubjectIds([]);
      setSchoolTargets([]);
    }
    setView('edit');
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!formData.name || !formData.startTime || !formData.endTime) {
       toast.error("Nama tes dan Waktu pelaksanaan wajib diisi!");
       setIsLoading(false);
       return;
    }

    const finalRules = [];
    if (targetType === 'GLOBAL' && globalSubjectIds.length > 0) {
       finalRules.push({ schoolId: '', classIds: [], subjectIds: globalSubjectIds });
    } else if (targetType === 'SPECIFIC') {
       schoolTargets.forEach(st => { if (st.schoolId) finalRules.push({ schoolId: st.schoolId, classIds: st.classIds, subjectIds: [] }); });
    }

    // Validasi & Sanitasi Data
    const safeParse = (val: any) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    const submissionData = {
       name: formData.name,
       description: formData.description,
       startTime: formData.startTime,
       endTime: formData.endTime,
       duration: parseInt(formData.duration),
       token: formData.token?.trim() || null,
       enabled: formData.enabled !== undefined ? formData.enabled : true,
       basePoints: safeParse(formData.basePoints),
       wrongPoints: safeParse(formData.wrongPoints),
       noAnswerPoints: safeParse(formData.noAnswerPoints),
       minScore: safeParse(formData.minScore),
       shuffleQuestions: formData.shuffleQuestions,
       shuffleAnswers: formData.shuffleAnswers,
       showPrevious: formData.showPrevious,
       showNext: formData.showNext,
       showMenu: formData.showMenu,
       showResultToUser: formData.showResultToUser,
       targetRulesJson: JSON.stringify(finalRules),
       topicRules // This will be destructured by server
    };

    console.log("Submitting Clean Data:", submissionData);

    try {
      const response = await fetch(selectedExamId ? `http://localhost:3001/api/exams/${selectedExamId}` : 'http://localhost:3001/api/exams', {
        method: selectedExamId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      
      const result = await response.json();
      
      if (response.ok) { 
        toast.success("Konfigurasi ujian aman disimpan"); 
        setView('list'); 
        fetchExams(); 
      } else {
        toast.error(result.error || result.message || "Gagal menyimpan data ke server");
        console.error("Server Error Details:", result);
      }
    } catch (err) { 
      toast.error("Koneksi gagal atau server bermasalah"); 
      console.error("Save Error:", err);
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleDeleteExam = async (id: number) => {
     try {
        const res = await fetch(`http://localhost:3001/api/exams/${id}`, { method: 'DELETE' });
        if (res.ok) { toast.success("Data dihapus"); fetchExams(); }
     } catch (e) { toast.error("Gagal hapus"); }
  };

  if (view !== 'list') {
    return (
      <div className="space-y-4 pb-10 p-6 animate-in fade-in duration-500">
         <div className="flex items-center justify-between">
            <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase">{selectedExamId ? 'Edit Konfigurasi Ujian' : 'Tambah Konfigurasi Baru'}</h1>
            <button onClick={() => setView('list')} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-200 transition-all">Batalkan</button>
         </div>

         <form onSubmit={handleSaveExam} className="space-y-4">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 space-y-8">
               
               {/* 1. INFO UMUM & JADWAL */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Ujian & Deskripsi</label>
                     <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 text-sm" placeholder="Isi nama ujian" />
                     <textarea rows={1} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-bold text-slate-700 outline-none resize-none text-xs" placeholder="Catatan tambahan..." />
                   </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Mulai</label>
                        <input type="datetime-local" required value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700" />
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Selesai</label>
                        <input type="datetime-local" required value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700" />
                     </div>
                     <div className="col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Durasi Pengerjaan (Menit)</label>
                        <div className="relative">
                           <input type="number" required value={formData.duration} onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-5 py-2 text-sm font-black text-slate-800" />
                           <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400 tracking-widest">MINUTES</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* 2. PENGATURAN SKOR (KKM & POIN) */}
               <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100 flex flex-wrap gap-4 justify-between animate-in zoom-in-95">
                  {[
                    {L:'Poin Benar', K:'basePoints', I:'✅'},
                    {L:'Poin Salah', K:'wrongPoints', I:'❌'},
                    {L:'Poin Kosong', K:'noAnswerPoints', I:'🔘'},
                    {L:'Batas KKM', K:'minScore', I:'🏆'}
                  ].map(p => (
                     <div key={p.K} className="flex-1 min-w-[120px] space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[.2em] flex items-center gap-2">{p.I} {p.L}</label>
                        <input type="text" value={formData[p.K]} onChange={(e) => setFormData({...formData, [p.K]: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-black text-slate-700 shadow-sm outline-none focus:border-blue-500" />
                     </div>
                  ))}
               </div>

               {/* 3. SMART TARGETING SYSTEM (V5 COMPACT) */}
               <div className="space-y-4 pt-8 border-t border-slate-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">🎯 Target Peserta:</h3>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg">
                           <button type="button" onClick={() => setTargetType('GLOBAL')} className={`px-3 py-1.5 rounded-md text-[8px] font-bold uppercase transition-all ${targetType === 'GLOBAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Jurusan Global</button>
                           <button type="button" onClick={() => setTargetType('SPECIFIC')} className={`px-3 py-1.5 rounded-md text-[8px] font-bold uppercase transition-all ${targetType === 'SPECIFIC' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Khusus Lembaga</button>
                        </div>
                     </div>
                     {targetType === 'SPECIFIC' && (
                        <button type="button" onClick={() => setSchoolTargets([...schoolTargets, { id: Math.random().toString(36).substr(2, 9), schoolId: '', classIds: [] }])} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[9px] font-bold uppercase shadow-md hover:bg-blue-700 transition-all">
                           <Plus className="w-3.5 h-3.5" /> Tambah Sekolah
                        </button>
                     )}
                  </div>

                  {targetType === 'GLOBAL' ? (
                     <div className="bg-emerald-50/50 p-6 rounded-[1.5rem] border border-emerald-100 transition-all animate-in slide-in-from-top-2">
                        <p className="text-[8px] font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Centang Jurusan (Peminatan) Independen:</p>
                        <div className="flex flex-wrap gap-1.5">
                           {availablePeminatans.map(p => (
                              <label key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${globalSubjectIds.includes(p.id) ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'}`} onClick={() => setGlobalSubjectIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}>
                                 <div className={`w-2 h-2 rounded-full border ${globalSubjectIds.includes(p.id) ? 'bg-white' : 'bg-slate-100 border-slate-300'}`}></div>
                                 <span className="text-[9px] font-bold uppercase tracking-tight">{p.name}</span>
                              </label>
                           ))}
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-2 transition-all animate-in slide-in-from-top-2">
                        {schoolTargets.map((st, sIdx) => (
                           <div key={st.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-center gap-4 group">
                              <div className="w-full md:w-56">
                                 <select value={st.schoolId} onChange={(e) => { const newT = [...schoolTargets]; newT[sIdx].schoolId = e.target.value ? parseInt(e.target.value) : ''; newT[sIdx].classIds = []; setSchoolTargets(newT); }} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-700 shadow-sm outline-none focus:border-blue-500">
                                    <option value="">-- PILIH SEKOLAH --</option>
                                    {availableSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                 </select>
                              </div>
                              <div className="flex-1 w-full flex flex-wrap gap-1">
                                 {st.schoolId ? (
                                    availableClasses.filter(c => groupMappings[st.schoolId]?.includes(c.id)).map(c => (
                                       <label key={c.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all cursor-pointer ${st.classIds.includes(c.id) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-100'}`} onClick={() => { const newT = [...schoolTargets]; const curr = newT[sIdx].classIds; newT[sIdx].classIds = curr.includes(c.id) ? curr.filter((x:any)=>x!==c.id) : [...curr, c.id]; setSchoolTargets(newT); }}>
                                          {st.classIds.includes(c.id) ? <CheckSquare className="w-2.5 h-2.5" /> : <Square className="w-2.5 h-2.5" />}
                                          <span className="text-[8px] font-bold uppercase">{c.name}</span>
                                       </label>
                                    ))
                                 ) : (
                                    <span className="text-[9px] font-bold text-slate-400 uppercase italic">Pilih Sekolah...</span>
                                 )}
                                 {st.schoolId && st.classIds.length === 0 && <span className="text-[8px] font-bold text-rose-600 uppercase flex items-center gap-1 ml-2"><AlertCircle className="w-2.5 h-2.5" /> Target: SEMUA ROMBEL</span>}
                              </div>
                              <button type="button" onClick={() => setSchoolTargets(schoolTargets.filter((_, i) => i !== sIdx))} className="p-1.5 text-rose-500 hover:scale-110 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* 4. BANK SOAL (SISIPKAN TOPIK) */}
               <div className="space-y-4 pt-8 border-t border-slate-100">
                  <div className="bg-blue-600 rounded-[1.5rem] p-6 text-white shadow-lg shadow-blue-500/10">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-500 rounded-xl shadow-inner shadow-blue-400"><Database className="w-5 h-5" /></div>
                        <div>
                           <h3 className="text-base font-bold uppercase tracking-tight">Sisipkan Bank Soal</h3>
                           <p className="text-blue-100 text-[8px] font-bold uppercase tracking-wider mt-0.5 opacity-80 italic">Masukkan topik materi dan jumlah butir soal</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-xl border border-white/5">
                        <div className="md:col-span-2 relative">
                           <div className="w-full bg-white rounded-lg px-4 py-2 text-slate-700 flex items-center justify-between cursor-pointer group" onClick={() => setIsTopicMenuOpen(!isTopicMenuOpen)}>
                              <input type="text" placeholder="Cari Mata Pelajaran / Topik..." className="bg-transparent border-none outline-none font-bold text-[11px] w-full" value={topicSearchTerm} onChange={(e) => { setTopicSearchTerm(e.target.value); setIsTopicMenuOpen(true); }} />
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isTopicMenuOpen ? 'rotate-180' : ''}`} />
                           </div>
                           {isTopicMenuOpen && (
                              <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-blue-50 max-h-[180px] overflow-y-auto animate-in fade-in zoom-in-95">
                                 {subjects.filter(s => s.name.toLowerCase().includes(topicSearchTerm.toLowerCase())).map(s => (
                                    <div key={s.id} onClick={() => { setNewRule({...newRule, subjectId: s.id.toString()}); setTopicSearchTerm(s.name); setIsTopicMenuOpen(false); }} className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-50 flex justify-between items-center group">
                                       <div>
                                          <p className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">{s.name}</p>
                                          <p className="text-[7px] uppercase font-bold text-slate-400">{s.module?.name}</p>
                                       </div>
                                       <div className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-bold">{s._count?.questions || 0} Soal</div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                        <div className="relative">
                           <input 
                              type="number" 
                              placeholder="Jml Soal" 
                              value={newRule.questionCount} 
                              max={newRule.subjectId ? subjects.find(x => x.id === parseInt(newRule.subjectId))?._count?.questions : undefined}
                              onChange={(e) => setNewRule({...newRule, questionCount: parseInt(e.target.value) || 0})} 
                              className="w-full bg-white rounded-lg px-4 py-2 text-slate-800 font-bold text-xs outline-none" 
                           />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400">
                              {newRule.subjectId ? `MAX: ${subjects.find(x => x.id === parseInt(newRule.subjectId))?._count?.questions || 0}` : 'BUTIR'}
                           </span>
                        </div>
                        <button type="button" onClick={() => { 
                           if(!newRule.subjectId) return; 
                           const s = subjects.find(x => x.id === parseInt(newRule.subjectId)); 
                           const max = s?._count?.questions || 0;
                           if (newRule.questionCount > max) {
                              toast.error(`Jumlah soal melebihi sediaan (${max} soal tersedia)`);
                              return;
                           }
                           setTopicRules([...topicRules, { ...newRule, subjectName: s?.name, questionType: 'all', difficulty: 1, answerCount: 4 }]); 
                           setNewRule({ subjectId:'', questionCount: 1}); 
                           setTopicSearchTerm(''); 
                        }} className="bg-slate-900 text-white rounded-lg font-bold uppercase text-[9px] tracking-wider shadow-md hover:bg-black transition-all">Sisipkan</button>
                     </div>

                     {topicRules.length > 0 && (
                        <div className="mt-4 bg-white/5 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                           <table className="w-full">
                              <tbody className="divide-y divide-white/5 font-bold text-xs">
                                 {topicRules.map((rule, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                       <td className="px-6 py-4 flex items-center gap-3"><Zap className="w-3 h-3 text-yellow-400" /> {rule.subjectName}</td>
                                       <td className="px-6 py-4 text-center bg-white/5 w-32 tracking-wider">{rule.questionCount} BUTIR</td>
                                       <td className="px-6 py-4 text-right w-16">
                                          <button type="button" onClick={() => setTopicRules(topicRules.filter((_, i) => i !== idx))} className="p-2 bg-rose-500/20 text-rose-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                  </div>
               </div>

               {/* 5. SETTINGS AREA (OPSI LAIN) */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 text-left">
                  <div className="space-y-3">
                     <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-wider pl-1"><Shield className="inline-block w-3.5 h-3.5 mr-2 text-orange-500" /> Keamanan Ujian</h3>
                     <div className="grid grid-cols-2 gap-2">
                        {[{L:'Acak Soal',K:'shuffleQuestions'}, {L:'Acak Opsi',K:'shuffleAnswers'}, {L:'Auto Log',K:'autoLogout'}, {L:'Mulai Ulang',K:'canRepeat'}].map(s => (
                           <label key={s.K} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg cursor-pointer hover:bg-white transition-all shadow-sm">
                              <input type="checkbox" checked={formData[s.K]} onChange={(e) => setFormData({...formData, [s.K]: e.target.checked})} className="w-3.5 h-3.5 text-blue-600 rounded" />
                              <span className="text-[9px] font-bold text-slate-600 uppercase italic tracking-tight">{s.L}</span>
                           </label>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-3">
                     <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-wider pl-1"><Monitor className="inline-block w-3.5 h-3.5 mr-2 text-blue-500" /> Pengalaman Siswa</h3>
                     <div className="grid grid-cols-2 gap-2">
                        {[{L:'Nav Back',K:'showPrevious'}, {L:'Nav Next',K:'showNext'}, {L:'Peta Soal',K:'showMenu'}, {L:'Cek Skor',K:'showResultToUser'}].map(s => (
                           <label key={s.K} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg cursor-pointer hover:bg-white transition-all shadow-sm">
                              <input type="checkbox" checked={formData[s.K]} onChange={(e) => setFormData({...formData, [s.K]: e.target.checked})} className="w-3.5 h-3.5 text-blue-600 rounded" />
                              <span className="text-[9px] font-bold text-slate-600 uppercase italic tracking-tight">{s.L}</span>
                           </label>
                        ))}
                     </div>
                  </div>
               </div>

               {/* FINAL COMMANDS (TOKEN & SAVE) */}
               <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center gap-6 border-4 border-slate-800 animate-in slide-in-from-bottom-4">
                  <div className="flex-1 w-full text-left">
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-2 flex items-center gap-3"><Clock className="w-3.5 h-3.5" /> Kunci / Token Akses Ujian</p>
                     <input type="text" placeholder="MISAL: MANSABA-24" value={formData.token} onChange={(e) => setFormData({...formData, token: e.target.value.toUpperCase()})} className="bg-white/5 border border-white/5 rounded-2xl w-full py-4 px-8 font-mono text-xl text-blue-400 outline-none uppercase tracking-[0.2em] focus:bg-white/10 transition-all shadow-inner" />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full md:w-auto px-10 py-5 bg-blue-600 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-[.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                     {selectedExamId ? 'Update Jadwal' : 'Simpan Jadwal'}
                  </button>
               </div>

            </div>
         </form>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200/50"><ClipboardList className="w-7 h-7" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Pusat Jadwal Ujian</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[.2em] mt-1.5">Smart Institutional Distribution Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input type="text" placeholder="CARI NAMA TES..." value={examSearchTerm} onChange={(e) => setExamSearchTerm(e.target.value)} className="h-12 pl-11 pr-6 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 w-64 transition-all" />
           </div>
           <button onClick={() => { setView('add'); setSelectedExamId(null); setFormData({ ...formData, name:'', description:'', token:'' }); setTargetType('SPECIFIC'); setGlobalSubjectIds([]); setSchoolTargets([]); setTopicRules([]); }} className="bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-wider flex items-center gap-3">
             <Plus className="w-5 h-5 border border-white/20 rounded-full" /> BUAT TES BARU
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-[.2em]">
               <th className="px-8 py-5">Informasi Ujian</th>
               <th className="px-8 py-5">Waktu Pelaksanaan</th>
               <th className="px-8 py-5 text-center">Token</th>
               <th className="px-8 py-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exams.filter(e => e.name.toLowerCase().includes(examSearchTerm.toLowerCase())).map(exam => {
               const isFinished = new Date() > new Date(exam.endTime);
               const start = new Date(exam.startTime);
               const end = new Date(exam.endTime);
               
               return (
                <tr key={exam.id} className={`group hover:bg-slate-50/50 transition-all ${isFinished ? 'opacity-40' : ''}`}>
                  <td className="px-8 py-4">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border-2 ${isFinished ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-blue-50 border-blue-100 text-blue-600 shadow-sm'}`}>
                           <Calendar className="w-5 h-5" />
                           <span className="text-[7px] font-bold mt-0.5 uppercase">{isFinished ? 'DONE' : 'LIVE'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <h3 className="font-bold text-slate-800 text-sm truncate leading-tight group-hover:text-blue-700 transition-colors uppercase tracking-tight">{exam.name}</h3>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                 <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                                 {exam.topicRules?.[0]?.subject?.name || 'Materi Campuran'}
                              </span>
                           </div>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-4">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-600">
                           <Clock className="w-3 h-3 text-blue-500" />
                           <span>{start.toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} • {start.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="text-[8px] font-bold text-slate-400 pl-5 uppercase">
                           S/D {end.toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} • {end.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                     <span className="inline-block px-4 py-1.5 bg-slate-900 text-blue-400 rounded-lg font-mono text-xs font-black tracking-widest border border-slate-800">{exam.token || 'OPEN'}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                     <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditClick(exam)} className="p-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => { confirm({ title: 'Hapus Sesi?', message: 'Data ini akan hilang. Lanjutkan?', type: 'danger' }).then(ok => ok && handleDeleteExam(exam.id)) }} className="p-2.5 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </td>
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamsManager;
