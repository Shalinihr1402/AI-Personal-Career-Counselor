import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  BarChart2,
  Heart,
  Award,
  Plus,
  Trash2,
  X,
  School,
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

const COMMON_STRENGTH_SUGGESTIONS = [
  'Web Development',
  'Data Structures',
  'Java Programming',
  'Database Management',
  'Financial Accounting',
  'Economics',
  'Discrete Mathematics',
  'English Literature',
  'Algorithms',
  'Cost Accounting',
];

const COMMON_ENJOYED_SUGGESTIONS = [
  'AI & Machine Learning',
  'System Design',
  'Software Engineering',
  'Problem Solving',
  'UI/UX Design',
  'Financial Modeling',
  'Creative Writing',
  'Statistics & Probability',
  'Marketing Strategy',
  'Cybersecurity',
];

export const Stage2Education: React.FC<Stage2EducationProps> = ({ data, onChange }) => {
  const edu: EducationDetails = data.education_details || {
    education_level: 'undergraduate',
    education_status: '' as unknown as EducationStatus,
    degree: '', // Explicit: NO automatic default to btech_be!
    specialization: '',
    institution: '',
    study_stage_type: 'year',
    study_stage_value: '',
    graduation_year: '',
    last_attended_stage: '',
    academic_strengths: [],
    subjects_enjoyed: [],
    certifications_and_courses: [],
  };

  const [customStrength, setCustomStrength] = useState('');
  const [showAddStrength, setShowAddStrength] = useState(false);
  const [customEnjoyed, setCustomEnjoyed] = useState('');
  const [showAddEnjoyed, setShowAddEnjoyed] = useState(false);
  const [newCertName, setNewCertName] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [showCertForm, setShowCertForm] = useState(false);

  const updateEdu = (patch: Partial<EducationDetails>) => {
    const updated = { ...edu, ...patch };
    let yearDisplay = updated.study_stage_value;
    if (updated.education_status === 'completed') {
      yearDisplay = updated.graduation_year ? `Graduated ${updated.graduation_year}` : 'Graduated';
    } else if (updated.education_status === 'discontinued') {
      yearDisplay = updated.last_attended_stage ? `Discontinued (${updated.last_attended_stage})` : 'Discontinued';
    } else if (updated.education_status === 'study_break' || updated.education_status === 'gap_year') {
      yearDisplay = updated.last_attended_stage ? `Study Break (${updated.last_attended_stage})` : 'On Study Break';
    }

    onChange({
      education_details: updated,
      college: updated.institution !== undefined ? (updated.institution || '') : data.college,
      course: updated.degree || data.course,
      year: yearDisplay || data.year,
    });
  };

  const handleStatusChange = (newStatus: EducationStatus | '') => {
    if (!newStatus) {
      updateEdu({
        education_status: '' as any,
        study_stage_value: '',
        graduation_year: '',
        last_attended_stage: '',
      });
      return;
    }

    if (newStatus === 'currently_studying') {
      updateEdu({
        education_status: 'currently_studying',
        graduation_year: '',
        last_attended_stage: '',
        study_stage_value: edu.study_stage_value || '',
      });
    } else if (newStatus === 'completed') {
      updateEdu({
        education_status: 'completed',
        // Clear contradictory current-year value
        study_stage_value: '',
        last_attended_stage: '',
        graduation_year: edu.graduation_year || '',
      });
    } else if (newStatus === 'discontinued' || newStatus === 'study_break') {
      updateEdu({
        education_status: newStatus,
        // Clear contradictory current-year & graduation_year values
        study_stage_value: '',
        graduation_year: '',
        last_attended_stage: edu.last_attended_stage || '',
      });
    }
  };

  const currentLevelConfig = DEGREE_CATALOG[edu.education_level] || [];
  const currentDegConfig = currentLevelConfig.find((d) => d.id === edu.degree);
  const stageOptions = getStudyStageOptions(
    currentDegConfig,
    edu.study_stage_type === 'semester' ? 'semester' : 'year'
  );

  // Toggle or add Academic Strength
  const removeStrength = (sub: string) => {
    const current = edu.academic_strengths || [];
    updateEdu({ academic_strengths: current.filter((s) => s !== sub) });
  };

  const addStrength = (sub: string) => {
    const trimmed = sub.trim();
    if (!trimmed) return;
    const current = edu.academic_strengths || [];
    if (!current.includes(trimmed)) {
      updateEdu({ academic_strengths: [...current, trimmed] });
    }
    setCustomStrength('');
    setShowAddStrength(false);
  };

  // Toggle or add Subject Enjoyed
  const removeEnjoyed = (sub: string) => {
    const current = edu.subjects_enjoyed || [];
    updateEdu({ subjects_enjoyed: current.filter((s) => s !== sub) });
  };

  const addEnjoyed = (sub: string) => {
    const trimmed = sub.trim();
    if (!trimmed) return;
    const current = edu.subjects_enjoyed || [];
    if (!current.includes(trimmed)) {
      updateEdu({ subjects_enjoyed: [...current, trimmed] });
    }
    setCustomEnjoyed('');
    setShowAddEnjoyed(false);
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stage Header */}
      <div className="flex items-start gap-4 pb-2 border-b border-[#E2E8F0]">
        <div className="w-12 h-12 rounded-xl bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4] flex items-center justify-center shrink-0 shadow-xs">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172638] tracking-tight">
            Your Education & Learning Background
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
            Tell us about your academic journey, strengths, and the areas you enjoy learning.
          </p>
        </div>
      </div>

      {/* 1. Academic Details Subcard */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-[#172638] font-bold text-sm tracking-tight border-b border-[#E2E8F0] pb-3">
          <BookOpen className="w-4 h-4 text-[#168C89]" />
          <span>Academic Details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Education Level */}
          <div>
            <label className="block text-xs font-semibold text-[#172638] mb-1.5">
              Education Level <span className="text-[#168C89]">*</span>
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
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] transition-all"
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
            <label className="block text-xs font-semibold text-[#172638] mb-1.5">
              Academic Status <span className="text-[#168C89]">*</span>
            </label>
            <select
              value={edu.education_status === 'gap_year' ? 'study_break' : (edu.education_status || '')}
              onChange={(e) => handleStatusChange(e.target.value as EducationStatus)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] transition-all"
            >
              <option value="">Select Academic Status</option>
              <option value="currently_studying">Currently Studying</option>
              <option value="completed">Completed / Graduated</option>
              <option value="discontinued">Discontinued</option>
              <option value="study_break">On a Study Break</option>
            </select>
          </div>

          {/* Degree / Program */}
          <div>
            <label className="block text-xs font-semibold text-[#172638] mb-1.5">
              Degree / Program <span className="text-[#168C89]">*</span>
            </label>
            <select
              value={edu.degree}
              onChange={(e) => updateEdu({ degree: e.target.value })}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] transition-all"
            >
              <option value="">Select Degree / Program</option>
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
                className="mt-2 w-full text-xs px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
              />
            )}
          </div>

          {/* Specialization / Major */}
          <div>
            <label className="block text-xs font-semibold text-[#172638] mb-1.5">
              Specialization / Major <span className="text-[#168C89]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Computer Applications, Accounting, English Literature"
              value={edu.specialization || ''}
              onChange={(e) => updateEdu({ specialization: e.target.value })}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] transition-all"
            />
          </div>

          {/* College / University Name */}
          <div>
            <label className="block text-xs font-semibold text-[#172638] mb-1.5">
              College / University (Optional)
            </label>
            <div className="relative">
              <School className="w-4 h-4 text-[#168C89] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. GM University, Davanagere"
                value={edu.institution || ''}
                onChange={(e) => updateEdu({ institution: e.target.value })}
                className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] transition-all"
              />
            </div>
          </div>

          {/* Conditional Stage / Year Field */}
          {edu.education_status === 'currently_studying' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#172638]">
                  Current Year / Semester <span className="text-[#168C89]">*</span>
                </label>
                {Boolean(currentDegConfig?.totalSemesters) && (
                  <div className="inline-flex rounded-lg border border-[#E2E8F0] p-0.5 bg-[#F8FAFC] text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => updateEdu({ study_stage_type: 'year', study_stage_value: '' })}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        edu.study_stage_type !== 'semester'
                          ? 'bg-[#142B4A] text-white shadow-2xs'
                          : 'text-[#64748B] hover:text-[#172638]'
                      }`}
                    >
                      Year
                    </button>
                    <button
                      type="button"
                      onClick={() => updateEdu({ study_stage_type: 'semester', study_stage_value: '' })}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        edu.study_stage_type === 'semester'
                          ? 'bg-[#142B4A] text-white shadow-2xs'
                          : 'text-[#64748B] hover:text-[#172638]'
                      }`}
                    >
                      Semester
                    </button>
                  </div>
                )}
              </div>
              <select
                value={edu.study_stage_value || ''}
                onChange={(e) => updateEdu({ study_stage_value: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] transition-all"
              >
                <option value="">Select Current Year / Semester</option>
                {stageOptions.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          ) : edu.education_status === 'completed' ? (
            <div>
              <label className="block text-xs font-semibold text-[#172638] mb-1.5">
                Graduation Year <span className="text-[#64748B] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="e.g. 2024"
                value={edu.graduation_year || ''}
                onChange={(e) => updateEdu({ graduation_year: e.target.value.replace(/\D/g, '') })}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] transition-all"
              />
            </div>
          ) : edu.education_status === 'discontinued' || edu.education_status === 'study_break' || edu.education_status === 'gap_year' ? (
            <div>
              <label className="block text-xs font-semibold text-[#172638] mb-1.5">
                Last Completed Year / Semester <span className="text-[#64748B] font-normal">(Optional)</span>
              </label>
              <select
                value={edu.last_attended_stage || ''}
                onChange={(e) => updateEdu({ last_attended_stage: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] transition-all"
              >
                <option value="">Select Last Completed Stage (Optional)</option>
                {stageOptions.map((st) => (
                  <option key={st.id} value={st.id}>
                    Completed {st.label.replace(' (Final)', '').replace(' (Final Year)', '')}
                  </option>
                ))}
                <option value="Left in 1st Year">Left during 1st Year / Semester</option>
              </select>
            </div>
          ) : (
            <div className="opacity-75">
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                Academic Timeline / Stage
              </label>
              <div className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-[#94A3B8]">
                Select Academic Status above first
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2 & 3. Side-by-Side: Academic Strengths and Subjects Enjoyed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left Card: Academic Strengths */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-[#172638] font-bold text-xs uppercase tracking-wider mb-1">
              <BarChart2 className="w-4 h-4 text-[#168C89]" />
              <span>Academic Strengths</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-snug mb-3">
              Subjects or areas where you perform well.
            </p>

            {/* Selected Chips with X button */}
            <div className="flex flex-wrap gap-2 min-h-[40px] mb-3">
              {(edu.academic_strengths || []).map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4] shadow-2xs"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => removeStrength(sub)}
                    className="hover:text-[#172638] p-0.5 rounded-full"
                    title={`Remove ${sub}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {(edu.academic_strengths || []).length === 0 && !showAddStrength && (
                <span className="text-xs text-[#94A3B8] italic py-1">
                  No subjects selected yet. Pick below or type to add.
                </span>
              )}
            </div>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-1 mb-3 pt-2 border-t border-[#E2E8F0]">
              {COMMON_STRENGTH_SUGGESTIONS.filter(
                (s) => !(edu.academic_strengths || []).includes(s)
              )
                .slice(0, 4)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addStrength(s)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8FAFC] hover:bg-[#EAF5F4] border border-[#E2E8F0] text-[#64748B] hover:text-[#168C89] transition-colors"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>

          {/* Add Subject Input Pill */}
          <div>
            {showAddStrength ? (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Operating Systems"
                  value={customStrength}
                  onChange={(e) => setCustomStrength(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStrength(customStrength);
                    }
                  }}
                  autoFocus
                  className="flex-1 text-xs px-3.5 py-1.5 rounded-full border border-[#168C89] bg-white text-[#172638] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30"
                />
                <button
                  type="button"
                  onClick={() => addStrength(customStrength)}
                  className="px-3 py-1 text-xs font-bold rounded-full bg-[#142B4A] text-white hover:bg-[#0E1F36]"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStrength(false)}
                  className="px-2 py-1 text-xs text-[#64748B]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddStrength(true)}
                className="w-full text-xs font-medium py-1.5 px-3 rounded-full border border-dashed border-[#CBD5E1] text-[#64748B] hover:border-[#168C89] hover:text-[#168C89] hover:bg-[#EAF5F4]/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add a subject (e.g., Operating Systems)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Card: Subjects You Enjoy Learning */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-[#172638] font-bold text-xs uppercase tracking-wider mb-1">
              <Heart className="w-4 h-4 text-[#168C89]" />
              <span>Subjects You Enjoy Learning</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-snug mb-3">
              Topics that genuinely interest you and keep you engaged.
            </p>

            {/* Selected Chips with X button */}
            <div className="flex flex-wrap gap-2 min-h-[40px] mb-3">
              {(edu.subjects_enjoyed || []).map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4] shadow-2xs"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => removeEnjoyed(sub)}
                    className="hover:text-[#172638] p-0.5 rounded-full"
                    title={`Remove ${sub}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {(edu.subjects_enjoyed || []).length === 0 && !showAddEnjoyed && (
                <span className="text-xs text-[#94A3B8] italic py-1">
                  No subjects selected yet. Pick below or type to add.
                </span>
              )}
            </div>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-1 mb-3 pt-2 border-t border-[#E2E8F0]">
              {COMMON_ENJOYED_SUGGESTIONS.filter(
                (s) => !(edu.subjects_enjoyed || []).includes(s)
              )
                .slice(0, 4)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addEnjoyed(s)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8FAFC] hover:bg-[#EAF5F4] border border-[#E2E8F0] text-[#64748B] hover:text-[#168C89] transition-colors"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>

          {/* Add Subject Input Pill */}
          <div>
            {showAddEnjoyed ? (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. UI/UX, Cybersecurity"
                  value={customEnjoyed}
                  onChange={(e) => setCustomEnjoyed(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEnjoyed(customEnjoyed);
                    }
                  }}
                  autoFocus
                  className="flex-1 text-xs px-3.5 py-1.5 rounded-full border border-[#168C89] bg-white text-[#172638] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30"
                />
                <button
                  type="button"
                  onClick={() => addEnjoyed(customEnjoyed)}
                  className="px-3 py-1 text-xs font-bold rounded-full bg-[#142B4A] text-white hover:bg-[#0E1F36]"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEnjoyed(false)}
                  className="px-2 py-1 text-xs text-[#64748B]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddEnjoyed(true)}
                className="w-full text-xs font-medium py-1.5 px-3 rounded-full border border-dashed border-[#CBD5E1] text-[#64748B] hover:border-[#168C89] hover:text-[#168C89] hover:bg-[#EAF5F4]/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add a subject (e.g., UI/UX, Cybersecurity)</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 4. Certifications, Online Courses & Self-Learning */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div className="flex items-start gap-2.5">
            <Award className="w-5 h-5 text-[#168C89] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#172638] tracking-tight">
                Certifications, Online Courses & Self-Learning <span className="text-[#64748B] font-normal">(Optional)</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Any relevant courses, certifications, bootcamps, or independent learning.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCertForm(!showCertForm)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#142B4A] text-white text-xs font-semibold hover:bg-[#0E1F36] transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>
        </div>

        {/* Existing Certifications List */}
        {(edu.certifications_and_courses || []).length > 0 && (
          <div className="space-y-2.5">
            {(edu.certifications_and_courses || []).map((c, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#142B4A] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <GraduationCap className="w-4 h-4 text-[#168C89]" />
                  </div>
                  <div>
                    <span className="font-bold text-[#172638] block text-xs">{c.name}</span>
                    <span className="text-[#64748B] text-[11px]">
                      {c.issuer_or_platform} {c.year ? `• ${c.year}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[#64748B]">
                  <button
                    type="button"
                    onClick={() => handleRemoveCert(idx)}
                    className="hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
                    title="Remove course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Cert Form Drawer */}
        {showCertForm && (
          <div className="p-4 rounded-xl border border-[#C5E6E4] bg-[#EAF5F4]/50 space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#172638] mb-1">
                  Course or Certification Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python for Data Science"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#172638] mb-1">
                  Platform or Provider
                </label>
                <input
                  type="text"
                  placeholder="e.g. Coursera, NPTEL, Udemy"
                  value={newCertIssuer}
                  onChange={(e) => setNewCertIssuer(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCertForm(false)}
                className="px-3 py-1 text-xs text-[#64748B] hover:text-[#172638]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCert}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#142B4A] text-white hover:bg-[#0E1F36] shadow-xs"
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
