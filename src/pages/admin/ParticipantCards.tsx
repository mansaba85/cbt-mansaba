import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Users, 
  ChevronDown, 
  Search,
  CreditCard,
  LayoutGrid,
  Loader2,
  AlertCircle,
  Building2
} from 'lucide-react';

const ParticipantCards: React.FC = () => {
    const [institution, setInstitution] = useState<any>(null);
    const [logo, setLogo] = useState<string | null>(null);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Load Groups & Settings
    useEffect(() => {
        const fetchBaseData = async () => {
            setIsLoading(true);
            try {
                const [gRes, sRes] = await Promise.all([
                    fetch('http://localhost:3001/api/groups'),
                    fetch('http://localhost:3001/api/settings')
                ]);
                setGroups(await gRes.json());
                
                const settings = await sRes.json();
                if (settings.cbt_institution_settings) setInstitution(settings.cbt_institution_settings);
                if (settings.cbt_logo_preview) setLogo(settings.cbt_logo_preview);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBaseData();
    }, []);

    const handleFetchCards = async () => {
        if (!selectedGroup) return;
        setIsFetching(true);
        try {
            const res = await fetch(`http://localhost:3001/api/users?groupId=${selectedGroup}`);
            setUsers(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetching(false);
        }
    };

    const handlePrint = () => {
        const html = `
          <div class="header" style="border-bottom: 2px solid #000; padding-bottom: 20px; display: flex; flex-direction: column; align-items: center; text-align: center;">
            ${logo ? `<img src="${logo}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;" />` : ''}
            <div class="header-text">
              <h1>DAFTAR KARTU LOGIN PESERTA</h1>
              <p style="font-size: 10px; font-weight: 900; color: #64748b;">${institution?.name || 'CBT Modern System'}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 30px;">
            ${users.map(user => `
              <div class="card-item" style="width: 9.3cm; height: 6.3cm; border: 1.5px solid #0f172a; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; background: #fff; break-inside: avoid; page-break-inside: avoid;">
                 <!-- Template Header -->
                 <div style="padding: 10px; border-bottom: 1.5px solid #0f172a; display: flex; align-items: center; justify-content: center; gap: 12px; background: #f8fafc; height: 1.8cm;">
                    ${logo ? `<img src="${logo}" style="width: 40px; height: 40px; object-fit: contain;" />` : ''}
                    <div style="text-align: center">
                       <h2 style="margin: 0; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #0f172a;">KARTU PESERTA UJIAN</h2>
                       <h3 style="margin: 0; font-size: 10px; font-weight: 900; color: #4338ca; text-transform: uppercase;">${institution?.name || 'INSTITUSI'}</h3>
                       <p style="margin: 2px 0 0 0; font-size: 6px; color: #64748b; font-weight: bold;">${institution?.address1 || ''}</p>
                    </div>
                 </div>
                 
                 <!-- Content -->
                 <div style="padding: 15px; display: flex; gap: 15px; flex: 1; align-items: center;">
                    <div style="width: 2.1cm; height: 2.8cm; background: #f1f5f9; border: 1px dashed #cbd5e1; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
                        <span style="font-size: 7px; color: #94a3b8; font-weight: 900; text-align: center;">PAS FOTO<br>2 x 3</span>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                       <div>
                          <p style="margin: 0; font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; font-style: italic;">Nama Lengkap:</p>
                          <p style="margin: 1px 0 0 0; font-size: 13px; font-weight: 900; text-transform: uppercase; color: #0f172a;">${user.fullName}</p>
                       </div>
                       <div>
                          <p style="margin: 0; font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; font-style: italic;">Nomor Peserta:</p>
                          <p style="margin: 1px 0 0 0; font-size: 18px; font-weight: 900; color: #4338ca; font-family: monospace;">${user.username}</p>
                       </div>
                       <div>
                          <p style="margin: 0; font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; font-style: italic;">PIN / Password:</p>
                          <p style="margin: 1px 0 0 0; font-size: 18px; font-weight: 900; color: #e11d48; font-family: monospace; letter-spacing: 2.5px;">${user.password || '******'}</p>
                       </div>
                    </div>
                 </div>
                 
                 <!-- Footer Card -->
                 <div style="padding: 8px 15px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <span style="padding: 3px 10px; background: #0f172a; color: #fff; font-size: 8px; font-weight: 900; border-radius: 5px; text-transform: uppercase;">${user.group?.name || 'UMUM'}</span>
                    <div style="text-align: right">
                       <div style="display: flex; gap: 0.5px; height: 12px; align-items: flex-end; justify-content: flex-end;">
                          ${Array(12).fill(0).map((_, i) => `<div style="width: ${i % 3 === 0 ? 2 : 1}px; height: 100%; background: #000;"></div>`).join('')}
                       </div>
                       <p style="margin: 2px 0 0 0; font-size: 6px; font-family: monospace; color: #64748b;">${user.username}</p>
                    </div>
                 </div>
                 <div style="height: 4px; background: linear-gradient(to right, #4338ca, #7c3aed);"></div>
              </div>
            `).join('')}
          </div>
        `;

        import('../../utils/printReport').then(m => {
            m.printReport(`Kartu_Siswa_${selectedGroup}`, html);
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Menyiapkan Mesin Cetak...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="no-print space-y-6">
            {/* Header Screen Only */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cetak Kartu Peserta</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hasilkan kartu login untuk siswa</p>
                    </div>
                </div>
                {users.length > 0 && (
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        <Printer className="w-4 h-4" /> Cetak Sekarang
                    </button>
                )}
            </div>

            {/* Filter Panel Screen Only */}
            <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-xl shadow-slate-200/50">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pilih Kelas / Grup</label>
                        <div className="relative">
                            <select 
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:border-indigo-600 outline-none transition-all appearance-none"
                            >
                                <option value="">-- Cari Kelas --</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <button 
                        onClick={handleFetchCards}
                        disabled={!selectedGroup || isFetching}
                        className="h-12 px-8 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Tampilkan
                    </button>
                </div>
              </div>
            </div>

            {/* Empty State Screen Only */}
            {!users.length && !selectedGroup && !isFetching && (
                <div className="no-print bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] py-32 text-center">
                    <LayoutGrid className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tighter">Siap Untuk Mencetak</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium">Pilih grup atau kelas di atas untuk men-generate kartu login peserta.</p>
                </div>
            )}
            
            {users.length === 0 && selectedGroup && !isFetching && (
                <div className="no-print bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] py-20 text-center">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tight">Tidak Ada Data Siswa</h3>
                    <p className="text-sm text-slate-400 font-medium">Silakan pilih kelas yang memiliki daftar siswa.</p>
                </div>
            )}
        </div>
    );
};

export default ParticipantCards;
