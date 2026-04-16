import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Settings2, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  Save, 
  Database,
  ArrowRight,
  Shield,
  Monitor,
  Users,
  Loader2,
  Search,
  ClipboardList
} from 'lucide-react';
import { useConfirm } from '../../components/ui/ConfirmContext';
import { toast } from 'sonner';

const ExamsManager: React.FC = () => {
  const confirm = useConfirm();
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [exams, setExams] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [examSearchTerm, setExamSearchTerm] = useState('');
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);

  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);

  // Helper formatting functions
  const formatDateTimeLocal = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const initialFormData = {
    name: '',
    description: '',
    startTime: formatDateTimeLocal(new Date()),
    endTime: formatDateTimeLocal(new Date(Date.now() + 86400000)),
    duration: 60,
    basePoints: '1.0',
    wrongPoints: '0.0',
    noAnswerPoints: '0.0',
    minScore: '0.0',
    ipRange: '*.*.*.*',
    token: '',
    shuffleQuestions: true,
    shuffleAnswers: true,
    showPrevious: true,
    showNext: true,
    showMenu: true,
    showResultToUser: false,
    showKkmToUser: false,
    showReportToUser: false,
    canRepeat: false,
    autoLogout: true,
    testComment: '',
    sslRequired: false,
    allowedGroupIds: []
  };

  const [formData, setFormData] = useState<any>(initialFormData);
  const [topicRules, setTopicRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({
    subjectId: '',
    questionCount: 1,
    questionType: 'all',
    difficulty: 1,
    answerCount: 4
  });

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
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/groups');
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (exam: any) => {
    setSelectedExamId(exam.id);
    setFormData({
      ...exam,
      startTime: formatDateTimeLocal(new Date(exam.startTime)),
      endTime: formatDateTimeLocal(new Date(exam.endTime)),
      allowedGroupIds: exam.groups?.map((g: any) => g.id) || []
    });
    setTopicRules(exam.topicRules.map((r: any) => ({
      subjectId: r.subjectId.toString(),
      subjectName: r.subject?.name,
      questionCount: r.questionCount,
      questionType: r.questionType,
      difficulty: r.difficulty,
      answerCount: r.answerCount
    })));
    setView('edit');
  };

  const toggleGroup = (groupId: number) => {
    const current = formData.allowedGroupIds || [];
    if (current.includes(groupId)) {
      setFormData({...formData, allowedGroupIds: current.filter((id: number) => id !== groupId)});
    } else {
      setFormData({...formData, allowedGroupIds: [...current, groupId]});
    }
  };

  const handleDeleteExam = async (id: number) => {
    const isConfirmed = await confirm({
        title: 'Hapus Tes',
        message: 'Apakah Anda yakin ingin menghapus tes ini? Data hasil tes yang terkait juga mungkin akan terpengaruh.',
        type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:3001/api/exams/${id}`, { method: 'DELETE' });
      if (res.ok) {
          toast.success("Tes berhasil dihapus");
          fetchExams();
      } else {
          toast.error("Gagal menghapus tes");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan server saat menghapus");
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const method = selectedExamId ? 'PUT' : 'POST';
    const url = selectedExamId ? `http://localhost:3001/api/exams/${selectedExamId}` : 'http://localhost:3001/api/exams';

    const submissionData = {
      ...formData,
      basePoints: parseFloat(formData.basePoints) || 0,
      wrongPoints: parseFloat(formData.wrongPoints) || 0,
      noAnswerPoints: parseFloat(formData.noAnswerPoints) || 0,
      minScore: parseFloat(formData.minScore) || 0,
      topicRules
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      if (res.ok) {
        toast.success(selectedExamId ? "Tes berhasil diupdate" : "Tes baru berhasil disimpan");
        setView('list');
        fetchExams();
      } else {
        toast.error("Gagal menyimpan data ke server");
      }
    } catch (err) {
      toast.error("Server tidak merespons");
    } finally {
      setIsLoading(false);
    }
  };

  const addTopicRule = () => {
    if (!newRule.subjectId) return;
    const subject = subjects.find(s => s.id === parseInt(newRule.subjectId));
    const available = subject?._count?.questions || 0;

    if (newRule.questionCount > available) {
      toast.error(`Maaf, jumlah soal di "${subject?.name}" hanya ${available} soal.`, {
          description: "Silakan kurangi jumlah soal yang diminta untuk topik ini."
      });
      return;
    }

    setTopicRules([...topicRules, { ...newRule, subjectName: subject?.name }]);
    setNewRule({ ...newRule, subjectId: '' });
    setTopicSearchTerm('');
    toast.info(`Topik "${subject?.name}" ditambahkan ke aturan tes`);
  };

  const removeRule = (idx: number) => {
    setTopicRules(topicRules.filter((_, i) => i !== idx));
  };

  if (view !== 'list') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                  <Settings2 className="w-6 h-6" />
               </div>
               <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                    {selectedExamId ? 'Edit Pengaturan Test' : 'Buat Test Baru'}
                  </h1>
               </div>
            </div>
            <button onClick={() => setView('list')} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl font-bold uppercase text-xs">Batalkan</button>
         </div>

         <form onSubmit={handleSaveExam} className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-8 space-y-6">
               <div className="space-y-2">
                  <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Test</label>
                     <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full neat-field mt-0.5" />
                  </div>
                  <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Deskripsi</label>
                     <textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full neat-field mt-0.5 resize-none" />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Waktu Mulai</label>
                     <input type="datetime-local" required value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="w-full neat-field mt-0.5" />
                  </div>
                  <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Waktu Selesai</label>
                     <input type="datetime-local" required value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className="w-full neat-field mt-0.5" />
                  </div>
                  <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Durasi (Menit)</label>
                     <input type="number" required value={formData.duration} onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})} className="w-full neat-field mt-0.5" />
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                  <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider pl-1">Poin Benar</label>
                     <input type="text" value={formData.basePoints} onChange={(e) => setFormData({...formData, basePoints: e.target.value})} className="w-full neat-field mt-0.5" />
                  </div>
                  <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider pl-1">Poin Salah</label>
                     <input type="text" value={formData.wrongPoints} onChange={(e) => setFormData({...formData, wrongPoints: e.target.value})} className="w-full neat-field mt-0.5" />
                  </div>
                  <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider pl-1">Poin Kosong</label>
                     <input type="text" value={formData.noAnswerPoints} onChange={(e) => setFormData({...formData, noAnswerPoints: e.target.value})} className="w-full neat-field mt-0.5" />
                  </div>
                  <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider pl-1">KKM (Poin)</label>
                     <input type="text" value={formData.minScore} onChange={(e) => setFormData({...formData, minScore: e.target.value})} className="w-full neat-field mt-0.5" />
                  </div>
               </div>

               {/* TARGET PESERTA */}
               <div className="space-y-3 pt-4 border-t border-slate-100 relative">
                  <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Users className="w-4 h-4 text-indigo-500" /> Target Peserta (Grup/Kelas)</h3>
                  
                  <div className="relative">
                    <div 
                      className="min-h-[45px] w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 flex flex-wrap gap-2 cursor-text focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all"
                      onClick={() => setIsGroupMenuOpen(true)}
                    >
                      {formData.allowedGroupIds?.map((id: number) => {
                        const group = groups.find(g => g.id === id);
                        return (
                          <span key={id} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 group animate-in zoom-in-95">
                            {group?.name}
                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleGroup(id); }} className="hover:text-amber-300">×</button>
                          </span>
                        );
                      })}
                      <input 
                        type="text"
                        placeholder={formData.allowedGroupIds?.length === 0 ? "Ketik nama kelas/grup..." : ""}
                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 flex-1 min-w-[120px]"
                        value={groupSearchTerm}
                        onFocus={() => setIsGroupMenuOpen(true)}
                        onChange={(e) => setGroupSearchTerm(e.target.value)}
                      />
                    </div>

                    {isGroupMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsGroupMenuOpen(false)} />
                        <div className="absolute z-[70] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[250px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                          <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1 text-slate-400">
                             {groups
                               .filter(g => g.name.toLowerCase().includes(groupSearchTerm.toLowerCase()))
                               .map(g => (
                                 <div 
                                   key={g.id} 
                                   className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${formData.allowedGroupIds?.includes(g.id) ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                                   onClick={() => toggleGroup(g.id)}
                                 >
                                   <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.allowedGroupIds?.includes(g.id) ? 'bg-indigo-600 border-transparent text-white' : 'border-slate-200'}`}>
                                      {formData.allowedGroupIds?.includes(g.id) && <span className="text-[10px] font-black">L</span>}
                                   </div>
                                   <span className="text-xs font-bold uppercase">{g.name}</span>
                                 </div>
                               ))
                             }
                             {groups.filter(g => g.name.toLowerCase().includes(groupSearchTerm.toLowerCase())).length === 0 && (
                               <p className="col-span-2 p-6 text-center text-xs italic">Grup tidak ditemukan.</p>
                             )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-3">
                     <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Shield className="w-4 h-4 text-orange-500" /> Keamanan & Akses</h3>
                     <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                           <input type="checkbox" checked={formData.shuffleQuestions} onChange={(e) => setFormData({...formData, shuffleQuestions: e.target.checked})} />
                           <span className="text-[11px] font-bold text-slate-600">Acak Soal</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                           <input type="checkbox" checked={formData.shuffleAnswers} onChange={(e) => setFormData({...formData, shuffleAnswers: e.target.checked})} />
                           <span className="text-[11px] font-bold text-slate-600">Acak Jawaban</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                           <input type="checkbox" checked={formData.canRepeat} onChange={(e) => setFormData({...formData, canRepeat: e.target.checked})} />
                           <span className="text-[11px] font-bold text-slate-600">Dapat Diulang</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                           <input type="checkbox" checked={formData.autoLogout} onChange={(e) => setFormData({...formData, autoLogout: e.target.checked})} />
                           <span className="text-[11px] font-bold text-slate-600">Auto Logout</span>
                        </label>
                     </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Monitor className="w-4 h-4 text-blue-500" /> Tampilan Interface</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                           <input type="checkbox" checked={formData.showPrevious} onChange={(e) => setFormData({...formData, showPrevious: e.target.checked})} />
                           <span className="text-[11px] font-bold text-slate-600">Tombol Sebelumnya</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                           <input type="checkbox" checked={formData.showMenu} onChange={(e) => setFormData({...formData, showMenu: e.target.checked})} />
                           <span className="text-[11px] font-bold text-slate-600">Menu Soal</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                           <input type="checkbox" checked={formData.showResultToUser} onChange={(e) => setFormData({...formData, showResultToUser: e.target.checked})} />
                           <span className="text-[11px] font-bold text-slate-600">Tampilkan Skor</span>
                        </label>
                    </div>
                  </div>
               </div>

               {/* SISIPKAN BANK SOAL */}
               <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="bg-blue-600 text-white p-6 rounded-3xl">
                     <div className="flex items-center gap-3 mb-4">
                        <Database className="w-5 h-5" />
                        <h2 className="text-lg font-black uppercase tracking-tight">Sisipkan Bank Soal</h2>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-blue-700/50 p-4 rounded-2xl">
                        <div className="col-span-2 space-y-1 relative">
                           <div className="relative">
                              <div className="w-full bg-white rounded-xl px-4 py-2 text-sm font-bold text-slate-700 flex items-center justify-between cursor-pointer" onClick={() => setIsTopicMenuOpen(true)}>
                                 <input type="text" placeholder="Cari Topik..." className="bg-transparent border-none outline-none w-full" value={topicSearchTerm} onChange={(e) => setTopicSearchTerm(e.target.value)} />
                                 <ChevronDown className="w-4 h-4 text-slate-400" />
                              </div>
                              {isTopicMenuOpen && (
                                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[200px] overflow-y-auto">
                                  {subjects.filter(s => s.name.toLowerCase().includes(topicSearchTerm.toLowerCase())).map(s => (
                                    <div key={s.id} className="group px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-50" onClick={() => { setNewRule({...newRule, subjectId: s.id.toString()}); setTopicSearchTerm(s.name); setIsTopicMenuOpen(false); }}>
                                      <div className="flex justify-between items-center">
                                         <div><p className="text-sm font-bold text-slate-700">{s.name}</p><p className="text-[9px] uppercase">{s.module?.name}</p></div>
                                         <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-black">{s._count?.questions || 0} Soal</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                           </div>
                        </div>
                        <div className="space-y-1">
                           <input type="number" value={newRule.questionCount} onChange={(e) => setNewRule({...newRule, questionCount: parseInt(e.target.value)})} className="w-full bg-white border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700" />
                        </div>
                        <div className="flex items-end">
                           <button type="button" onClick={addTopicRule} className="w-full bg-slate-800 text-white rounded-xl py-2 text-xs font-black uppercase shadow-lg">Sisipkan</button>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden">
                     <table className="w-full text-left text-sm">
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                           {topicRules.map((rule, idx) => (
                              <tr key={idx} className="bg-white hover:bg-blue-50/50">
                                 <td className="px-6 py-4">{rule.subjectName}</td>
                                 <td className="px-6 py-4 text-center">{rule.questionCount} Soal</td>
                                 <td className="px-6 py-4 text-right">
                                    <button type="button" onClick={() => removeRule(idx)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* Footer */}
               <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                  <div className="flex-1 w-full space-y-2">
                        <Shield className="inline-block mr-2 w-4 h-4 text-slate-500" />
                        <input type="text" placeholder="Token / Password Ujian" value={formData.token} onChange={(e) => setFormData({...formData, token: e.target.value})} className="bg-transparent border-b border-slate-700 py-2 outline-none text-blue-400 w-full" />
                  </div>
                  <div className="w-full md:w-auto">
                     <button type="submit" disabled={isLoading} className="w-full px-10 py-4 bg-blue-600 rounded-2xl font-black shadow-xl text-xs uppercase transition-all">
                        {isLoading ? 'Menyimpan...' : (selectedExamId ? 'Update Pengaturan Test' : 'Simpan Test Baru')}
                     </button>
                  </div>
               </div>
            </div>
         </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-blue-600">
              <ClipboardList className="w-6 h-6" />
           </div>
           <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Daftar Tes</h1>
              <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.2em]">Ujian Real-time</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama tes..." 
                className="h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm w-full md:w-64"
                value={examSearchTerm}
                onChange={(e) => setExamSearchTerm(e.target.value)}
              />
           </div>
           <button 
              onClick={() => { setView('add'); setSelectedExamId(null); setFormData(initialFormData); setTopicRules([]); }} 
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5 text-[10px] uppercase tracking-widest"
           >
             <Plus className="w-4 h-4" /> BUAT TEST BARU
           </button>
        </div>
      </div>

      {/* Modern Table List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-10 text-center">#</th>
                <th className="px-5 py-3 text-[9px] font-black text-blue-600 uppercase tracking-widest">Waktu Mulai</th>
                <th className="px-5 py-3 text-[9px] font-black text-blue-600 uppercase tracking-widest">Waktu Selesai</th>
                <th className="px-5 py-3 text-[9px] font-black text-blue-600 uppercase tracking-widest">Nama Tes</th>
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Deskripsi</th>
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Token</th>
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!isLoading && exams
                .filter(e => e.name.toLowerCase().includes(examSearchTerm.toLowerCase()))
                .map((exam, idx) => {
                const isFinished = new Date() > new Date(exam.endTime);
                return (
                  <tr 
                    key={exam.id} 
                    className={`group transition-all hover:bg-blue-50/30 ${isFinished ? 'bg-rose-50/30' : ''}`}
                  >
                    <td className="px-5 py-3 text-[10px] font-black text-slate-300 text-center">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 shadow-sm">{formatDateDisplay(exam.startTime)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold shadow-sm ${isFinished ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
                        {formatDateDisplay(exam.endTime)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-blue-600 uppercase truncate max-w-[150px]">{exam.name}</p>
                        <div className="flex flex-wrap gap-1">
                          {exam.groups?.map((g: any) => (
                            <span key={g.id} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase">{g.name}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[10px] font-medium text-slate-400 max-w-[150px] truncate">
                      {exam.description || '-'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {exam.token ? (
                        <span className="px-2 py-0.5 bg-slate-800 text-blue-400 rounded-md text-[9px] font-black font-mono">
                          {exam.token}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-300 font-bold uppercase italic tracking-tighter">No Pass</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                       <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(exam)} className="p-1.5 text-blue-500 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-slate-100"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteExam(exam.id)} className="p-1.5 text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-slate-100"><Trash2 className="w-3.5 h-3.5" /></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {exams.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-bold italic text-sm">
                    Belum ada jadwal tes yang dibuat.
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

export default ExamsManager;
