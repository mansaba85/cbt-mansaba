import { API_BASE_URL } from '../../config/api';
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
                    fetch(`${API_BASE_URL}/api/exams`),
                    fetch(`${API_BASE_URL}/api/groups`),
                    fetch(`${API_BASE_URL}/api/settings`)
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
            const res = await fetch(`${API_BASE_URL}/api/users?groupId=${selectedGroup}`);
            setStudents(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetching(false);
        }
    };

    const handlePrint = () => {
        const examData = exams.find(e => e.id === parseInt(selectedExam));
        const groupData = groups.find(g => g.id === parseInt(selectedGroup));

        const html = `
          <div class="header">
            ${logo ? `<img src="${logo}" alt="Logo" />` : '<div class="header-spacer"></div>'}
            <div class="header-text">
                <h1>${institution?.name || 'INSTITUSI PENDIDIKAN'}</h1>
                <p>${institution?.address1 || ''} ${institution?.address2 || ''}</p>
                <p style="font-style: italic; font-size: 8px;">${institution?.address3 || ''}</p>
            </div>
            <div class="header-spacer"></div>
          </div>

          <div class="title-area">
            <h2>DAFTAR HADIR PESERTA UJIAN</h2>
            <p style="font-size: 11px; font-weight: bold; margin-top: 5px;">TAHUN PELAJARAN 2026/2027</p>
          </div>

          <div style="display: grid; grid-template-columns: 150px 10px 1fr; gap: 5px; margin-bottom: 25px; font-weight: bold; border: 1px solid #eee; padding: 15px; border-radius: 8px;">
            <span>Mata Pelajaran</span><span>:</span><span class="uppercase">${examData?.name || '-'}</span>
            <span>Kelas / Group</span><span>:</span><span class="uppercase">${groupData?.name || '-'}</span>
            <span>Hari / Tanggal</span><span>:</span><span>${examData ? new Date(examData.startTime).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
            <span>Ruang / Sesi</span><span>:</span><span style="border-bottom: 1px dashed #000; width: 250px;"> .....................................................</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px" class="text-center">No</th>
                <th style="width: 140px" class="text-center">No. Peserta</th>
                <th>Nama Lengkap Peserta</th>
                <th style="width: 300px" class="text-center">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((student, idx) => `
                <tr>
                  <td class="text-center font-bold">${idx + 1}</td>
                  <td class="text-center font-bold" style="font-family: monospace">${student.username}</td>
                  <td class="uppercase font-bold">${student.fullName}</td>
                  <td style="height: 50px; position: relative;">
                    <span style="font-size: 10px; position: absolute; left: 8px; top: 8px; font-weight: bold;">${idx + 1}.</span>
                    <div style="width: 50%; height: 100%; ${idx % 2 === 0 ? 'margin-right: auto' : 'margin-left: auto'}; border-bottom: 1px dotted #ccc;"></div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer-sign" style="display: flex; justify-content: space-around; margin-top: 60px;">
            <div class="sign-box">
              <p>Pengawas 1,</p>
              <div class="sign-space"></div>
              <div class="sign-line" style="width: 220px; border-bottom: 1.5px solid #000; margin: 0 auto;"></div>
              <p style="font-size: 9px; margin-top: 5px;">NIP. ..............................</p>
            </div>
            <div class="sign-box">
              <p>Pengawas 2,</p>
              <div class="sign-space"></div>
              <div class="sign-line" style="width: 220px; border-bottom: 1.5px solid #000; margin: 0 auto;"></div>
              <p style="font-size: 9px; margin-top: 5px;">NIP. ..............................</p>
            </div>
          </div>
        `;

        import('../../utils/printReport').then(m => {
            m.printReport(`Daftar_Hadir_${groupData?.name || 'Siswa'}`, html);
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Menyiapkan Absensi...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
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
