import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

interface AnalysisItem {
  id: number;
  content: string;
  diffIdx: string;
  diffLabel: string;
  discIdx: string;
  discLabel: string;
  opts: {
    label: string;
    count: number;
    isKey: boolean;
  }[];
}

interface AnalysisData {
  examTitle: string;
  totalStudents: number;
  analysis: AnalysisItem[];
}

const ItemAnalysis: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/exams')
      .then(res => res.json())
      .then(setExams);
  }, []);

  const handleFetchAnalysis = async () => {
    if (!selectedExamId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/analysis/exams/${selectedExamId}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeColor = (label: string) => {
    if (label === 'SUKAR' || label.includes('JELEK')) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (label === 'MUDAH' || label.includes('BAIK')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded text-white shadow-lg shadow-indigo-100">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Analisis Butir Soal</h1>
          <p className="text-xs text-slate-500 font-medium">Evaluasi kualitas instrumen tes berdasarkan statistik jawaban</p>
        </div>
      </div>

      {/* Selector Area */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[300px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pilih Ujian Untuk Dianalisis</label>
          <div className="relative">
            <select 
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            >
              <option value="">-- Pilih Ujian --</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <button 
          onClick={handleFetchAnalysis}
          disabled={!selectedExamId || isLoading}
          className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-100"
        >
          {isLoading ? 'Memproses...' : <><Search className="w-4 h-4" /> Proses Analisis</>}
        </button>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Peserta</p>
              <h3 className="text-3xl font-black text-slate-900">{data.totalStudents} <span className="text-sm font-bold text-slate-400">Siswa</span></h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Soal</p>
              <h3 className="text-3xl font-black text-slate-900">{data.analysis.length} <span className="text-sm font-bold text-slate-400">Butir</span></h3>
            </div>
            <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white">
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Status Ujian</p>
              <h3 className="text-2xl font-black">{data.examTitle}</h3>
            </div>
          </div>

          {/* Analysis List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">No</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Butir Soal</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tingkat Kesukaran (P)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Daya Pembeda (D)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.analysis.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      <tr className={`${expandedId === item.id ? 'bg-indigo-50/30' : ''} transition-colors`}>
                        <td className="px-6 py-4 text-sm font-black text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="px-6 py-4">
                          <div 
                            className="text-sm font-bold text-slate-700 truncate max-w-md"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">{item.diffIdx}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${getBadgeColor(item.diffLabel)}`}>
                              {item.diffLabel}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">{item.discIdx}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${getBadgeColor(item.discLabel)}`}>
                              {item.discLabel}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            className={`p-2 rounded-xl transition-all ${expandedId === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                          >
                            {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                      {expandedId === item.id && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50/50 p-8 border-t border-slate-100">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-top-2 duration-300">
                              <div>
                                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <FileText className="w-4 h-4" /> Konten Soal Lengkap
                                </h4>
                                <div 
                                  className="p-4 bg-white border border-slate-200 rounded-2xl text-sm leading-relaxed text-slate-700"
                                  dangerouslySetInnerHTML={{ __html: item.content }}
                                />
                              </div>
                              <div>
                                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4" /> Efektivitas Pengecoh (Distractor)
                                </h4>
                                <div className="space-y-3">
                                  {item.opts.map(opt => {
                                    const percent = Math.round((opt.count / data.totalStudents) * 100);
                                    return (
                                      <div key={opt.label} className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                          <span className="flex items-center gap-2">
                                            <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border ${opt.isKey ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                              {opt.label}
                                            </span>
                                            {opt.isKey && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                          </span>
                                          <span className="text-[10px] font-black text-slate-400">{opt.count} Siswa ({percent}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${opt.isKey ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Card */}
          <div className="flex items-start gap-4 p-6 bg-blue-50 border border-blue-100 rounded-3xl">
            <HelpCircle className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-black text-blue-900 uppercase tracking-tight">Apa itu Daya Pembeda (D)?</h5>
                <p className="text-xs text-blue-700 leading-relaxed mt-1">
                  Menunjukkan kemampuan soal dalam membedakan siswa kelompok pandai (Atas) dan kurang pandai (Bawah).
                  <b> D &ge; 0.4: Baik Sekali</b>, <b>0.3 &le; D &lt; 0.4: Cukup (Diterima)</b>, <b>0.2 &le; D &lt; 0.3: Jelek (Diperbaiki)</b>, <b>D &lt; 0.2: Sangat Jelek (Dibuang)</b>.
                </p>
              </div>
              <div>
                <h5 className="text-sm font-black text-blue-900 uppercase tracking-tight">Apa itu Index Kesukaran (P)?</h5>
                <p className="text-xs text-blue-700 leading-relaxed mt-1">
                  Menunjukkan seberapa banyak siswa yang menjawab benar. 
                  <b> P &lt; 0.3: Sukar (Sulit)</b>, <b>0.3 &le; P &le; 0.7: Sedang</b>, <b>P &gt; 0.7: Mudah</b>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!data && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <BarChart3 className="w-16 h-16 text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold">Silakan pilih ujian dan klik tombol Proses untuk memulai analisis</p>
        </div>
      )}
    </div>
  );
};

export default ItemAnalysis;
