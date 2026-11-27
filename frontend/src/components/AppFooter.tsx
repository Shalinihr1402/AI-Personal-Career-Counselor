import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, X } from 'lucide-react';

export const AppFooter: React.FC = () => {
  const [modalContent, setModalContent] = useState<'privacy' | 'terms' | null>(null);

  return (
    <footer className="bg-white border-t border-[#E2E8F0] text-[#64748B] font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Application Logo, Name & Short Tagline */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-2.5">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-lg bg-[#142B4A] flex items-center justify-center text-white shadow-2xs group-hover:bg-[#0E1F36] transition-colors">
                <BrainCircuit className="w-3.5 h-3.5 text-[#168C89]" />
              </div>
              <span className="font-bold text-[#142B4A] tracking-tight hover:text-[#0E1F36] transition-colors">
                AI Personal Career Counselor
              </span>
            </Link>

            <span className="text-[#CBD5E1] hidden sm:inline">•</span>

            <span className="text-[#64748B] font-medium tracking-wide">
              Discover · Assess · Plan · Grow
            </span>
          </div>

          {/* Right: Copyright & Legal Policies */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 text-[#64748B]">
            <span>
              © {new Date().getFullYear()} AI Personal Career Counselor.
            </span>

            <span className="text-[#CBD5E1]">•</span>

            <button
              type="button"
              onClick={() => setModalContent('privacy')}
              className="hover:text-[#168C89] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
            >
              Privacy Policy
            </button>

            <span className="text-[#CBD5E1]">•</span>

            <button
              type="button"
              onClick={() => setModalContent('terms')}
              className="hover:text-[#168C89] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Policy Modal Dialog */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl max-w-lg w-full p-6 space-y-4 text-[#172638] text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#142B4A]">
                {modalContent === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button
                type="button"
                onClick={() => setModalContent(null)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#172638] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[#64748B] max-h-80 overflow-y-auto leading-relaxed pr-1">
              {modalContent === 'privacy' ? (
                <>
                  <p>
                    <strong>Data Privacy & Security:</strong> AI Personal Career Counselor processes your education details, assessment responses, and skill profiles solely to generate personalized career recommendations and guidance roadmaps.
                  </p>
                  <p>
                    <strong>No Data Selling:</strong> We do not sell, rent, or monetize personal student data. All authenticated sessions and profile records are secured via end-to-end encrypted databases.
                  </p>
                  <p>
                    <strong>Your Controls:</strong> You maintain full control over your saved profile information, resume files, and assessment history, and may clear or update your records at any time.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Educational Advisory Nature:</strong> AI Personal Career Counselor provides psychometric and career discovery insights based on algorithmic models and knowledge bases.
                  </p>
                  <p>
                    <strong>Statutory Requirements:</strong> Guidance suggestions and career matches do not substitute for formal statutory licensing exams (such as Bar Council, Medical Council, or ICAI regulations).
                  </p>
                  <p>
                    <strong>Acceptable Use:</strong> Users agree to provide truthful academic information and use platform tools for personal educational and career development purposes.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setModalContent(null)}
                className="px-4 py-2 rounded-xl bg-[#142B4A] hover:bg-[#0E1F36] text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default AppFooter;
