import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileUp, 
  ChevronDown, 
  Edit3,
  CheckCircle2,
  Download,
  Printer,
  FileText,
  Search
} from 'lucide-react';
import WordImportWizard from '../../components/admin/questions/WordImportWizard';
import EditQuestionModal from '../../components/admin/questions/EditQuestionModal';
import { toast } from 'sonner';

type ViewMode = 'list' | 'import';

const QuestionsHub: React.FC<{initialImport?: boolean}> = ({ initialImport }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialImport ? 'import' : 'list');
  const [showKeysInPrint, setShowKeysInPrint] = useState(false);
  const [hideOptions, setHideOptions] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  useEffect(() => { setViewMode(initialImport ? 'import' : 'list'); }, [initialImport]);

  const fetchModules = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/modules');
      const data = await res.json();
      setModules(data);
      if (data.length > 0 && !selectedModuleId) {
        setSelectedModuleId(data[0].id);
        if (data[0].subjects.length > 0) setSelectedTopicId(data[0].subjects[0].id);
      }
    } catch (err) { console.error(err); }
  };

  const fetchQuestions = async (topicId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/questions/${topicId}`);
      const data = await res.json();
      setQuestions(data);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchModules(); }, [viewMode]);
  useEffect(() => { if (selectedTopicId) fetchQuestions(selectedTopicId); }, [selectedTopicId]);

  const handleEditClick = (q: any) => {
    setEditingQuestion(q);
    setIsEditModalOpen(true);
  };

  const handleAddNewQuestion = () => {
    if (!selectedTopicId) { toast.error("Pilih modul & topik dahulu!"); return; }
    const newQuestion = {
      id: 0, content: '', type: 'MCSA', difficulty: 1,
      answers: [
        { content: '', isRight: true, weight: 100 },
        { content: '', isRight: false, weight: 0 },
        { content: '', isRight: false, weight: 0 },
        { content: '', isRight: false, weight: 0 }
      ]
    };
    setEditingQuestion(newQuestion);
    setIsEditModalOpen(true);
  };

  const handleQuickSetRightAnswer = async (qId: number, aId: number) => {
    const question = questions.find(q => q.id === qId);
    if (!question) return;

    // 1. Optimistic Update (UI)
    // We toggle the clicked answer. Then we check if there are > 1 right answers.
    const updatedQuestions = questions.map(q => {
      if (q.id === qId) {
        const newAnswers = q.answers.map((ans: any) => {
          if (ans.id === aId) {
            const newStatus = !ans.isRight;
            return { ...ans, isRight: newStatus, weight: newStatus ? 100 : 0 };
          }
          return ans;
        });

        const rightCount = newAnswers.filter((a: any) => a.isRight).length;
        const optionCount = newAnswers.length;

        // Logika Auto-Switch Type:
        // 1. Jika opsi > 1 dan jawaban benar > 1 -> MCMA
        // 2. Jika opsi > 1 dan jawaban benar = 1 -> MCSA
        // 3. Jika opsi = 1 -> FIB (Isian Singkat)
        let newType = q.type;
        if (optionCount > 1) {
          newType = rightCount > 1 ? 'MCMA' : 'MCSA';
        } else if (optionCount === 1) {
          newType = 'FIB';
        }

        return { ...q, answers: newAnswers, type: newType };
      }
      return q;
    });
    setQuestions(updatedQuestions);

    // 2. Persistent Update (DB)
    try {
      await fetch(`http://localhost:3001/api/questions/${qId}/quick-toggle-answer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId: aId })
      });
    } catch (err) {
      console.error("Gagal update kunci jawaban:", err);
      if (selectedTopicId) fetchQuestions(selectedTopicId);
    }
  };

  const handlePrint = (withKeys: boolean) => {
    setShowKeysInPrint(withKeys);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (viewMode === 'import') {
    return (
      <div className="space-y-4">
        <button onClick={() => setViewMode('list')} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">← Kembali</button>
        <WordImportWizard onComplete={() => setViewMode('list')} />
      </div>
    );
  }

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const topics = selectedModule?.subjects || [];

  return (
    <div className="bg-[#f8fafc] min-h-screen p-4 space-y-4 relative text-slate-900">
      <style>{`
        @media print {
          @page { margin: 2cm; }
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { 
            position: absolute; 
            left: 0; top: 0; width: 100%; 
            font-family: 'Times New Roman', Times, serif !important;
            color: black !important;
                    .no-print { display: none !important; }
          .printable-area p { margin-bottom: 0.2rem; }
        }
        .question-content-preview p, .question-content-preview div {
          display: inline !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .question-content-preview img {
          display: inline-block !important;
          vertical-align: middle;
          max-height: 2em;
        }
      `}</style>

      {editingQuestion && (
        <EditQuestionModal 
          key={editingQuestion.id === 0 ? `new-q-${Date.now()}` : editingQuestion.id}
          isOpen={isEditModalOpen}
          question={editingQuestion}
          subjectId={selectedTopicId}
          onClose={() => { setIsEditModalOpen(false); setEditingQuestion(null); }}
          onSave={() => selectedTopicId && fetchQuestions(selectedTopicId)}
        />
      )}

      {/* --- SCREEN ONLY UI (PREMIUM RESTORED) --- */}
      <div className="no-print space-y-4">
        {/* Top Filter Bar (Premium Large Dropdowns) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-stretch md:items-center">
          <div className="flex-1 flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Pilih Modul</span>
            <div className="relative">
                <select 
                  value={selectedModuleId || ''} 
                  onChange={(e) => {
                    const mid = parseInt(e.target.value);
                    setSelectedModuleId(mid);
                    const m = modules.find(mod => mod.id === mid);
                    if (m?.subjects.length > 0) setSelectedTopicId(m.subjects[0].id);
                    else setSelectedTopicId(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-[2] flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Pilih Topik Pembahasan</span>
            <div className="relative">
                <select 
                  value={selectedTopicId || ''} 
                  onChange={(e) => setSelectedTopicId(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {topics.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari konten soal..." 
                  className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer shrink-0">
                <input type="checkbox" checked={hideOptions} onChange={(e) => setHideOptions(e.target.checked)} className="rounded border-slate-300" />
                Sembunyikan opsi
            </label>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">Jumlah soal</span>
                <span className="bg-slate-800 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{questions.length}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('import')} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 transition-all">
              <FileUp className="w-4 h-4" /> IMPOR WORD (TMF)
            </button>
            <button onClick={handleAddNewQuestion} className="flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all border border-blue-600">
              <Plus className="w-4 h-4 shadow-sm" /> TAMBAH SOAL BARU
            </button>
          </div>
        </div>

        {/* List Content (Detailed Sidebar Restored) */}
        <div className="space-y-4">
          {isLoading && <div className="text-center py-20 animate-pulse text-slate-400 font-black text-xs uppercase tracking-widest">Memuat Bank Soal...</div>}
          
          {!isLoading && questions
            .filter(q => q.content.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((q, idx) => (
            <div key={q.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex shadow-sm hover:shadow-md transition-shadow">
              {/* Detailed Sidebar Info (RESTORED) */}
              <div className="w-24 bg-slate-50 border-r border-slate-100 p-3 flex flex-col items-center gap-3 shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <input type="checkbox" className="rounded border-slate-300 mb-1" />
                  <span className="text-xs font-black text-slate-400"># {idx + 1}</span>
                </div>
                
                <div className="w-full space-y-2">
                  <div className="bg-white border border-slate-200 rounded px-1.5 py-1 flex items-center justify-between shadow-sm text-[10px]">
                    <span className="font-bold text-slate-400 uppercase text-[8px]">Posisi</span>
                    <span className="font-black text-slate-700 bg-slate-50 px-1 rounded">{idx + 1}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded px-1.5 py-1 flex items-center justify-between shadow-sm text-[10px]">
                    <span className="font-bold text-slate-400 uppercase text-[8px]">Sulit</span>
                    <span className="font-black text-slate-700 bg-slate-50 px-1 rounded">{q.difficulty}</span>
                  </div>
                  <div className={`border rounded px-1 py-1.5 text-center shadow-sm ${
                    q.type === 'FIB' ? 'border-amber-200 bg-amber-50' : 
                    q.type === 'ESSAY' ? 'border-indigo-200 bg-indigo-50' :
                    'border-blue-200 bg-blue-50/30'
                  }`}>
                    <span className={`text-[8px] font-black uppercase block leading-tight ${
                      q.type === 'FIB' ? 'text-amber-600' : 
                      q.type === 'ESSAY' ? 'text-indigo-600' :
                      'text-blue-600'
                    }`}>
                      {q.type === 'MCSA' && 'Pilihan Ganda'}
                      {q.type === 'MCMA' && 'PG Jamak'}
                      {q.type === 'FIB' && 'Isian Singkat'}
                      {q.type === 'ESSAY' && 'Uraian / Essay'}
                      {q.type === 'ORDERING' && 'Urutan'}
                      {q.type === 'MATCHING' && 'Match'}
                    </span>
                  </div>
                  {q.type === 'FIB' && (
                    <div className="mt-1 flex items-center justify-center gap-1 text-[7px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 py-0.5 rounded border border-emerald-100">
                      <CheckCircle2 className="w-2 h-2" /> Auto Correct
                    </div>
                  )}
                </div>

                <button onClick={() => handleEditClick(q)} className="mt-2 w-full py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 flex items-center justify-center gap-1 uppercase transition-all">
                  <Edit3 className="w-3 h-3" /> EDIT
                </button>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 p-6 space-y-5">
                <div className="question-content-preview text-[13px] text-slate-700 leading-relaxed font-medium pr-10" dangerouslySetInnerHTML={{ __html: q.content }} />
                {!hideOptions && (
                  <div className="space-y-1.5">
                    {q.answers.map((ans: any, i: number) => (
                      <div 
                        key={ans.id} 
                        onClick={() => handleQuickSetRightAnswer(q.id, ans.id)}
                        title="Klik untuk menjadikan kunci jawaban"
                        className={`group flex items-center rounded-xl border transition-all cursor-pointer ${ans.isRight ? 'bg-green-100/40 border-green-300' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-blue-50/20 shadow-sm'}`}
                      >
                        <div className={`w-9 h-9 flex items-center justify-center shrink-0 border-r ${ans.isRight ? 'border-green-200' : 'border-slate-50/50'}`}>
                          <span className={`w-5 h-5 flex items-center justify-center rounded border text-[10px] font-black ${ans.isRight ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                        </div>
                        <div className="flex-1 px-4 text-[13px] font-medium text-slate-700 py-2" dangerouslySetInnerHTML={{ __html: ans.content }} />
                        <div className="flex items-center gap-3 pr-4">
                            <span className={`text-[11px] font-black w-10 text-right ${ans.isRight ? 'text-green-600' : 'text-slate-300'}`}>{ans.isRight ? '100%' : '0%'}</span>
                            <div className={`transition-all ${ans.isRight ? 'text-green-600 scale-110' : 'text-slate-200 group-hover:text-blue-500'}`}><CheckCircle2 className="w-4 h-4" /></div>
                            <button onClick={(e) => { e.stopPropagation(); handleEditClick(q); }} className="p-1 text-slate-200 hover:text-blue-500 transition-colors">
                               <Edit3 className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Export Section (Premium Colorful UI Restored) */}
        <div className="bg-white rounded-3xl border border-slate-200 mt-10 p-6 shadow-sm overflow-hidden">
          <div className="mb-6 flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">EXPORT BANK SOAL</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <button className="px-4 py-3 bg-[#e11d48] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-rose-500/20 hover:saturate-150 transition-all">PDF</button>
            <button className="px-4 py-3 bg-[#e11d48] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-rose-500/20 hover:saturate-150 transition-all">PDF Modul</button>
            <button className="px-4 py-3 bg-[#2563eb] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-500/20 hover:saturate-150 transition-all">XML Semua</button>
            <button className="px-4 py-3 bg-[#16a34a] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-500/20 hover:saturate-150 transition-all">JSON Semua</button>
            <button className="px-4 py-3 bg-[#7c3aed] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-violet-500/20 hover:saturate-150 transition-all">TSV Semua</button>
            
            <button onClick={() => {
              const data = questions.map((q, idx) => {
                const row: any = {
                  'No': idx + 1,
                  'Tipe': q.type,
                  'Tingkat': q.difficulty,
                  'Pertanyaan': q.content.replace(/<[^>]*>/g, ''),
                };
                q.answers.forEach((ans: any, i: number) => {
                  row[`Opsi ${String.fromCharCode(65 + i)}`] = ans.content.replace(/<[^>]*>/g, '');
                  if (ans.isRight) row['Kunci Jawaban'] = String.fromCharCode(65 + i);
                });
                row['Pembahasan'] = (q.explanation || '').replace(/<[^>]*>/g, '');
                return row;
              });

              const XLSX = (window as any).XLSX;
              const ws = XLSX.utils.json_to_sheet(data);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Soal");

              // Autofit
              ws['!cols'] = [
                { wch: 5 }, { wch: 10 }, { wch: 10 }, { wch: 60 },
                { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 },
                { wch: 15 }, { wch: 30 }
              ];

              XLSX.writeFile(wb, `Bank_Soal_${topics.find((t: any) => t.id === selectedTopicId)?.name || 'Export'}.xlsx`);
            }} className="px-4 py-3 bg-[#16a34a] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-500/20 hover:saturate-150 transition-all flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Excel (.xlsx)
            </button>
            <button onClick={() => handlePrint(false)} className="md:col-span-2 px-4 py-3 bg-[#1e293b] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
              <Printer className="w-4 h-4" /> Cetak Print / PDF
            </button>
            <button onClick={() => handlePrint(true)} className="md:col-span-3 px-4 py-3 bg-[#334155] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
              <Printer className="w-4 h-4" /> Cetak Print / PDF + Kunci Jawaban
            </button>
          </div>
        </div>
      </div>

      {/* --- PRINT ONLY AREA (THE NEAT ONE) --- */}
      <div className="printable-area hidden print:block pt-5 bg-white text-black font-serif">
         {/* KOP Identitas */}
         <div className="flex items-center gap-6 border-b-4 border-black pb-4 mb-4">
            <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-slate-100 italic rounded">LOGO</div>
            <div className="flex-1 font-serif">
               <h1 className="text-[22px] font-bold leading-tight">KKMA Ma'arif Kab. Batang</h1>
               <p className="text-[13px] leading-tight mt-1">Jl. Lapangan 9A Banyupatih, Batang, Jawa Tengah</p>
            </div>
         </div>

         <div className="text-center mb-6"><h2 className="text-[18px] font-black uppercase tracking-[2px]">DAFTAR SOAL</h2></div>
         
         <div className="mb-6 text-[14px]">
            <div className="grid grid-cols-[100px_max-content_1fr] gap-x-2">
              <span className="font-bold">Modul</span><span>:</span><span className="uppercase">{selectedModule?.name}</span>
              <span className="font-bold">Topik</span><span>:</span><span>{topics.find(t => t.id === selectedTopicId)?.name}</span>
            </div>
         </div>

         <div className="border-b border-slate-300 mb-8"></div>

         <div className="space-y-10">
            {questions.map((q, idx) => (
              <div key={q.id} className="grid grid-cols-[30px_1fr] gap-x-2">
                 <span className="font-bold text-[14px]">{idx + 1}.</span>
                 <div>
                    <div className="text-[14px] leading-relaxed mb-4 text-justify" dangerouslySetInnerHTML={{ __html: q.content }} />
                    <div className="space-y-2">
                       {q.answers.map((ans, i) => (
                         <div key={ans.id} className={`grid grid-cols-[30px_1fr] items-start text-[13px] ${showKeysInPrint && ans.isRight ? 'font-bold underline' : ''}`}>
                            <span>{String.fromCharCode(65 + i)}.</span>
                            <div dangerouslySetInnerHTML={{ __html: ans.content }} />
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default QuestionsHub;
