import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  User, 
  BookOpen, 
  Save, 
  ArrowLeft,
  ChevronLeft,
  HelpCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'exams' | 'students' | 'grading';

const GradingManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('exams');
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [essayQuestions, setEssayQuestions] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, { score: number; comment: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Exams on Mount
  useEffect(() => {
    const fetchExamsWithEssay = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/grading/exams`);
            const data = await res.json();
            setExams(data);
        } catch (err) {
            toast.error("Gagal memuat daftar ujian");
        } finally {
            setIsLoading(false);
        }
    };
    fetchExamsWithEssay();
  }, []);

  const handleSelectExam = async (exam: any) => {
    setIsLoading(true);
    setSelectedExam(exam);
    try {
        const res = await fetch(`${API_BASE_URL}/api/grading/exams/${exam.id}/students`);
        const data = await res.json();
        setStudents(data);
        setViewMode('students');
    } catch (err) {
        toast.error("Gagal memuat peserta");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectStudent = async (student: any) => {
    setIsLoading(true);
    setSelectedStudent(student);
    try {
        const res = await fetch(`${API_BASE_URL}/api/grading/exams/${selectedExam.id}/students/${student.id}/details`);
        const data = await res.json();
        setEssayQuestions(data.essayQuestions);
        
        // Initialize scores state
        const initialScores: any = {};
        data.essayQuestions.forEach((q: any) => {
            initialScores[q.id] = { score: q.currentScore, comment: q.comment };
        });
        setScores(initialScores);
        
        setViewMode('grading');
    } catch (err) {
        toast.error("Gagal memuat jawaban siswa");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveGrading = async () => {
    setIsSaving(true);
    try {
        const res = await fetch(`${API_BASE_URL}/api/grading/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                examId: selectedExam.id,
                userId: selectedStudent.id,
                scores
            })
        });
        const data = await res.json();
        if (data.success) {
            toast.success("Penilaian berhasil disimpan!");
            // Refresh student list for the updated score
            handleSelectExam(selectedExam);
        } else {
            toast.error(data.error || "Gagal menyimpan");
        }
    } catch (err) {
        toast.error("Gagal menghubungi server");
    } finally {
        setIsSaving(false);
    }
  };

  const calculateTotalInput = () => {
    return Object.values(scores).reduce((acc, curr) => acc + (Number(curr.score) || 0), 0).toFixed(2);
  };

  if (isLoading && viewMode === 'exams') {
      return (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data Essay...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-blue-600">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Koreksi Essay</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penilaian Jawaban Uraian</p>
          </div>
        </div>

        {viewMode !== 'exams' && (
          <button 
            onClick={() => setViewMode(viewMode === 'grading' ? 'students' : 'exams')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        )}
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <span className={viewMode === 'exams' ? 'text-blue-600' : ''}>Pilih Ujian</span>
        <ChevronRight className="w-3 h-3" />
        <span className={viewMode === 'students' ? 'text-blue-600' : ''}>Pilih Siswa</span>
        <ChevronRight className="w-3 h-3" />
        <span className={viewMode === 'grading' ? 'text-blue-600' : ''}>Penilaian</span>
      </div>

      {/* Content Rendering */}
      {viewMode === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <div 
              key={exam.id}
              onClick={() => handleSelectExam(exam)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-150 duration-500" />
              
              <div className="relative z-10">
                <div className="p-3 bg-blue-50 text-blue-600 w-fit rounded-2xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight">{exam.name}</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-6">{exam.subject} • {exam.date}</p>
                
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                   <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Jumlah Siswa</p>
                       <p className="text-lg font-black text-slate-800">{exam.totalStudents}</p>
                   </div>
                   <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            </div>
          ))}
          {exams.length === 0 && !isLoading && (
              <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Tidak ada ujian dengan soal essay yang tersedia</p>
              </div>
          )}
        </div>
      )}

      {viewMode === 'students' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedExam?.name}</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedExam?.subject}</p>
             </div>
             <div className="flex items-center gap-2 text-blue-600 font-black text-xs">
                {isLoading ? <Loader2 className="animate-spin" /> : <User className="w-4 h-4" />} {students.length} Peserta Terdeteksi
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 uppercase tracking-widest text-[10px] font-black text-slate-400">
                  <th className="px-8 py-5 text-center w-16">#</th>
                  <th className="px-6 py-5">Siswa</th>
                  <th className="px-6 py-5">Grup / Kelas</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-right font-black text-blue-600">Skor (Real-time)</th>
                  <th className="px-8 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4 text-[12px] font-black text-slate-300 text-center">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-black text-slate-700 uppercase">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[12px] font-bold text-slate-500 uppercase">{student.group}</td>
                    <td className="px-6 py-4 text-center">
                      {student.isGraded ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tight">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terkoreksi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-tight">
                          <Clock className="w-3.5 h-3.5" /> Menunggu
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[14px] font-black text-slate-800">{student.score.toFixed(2)}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <button 
                        onClick={() => handleSelectStudent(student)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95"
                      >
                        Koreksi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'grading' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Content (Questions) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30">
               <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{selectedStudent?.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedStudent?.username} • {selectedExam?.name}</p>
                  </div>
               </div>

               <div className="space-y-12">
                  {essayQuestions.map((q, qIdx) => (
                    <div key={q.id} className="relative pl-12">
                      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[12px] font-black shadow-lg">
                        {qIdx + 1}
                      </div>

                      <div className="space-y-6">
                        {/* Question */}
                        <div>
                           <label className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 block">Pertanyaan Soal</label>
                           <p className="text-[15px] font-bold text-slate-800 leading-relaxed">
                             {q.question}
                           </p>
                        </div>

                        {/* Student Answer */}
                        <div className="p-6 bg-blue-50/50 rounded-3xl border-2 border-dashed border-blue-200 relative">
                           <label className="absolute -top-3 left-6 px-3 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg h-6 flex items-center">Jawaban Siswa</label>
                           <p className="text-[14px] text-slate-700 leading-relaxed font-medium pt-2 whitespace-pre-wrap">
                             {q.studentAnswer || '(Siswa tidak memberikan jawaban)'}
                           </p>
                        </div>

                        {/* Key Answer (Reference) */}
                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100/50 shadow-sm">
                           <div className="flex items-center gap-2 mb-3">
                              <HelpCircle className="w-4 h-4 text-emerald-600" />
                              <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Kunci Jawaban / Kata Kunci</label>
                           </div>
                           <p className="text-[13px] text-emerald-800/80 leading-relaxed italic">
                             {q.keyAnswer}
                           </p>
                        </div>

                        {/* Scoring Field */}
                        <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                           <div className="flex-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Komentar / Feedback</label>
                              <textarea 
                                placeholder="Berikan catatan perbaikan..."
                                className="w-full h-24 p-4 border border-slate-200 rounded-2xl text-sm focus:border-blue-600 outline-none resize-none"
                                value={scores[q.id]?.comment || ''}
                                onChange={(e) => setScores(p => ({ ...p, [q.id]: { ...p[q.id], comment: e.target.value } }))}
                              />
                           </div>
                           <div className="w-full md:w-32">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1 text-center">Skor (Maks {q.maxScore})</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  max={q.maxScore}
                                  min={0}
                                  placeholder="0"
                                  className="w-full h-14 bg-white border-2 border-slate-200 rounded-2xl text-center font-black text-xl text-blue-600 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                  value={scores[q.id]?.score || 0}
                                  onChange={(e) => setScores(p => ({ ...p, [q.id]: { ...p[q.id], score: Number(e.target.value) } }))}
                                />
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Sidebar (Summary & Actions) */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
             <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/30 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 -mr-16 -mt-16 rounded-full blur-2xl" />
                
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-2">
                   <AlertCircle className="w-4 h-4" /> Ringkasan Penilaian
                </h3>

                <div className="space-y-6 mb-8 relative z-10">
                   <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Jumlah Soal Essay</span>
                      <span className="text-xl font-black">{essayQuestions.length} Soal</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Input Nilai Baru</span>
                      <span className="text-xl font-black text-amber-400">+{calculateTotalInput()}</span>
                   </div>
                </div>

                <div className="space-y-3 relative z-10">
                   <button 
                     onClick={handleSaveGrading}
                     disabled={isSaving}
                     className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-white hover:text-blue-900 transition-all transform active:scale-95 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Simpan Penilaian
                   </button>
                   <button 
                     onClick={() => setViewMode('students')}
                     className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                   >
                      <ChevronLeft className="w-4 h-4" /> Batal
                   </button>
                </div>
             </div>

             <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4 items-start">
                <div className="p-2 bg-amber-200 text-amber-700 rounded-xl">
                   <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-1">Tips Penilaian</h4>
                  <p className="text-[12px] text-amber-800/80 leading-relaxed font-medium text-justify">
                    Masukan skor sesuai dengan bobot soal. Jika jawaban siswa mendekati kata kunci, berikan poin proporsional. Klik **Simpan** untuk memperbarui nilai rapor siswa secara global.
                  </p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingManager;
