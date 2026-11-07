import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ShieldCheck, Scale } from 'lucide-react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-500 font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-100">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 inline-flex">
              <div className="w-8 h-8 rounded-xl bg-violet-700 text-white flex items-center justify-center shadow-xs">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                AI Personal Career Counselor
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">
                SaaS
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Evidence-grounded career intelligence platform integrating deterministic Holland RIASEC scoring, 
              4-tier competency verification, and statutory licensing standards across 1,016 occupational pathways.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Deterministic Engine Active
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Statutory Verified
              </span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Platform</p>
            <ul className="space-y-1.5">
              <li>
                <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/assessment" className="hover:text-slate-900 transition-colors">
                  Adaptive Career Assessment
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-slate-900 transition-colors">
                  Career Explorer (1,016 Roles)
                </Link>
              </li>
              <li>
                <Link to="/roadmap" className="hover:text-slate-900 transition-colors">
                  Stage Learning Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Statutory Intelligence Links */}
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Compliance & Governance</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mapped against national statutory regulatory bodies in India including NMC, BCI, ICAI, and AICTE. Multiple-choice responses do not substitute for formal statutory licensing exams.
            </p>
            <div className="pt-1 text-[11px] text-violet-700 font-semibold flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              <span>National Career Service Framework</span>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} AI Personal Career Counselor. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Evidence Methodology</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
