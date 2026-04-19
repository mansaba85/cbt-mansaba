import { API_BASE_URL } from '../../../config/api';
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ChevronRight, Download, ClipboardPaste, Zap, X, Info } from 'lucide-react';
import mammoth from 'mammoth';
import { CKEditor } from 'ckeditor4-react';

interface ParsedQuestion {
  question: string;
  options: { text: string; perc: number }[];
  answer: string;
  type: 'MCSA' | 'MCMA' | 'ESSAY' | 'MATCHING' | 'ORDERING' | 'FIB';
  difficulty: number;
  timer: number;
  autoNext: boolean;
  noRandom: boolean;
  maxSel: number;
  similarity: boolean;
  mcmaHeader: string[];
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const WordImportWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [importMethod, setImportMethod] = useState<'upload' | 'paste'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [targetModule, setTargetModule] = useState('Modul Default');
  const [targetTopic, setTargetTopic] = useState('Topik Default');
  const [step, setStep] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      addToast(`File ${e.target.files[0].name} terpilih`, 'info');
    }
  };

  const parseQuestionsFromHtml = (htmlContent: string) => {
    let content = htmlContent.replace(/&nbsp;|\u00A0/g, ' ');
    
    const tempDivForMeta = document.createElement('div');
    tempDivForMeta.innerHTML = content;
    const rawTextForMeta = tempDivForMeta.innerText;

    const moduleMatch = rawTextForMeta.match(/MODULE\s*:=\s*(.*)/i);
    const topicMatch = rawTextForMeta.match(/TOPIC\s*:=\s*(.*)/i);
    
    if (moduleMatch) setTargetModule(moduleMatch[1].trim());
    if (topicMatch) setTargetTopic(topicMatch[1].trim());

    const container = document.createElement('div');
    container.innerHTML = content;
    
    container.querySelectorAll('p').forEach(p => {
       if (p.querySelector('br')) {
          const shards = p.innerHTML.split(/<br\s*\/?>/i);
          if (shards.length > 1) {
             shards.forEach(shard => {
                const newP = document.createElement('p');
                newP.innerHTML = shard;
                p.parentElement?.insertBefore(newP, p);
             });
             p.remove();
          }
       }
    });

    const allElements = Array.from(container.querySelectorAll('li, p'));
    
    let isMatchingLocked = false;
    let lockStandby = false;
    let questionBlocks: string[] = [];
    let currentBlock = "";
    let currentQuestionNum = 0;
    let inInnerList = false;

    allElements.forEach((el: any) => {
      const text = el.innerText?.trim() || '';
      if (!text && !el.querySelector('img')) return;
      
      const isMetadata = /MODULE\s*:=|TOPIC\s*:=/i.test(text);
      const html = el.innerHTML;
      // Regex yang mendukung 1. , 1) , Q:1. , Q:1)
      const numMatch = text.match(/^\s*(?:Q\s*:?\s*)?(\d+)(?:[\.\)]|[:]\)?)\s*/i);
      const isListItem = el.tagName === 'LI';
      const listStyle = (el.parentElement?.getAttribute('type') || el.parentElement?.style.listStyleType || '').toLowerCase();
      const isAlphaList = listStyle.includes('a') || listStyle.includes('alpha') || listStyle.includes('latin');
      
      let isNumericList = false;
      const hasOptionsOrRight = /(^|[^a-zA-Z0-9])[a-eA-E][\.\:]\s+|RIGHT\s*:/i.test(currentBlock);
      if (hasOptionsOrRight) inInnerList = false; // Reset inner list status once options start

      if (numMatch) {
          const parsedNum = parseInt(numMatch[1], 10);
          const hasQ = /Q\s*:?/i.test(numMatch[0]);
          if (hasQ) {
              isNumericList = true;
          } else if (numMatch[0].includes(')')) {
              isNumericList = false;
              inInnerList = true;
          } else if (isMatchingLocked || lockStandby) {
              isNumericList = false;
          } else {
              if (parsedNum === 1 && currentQuestionNum > 0 && currentBlock.trim() !== '' && !hasOptionsOrRight) {
                  isNumericList = false;
                  inInnerList = true;
              } else if (inInnerList) {
                  isNumericList = false;
              } else if (parsedNum === currentQuestionNum + 1 || parsedNum > currentQuestionNum) {
                  isNumericList = true;
              } else if (parsedNum === 1 && (currentBlock.trim() === '' || hasOptionsOrRight)) {
                  isNumericList = true;
              }
          }
          if (isNumericList && parsedNum > 0) currentQuestionNum = parsedNum;
      } else if (isListItem && !isAlphaList) {
          const isNestedList = el.parentElement && el.parentElement.closest('li');
          if (!isNestedList && (currentBlock.trim() === '' || hasOptionsOrRight)) {
              isNumericList = true;
              currentQuestionNum++;
          }
      }

      let startNew = false;
      const hasMatchingTag = /\[\[MATCHING\]\]|\[\[JODOHKAN\]\]/i.test(text);

      if (hasMatchingTag) {
          startNew = true;
          lockStandby = true;
      } else if (!isMatchingLocked && isNumericList && !isMetadata) {
          // Hanya start new jika bukan bagian dari sub-numbering (isian soal menjodohkan)
          const isExplicitQ = /Q\s*:/i.test(text);
          const isSequential = (parseInt(numMatch![1], 10) === currentQuestionNum);
          
          if (isExplicitQ || isSequential || currentBlock.length === 0 || hasOptionsOrRight) {
            startNew = true;
          }
      }

      if (startNew && currentBlock.trim()) {
         questionBlocks.push(currentBlock);
         currentBlock = "";
         if (lockStandby) { isMatchingLocked = true; lockStandby = false; }
      }

      if (!isMetadata) {
          let processedHtml = html;
          if (isListItem) {
              const index = Array.from(el.parentElement?.children || []).indexOf(el);
              if (isAlphaList) {
                 const char = String.fromCharCode(65 + (index % 26));
                 if (!text.match(/^[A-Z][\.\)]/i)) processedHtml = `${char}. ` + html;
              } else if (isMatchingLocked) {
                 if (!text.match(/^(?:Q\s*:?\s*)?\d+[\.\)]/i)) processedHtml = `${index + 1}. ` + html;
              }
          }
          currentBlock += processedHtml + " <br/> ";
      }

      if (text.includes('RIGHT:')) {
        isMatchingLocked = false;
        lockStandby = false;
      }
    });
    if (currentBlock.trim()) questionBlocks.push(currentBlock);

    return questionBlocks.map(block => {
        const difficulty = block.match(/\[\[DIFFICULTY\s*-\s*(\d+)\]\]/i)?.[1];
        const timer = block.match(/\[\[QTIMER\s*-\s*(\d+)\]\]/i)?.[1];
        const isOrdering = /\[\[QTYPE\s*-\s*ORDERING\]\]/i.test(block) || /urutan|urutkan/i.test(block);
        const hasSubNumbers = /\d+\.\s+.*?/s.test(block.replace(/^\s*\d+[\.\)]/, '')); 
        const isMatching = /\[\[QTYPE\s*-\s*MATCHING\]\]/i.test(block) || /jodohkan|pasangkan|pasangan/i.test(block) || (hasSubNumbers && !isOrdering);
        
        const optionSplitRegex = /(^|[^a-zA-Z0-9])([a-eA-E])[\.\:\)]\s*[\)\s]*/g;
        let normalizedBlock = block.replace(optionSplitRegex, (match, prefix, char) => `${prefix} [[OPT_${char.toUpperCase()}]] `);
        const parts = normalizedBlock.split(/\[\[OPT_[A-Z]\]\]/);
        const hasOptions = parts.length > 1;
        const hasRightKey = /RIGHT\s*:\s*/i.test(block);

        const isEssay = !hasOptions && !hasRightKey && !isMatching;
        let questionContent = parts[0]
            .replace(/\[\[.*?\]\]/g, '')
            .replace(/^(\s*<[^>]+>)*\s*(?:Q\s*:?\s*)?\d+[\.\)]\s*/i, (match, tags) => tags || '')
            .trim();

        const rawOptions = parts.slice(1);
        let answer = "";
        if (rawOptions.length > 0) {
          const lastIdx = rawOptions.length - 1;
          const lastPart = rawOptions[lastIdx];
          if (/RIGHT\s*:/i.test(lastPart)) {
            const rightSplit = lastPart.split(/RIGHT\s*:/i);
            rawOptions[lastIdx] = rightSplit[0].trim();
            answer = rightSplit[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
          }
        }
        if (!answer && hasRightKey) {
            const globalMatch = block.match(/RIGHT\s*:\s*([^\s<]+)/i);
            if (globalMatch) answer = globalMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
        }

        const processedOptions = rawOptions.map(opt => ({
          text: opt.replace(/\[\[PERC=\d+\]\]/g, '').trim(),
          perc: opt.match(/\[\[PERC=(\d+)\]\]/)?.[1] ? parseInt(opt.match(/\[\[PERC=(\d+)\]\]/)?.[1] || "0") : 0
        }));

        let finalType: any = 'MCSA';
        const isSingleLetter = /^[A-E]$/i.test(answer);
        if (isEssay) finalType = 'ESSAY';
        else if (isOrdering) finalType = 'ORDERING';
        else if (isMatching && !isSingleLetter) finalType = 'MATCHING';
        else if (answer.includes(',')) finalType = 'MCMA';
        else if (processedOptions.length === 1) finalType = 'FIB';

        return {
          question: questionContent, options: processedOptions, answer, type: finalType,
          difficulty: difficulty ? parseInt(difficulty) : 1, timer: timer ? parseInt(timer) : 0,
          autoNext: /\[\[AUTONEXT\]\]/i.test(block), noRandom: /\[\[NO_RANDOM\]\]/i.test(block),
          maxSel: block.match(/\[\[MAX_SEL\s*=\s*(\d+)\]\]/i)?.[1] ? parseInt(block.match(/\[\[MAX_SEL\s*=\s*(\d+)\]\]/i)?.[1] || "1") : 1,
          similarity: /\[\[SIMILARITY_CORRECTION\]\]/i.test(block) || finalType === 'FIB',
          mcmaHeader: block.match(/\[\[MCMA_HEADER\s*:=\s*(.*?)\]\]/i)?.[1] ? (block.match(/\[\[MCMA_HEADER\s*:=\s*(.*?)\]\]/i)?.[1] || "").split(',') : [],
        };
    }).filter(q => q.question.replace(/<\/?[^>]+(>|$)/g, "").trim().length > 3 || q.question.includes('<img'));
  };

  const processImport = async () => {
    if (importMethod === 'upload' && !file) { addToast("Pilih file Word terlebih dahulu!", "error"); return; }
    if (importMethod === 'paste' && !pastedText) { addToast("Tempelkan teks soal terlebih dahulu!", "error"); return; }
    
    setIsProcessing(true);
    try {
      let content = "";
      if (importMethod === 'upload' && file) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer,
          convertImage: mammoth.images.inline((element) => element.read("base64").then((buf) => ({ src: "data:" + element.contentType + ";base64," + buf })))
        });
        content = result.value;
      } else {
        content = pastedText;
      }
      const parsed = parseQuestionsFromHtml(content);
      if (parsed.length === 0) {
          addToast("Tidak ada soal yang ditemukan. Cek format penomorannya.", "error");
      } else {
          setQuestions(parsed);
          setStep(2);
          addToast(`${parsed.length} soal berhasil diekstraksi!`, "success");
      }
    } catch (error) {
      addToast("Gagal memproses file. Pastikan format .docx benar.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToDatabase = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/import-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleName: targetModule, topicName: targetTopic, questions: questions })
      });
      const result = await response.json();
      if (result.success) {
          addToast("Semua soal berhasil disimpan ke Bank Soal!", "success");
          setTimeout(() => onComplete(), 1500);
      } else {
          addToast("Gagal menyimpan: " + result.error, "error");
      }
    } catch (error) {
      addToast("Kesalahan jaringan. Gagal menghubungi server.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
      {/* MODERN TOAST SYSTEM */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`
            pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border-l-4
            animate-in slide-in-from-right fade-in duration-300 min-w-[300px]
            ${t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400' : ''}
            ${t.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400' : ''}
            ${t.type === 'info' ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400' : ''}
          `}>
             <div className={`p-2 rounded-xl bg-white/50 dark:bg-slate-800/50`}>
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
             </div>
             <div className="flex-1">
                <p className="text-sm font-bold leading-tight">{t.message}</p>
             </div>
             <button onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
             </button>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50 border-b flex items-center justify-center gap-8">
        {[{ n: 1, l: 'Metode Impor' }, { n: 2, l: 'Review' }, { n: 3, l: 'Selesai' }].map((s) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.n ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{s.n}</div>
            <span className={`text-sm font-medium ${step >= s.n ? 'text-slate-900' : 'text-slate-400'}`}>{s.l}</span>
            {s.n < 3 && <ChevronRight className="w-4 h-4 text-slate-300 mx-2" />}
          </div>
        ))}
      </div>
      <div className="p-8">
        {step === 1 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex p-1 bg-slate-100 rounded-xl w-fit mx-auto">
               <button onClick={() => setImportMethod('upload')} className={`px-6 py-2 rounded-lg text-sm font-bold ${importMethod === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Unggah .docx</button>
               <button onClick={() => setImportMethod('paste')} className={`px-6 py-2 rounded-lg text-sm font-bold ${importMethod === 'paste' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Copy-Paste</button>
            </div>
            {importMethod === 'upload' ? (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-3xl p-12 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer text-center group transition-colors">
                <Upload className="w-16 h-16 bg-blue-100 rounded-2xl p-4 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold">Pilih File MS Word (.docx)</h3>
                <p className="text-slate-500 mt-2 text-sm italic">Gunakan [[MATCHING]] sebelum soal menjodohkan</p>
                {file && <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold w-fit mx-auto">{file.name}</div>}
                <input type="file" ref={fileInputRef} className="hidden" accept=".docx" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl shadow-sm bg-white min-h-[300px]">
                <div className="p-4 bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                  <ClipboardPaste className="w-3 h-3" /> Area Copy-Paste Dari MS Word
                </div>
                <CKEditor initData="" onChange={(evt: any) => setPastedText(evt.editor.getData())} config={{ versionCheck: false, height: 300, skin: 'moono-lisa' }} />
              </div>
            )}
            <button disabled={isProcessing} onClick={processImport} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all">
              {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : 'Mulai Ekstraksi Soal'}
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Review Hasil Impor</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                   <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-2">
                      <FileText className="w-3 h-3 text-slate-400" /> MODUL: <span className="text-blue-600">{targetModule}</span>
                   </div>
                   <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-amber-500" /> TOPIK: <span className="text-blue-600">{targetTopic}</span>
                   </div>
                   <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-2">
                       TOTAL: {questions.length} Butir
                   </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-slate-50"><ChevronRight className="w-4 h-4 rotate-180" /> Kembali</button>
                <button onClick={saveToDatabase} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all"><CheckCircle2 className="w-4 h-4" /> Simpan ke Bank Soal</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar focus:outline-none">
              {questions.map((q, idx) => (
                <div key={idx} className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                  <div className="absolute top-0 right-0 p-2 flex gap-1 items-center">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 tracking-wider font-mono">{q.type}</span>
                    {q.answer && <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-mono">KEY: {q.answer}</span>}
                  </div>
                  <div className="flex gap-4">
                    <span className="text-sm font-black text-slate-200">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question }} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => {
                          const char = String.fromCharCode(65 + oIdx);
                          const isCorrect = q.answer.split(',').map(a => a.trim()).includes(char);
                          return (
                            <div key={oIdx} className={`p-3 rounded-xl border text-xs flex gap-2 transition-all ${isCorrect ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                              <span className={`font-black ${isCorrect ? 'text-emerald-600' : 'text-slate-300'}`}>{char}: )</span>
                              <div className="flex-1 opacity-90 font-medium" dangerouslySetInnerHTML={{ __html: opt.text }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordImportWizard;
