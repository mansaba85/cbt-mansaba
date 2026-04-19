import { API_BASE_URL } from '../../../config/api';
import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle2, Loader2, Edit3, Plus, Trash2 } from 'lucide-react';
import { CKEditor } from 'ckeditor4-react';
import { toast } from 'sonner';

interface Answer {
  id?: number;
  content: string;
  isRight: boolean;
  weight: number;
}

interface Question {
  id: number;
  content: string;
  type: string;
  difficulty: number;
  answers: Answer[];
}

interface EditQuestionModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  subjectId?: number | null;
}

const FULL_TOOLBAR_CONFIG = {
  versionCheck: false,
  height: 250,
  toolbar: [
    { name: 'document', items: [ 'Source', '-', 'Save', 'NewPage', 'Preview', 'Print', '-', 'Templates' ] },
    { name: 'clipboard', items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
    { name: 'editing', items: [ 'Find', 'Replace', '-', 'SelectAll', '-', 'Scayt' ] },
    { name: 'forms', items: [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
    '/',
    { name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat' ] },
    { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language' ] },
    { name: 'links', items: [ 'Link', 'Unlink', 'Anchor' ] },
    { name: 'insert', items: [ 'Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe', 'Mathjax' ] },
    '/',
    { name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
    { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
    { name: 'tools', items: [ 'Maximize', 'ShowBlocks' ] },
  ]
};

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({ question, isOpen, onClose, onSave, subjectId }) => {
  const [editedContent, setEditedContent] = useState(question.content);
  const [editedDifficulty, setEditedDifficulty] = useState(question.difficulty);
  const [editedType, setEditedType] = useState(question.type);
  const [editedAnswers, setEditedAnswers] = useState<Answer[]>([...question.answers]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorLoaded, setIsEditorLoaded] = useState(true);

  useEffect(() => {
    setEditedContent(question.content);
    setEditedDifficulty(question.difficulty);
    setEditedType(question.type);
    setEditedAnswers([...question.answers]);
  }, [question]);

  if (!isOpen) return null;

  const handleToggleAnswer = (index: number) => {
    const newAnswers = [...editedAnswers];
    if (editedType === 'MCSA' || editedType === 'FIB') {
      newAnswers.forEach((ans, i) => {
        ans.isRight = (i === index);
        ans.weight = (i === index ? 100 : 0);
      });
    } else {
      newAnswers[index].isRight = !newAnswers[index].isRight;
      newAnswers[index].weight = newAnswers[index].isRight ? 100 : 0;
    }
    setEditedAnswers(newAnswers);
  };

  const handleUpdateAnswerText = (index: number, text: string) => {
    const newAnswers = [...editedAnswers];
    newAnswers[index].content = text;
    setEditedAnswers(newAnswers);
  };

  const addAnswerOption = () => {
    const newAnswers = [...editedAnswers, { content: '', isRight: false, weight: 0 }];
    setEditedAnswers(newAnswers);
  };

  const removeAnswerOption = (index: number) => {
    const newAnswers = editedAnswers.filter((_, i) => i !== index);
    setEditedAnswers(newAnswers);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const isNew = question.id === 0;
      const url = isNew ? `${API_BASE_URL}/api/questions` : `${API_BASE_URL}/api/questions/${question.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const body: any = { content: editedContent, type: editedType, difficulty: editedDifficulty, answers: editedAnswers };
      if (isNew) body.subjectId = subjectId;

      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const result = await response.json();
      if (result.success) { 
          toast.success("Butir soal berhasil disimpan");
          onSave(); 
          onClose(); 
      }
      else {
          toast.error("Gagal menyimpan: " + (result.error || "Server error"));
      }
    } catch (error) { 
        toast.error("Terjadi kesalahan koneksi server"); 
    } finally { 
        setIsSaving(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{question.id === 0 ? 'Tambah Soal' : 'Edit Soal'}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Panel Pengolahan Butir Soal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipe Pertanyaan</label>
                <select 
                  value={editedType} 
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setEditedType(nextType);
                    // Jika pindah ke FIB dan belum ada jawaban, tambahkan satu slot kosong sebagai kunci
                    if (nextType === 'FIB' && editedAnswers.length === 0) {
                      setEditedAnswers([{ content: '', isRight: true, weight: 100 }]);
                    }
                  }} 
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-offset-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MCSA">Pilihan Ganda (Single)</option>
                  <option value="MCMA">Pilihan Ganda (Jamak)</option>
                  <option value="FIB">Isian Singkat</option>
                  <option value="ESSAY">Uraian / Essay</option>
                  <option value="ORDERING">Mengurutkan</option>
                </select>
             </div>
             <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tingkat Kesulitan</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button key={lvl} onClick={() => setEditedDifficulty(lvl)} className={`flex-1 h-11 rounded-xl font-bold flex items-center justify-center transition-all ${editedDifficulty === lvl ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                      {lvl}
                    </button>
                  ))}
                </div>
             </div>
          </div>

          {/* QUESTION TEXT EDITOR */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Teks Soal</label>
               <button 
                onClick={() => setIsEditorLoaded(!isEditorLoaded)}
                className="bg-[#7c3aed] text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-95 transition-all"
               >
                 {isEditorLoaded ? 'UNLOAD EDITOR' : 'LOAD EDITOR'}
               </button>
            </div>
            
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {isEditorLoaded ? (
                <CKEditor 
                  initData={editedContent}
                  onChange={(evt) => setEditedContent(evt.editor.getData())}
                  config={FULL_TOOLBAR_CONFIG}
                />
              ) : (
                <textarea 
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[250px] p-6 text-sm font-mono border-none outline-none bg-slate-50"
                  placeholder="Masukkan teks soal atau kode HTML di sini..."
                />
              )}
            </div>
          </div>

          {/* ANSWERS LIST */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-100/50 p-4 rounded-2xl">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Opsi Jawaban</label>
               <button onClick={addAnswerOption} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700">
                 <Plus className="w-4 h-4" /> TAMBAH PILIHAN JAWABAN
               </button>
            </div>
            
            <div className="space-y-4">
              {editedAnswers.map((ans, idx) => (
                <div key={idx} className={`p-6 rounded-[2rem] border-2 transition-all ${ans.isRight ? 'border-green-500 bg-green-50/20' : 'border-slate-100 bg-white'}`}>
                  <div className="flex items-start gap-4">
                    <button onClick={() => handleToggleAnswer(idx)} className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl transition-all ${ans.isRight ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:text-green-500'}`}>
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Pilihan {String.fromCharCode(65 + idx)}</span>
                        <button onClick={() => removeAnswerOption(idx)} className="text-slate-200 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                      </div>
                      
                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        {isEditorLoaded ? (
                          <CKEditor 
                            key={`ans-${question.id}-${idx}`}
                            initData={ans.content}
                            onChange={(evt) => handleUpdateAnswerText(idx, evt.editor.getData())}
                            config={{ versionCheck: false, height: 100, toolbar: [['Bold', 'Italic', 'Underline', '-', 'Image', 'SpecialChar', 'Source']] }}
                          />
                        ) : (
                          <textarea 
                            value={ans.content}
                            onChange={(e) => handleUpdateAnswerText(idx, e.target.value)}
                            className="w-full h-[100px] p-4 text-xs font-mono border-none outline-none bg-slate-50"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 font-bold text-slate-400">Batalkan</button>
          <button 
            onClick={handleSaveChanges} 
            disabled={isSaving}
            className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            SIMPAN PERUBAHAN SOAL
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuestionModal;
