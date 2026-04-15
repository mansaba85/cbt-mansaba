import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  Settings,
  Save,
  Globe,
  Building2,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';

// --- Reusable Components ---
const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200">
      <span className="text-indigo-600">{icon}</span>
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{title}</h2>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

const FormRow: React.FC<{ label: string; children: React.ReactNode; half?: boolean }> = ({ label, children, half }) => (
  <div className={`flex flex-col md:flex-row md:items-center gap-2 ${half ? 'md:w-1/2' : ''}`}>
    <label className="text-xs font-bold text-slate-600 md:w-44 shrink-0">{label}</label>
    <div className="flex-1">{children}</div>
  </div>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full h-9 px-3 border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all" />
);

const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <div className="relative">
    <select {...props} className="w-full h-9 pl-3 pr-8 border border-slate-300 rounded text-sm text-slate-800 outline-none appearance-none focus:border-indigo-500 bg-white">
      {children}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
  </div>
);

interface ToggleOptionProps {
  id: string;
  label: string;
  description: string;
  defaultNote: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}
const ToggleOption: React.FC<ToggleOptionProps> = ({ id, label, description, defaultNote, checked, onChange }) => (
  <div className="flex items-start gap-3 py-2">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
    />
    <label htmlFor={id} className="cursor-pointer">
      <span className="text-sm font-bold text-slate-800 block">{label}</span>
      <span className="text-xs text-slate-500 block mt-0.5">{description}</span>
      <span className="text-[10px] text-slate-400 italic block">default value: {defaultNote}</span>
    </label>
  </div>
);

