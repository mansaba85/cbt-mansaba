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
      ['username', 'password', 'nama', 'level_user', 'grup', 'keterangan'],
      ['siswa01', 'password123', 'Ahmad Dhani', '1', 'XII IPA 1', 'Siswa Pindahan'],
      ['guru02', 'rahasia456', 'Iwan Fals', '5', 'GURU', 'Guru Seni Musik'],
      ['admin03', 'admin789', 'Lutfi Admin', '10', 'STAF', 'Administrator Utama']
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Template_Peserta");
    XLSX.writeFile(wb, "Template_User_CBT.xlsx");
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
        password: String(row.password || row.PASSWORD || '123456'), // Default pass
        nama: String(row.nama || row.NAMA || row.fullName || ''),
        level_user: row.level_user || row.LEVEL || '1',
        grup: String(row.grup || row.GRUP || row.group || 'Default'),
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
      <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold italic tracking-tight">Wisaya Impor Pengguna</h2>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mt-1">Impor Peserta & Staf via Excel</p>
          </div>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border-2 transition-all ${step === s ? 'bg-blue-600 border-blue-600' : (step > s ? 'bg-green-600 border-green-600' : 'border-slate-700 text-slate-500')}`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-3xl font-black text-slate-800 leading-tight">Siapkan Data Anda<br/><span className="text-blue-600">Dalam Format Excel</span></h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Gunakan template standar kami untuk memastikan data Anda terbaca dengan sempurna oleh sistem. Pastikan kolom <span className="font-bold text-slate-800 italic">username</span> dan <span className="font-bold text-slate-800 italic">nama</span> sudah terisi.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={downloadTemplate}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all border border-slate-200"
                  >
                    <Download className="w-5 h-5" /> UNDUH TEMPLATE EXCEL
                  </button>
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Wajib menggunakan format ini (.xlsx)</p>
                </div>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-slate-100 bg-slate-50/50 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  {isProcessing ? <Loader2 className="w-10 h-10 text-blue-600 animate-spin" /> : <FileUp className="w-10 h-10 text-blue-500" />}
                </div>
                <div className="text-center">
                   <p className="text-lg font-black text-slate-800 uppercase tracking-tight">Pilih File Excel</p>
                   <p className="text-xs text-slate-400 font-medium">Klik atau tarik file Anda ke sini</p>
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
                <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200">BATAL</button>
                <button 
                  onClick={saveToDatabase}
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  SIMPAN KE DATABASE
                </button>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase">Username</th>
                    <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase">Nama Lengkap</th>
                    <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase">Level</th>
                    <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase">Grup / Kelas</th>
                    <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-bold text-slate-800">{row.username}</td>
                      <td className="px-6 py-3 text-slate-600">{row.nama}</td>
                      <td className="px-6 py-3">
                        <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
                          {row.level_user === '1' || row.level_user === 1 ? 'Siswa' : (row.level_user === '5' || row.level_user === 5 ? 'Guru' : 'Staf')}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-500 italic">{row.grup}</td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={() => setData(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-slate-300 hover:text-red-500"
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
