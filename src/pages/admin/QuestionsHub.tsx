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
  const [institution, setInstitution] = useState<any>(null);
  const [logo, setLogo] = useState<string | null>(null);

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

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/settings');
      const data = await res.json();
      if (data.cbt_institution_settings) setInstitution(data.cbt_institution_settings);
      if (data.cbt_logo_preview) setLogo(data.cbt_logo_preview);
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

  useEffect(() => { 
    fetchModules(); 
    fetchSettings();
  }, []);

  useEffect(() => { 
    if (viewMode === 'list') fetchModules(); 
  }, [viewMode]);

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
    const topicName = topics.find(t => t.id === selectedTopicId)?.name || 'Semua';
    
    // Generate Answer Key List for the bottom
    const keyListHtml = questions.map((q, idx) => {
      const correctIdx = q.answers.findIndex((a: any) => a.isRight);
      const letter = correctIdx !== -1 ? String.fromCharCode(65 + correctIdx) : '?';
      return `<div style="display: flex; gap: 4px; font-weight: bold;"><span>${idx + 1}.</span><span>${letter}</span></div>`;
    }).join('');

    const html = `
      <div class="header">
        ${logo ? `<img src="${logo}" alt="Logo" />` : '<div class="header-spacer"></div>'}
        <div class="header-text">
            <h1>${institution?.name || 'DAFTAR BANK SOAL'}</h1>
            <p>${institution?.address1 || ''} ${institution?.address2 || ''}</p>
            <p style="font-style: italic; font-size: 8px;">${institution?.address3 || ''}</p>
        </div>
        <div class="header-spacer"></div>
      </div>

      <div class="title-area">
        <h2>DAFTAR BUTIR SOAL PEMBAHASAN</h2>
        <p style="font-size: 10px; font-weight: bold; margin-top: 5px; color: #666;">
          DOKUMEN BANK SOAL
        </p>
      </div>

      <div class="meta-grid">
        <div>
          <p>Modul Utama: ${selectedModule?.name || '-'}</p>
          <p>Topik / Mapel: ${topicName}</p>
        </div>
        <div class="meta-right">
          <p>Total Soal: ${questions.length} Butir</p>
          <p>Tanggal Cetak: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div style="font-family: 'Times New Roman', Times, serif; font-size: 13px; line-height: 1.6; color: #000;">
        ${questions.map((q, idx) => `
          <div style="margin-bottom: 25px; border-bottom: 1px dotted #ccc; padding-bottom: 15px; page-break-inside: avoid;">
            <div style="display: flex; gap: 10px;">
              <span style="font-weight: bold; width: 25px; shrink: 0;">${idx + 1}.</span>
              <div style="flex: 1;">
                 <div style="margin-bottom: 12px;">${q.content}</div>
                 <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 30px;">
                    ${q.answers.map((ans: any, i: number) => `
                      <div style="display: flex; gap: 8px; align-items: flex-start;">
                        <span style="font-weight: bold;">${String.fromCharCode(65 + i)}.</span>
                        <div style="flex: 1;">${ans.content}</div>
                      </div>
                    `).join('')}
                 </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      ${withKeys ? `
        <div style="margin-top: 40px; page-break-before: always; border: 2px solid #000; padding: 20px;">
          <h3 style="text-align: center; text-transform: uppercase; margin-top: 0; text-decoration: underline;">KUNCI JAWABAN</h3>
          <p style="text-align: center; font-size: 10px; margin-bottom: 20px;">Topik: ${topicName} | Total: ${questions.length} Soal</p>
          
          <div style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 15px 5px; font-size: 12px; font-family: monospace;">
            ${keyListHtml}
          </div>
        </div>
      ` : ''}

      <div class="footer-sign" style="margin-top: 40px;">
        <div class="sign-box">
          <p>Dicetak Oleh,</p>
          <p>Admin CBT System</p>
          <div class="sign-space" style="height: 55px;"></div>
          <div class="sign-line"></div>
          <p style="font-size: 8px; margin-top: 5px; font-style: italic;">Dokumen ini dihasilkan secara otomatis pada ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>
    `;

    import('../../utils/printReport').then(m => {
        m.printReport(`Bank_Soal_${topicName}`, html);
    });
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
    <>
      {/* --- SCREEN ONLY UI --- */}
      <div className="no-print bg-[#f8fafc] min-h-screen p-4 space-y-4 relative text-slate-900">
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

        {/* Top Filter Bar */}
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

        {/* List Content */}
        <div className="space-y-4">
          {isLoading && <div className="text-center py-20 animate-pulse text-slate-400 font-black text-xs uppercase tracking-widest">Memuat Bank Soal...</div>}
          {!isLoading && questions
            .filter(q => q.content.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((q, idx) => (
            <div key={q.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex shadow-sm hover:shadow-md transition-shadow">
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
                  <div className={`border rounded px-1 py-1.5 text-center shadow-sm ${q.type === 'FIB' ? 'border-amber-200 bg-amber-50' : q.type === 'ESSAY' ? 'border-indigo-200 bg-indigo-50' : 'border-blue-200 bg-blue-50/30'}`}>
                    <span className={`text-[8px] font-black uppercase block leading-tight ${q.type === 'FIB' ? 'text-amber-600' : q.type === 'ESSAY' ? 'text-indigo-600' : 'text-blue-600'}`}>
                      {q.type === 'MCSA' && 'Pilihan Ganda'}
                      {q.type === 'MCMA' && 'PG Jamak'}
                      {q.type === 'FIB' && 'Isian Singkat'}
                      {q.type === 'ESSAY' && 'Uraian / Essay'}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleEditClick(q)} className="mt-2 w-full py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 flex items-center justify-center gap-1 uppercase transition-all">
                  <Edit3 className="w-3 h-3" /> EDIT
                </button>
              </div>
              <div className="flex-1 p-6 space-y-5">
                <div className="question-content-preview text-[13px] text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: q.content }} />
                {!hideOptions && (
                  <div className="space-y-1.5">
                    {q.answers.map((ans: any, i: number) => (
                      <div key={ans.id} onClick={() => handleQuickSetRightAnswer(q.id, ans.id)} className={`group flex items-center rounded-xl border transition-all cursor-pointer ${ans.isRight ? 'bg-green-50 border-green-300' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                        <div className={`w-9 h-9 flex items-center justify-center shrink-0 border-r ${ans.isRight ? 'border-green-200' : 'border-slate-50'}`}>
                          <span className={`w-5 h-5 flex items-center justify-center rounded border text-[10px] font-black ${ans.isRight ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>{String.fromCharCode(65 + i)}</span>
                        </div>
                        <div className="flex-1 px-4 text-[13px] font-medium text-slate-700 py-2" dangerouslySetInnerHTML={{ __html: ans.content }} />
                        <div className="flex items-center gap-3 pr-4">
                            <span className={`text-[11px] font-black ${ans.isRight ? 'text-green-600' : 'text-slate-300'}`}>{ans.isRight ? '100%' : '0%'}</span>
                            <CheckCircle2 className={`w-4 h-4 ${ans.isRight ? 'text-green-600' : 'text-slate-200'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Export Section */}
        <div className="bg-white rounded-3xl border border-slate-200 mt-10 p-6 shadow-sm overflow-hidden">
          <div className="mb-6 flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">EXPORT BANK SOAL</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <button onClick={() => handlePrint(false)} className="md:col-span-2 px-4 py-3 bg-[#1e293b] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
              <Printer className="w-4 h-4" /> Cetak Print / PDF
            </button>
            <button onClick={() => handlePrint(true)} className="md:col-span-3 px-4 py-3 bg-[#334155] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
              <Printer className="w-4 h-4" /> Cetak Print / PDF + Kunci Jawaban
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuestionsHub;
