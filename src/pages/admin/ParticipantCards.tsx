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
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 15mm 8mm; width: 215mm; margin: 0 auto;">
            ${users.map(user => `
              <div class="card-item" style="width: 9.8cm; height: 5.8cm; border: 1.5px solid #000; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; background: #fff !important; break-inside: avoid; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-shadow: 0 0 0 0.5px #eee;">
                 <!-- Template Header -->
                 <div style="padding: 8px 12px; border-bottom: 2px solid #000; display: flex; align-items: center; justify-content: center; gap: 12px; background: #f8fafc !important; height: 1.6cm; -webkit-print-color-adjust: exact;">
                    ${logo ? `<img src="${logo}" style="width: 40px; height: 40px; object-fit: contain;" />` : ''}
                    <div style="text-align: center">
                       <h2 style="margin: 0; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5px;">KARTU LOGIN PESERTA</h2>
                       <h3 style="margin: 0; font-size: 10px; font-weight: 950; color: #4338ca !important; text-transform: uppercase;">${institution?.name || 'INSTITUSI'}</h3>
                    </div>
                 </div>
                 
                 <!-- Content -->
                 <div style="padding: 15px 20px; display: flex; gap: 15px; flex: 1; align-items: center;">
                    <div style="width: 2.1cm; height: 2.8cm; background: #f1f5f9 !important; border: 1px dashed #cbd5e1; display: flex; flex-direction: column; align-items: center; justify-content: center; -webkit-print-color-adjust: exact;">
                        <span style="font-size: 6px; color: #94a3b8; font-weight: 950; text-align: center;">FOTO<br>2 x 3</span>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                       <div>
                          <p style="margin: 0; font-size: 8px; font-weight: 950; color: #64748b; text-transform: uppercase;">Nama Lengkap:</p>
                          <p style="margin: 1px 0 0 0; font-size: 13px; font-weight: 950; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 190px;">${user.fullName}</p>
                       </div>
                       <div style="display: flex; flex-direction: column; gap: 4px;">
                           <div style="display: flex; justify-content: space-between;">
                              <span style="font-size: 8px; font-weight: 950; color: #64748b;">USERNAME:</span>
                              <span style="font-size: 8px; font-weight: 950; color: #64748b;">PIN/PASS:</span>
                           </div>
                           <div style="display: flex; justify-content: space-between; align-items: center;">
                              <span style="font-size: 18px; font-weight: 950; color: #4338ca !important; font-family: monospace;">${user.username}</span>
                              <span style="font-size: 18px; font-weight: 950; color: #e11d48 !important; font-family: monospace;">${user.password || '******'}</span>
                           </div>
                       </div>
                    </div>
                 </div>
                 
                 <!-- Footer Card -->
                 <div style="padding: 6px 15px; border-top: 1.5px solid #222; display: flex; justify-content: space-between; align-items: center; background: #fcfcfc !important; -webkit-print-color-adjust: exact; height: 0.9cm;">
                    <span style="padding: 3px 10px; background: #0f172a !important; color: #fff !important; font-size: 8px; font-weight: 950; border-radius: 4px; text-transform: uppercase;">${user.group?.name || 'UMUM'}</span>
                    <div style="text-align: right">
                        <p style="margin: 0; font-size: 7px; font-family: monospace; color: #64748b; font-weight: bold;">CBT SYSTEM - ${user.username}</p>
                    </div>
                 </div>
                 <div style="height: 5px; background: #4338ca !important; -webkit-print-color-adjust: exact;"></div>
              </div>
            `).join('')}
          </div>
        `;

        import('../../utils/printReport').then(m => {
            m.printReport(`Kartu_Siswa_${selectedGroup}`, html, {
                paperSize: '215mm 330mm'
            });
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
                <div className="flex items-center gap-4">
                    <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center animate-pulse">
                            <AlertCircle className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-amber-800 uppercase leading-none mb-1">Penting saat cetak:</p>
                            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tight">Ceklis opsi "Background Graphics" agar warna muncul</p>
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

            {/* Cards Preview Grid */}
            {users.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {users.map(user => (
                        <div key={user.id} className="bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-xl flex flex-col group hover:scale-[1.02] transition-all">
                            <div className="p-4 border-b-2 border-slate-900 bg-slate-50 flex items-center gap-3">
                                {logo ? <img src={logo} className="w-8 h-8 object-contain" alt="Logo" /> : <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><Building2 className="w-4 h-4 text-indigo-600" /></div>}
                                <div className="leading-tight">
                                    <h4 className="text-[10px] font-black uppercase text-slate-900">Kartu Peserta</h4>
                                    <p className="text-[9px] font-bold text-indigo-600 uppercase truncate max-w-[150px]">{institution?.name || 'CBT System'}</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4 flex-1">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Nama Lengkap</p>
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{user.fullName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Username</p>
                                        <p className="text-lg font-black text-indigo-600 font-mono tracking-tighter">{user.username}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">PIN / Password</p>
                                        <p className="text-lg font-black text-rose-600 font-mono tracking-widest">{user.password || '******'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-3 bg-slate-900 flex justify-between items-center text-white">
                                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-md">{user.group?.name || 'UMUM'}</span>
                                <div className="flex gap-0.5">
                                    {Array(8).fill(0).map((_, i) => <div key={i} className={`w-0.5 h-3 bg-white ${i % 3 === 0 ? 'opacity-100' : 'opacity-40'}`}></div>)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Empty State Screen Only */}
            {users.length === 0 && !isFetching && (
                <div className="no-print bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] py-32 text-center">
                    {selectedGroup ? (
                        <>
                            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tight">Tidak Ada Data Siswa</h3>
                            <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">Grup ini kosong. Pilih grup lain atau tambahkan siswa ke grup ini terlebih dahulu.</p>
                        </>
                    ) : (
                        <>
                            <LayoutGrid className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tighter">Siap Untuk Mencetak</h3>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium">Pilih grup atau kelas di atas untuk men-generate kartu login peserta.</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ParticipantCards;
