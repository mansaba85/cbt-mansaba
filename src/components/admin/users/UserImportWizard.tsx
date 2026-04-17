import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Users, 
  Trash2,
  Table as TableIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface RawUserData {
  username: string;
  password?: string;
  nama: string;
  level_user?: string | number;
  madrasah?: string;
  kelas?: string;
  peminatan?: string;
  grup?: string;
  keterangan?: string;
  status?: 'pending' | 'success' | 'error';
  message?: string;
}

const UserImportWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [data, setData] = useState<RawUserData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. Function to create Template Excel ---
  const downloadTemplate = () => {
    const headers = [
      ['username', 'password', 'nama', 'level_user', 'madrasah', 'kelas', 'peminatan', 'keterangan'],
      ['siswa01', 'password123', 'Budi Santoso', '1', 'MA NU 01 Banyuputih', '12.1', 'Biologi, Kimia', 'Siswa Baru'],
      ['siswa02', 'password123', 'Siti Aminah', '1', 'MA NU 01 Banyuputih', '12.1', 'Ekonomi, Geografi', 'Siswa Baru'],
      ['admin03', 'admin789', 'Lutfi Admin', '10', 'PUSAT', 'ADMIN', '', 'Administrator Utama']
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Template_Peserta");
    XLSX.writeFile(wb, "Template_User_CBT_Modern.xlsx");
  };

  // --- 2. Function to parse uploaded file ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json: any[] = XLSX.utils.sheet_to_json(ws);

      const mappedData: RawUserData[] = json.map(row => ({
        username: String(row.username || row.USERNAME || ''),
        password: String(row.password || row.PASSWORD || '123456'), 
        nama: String(row.nama || row.NAMA || row.fullName || ''),
        level_user: row.level_user || row.LEVEL || '1',
        madrasah: String(row.madrasah || row.MADRASAH || row.sekolah || ''),
        kelas: String(row.kelas || row.KELAS || row.rombel || ''),
        peminatan: String(row.peminatan || row.PEMINATAN || row.mapel || ''),
        grup: String(row.grup || row.GRUP || row.group || ''),
        keterangan: String(row.keterangan || row.KETERANGAN || row.notes || ''),
        status: 'pending'
      })).filter(u => u.username.trim() !== '');

      setData(mappedData);
      setIsProcessing(false);
      setStep(2);
    };
    reader.readAsBinaryString(file);
  };

  // --- 3. Function to save to DB ---
  const saveToDatabase = async () => {
    if (data.length === 0) return;
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:3001/api/users/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: data })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Berhasil mengimpor ${data.length} data.`);
        setStep(3);
      } else {
        toast.error("Gagal mengimpor data: " + result.error);
      }
    } catch (err) {
      toast.error("Kesalahan koneksi ke server");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Header Wizard */}
      <div className="bg-slate-900 px-8 py-10 text-white flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/20">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Wisaya Impor Pengguna</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
               Multi-Group Engine v2.0
            </p>
          </div>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-4 relative z-10">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border-2 transition-all ${step === s ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/40 text-white scale-110' : (step > s ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-800 text-slate-600')}`}>
              {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-3xl font-black text-slate-800 leading-tight">Impor Berbasis<br/><span className="text-blue-600">3 Kategori Grup</span></h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Gunakan format kolom <span className="font-bold text-slate-800">madrasah</span>, <span className="font-bold text-slate-800">kelas</span>, dan <span className="font-bold text-slate-800">peminatan</span> (untuk mapel pilihan). Sistem akan otomatis membagi siswa ke grup yang tepat.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                     <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                     <p className="text-[11px] font-bold text-indigo-700 leading-tight">
                        Pastikan kolom madrasah, kelas, dan peminatan sesuai dengan aturan multi-grup sistem.
                     </p>
                  </div>
                  <button 
                    onClick={downloadTemplate}
                    className="flex items-center justify-center gap-2 w-fit px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" /> UNDUH TEMPLATE EXCEL
                  </button>
                </div>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-indigo-100 bg-indigo-50/20 rounded-[2.5rem] p-16 flex flex-col items-center justify-center gap-6 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group shadow-inner"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-indigo-50">
                  {isProcessing ? <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" /> : <FileUp className="w-12 h-12 text-indigo-500" />}
                </div>
                <div className="text-center">
                   <p className="text-xl font-black text-slate-800 tracking-tight">UNGGAH FILE DATA</p>
                   <p className="text-sm text-slate-500 font-bold mt-1">Klik atau seret file Excel ke sini</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Pratinjau Data Impor</h3>
                <p className="text-sm text-slate-500">Ditemukan <span className="font-bold text-blue-600">{data.length}</span> baris calon pengguna.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 uppercase tracking-widest">BATAL</button>
                <button 
                  onClick={saveToDatabase}
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 uppercase tracking-widest"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  PROSES IMPOR
                </button>
              </div>
            </div>

            <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase">Username</th>
                    <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase">Nama Lengkap</th>
                    <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase">Madrasah</th>
                    <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase text-center">Kelas</th>
                    <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase">Peminatan</th>
                    <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase text-right">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 italic">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-800">{row.username}</td>
                      <td className="px-6 py-4 font-bold text-slate-600 uppercase">{row.nama}</td>
                      <td className="px-6 py-4">
                        <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border border-rose-100">
                           {row.madrasah || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border border-indigo-100">
                           {row.kelas || '-'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-wrap gap-1">
                            {row.peminatan?.split(/[,;]/).map((s, i) => (
                               <span key={i} className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-emerald-100">{s.trim()}</span>
                            ))}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setData(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/10">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-800 leading-tight">Pekerjaan Selesai!</h3>
              <p className="text-slate-500 mt-2 font-medium">Semua data pengguna telah berhasil diimpor dan didaftarkan ke sistem.</p>
            </div>
            <button 
              onClick={onComplete}
              className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3"
            >
              LIHAT DAFTAR PENGGUNA <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserImportWizard;