// --- Main Component ---
const GeneralSettings: React.FC = () => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Site Settings State
  const [site, setSite] = useState({
    appDescription: 'CBT Application - AM2',
    appShortDescription: 'CBT App',
    siteName: "CBT KKMA Ma'arif Batang",
    siteDescription: 'Enhancement of Original TCExam with Additional Features',
    siteAuthor: 'Maman Sulaeman',
    siteReplyTo: 'mamansulaeman86@gmail.com',
    siteKeyword: 'TCExam, TCExam Mobile Friendly, e-exam, CBT, CAT',
  });

  // Timezone & Language State
  const [locale, setLocale] = useState({
    timezone: 'Asia/Jakarta',
    language: 'id',
  });
  const [toggles, setToggles] = useState({
    enableLanguageSelector: false,
    publicPageHelp: false,
    showForgotPassword: true,
    enableSelfRegistration: false,
    enableMultiLogin: true,
  });

  // Institution Data State
  const [institution, setInstitution] = useState({
    name: "KKMA Ma'arif Kab. Batang",
    address1: 'Jl. Lapangan 9A Banyuputih',
    address2: 'Kabupaten Batang',
    address3: 'Provinsi Jawa Tengah',
  });

  // Global Test Settings State
  const [testSettings, setTestSettings] = useState({
    realtimeGrading: true,
    answerAllQuestions: false,
    showTerminateOnlyWhenAnswered: false,
    allowTerminateAfterPercent: '20',
    simpleCheatDetection: true,
    cheatLockWaitTime: '60',
    cheatWarningTitle: '⚠️ Pelanggaran Terdeteksi — Ujian Dibekukan!',
    cheatWarningMessage: 'Sistem kami mendeteksi bahwa Anda berpindah ke halaman atau aplikasi lain selama ujian berlangsung. Tindakan ini termasuk pelanggaran integritas ujian. Halaman ujian Anda telah dibekukan sementara dan akan kembali aktif setelah hitungan mundur selesai. Harap tetap fokus pada halaman ujian hingga ujian selesai.',
    forceLogoutAndLock: false,
    cheatMaxViolations: '3',
    disableMainMenuDuringTest: true,
    showSaveButton: false,
    forceFullscreen: true,
    testDescription: true,
  });

  // Initial Load
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/settings');
        const data = await res.json();
        
        if (data.cbt_site_settings) setSite(data.cbt_site_settings);
        if (data.cbt_locale_settings) setLocale(data.cbt_locale_settings);
        if (data.cbt_toggle_settings) setToggles(data.cbt_toggle_settings);
        if (data.cbt_institution_settings) setInstitution(data.cbt_institution_settings);
        if (data.cbt_test_settings) setTestSettings(data.cbt_test_settings);
        if (data.cbt_logo_preview) setLogoPreview(data.cbt_logo_preview);
      } catch (e) {
        // Fallback or handle error
      }
    };
    fetchSettings();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setLogoPreview(b64);
        localStorage.setItem('cbt_logo_preview', b64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const allSettings = {
        cbt_site_settings: site,
        cbt_locale_settings: locale,
        cbt_toggle_settings: toggles,
        cbt_institution_settings: institution,
        cbt_test_settings: testSettings,
        cbt_logo_preview: logoPreview
    };

    try {
        const res = await fetch('http://localhost:3001/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allSettings)
        });
        const result = await res.json();

        if (result.success) {
            // Also update local for immediate use in current browser
            localStorage.setItem('cbt_site_settings', JSON.stringify(site));
            localStorage.setItem('cbt_locale_settings', JSON.stringify(locale));
            localStorage.setItem('cbt_toggle_settings', JSON.stringify(toggles));
            localStorage.setItem('cbt_institution_settings', JSON.stringify(institution));
            localStorage.setItem('cbt_test_settings', JSON.stringify(testSettings));
            
            setSaved(true);
            toast.success("Pengaturan sistem berhasil diperbarui!");
            setTimeout(() => setSaved(false), 3000);
        } else {
            toast.error(result.error || "Gagal menyimpan ke database");
        }
    } catch(e) {
        toast.error("Masalah koneksi ke server");
    }
  };

  const setToggle = (key: keyof typeof toggles) => (v: boolean) => setToggles(p => ({ ...p, [key]: v }));
  const setTest = (key: keyof typeof testSettings) => (v: any) => setTestSettings(p => ({ ...p, [key]: v }));

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded text-white"><Settings className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">General Settings</h1>
            <p className="text-xs text-slate-500">Konfigurasi umum aplikasi CBT</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2 rounded text-sm font-bold transition-all shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Tersimpan!' : 'Simpan Pengaturan'}
        </button>
      </div>

      {/* 1. Site Settings */}
      <SectionCard title="Site Settings" icon={<Globe className="w-4 h-4" />}>
        <FormRow label="App Description">
          <TextInput value={site.appDescription} onChange={e => setSite(p => ({ ...p, appDescription: e.target.value }))} />
        </FormRow>
        <FormRow label="App Short Description">
          <TextInput value={site.appShortDescription} onChange={e => setSite(p => ({ ...p, appShortDescription: e.target.value }))} />
        </FormRow>
        <FormRow label="Site Name">
          <TextInput value={site.siteName} onChange={e => setSite(p => ({ ...p, siteName: e.target.value }))} />
        </FormRow>
        <FormRow label="Site Description">
          <TextInput value={site.siteDescription} onChange={e => setSite(p => ({ ...p, siteDescription: e.target.value }))} />
        </FormRow>
        <div className="flex flex-col md:flex-row gap-4">
          <FormRow label="Site Author">
            <TextInput value={site.siteAuthor} onChange={e => setSite(p => ({ ...p, siteAuthor: e.target.value }))} />
          </FormRow>
          <FormRow label="Site Reply-to">
            <TextInput type="email" value={site.siteReplyTo} onChange={e => setSite(p => ({ ...p, siteReplyTo: e.target.value }))} />
          </FormRow>
        </div>
        <FormRow label="Site Keyword">
          <TextInput value={site.siteKeyword} onChange={e => setSite(p => ({ ...p, siteKeyword: e.target.value }))} />
        </FormRow>
      </SectionCard>

      {/* 2. Timezone & Language */}
      <SectionCard title="Timezone & Language" icon={<Globe className="w-4 h-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Timezone</label>
            <SelectInput value={locale.timezone} onChange={e => setLocale(p => ({ ...p, timezone: e.target.value }))}>
              <option value="Asia/Jakarta">(GMT+7:00) Asia/Jakarta (West Indonesia Time)</option>
              <option value="Asia/Makassar">(GMT+8:00) Asia/Makassar (Central Indonesia Time)</option>
              <option value="Asia/Jayapura">(GMT+9:00) Asia/Jayapura (East Indonesia Time)</option>
            </SelectInput>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Default Language</label>
            <SelectInput value={locale.language} onChange={e => setLocale(p => ({ ...p, language: e.target.value }))}>
              <option value="id">Indonesian</option>
              <option value="en">English</option>
            </SelectInput>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 pt-2 border-t border-slate-100">
          <div>
            <ToggleOption id="enableLanguageSelector" label="Enable Language Selector" description="If enable, show language selector on top right of the page." defaultNote="enable" checked={toggles.enableLanguageSelector} onChange={setToggle('enableLanguageSelector')} />
            <ToggleOption id="showForgotPassword" label="Show Forgot Password Link" description="If enable, show link to reset user password." defaultNote="enable" checked={toggles.showForgotPassword} onChange={setToggle('showForgotPassword')} />
            <ToggleOption id="enableMultiLogin" label="Enable Multi Login" description="If disable, User level 1,2,3 are blocked if login twice or more on other device/browser." defaultNote="disable" checked={toggles.enableMultiLogin} onChange={setToggle('enableMultiLogin')} />
          </div>
          <div>
            <ToggleOption id="publicPageHelp" label="Public Page Help" description="If enable, display page help on the bottom of the page." defaultNote="disable" checked={toggles.publicPageHelp} onChange={setToggle('publicPageHelp')} />
            <ToggleOption id="enableSelfRegistration" label="Enable Self Registration" description="If enable, show self registration link." defaultNote="enable" checked={toggles.enableSelfRegistration} onChange={setToggle('enableSelfRegistration')} />
          </div>
        </div>
      </SectionCard>

      {/* 3. Institution Data */}
      <SectionCard title="Institution Data" icon={<Building2 className="w-4 h-4" />}>
        <FormRow label="Institution Name">
          <TextInput value={institution.name} onChange={e => setInstitution(p => ({ ...p, name: e.target.value }))} />
        </FormRow>
        <FormRow label="Address Line 1">
          <TextInput value={institution.address1} onChange={e => setInstitution(p => ({ ...p, address1: e.target.value }))} />
        </FormRow>
        <FormRow label="Address Line 2">
          <TextInput value={institution.address2} onChange={e => setInstitution(p => ({ ...p, address2: e.target.value }))} />
        </FormRow>
        <FormRow label="Address Line 3">
          <TextInput value={institution.address3} onChange={e => setInstitution(p => ({ ...p, address3: e.target.value }))} />
        </FormRow>

        {/* Logo Section */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Logo Institusi</span>
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Logo Saat Ini</p>
              <div className="w-32 h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                  : <ImageIcon className="w-10 h-10 text-slate-300" />
                }
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-1 justify-center mt-4 md:mt-8">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-full h-10 bg-white border border-slate-300 rounded text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-4 h-4" /> Select Logo
              </button>
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-full h-10 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Upload className="w-4 h-4" /> Upload Logo
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 4. Global Test Settings */}
      <SectionCard title="Global Test Settings" icon={<ShieldCheck className="w-4 h-4" />}>
        <ToggleOption id="realtimeGrading" label="Realtime Grading" description="Jika diaktifkan, semua jawaban akan dinilai langsung ke database. Jika dimatikan, semua jawaban harus dinilai manual dengan menekan tombol Regrade." defaultNote="aktif" checked={testSettings.realtimeGrading} onChange={setTest('realtimeGrading')} />
        <ToggleOption id="answerAllQuestions" label="Answer All Questions" description="If enable all questions must be answered before stopping the test." defaultNote="enable" checked={testSettings.answerAllQuestions} onChange={setTest('answerAllQuestions')} />
        <ToggleOption id="showTerminateOnlyWhenAnswered" label="Show Terminate Button Only When All Answered" description="If enable, show terminate button only when all question has been marked answered." defaultNote="disable" checked={testSettings.showTerminateOnlyWhenAnswered} onChange={setTest('showTerminateOnlyWhenAnswered')} />

        <div className="pt-2">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">Allow Terminate Test After n-persen Time</label>
          <TextInput
            type="number"
            value={testSettings.allowTerminateAfterPercent}
            onChange={e => setTest('allowTerminateAfterPercent')(e.target.value)}
            className="md:w-32"
          />
          <p className="text-[10px] text-blue-600 mt-1 max-w-2xl leading-relaxed">
            Izinkan peserta menghentikan ujian setelah durasi waktu berjalan sekian persen. Tuliskan dengan angka maksimal 100. Contoh: jika durasi ujian 100 menit, dan pada kolom di atas mengetikkan 20, maka peserta baru diijinkan menekan tombol berhenti setelah durasi ujian berjalan 20 menit.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <ToggleOption id="simpleCheatDetection" label="Simple Cheat Detection" description="Jika diaktifkan maka halaman ujian akan terkunci jika peserta ujian berpindah ke tab/aplikasi lain." defaultNote="mati" checked={testSettings.simpleCheatDetection} onChange={setTest('simpleCheatDetection')} />

          {testSettings.simpleCheatDetection && (
            <div className="ml-7 mt-2 space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Waktu Tunggu Kuncian Halaman Ujian (detik)</label>
                <TextInput
                  type="number"
                  value={testSettings.cheatLockWaitTime}
                  onChange={e => setTest('cheatLockWaitTime')(e.target.value)}
                  className="md:w-32"
                />
                <p className="text-[10px] text-slate-400 mt-1">Waktu yang harus ditunggu peserta ujian pada saat halaman ujian terkunci (dalam satuan detik). Isikan dengan angka misal 10.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Judul Pesan Peringatan</label>
                <TextInput value={testSettings.cheatWarningTitle} onChange={e => setTest('cheatWarningTitle')(e.target.value)} />
                <p className="text-[10px] text-slate-400 mt-1">Ketikkan pesan yang akan tampil sebagai judul peringatan.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Isi Pesan Peringatan</label>
                <textarea
                  value={testSettings.cheatWarningMessage}
                  onChange={e => setTest('cheatWarningMessage')(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-indigo-500 resize-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Ketikkan pesan yang akan ditampilkan sebagai pesan peringatan.</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-1">
          <ToggleOption id="forceLogoutAndLock" label="Paksa Logout dan Kunci" description="Jika diaktifkan maka peserta akan dipaksa logout dan dikunci akunnya. Akun yang dikunci memerlukan reset peserta apabila peserta diijinkan kembali mengikuti ujian." defaultNote="mati" checked={testSettings.forceLogoutAndLock} onChange={setTest('forceLogoutAndLock')} />
          {testSettings.forceLogoutAndLock && (
            <div className="ml-7 mt-2 mb-4 space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Batas Maksimal Pelanggaran (Maksimum Keluar Halaman)</label>
                <TextInput
                  type="number"
                  value={testSettings.cheatMaxViolations}
                  onChange={e => setTest('cheatMaxViolations')(e.target.value)}
                  className="md:w-32"
                />
                <p className="text-[10px] text-slate-400 mt-1">Sistem akan mengunci paksa akun jika peserta melakukan pelanggaran lebih dari batas ini.</p>
              </div>
            </div>
          )}
          <ToggleOption id="disableMainMenuDuringTest" label="Matikan Menu Utama Saat Ujian Berlangsung" description="Jika dimatikan, menu utama di pojok kiri atas tidak berfungsi. Jika dimatikan maka mempersulit peserta yang akan melakukan kecurangan." defaultNote="centang" checked={testSettings.disableMainMenuDuringTest} onChange={setTest('disableMainMenuDuringTest')} />
          <ToggleOption id="showSaveButton" label="Show Save Button" description="If enable, show save button below question navigation." defaultNote="disable" checked={testSettings.showSaveButton} onChange={setTest('showSaveButton')} />
          <ToggleOption id="forceFullscreen" label="Paksa Fullscreen" description="Jika diaktifkan, maka halaman ujian akan selalu tampil fullscreen. Jika peserta mematikan fullscreen maka akan dicoba menjalankan fullscreen kembali." defaultNote="aktif" checked={testSettings.forceFullscreen} onChange={setTest('forceFullscreen')} />
          <ToggleOption id="testDescription" label="Test Description" description="If enable show test description before executing the test." defaultNote="enable" checked={testSettings.testDescription} onChange={setTest('testDescription')} />
        </div>
      </SectionCard>

      {/* Save Button Bottom */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-2.5 rounded text-sm font-bold transition-all shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          <Save className="w-4 h-4" />
          {saved ? '✅ Pengaturan Tersimpan!' : 'Simpan Semua Pengaturan'}
        </button>
      </div>
    </div>
  );
};

export default GeneralSettings;
