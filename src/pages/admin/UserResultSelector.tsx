import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  ClipboardList, 
  User as UserIcon, 
  ArrowRight,
  Filter,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Download,
  Trophy
} from 'lucide-react';

const UserResultSelector: React.FC = () => {
    // --- Selection State ---
    const [exams, setExams] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedResultId, setSelectedResultId] = useState('');
    
    // --- Data State ---
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [reviewQuestions, setReviewQuestions] = useState<any[]>([]);
    
    // --- UI State ---
    const [isLoadingInitial, setIsLoadingInitial] = useState(false);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial load: Exams and Groups
    useEffect(() => {
        const fetchBaseData = async () => {
            setIsLoadingInitial(true);
            try {
                const [eRes, gRes] = await Promise.all([
                    fetch('http://localhost:3001/api/exams'),
                    fetch('http://localhost:3001/api/groups')
                ]);
                setExams(await eRes.json());
                setGroups(await gRes.json());
            } catch (err) {
                console.error("Gagal memuat data filter:", err);
            } finally {
                setIsLoadingInitial(false);
            }
        };
        fetchBaseData();
    }, []);

    // Fetch students based on exam and group
    useEffect(() => {
        if (!selectedExam) {
            setStudents([]);
            setSelectedResultId('');
            setStudentInfo(null);
            return;
        }

        const fetchStudents = async () => {
            setIsFetchingStudents(true);
            try {
                const params = new URLSearchParams();
                params.append('examId', selectedExam);
                if (selectedGroup) params.append('groupId', selectedGroup);
                
                const res = await fetch(`http://localhost:3001/api/results?${params.toString()}`);
                const data = await res.json();
                setStudents(data);
                if (!data.find((s: any) => s.id === parseInt(selectedResultId))) {
                    setSelectedResultId('');
                    setStudentInfo(null);
                }
            } catch (err) {
                console.error("Gagal memuat daftar siswa:", err);
            } finally {
                setIsFetchingStudents(false);
            }
        };
        fetchStudents();
    }, [selectedExam, selectedGroup]);

    // Fetch detail when student selection changes
    useEffect(() => {
        if (!selectedResultId) {
            setStudentInfo(null);
            setReviewQuestions([]);
            return;
        }

        const fetchDetail = async () => {
            setIsFetchingDetail(true);
            setError(null);
            try {
                const res = await fetch(`http://localhost:3001/api/results/${selectedResultId}/review`);
                const data = await res.json();
                if (data.info) {
                    setStudentInfo(data.info);
                    setReviewQuestions(data.reviews || []);
                } else {
                    setError(data.error || "Gagal memuat detail hasil");
                }
            } catch (err) {
                console.error("Gagal memuat detail:", err);
                setError("Kesalahan koneksi ke server");
            } finally {
                setIsFetchingDetail(false);
            }
        };
        fetchDetail();
    }, [selectedResultId]);

    const handlePrint = () => window.print();

    if (isLoadingInitial) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Menyiapkan Sistem...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {/* --- Filter Section --- */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 print:hidden">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                        <Filter className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cari Hasil Per User</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Filter ujian dan pilih peserta</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Exam Selection */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">1. Pilih Ujian</label>
                        <select 
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                        >
                            <option value="">-- Nama Ujian --</option>
                            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>

                    {/* Group Selection */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">2. Filter Kelas</label>
                        <select 
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                        >
                            <option value="">-- Semua Kelas --</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>

                    {/* Student Selection */}
                    <div className={`space-y-2 transition-opacity duration-300 ${!selectedExam ? 'opacity-30 pointer-events-none' : ''}`}>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">3. Pilih Nama Siswa</label>
                        <div className="relative">
                            <select 
                                value={selectedResultId}
                                onChange={(e) => setSelectedResultId(e.target.value)}
                                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-indigo-600 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none pr-10"
                            >
                                <option value="">{isFetchingStudents ? 'Memuat...' : '-- Nama Siswa --'}</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>[{s.username}] {s.fullName}</option>
                                ))}
                            </select>
                            {isFetchingStudents && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Results Display Section --- */}
            <div className="space-y-8 animate-in fade-in duration-500">
                {isFetchingDetail ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-20 flex flex-col items-center justify-center shadow-sm">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Mengambil Transkrip Jawaban...</p>
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-3xl p-12 text-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                        <h3 className="text-xl font-black text-rose-800 uppercase tracking-tight">{error}</h3>
                        <p className="text-sm text-rose-600 max-w-md mx-auto font-medium">Pastikan data pengerjaan siswa tersebut masih tersedia di database.</p>
                    </div>
                ) : studentInfo ? (
                    <div className="space-y-8">
                        {/* Summary Header Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden print:border-none print:shadow-none">
                            <div className="p-8 md:p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col md:row items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                                        <UserIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{studentInfo.name}</h2>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{studentInfo.username} • {studentInfo.testName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Skor Akhir</p>
                                    <p className="text-5xl font-black text-indigo-600 tracking-tighter leading-none">{studentInfo.points}</p>
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/50">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Benar</p>
                                    <p className="text-xl font-black text-emerald-700">{studentInfo.correct}</p>
                                </div>
                                <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100/50">
                                    <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1.5">Salah</p>
                                    <p className="text-xl font-black text-rose-700">{studentInfo.wrong}</p>
                                </div>
                                <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Waktu Test</p>
                                    <p className="text-xl font-black text-slate-700">{studentInfo.duration}</p>
                                </div>
                                <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100/50">
                                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">Tanggal</p>
                                    <p className="text-xl font-black text-indigo-700">{studentInfo.date}</p>
                                </div>
                            </div>

                            <div className="px-8 py-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
                                <div className="flex gap-4">
                                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-black transition-all">
                                        <Printer className="w-4 h-4" /> Cetak Hasil
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-black transition-all border border-slate-700">
                                        <Download className="w-4 h-4" /> Download PDF
                                    </button>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 italic">Dokumen digital resmi CBT System</p>
                            </div>
                        </div>

                        {/* Questions Review Section */}
                        <div className="space-y-6 mt-12">
                            <div className="flex items-center gap-2 mb-6 px-4">
                                <FileText className="w-5 h-5 text-slate-400" />
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Transkrip Jawaban Per Nomor</h3>
                            </div>

                            {reviewQuestions.map((q, qIdx) => (
                                <div key={q.id} className={`bg-white border-2 rounded-[2rem] overflow-hidden transition-all shadow-sm ${q.isCorrect ? 'border-emerald-100 shadow-emerald-100/20' : 'border-rose-100 shadow-rose-100/20'}`}>
                                    {/* Question Header */}
                                    <div className={`px-8 py-4 border-b-2 flex justify-between items-center ${q.isCorrect ? 'bg-emerald-50/30 border-emerald-50' : 'bg-rose-50/30 border-rose-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${q.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                                {qIdx + 1}
                                            </span>
                                            <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Nomor Soal</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl border-2 font-black text-[11px] ${q.isCorrect ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-rose-200 text-rose-700'}`}>
                                                POIN: {q.points}
                                            </div>
                                            {q.isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <XCircle className="w-6 h-6 text-rose-600" />}
                                        </div>
                                    </div>

                                    {/* Question Content */}
                                    <div className="p-8 space-y-8">
                                        <div className="text-base text-slate-800 font-bold leading-relaxed q-content-html" dangerouslySetInnerHTML={{ __html: q.question }} />

                                        {(q.type === 'multiple-choice' || q.type === 'mcma') ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                                {q.options?.map((opt: any) => {
                                                    const isStudentChoice = q.type === 'mcma' ? q.studentChoice?.includes(opt.key) : q.studentChoice === opt.key;
                                                    const isCorrectAnswer = q.type === 'mcma' ? q.correctChoices?.includes(opt.key) : q.correctChoice === opt.key;
                                                    
                                                    let bgClass = "bg-slate-50 border-slate-100 text-slate-400";
                                                    let icon = null;

                                                    if (isStudentChoice) {
                                                        const studentIsCorrect = q.type === 'mcma' ? isCorrectAnswer : q.isCorrect;
                                                        if (studentIsCorrect) {
                                                            bgClass = "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-lg shadow-emerald-100";
                                                            icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
                                                        } else {
                                                            bgClass = "bg-rose-50 border-rose-500 text-rose-900 shadow-lg shadow-rose-100";
                                                            icon = <XCircle className="w-4 h-4 text-rose-600" />;
                                                        }
                                                    } else if (isCorrectAnswer) {
                                                        bgClass = "bg-white border-emerald-500 border-dashed text-emerald-600 font-black";
                                                    }

                                                    return (
                                                        <div key={opt.key} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${bgClass}`}>
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${isStudentChoice ? 'bg-current/10' : 'bg-white text-slate-300'}`}>
                                                                {opt.key}
                                                            </div>
                                                            <div className="flex-1 text-[13px] font-bold q-content-html" dangerouslySetInnerHTML={{ __html: opt.text }} />
                                                            {isCorrectAnswer && <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-1 rounded shadow-sm shrink-0 uppercase tracking-widest">Kunci</span>}
                                                            {icon}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (q.type === 'ordering' || q.type === 'matching') ? (
                                            <div className="mt-4 overflow-hidden border-2 border-slate-100 rounded-[2rem] shadow-sm">
                                               <table className="w-full text-left border-collapse bg-white">
                                                  <thead>
                                                     <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-100">
                                                        <th className="px-6 py-4">Opsi Pilihan</th>
                                                        <th className="px-6 py-4 text-center">Jawaban Siswa</th>
                                                        <th className="px-6 py-4 text-center">Kunci Benar</th>
                                                        <th className="px-6 py-4 text-center">Status</th>
                                                     </tr>
                                                  </thead>
                                                  <tbody className="divide-y-2 divide-slate-50">
                                                     {q.options?.map((opt: any) => {
                                                        const sAns = q.studentChoice?.[opt.key] || '-';
                                                        const cAns = opt.correctVal;
                                                        const isItemCorrect = sAns.toString() === cAns.toString();
                                                        return (
                                                           <tr key={opt.key} className="hover:bg-slate-50/50 transition-colors">
                                                              <td className="px-6 py-4 flex items-center gap-4">
                                                                 <span className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl text-[11px] font-black shadow-sm">{opt.key}</span>
                                                                 <div className="text-sm font-bold text-slate-700 q-content-html" dangerouslySetInnerHTML={{ __html: opt.text }} />
                                                              </td>
                                                              <td className="px-6 py-4 text-center font-mono text-sm font-black text-indigo-600 bg-indigo-50/10 rounded-xl">{sAns}</td>
                                                              <td className="px-6 py-4 text-center font-mono text-sm font-black text-emerald-600 bg-emerald-50/10 rounded-xl">{cAns}</td>
                                                              <td className="px-6 py-4 text-center">
                                                                 {isItemCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" /> : <XCircle className="w-6 h-6 text-rose-500 mx-auto" />}
                                                              </td>
                                                           </tr>
                                                        );
                                                     })}
                                                  </tbody>
                                               </table>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 rounded-[2rem] border-2 border-slate-100 p-8 space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jawaban Yang Diketik Siswa:</p>
                                                </div>
                                                <p className="text-sm text-slate-800 font-bold italic leading-relaxed">"{typeof q.studentChoice === 'object' ? JSON.stringify(q.studentChoice) : (q.studentChoice || 'Tidak dijawab')}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Final Footer Decor */}
                            <div className="mt-20 p-12 bg-slate-900 rounded-[3rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce duration-[3000ms]" />
                                <div className="space-y-2 relative z-10">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Laporan Terverifikasi</h3>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto font-medium leading-relaxed">
                                        Data di atas adalah hasil valid dari pengerjaan {studentInfo.name}. Semua jawaban telah dicocokkan dengan kunci jawaban sistem.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Initial Empty State */
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
                        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8">
                            <UserIcon className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tight mb-2">Belum Ada Peserta Dipilih</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium">Silakan pilih ujian dan kelas terlebih dahulu untuk melihat hasil pengerjaan siswa.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserResultSelector;
