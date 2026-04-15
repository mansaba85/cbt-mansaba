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
        window.print();
    };

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Menyiapkan Inkjet...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <style>{`
                @media print {
                    @page { 
                        margin: 0.5cm;
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
                    .card-item {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            {/* Header Screen Only */}
            <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <div className="no-print bg-white border border-slate-200 p-6 rounded-[2rem] shadow-xl shadow-slate-200/50">
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

            {/* Print Area */}
            <div className="print-area">
                {users.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                        {users.map((user) => (
                            <div key={user.id} className="card-item w-[9.5cm] h-[6.5cm] bg-white border-[1px] border-slate-900 rounded-md overflow-hidden flex flex-col relative print:shadow-none shadow-sm mx-auto">
                                {/* Card Header (KOP LEMBAGA) - COMPACT */}
                                <div className="p-2 border-b border-slate-900 flex items-center justify-center gap-3 bg-slate-50/50 h-[1.8cm]">
                                    {logo ? (
                                        <img src={logo} alt="Logo" className="w-10 h-10 object-contain shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 border border-slate-300 rounded flex items-center justify-center shrink-0">
                                            <Building2 className="w-5 h-5 text-slate-300" />
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <h2 className="text-[11px] font-black uppercase leading-[1.1] text-slate-900 tracking-tight">KARTU PESERTA UJIAN</h2>
                                        <h3 className="text-[10px] font-black uppercase leading-[1.1] text-indigo-700">{institution?.name || 'INSTITUSI PENDIDIKAN'}</h3>
                                        <p className="text-[7px] font-bold leading-tight text-slate-500 mt-0.5 line-clamp-2">{institution?.address1} {institution?.address2}</p>
                                    </div>
                                </div>
                                
                                {/* Card Content - OPTIMIZED SPACE */}
                                <div className="p-3 flex gap-4 items-start flex-1 overflow-hidden">
                                    <div className="w-20 h-24 bg-slate-50 border border-slate-100 rounded-sm flex flex-col items-center justify-center relative shrink-0 overflow-hidden mt-1">
                                        <Users className="w-10 h-10 text-slate-100" />
                                        <span className="absolute bottom-1 text-[6px] font-black text-slate-200 uppercase">PAS FOTO 2x3</span>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2 pt-1">
                                        <div className="space-y-0 text-left">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter italic">Nama Lengkap:</p>
                                            <p className="text-[13px] font-black text-slate-900 uppercase truncate leading-none mt-0.5">{user.fullName}</p>
                                        </div>
                                        <div className="space-y-0 text-left">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter italic">Nomor Peserta:</p>
                                            <p className="text-[18px] font-mono font-black text-indigo-600 leading-none mt-1">{user.username}</p>
                                        </div>
                                        <div className="space-y-0 text-left">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter italic">PIN / Password Login:</p>
                                            <p className="text-[18px] font-mono font-black text-rose-600 leading-none tracking-[0.2em] mt-1">{user.password || '******'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Simplified Footer */}
                                <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
                                    <div className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest leading-none">
                                        {user.group?.name || 'UMUM'}
                                    </div>
                                    
                                    <div className="flex flex-col items-end">
                                        <div className="flex gap-[0.5px] h-3 items-end">
                                            {[1,2,1,1,2,1,3,1,1,2].map((w, i) => (
                                                <div key={i} className="bg-slate-900 h-full" style={{ width: `${w}px` }}></div>
                                            ))}
                                        </div>
                                        <span className="text-[6px] font-mono font-bold">{user.username}</span>
                                    </div>
                                </div>

                                {/* Bottom Color Stripe */}
                                <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600 w-full"></div>
                            </div>
                        ))}
                    </div>
                ) : !isFetching && selectedGroup && (
                    <div className="no-print bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] py-20 text-center">
                        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tight">Tidak Ada Data Siswa</h3>
                        <p className="text-sm text-slate-400 font-medium">Silakan pilih kelas yang memiliki daftar siswa.</p>
                    </div>
                )}
            </div>

            {/* Empty State Screen Only */}
            {!selectedGroup && !isFetching && (
                <div className="no-print bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] py-32 text-center">
                    <LayoutGrid className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tighter">Siap Untuk Mencetak</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium">Pilih grup atau kelas di atas untuk men-generate kartu login peserta.</p>
                </div>
            )}
        </div>
    );
};

export default ParticipantCards;
