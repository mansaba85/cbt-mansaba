import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Trophy,
  Printer,
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import React from 'react';

const UserResultDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = React.useState<any>(null);
  const [reviewQuestions, setReviewQuestions] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/results/${id}/review`);
        const data = await res.json();
        if (data.info) {
          setStudentInfo(data.info);
          setReviewQuestions(data.reviews || []);
        } else {
          setError(data.error || "Data tidak ditemukan");
        }
      } catch (err) {
        console.error("Gagal mengambil data review:", err);
        setError("Gagal menghubungi server");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Memuat Detail Hasil...</p>
      </div>
    );
  }

  if (error || !studentInfo) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-800 uppercase mb-4">{error || "Data Tidak Ditemukan"}</h2>
          <button onClick={() => navigate('/admin/exams/results')} className="px-6 py-2 bg-slate-900 text-white rounded">Kembali ke Daftar Hasil</button>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin/exams/results')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Hasil
        </button>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded text-xs font-bold hover:bg-slate-50">
              <Printer className="w-4 h-4" /> Cetak Hasil
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">
              <Download className="w-4 h-4" /> Download PDF
           </button>
        </div>
      </div>

      {/* Student & Detailed Stats Header */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
         <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <User className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-slate-900">{studentInfo.name}</h2>
                  <p className="text-sm text-slate-500 font-medium">{studentInfo.username} • {studentInfo.testName}</p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Skor Akhir</p>
               <p className="text-3xl font-black text-indigo-600 leading-tight">{studentInfo.points}</p>
            </div>
         </div>

         <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 max-w-4xl mx-auto">
            {/* Left Column: Timing */}
            <div className="space-y-1.5">
               <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-xs font-medium text-slate-500">Waktu Mulai</span>
                  <div className="flex gap-1.5 items-center">
                    <span className="px-2 py-0.5 bg-emerald-500 text-white rounded font-mono text-[10px] font-bold">{studentInfo.startTime}</span>
                  </div>
               </div>
               <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-xs font-medium text-slate-500">Waktu Selesai</span>
                  <span className="px-2 py-0.5 bg-rose-500 text-white rounded font-mono text-[10px] font-bold">{studentInfo.endTime}</span>
               </div>
               <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-xs font-medium text-slate-500">Waktu Test</span>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-mono text-[10px] font-bold">{studentInfo.duration}</span>
               </div>
               <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-slate-500">Poin Keseluruhan</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-white rounded font-bold text-[10px]">{studentInfo.points}</span>
               </div>
            </div>

            {/* Right Column: Counts */}
            <div className="space-y-1.5">
               <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-xs font-medium text-slate-500">Jawaban Benar</span>
                  <span className="px-2 py-0.5 bg-emerald-500 text-white rounded font-bold text-[10px] w-24 text-center">{studentInfo.correct}</span>
               </div>
               <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-xs font-medium text-slate-600">Jawaban Salah</span>
                  <span className="px-2 py-0.5 bg-rose-500 text-white rounded font-bold text-[10px] w-24 text-center">{studentInfo.wrong}</span>
               </div>
               <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-slate-500">Tidak Dijawab</span>
                  <span className="px-2 py-0.5 bg-slate-500 text-white rounded font-bold text-[10px] w-24 text-center">{studentInfo.unanswered}</span>
               </div>
            </div>
         </div>
         
         <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Komentar:</span>
            <span className="text-xs text-slate-600 font-medium italic">{studentInfo.comment === '-' ? 'Tidak ada komentar khusus' : studentInfo.comment}</span>
         </div>
      </div>

      {/* Review Questions List */}
      <div className="space-y-6 mt-8">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Review Jawaban Siswa</h3>
           </div>
           <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                 <span className="text-xs font-bold text-slate-500">Benar</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                 <span className="text-xs font-bold text-slate-500">Salah</span>
              </div>
           </div>
        </div>

        {reviewQuestions.map((q, qIdx) => (
          <div key={q.id} className={`bg-white border rounded-lg overflow-hidden ${q.isCorrect ? 'border-emerald-100' : 'border-rose-100'}`}>
            <div className={`px-6 py-3 border-b flex justify-between items-center ${q.isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
               <span className="text-sm font-bold text-slate-700">Soal Nomor {qIdx + 1}</span>
               <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${q.isCorrect ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                    {q.points} Poin
                  </span>
                  {q.isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
               </div>
            </div>

            <div className="p-6 space-y-4">
               <div className="text-base text-slate-800 font-medium leading-relaxed q-content-html" dangerouslySetInnerHTML={{ __html: q.question }} />
               {(q.type === 'multiple-choice' || q.type === 'mcma') ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                     {q.options.map((opt: any) => {
                       const isStudentChoice = q.type === 'mcma' ? q.studentChoice?.includes(opt.key) : q.studentChoice === opt.key;
                       const isCorrectAnswer = q.type === 'mcma' ? q.correctChoices?.includes(opt.key) : q.correctChoice === opt.key;
                       
                       let bgClass = "bg-white border-slate-200 text-slate-700";
                       let icon = null;

                       if (isStudentChoice) {
                         const studentIsCorrect = q.type === 'mcma' ? isCorrectAnswer : q.isCorrect;
                         if (studentIsCorrect) {
                           bgClass = "bg-emerald-50 border-emerald-500 shadow-sm text-emerald-900 font-bold";
                           icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
                         } else {
                           bgClass = "bg-rose-50 border-rose-500 shadow-sm text-rose-900 font-bold";
                           icon = <XCircle className="w-4 h-4 text-rose-600" />;
                         }
                       } else if (isCorrectAnswer) {
                         bgClass = "bg-emerald-50 border-emerald-200 border-dashed text-emerald-700 font-bold";
                       }

                       return (
                        <div key={opt.key} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${bgClass}`}>
                           <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isStudentChoice ? 'bg-current/10' : 'bg-slate-100 text-slate-500'}`}>
                               {opt.key}
                           </span>
                           <div className="flex-1 text-sm q-content-html" dangerouslySetInnerHTML={{ __html: opt.text }} />
                           {isCorrectAnswer && <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded shadow-sm shrink-0 uppercase tracking-widest mr-1">Kunci</span>}
                           {icon}
                        </div>
                       );
                    })}
                 </div>
               ) : (q.type === 'ordering' || q.type === 'matching') ? (
                  <div className="mt-4 overflow-hidden border border-slate-100 rounded-xl shadow-sm">
                     <table className="w-full text-left border-collapse bg-white">
                        <thead>
                           <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                              <th className="px-4 py-3">Opsi Pilihan</th>
                              <th className="px-4 py-3 text-center">Jawaban Siswa</th>
                              <th className="px-4 py-3 text-center">Kunci Benar</th>
                              <th className="px-4 py-3 text-center">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {q.options?.map((opt: any) => {
                              const sAns = q.studentChoice?.[opt.key] || '-';
                              const cAns = opt.correctVal;
                              const isItemCorrect = sAns.toString() === cAns.toString();
                              return (
                                 <tr key={opt.key} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 flex items-center gap-3">
                                       <span className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-500 rounded text-[10px] font-black">{opt.key}</span>
                                       <div className="text-xs font-bold text-slate-700 q-content-html" dangerouslySetInnerHTML={{ __html: opt.text }} />
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono text-xs font-black text-indigo-600 bg-indigo-50/20">{sAns}</td>
                                    <td className="px-4 py-3 text-center font-mono text-xs font-black text-emerald-600 bg-emerald-50/20">{cAns}</td>
                                    <td className="px-4 py-3 text-center">
                                       {isItemCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-rose-500 mx-auto" />}
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               ) : (
                 <div className="space-y-4 mt-2">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                       <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Jawaban Siswa (Lainnya):</p>
                       <p className="text-sm text-slate-800 leading-relaxed italic">"{typeof q.studentChoice === 'object' ? JSON.stringify(q.studentChoice) : (q.studentChoice || 'Tidak dijawab')}"</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        ))}

        {/* Finish Summary */}
        <div className="mt-12 p-8 bg-slate-900 text-white rounded-lg text-center space-y-4 shadow-2xl">
           <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce duration-[2000ms]" />
           <h3 className="text-xl font-bold">Ulasan Selesai</h3>
           <p className="text-slate-400 text-sm max-w-md mx-auto">
              Seluruh soal telah ditinjau. Hasil ini mencerminkan performa nyata dari siswa {studentInfo.name} pada materi {studentInfo.testName}.
           </p>
           <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
           >
              Kembali Ke Atas
           </button>
        </div>
      </div>
    </div>
  );
};

export default UserResultDetail;
