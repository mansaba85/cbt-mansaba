import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Search, 
  ChevronDown,
  ClipboardList,
  Calendar,
  Loader2,
  Table as TableIcon,
  Building2
} from 'lucide-react';

const AttendanceFormPage: React.FC = () => {
    const [institution, setInstitution] = useState<any>(null);
    const [logo, setLogo] = useState<string | null>(null);
    const [exams, setExams] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load: Exams, Groups, and Settings
    useEffect(() => {
        const fetchBaseData = async () => {
            setIsLoading(true);
            try {
                const [eRes, gRes, sRes] = await Promise.all([
                    fetch('http://localhost:3001/api/exams'),
                    fetch('http://localhost:3001/api/groups'),
                    fetch('http://localhost:3001/api/settings')
                ]);
                setExams(await eRes.json());
                setGroups(await gRes.json());
                
                const settings = await sRes.json();
                if (settings.cbt_institution_settings) setInstitution(settings.cbt_institution_settings);
                if (settings.cbt_logo_preview) setLogo(settings.cbt_logo_preview);
            } catch (err) {
                console.error("Gagal memuat data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBaseData();
    }, []);

    const handleFetchForm = async () => {
        if (!selectedExam || !selectedGroup) return;
        setIsFetching(true);
        try {
            const res = await fetch(`http://localhost:3001/api/users?groupId=${selectedGroup}`);
            setStudents(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetching(false);
        }
    };

    const handlePrint = () => window.print();

    const selectedExamData = exams.find(e => e.id === parseInt(selectedExam));
    const selectedGroupData = groups.find(g => g.id === parseInt(selectedGroup));

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <style>{`
                @media print {
                    @page { 
                        margin: 1.5cm;
                        size: A4;
                    }
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: block !important;
                    }
                    .no-print { display: none !important; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid black !important; padding: 8px !important; color: black !important; }
                    .signature-cell { height: 45px; position: relative; }
                    .signature-num { font-size: 10px; position: absolute; left: 4px; top: 4px; }
                }
            `}</style>

            {/* Header Screen Only */}
            <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Daftar Hadir Peserta</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cetak form absensi kehadiran ujian</p>
                    </div>
                </div>
                {students.length > 0 && (
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        <Printer className="w-4 h-4" /> Cetak Form
                    </button>
                )}
            </div>

            {/* Filter Panel Screen Only */}
            <div className="no-print bg-white border border-slate-200 p-6 rounded-[2rem] shadow-xl shadow-slate-200/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pilih Ujian</label>
                        <div className="relative">
                            <select 
                                value={selectedExam}
                                onChange={(e) => setSelectedExam(e.target.value)}
                                className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-600 appearance-none"
                            >
                                <option value="">-- Pilih Ujian --</option>
                                {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pilih Kelas</label>
                        <div className="relative">
                            <select 
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-600 appearance-none"
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={handleFetchForm}
                            disabled={!selectedExam || !selectedGroup || isFetching}
                            className="w-full h-12 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                        >
                            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Tampilkan
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Content Area */}
            <div className={`print-area ${students.length === 0 ? 'hidden' : 'block'}`}>
                {/* Header Formal Dinamis */}
                <div className="border-b-4 border-black pb-4 mb-6 flex items-center gap-6">
                    <div className="w-20 h-20 bg-white flex items-center justify-center rounded border-black border overflow-hidden shrink-0">
                        {logo ? (
                            <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                            <Building2 className="w-10 h-10 text-slate-200" />
                        )}
                    </div>
                    <div className="flex-1 text-center font-serif text-black pr-20">
                        <h1 className="text-lg font-bold uppercase leading-tight">YAYASAN / PEMERINTAH DAERAH</h1>
                        <h2 className="text-2xl font-black uppercase leading-tight">{institution?.name || 'SMK MA\'ARIF NU BANYUPUTIH'}</h2>
                        <p className="text-xs mt-1 font-bold">
                            {institution?.address1} {institution?.address2} {institution?.address3}
                        </p>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h3 className="text-lg font-bold uppercase underline decoration-2 underline-offset-4">DAFTAR HADIR PESERTA UJIAN</h3>
                    <p className="text-sm font-bold mt-2">TAHUN PELAJARAN 2026/2027</p>
                </div>

                {/* Identity Info */}
                <div className="grid grid-cols-[120px_max-content_1fr] md:grid-cols-[150px_max-content_1fr] gap-x-3 gap-y-1 mb-6 text-[13px] text-black font-semibold">
                    <span>Mata Pelajaran</span><span>:</span><span>{selectedExamData?.name || '-'}</span>
                    <span>Kelas / Group</span><span>:</span><span>{selectedGroupData?.name || '-'}</span>
                    <span>Hari / Tanggal</span><span>:</span><span>{selectedExamData ? new Date(selectedExamData.startTime).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
                    <span>Ruang</span><span>:</span><span className="border-b border-black border-dashed min-w-[200px]">.............................................................</span>
                </div>

                {/* Main Attendance Table */}
                <table className="w-full text-black">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="w-12 text-center text-xs font-bold py-3 uppercase">No</th>
                            <th className="w-32 text-center text-xs font-bold py-3 uppercase">No. Peserta</th>
                            <th className="text-left text-xs font-bold px-4 py-3 uppercase">Nama Lengkap Peserta</th>
                            <th className="w-64 text-center text-xs font-bold py-3 uppercase">Tanda Tangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, idx) => (
                            <tr key={student.id}>
                                <td className="text-center font-bold">{idx + 1}</td>
                                <td className="text-center font-mono font-bold">{student.username}</td>
                                <td className="px-4 font-bold uppercase text-sm">{student.fullName}</td>
                                <td className="signature-cell">
                                    <span className="signature-num">{idx + 1}.</span>
                                    <div className={`w-1/2 h-full flex items-center justify-center ${idx % 2 === 0 ? 'mr-auto' : 'ml-auto'}`}>
                                        <span className="text-[10px] text-slate-300"></span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer Signature */}
                <div className="mt-12 flex justify-between px-10 text-black">
                    <div className="text-center space-y-20">
                        <p className="text-sm font-bold">Pengawas 1,</p>
                        <p className="text-sm font-bold border-t border-black pt-1 min-w-[180px]">( ............................................ )</p>
                    </div>
                    <div className="text-center space-y-20">
                        <p className="text-sm font-bold">Pengawas 2,</p>
                        <p className="text-sm font-bold border-t border-black pt-1 min-w-[180px]">( ............................................ )</p>
                    </div>
                </div>
            </div>

            {/* Empty States */}
            {students.length === 0 && !isFetching && (
                <div className="no-print bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-32 text-center">
                    <TableIcon className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tighter">Form Absensi Masih Kosong</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium">Silakan tentukan Jadwal Ujian dan Kelas di atas untuk memuat daftar nama siswa.</p>
                </div>
            )}
        </div>
    );
};

export default AttendanceFormPage;
