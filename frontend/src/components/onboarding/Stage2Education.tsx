import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import type { OnboardingRecord } from '../../lib/onboarding';
import {
  type EducationDetails,
  type EducationLevel,
  type EducationStatus,
  type CertificationOrCourse,
  EDUCATION_LEVELS,
  DEGREE_CATALOG,
  getStudyStageOptions,
} from '../../lib/educationTaxonomy';

interface Stage2EducationProps {
  data: Partial<OnboardingRecord>;
  onChange: (patch: Partial<OnboardingRecord>) => void;
}

const COMMON_SUBJECTS = [
  'Financial Accounting',
  'Cost Accounting & Taxation',
  'Auditing & Assurance',
  'Economics & Macroeconomics',
  'Calculus & Linear Algebra',
  'Probability & Statistics',
  'Discrete Mathematics',
  'Data Structures & Algorithms',
  'Database Management & SQL',
  'Web Development & JavaScript',
  'Computer Networks & OS',
  'English Literature & Criticism',
  'Creative & Technical Writing',
  'Cognitive Linguistics',
  'Marketing & Brand Strategy',
  'Organizational Behavior',
  'Physics & Thermodynamics',
  'Chemistry & Biochemistry',
  'General Science & Biology',
];

export const Stage2Education: React.FC<Stage2EducationProps> = ({ data, onChange }) => {
  const edu: EducationDetails = data.education_details || {
    education_level: 'undergraduate',
    education_status: 'currently_studying',
    degree: '', // Explicit: NO automatic default to btech_be!
    specialization: '',
    institution: '',
    study_stage_type: 'year',
    study_stage_value: '1st Year',
    academic_strengths: [],
    subjects_enjoyed: [],
    certifications_and_courses: [],
  };

  const [customStrength, setCustomStrength] = useState('');
  const [customEnjoyed, setCustomEnjoyed] = useState('');
  const [newCertName, setNewCertName] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [showCertForm, setShowCertForm] = useState(false);

  const updateEdu = (patch: Partial<EducationDetails>) => {
    const updated = { ...edu, ...patch };
    onChange({
      education_details: updated,
      college: updated.institution || data.college,
      course: updated.degree || data.course,
      year: updated.study_stage_value || data.year,
    });
  };

  const currentLevelConfig = DEGREE_CATALOG[edu.education_level] || [];
  const currentDegConfig = currentLevelConfig.find((d) => d.id === edu.degree);
  const stageOptions = getStudyStageOptions(currentDegConfig);

  // Toggle Academic Strength
  const toggleStrength = (sub: string) => {
    const current = edu.academic_strengths || [];
    const updated = current.includes(sub) ? current.filter((s) => s !== sub) : [...current, sub];
    updateEdu({ academic_strengths: updated });
  };

  const addCustomStrength = () => {
    if (!customStrength.trim()) return;
    const current = edu.academic_strengths || [];
    if (!current.includes(customStrength.trim())) {
      updateEdu({ academic_strengths: [...current, customStrength.trim()] });
    }
    setCustomStrength('');
  };

  // Toggle Subject Enjoyed
  const toggleEnjoyed = (sub: string) => {
    const current = edu.subjects_enjoyed || [];
    const updated = current.includes(sub) ? current.filter((s) => s !== sub) : [...current, sub];
    updateEdu({ subjects_enjoyed: updated });
  };

  const addCustomEnjoyed = () => {
    if (!customEnjoyed.trim()) return;
    const current = edu.subjects_enjoyed || [];
    if (!current.includes(customEnjoyed.trim())) {
      updateEdu({ subjects_enjoyed: [...current, customEnjoyed.trim()] });
    }
    setCustomEnjoyed('');
  };

  // Add Certification
  const handleAddCert = () => {
    if (!newCertName.trim()) return;
    const certs = edu.certifications_and_courses || [];
    const newCert: CertificationOrCourse = {
      name: newCertName.trim(),
      issuer_or_platform: newCertIssuer.trim() || 'Online / Independent',
    };
    updateEdu({ certifications_and_courses: [...certs, newCert] });
    setNewCertName('');
    setNewCertIssuer('');
    setShowCertForm(false);
  };

  const handleRemoveCert = (idx: number) => {
    const certs = edu.certifications_and_courses || [];
    updateEdu({ certifications_and_courses: certs.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-left space-y-1.5 border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider">
          Stage 2 of 6
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Your Education & Learning Background
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          We understand that your academic journey is more than just your degree title. Tell us where you studied, what you excelled in, and what you loved learning.
        </p>
      </div>

      {/* 1. Core Degree Details */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-slate-600" /> Academic Program & Stage
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Education Level */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Education Level <span className="text-rose-500">*</span>
            </label>
            <select
              value={edu.education_level}
              onChange={(e) => {
                const lvl = e.target.value as EducationLevel;
                updateEdu({
                  education_level: lvl,
                  degree: '', // Reset degree so no wrong default is forced
                  specialization: '',
                });
              }}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {EDUCATION_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Status */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Current Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={edu.education_status}
              onChange={(e) => updateEdu({ education_status: e.target.value as EducationStatus })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="currently_studying">Currently Studying / Pursuing</option>
              <option value="completed">Completed / Graduated</option>
              <option value="gap_year">Gap Year / Exam Preparation</option>
              <option value="discontinued">Discontinued / Career Switch</option>
            </select>
          </div>
        </div>

        {/* Degree Selection (Categorized options, clean search/select) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Degree / Program <span className="text-rose-500">*</span>
            </label>
            <select
              value={edu.degree}
              onChange={(e) => updateEdu({ degree: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">-- Select Degree / Program --</option>
              {currentLevelConfig.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
              <option value="other">Other Degree / Custom Program</option>
            </select>
            {edu.degree === 'other' && (
              <input
                type="text"
                placeholder="Enter degree name (e.g. B.Voc, Dual Degree)"
                value={edu.degree_other || ''}
                onChange={(e) => updateEdu({ degree_other: e.target.value })}
                className="mt-2 w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900"
              />
            )}
          </div>

          {/* Specialization / Major */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Specialization / Major
            </label>
            <input
              type="text"
              placeholder="e.g. Accounting, Computer Science, Literature, General"
              value={edu.specialization || ''}
              onChange={(e) => updateEdu({ specialization: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Institution & Year Stage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              College / University Name
            </label>
            <input
              type="text"
              placeholder="e.g. Delhi University, Christ University, VIT"
              value={edu.institution || ''}
              onChange={(e) => updateEdu({ institution: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Academic Stage / Year <span className="text-rose-500">*</span>
            </label>
            <select
              value={edu.study_stage_value}
              onChange={(e) => updateEdu({ study_stage_value: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {stageOptions.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Academic Strengths (Subjects Excelled In) */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Academic Strengths (Where you achieved top marks or performed best)
            </label>
            <span className="text-[11px] text-slate-400">Select or enter 2-4 subjects</span>
          </div>
          <p className="text-xs text-slate-500">
            Highlights your analytical, quantitative, verbal, or conceptual foundations.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
          {COMMON_SUBJECTS.map((sub) => {
            const isSelected = (edu.academic_strengths || []).includes(sub);
            return (
              <button
                key={sub}
                type="button"
                onClick={() => toggleStrength(sub)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white font-medium shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {sub}
              </button>
            );
          })}
        </div>

        {/* Custom Subject Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a specific subject not listed above..."
            value={customStrength}
            onChange={(e) => setCustomStrength(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomStrength();
              }
            }}
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <button
            type="button"
            onClick={addCustomStrength}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      {/* 3. Subjects Truly Enjoyed (Intrinsic Interest vs Grades) */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Subjects You Genuinely Enjoyed Learning
            </label>
            <span className="text-[11px] text-slate-400">Separates passion from grades</span>
          </div>
          <p className="text-xs text-slate-500">
            Often different from your top scores — which subjects felt engaging, exciting, or easy to lose track of time in?
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
          {COMMON_SUBJECTS.map((sub) => {
            const isSelected = (edu.subjects_enjoyed || []).includes(sub);
            return (
              <button
                key={sub}
                type="button"
                onClick={() => toggleEnjoyed(sub)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-700 text-white font-medium shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {sub}
              </button>
            );
          })}
        </div>

        {/* Custom Subject Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add another subject you loved learning..."
            value={customEnjoyed}
            onChange={(e) => setCustomEnjoyed(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomEnjoyed();
              }
            }}
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <button
            type="button"
            onClick={addCustomEnjoyed}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      {/* 4. Certifications & Online Courses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Certifications, Online Courses & Bootcamps
            </label>
            <p className="text-xs text-slate-500">
              Include relevant non-college coursework (Coursera, Udemy, NPTEL, YouTube series, or industry credentials).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCertForm(!showCertForm)}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Course
          </button>
        </div>

        {/* Existing Certifications List */}
        {(edu.certifications_and_courses || []).length > 0 && (
          <div className="space-y-2">
            {(edu.certifications_and_courses || []).map((c, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white shadow-2xs text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="font-semibold text-slate-900 block">{c.name}</span>
                    <span className="text-slate-500 text-[11px]">{c.issuer_or_platform}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCert(idx)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Cert Form Drawer */}
        {showCertForm && (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Course or Certification Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python for Data Science"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Platform or Provider
                </label>
                <input
                  type="text"
                  placeholder="e.g. Coursera, NPTEL, Udemy"
                  value={newCertIssuer}
                  onChange={(e) => setNewCertIssuer(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCertForm(false)}
                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCert}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Save Course
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
