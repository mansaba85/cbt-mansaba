import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import IdleTimer from '../auth/IdleTimer';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-transparent font-sans">
      {/* Auto logout after 2 hours of idle */}
      <IdleTimer timeoutMinutes={120} />
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden transition-all duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Responsive Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-[100] w-72 transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Scroll Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Responsive Header Container */}
        <header className="px-6 lg:px-10 py-5 flex items-center justify-between sticky top-0 z-40 bg-white/40 backdrop-blur-xl border-b border-white/20">
          <div className="flex items-center gap-4">
             {/* Mobile Menu Toggle */}
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="lg:hidden p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 hover:bg-slate-50 transition-all"
             >
               {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
             </button>
             
             <div className="hidden sm:block">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">System Performance</h2>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-2.5 h-2.5 rounded-full bg-green-500 opacity-20 animate-ping" />
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-[10px] font-black text-slate-800 tracking-tighter uppercase">Cloud Server Stable • V2.0</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 font-black">
            <button className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-white/80 hover:bg-white text-slate-700 border border-slate-200 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-sm">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest bg-slate-100/50 px-4 py-2.5 rounded-2xl">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>12 April 2026</span>
            </div>
          </div>
        </header>

        {/* Page Content Holder */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-10 pt-6">
          <Outlet />
          
          <footer className="mt-20 py-10 border-t border-slate-100 flex flex-col items-center md:flex-row justify-between gap-4">
             <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                MANSABA CBT &bull; MA NU 01 Banyuputih
             </div>
             <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                &copy; 2026 TCEXAM V2.0 System
             </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
