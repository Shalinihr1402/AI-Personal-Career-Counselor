import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Layers,
  ArrowRight,
  Check,
  Plus,
} from 'lucide-react';
import type { EducationDetails } from '../lib/educationTaxonomy';
import type { SkillsAndExperienceDetails, ExperienceItem } from '../lib/skillsTaxonomy';
import {
  type ExtractedResumeData,
  compareResumeWithOnboarding,
} from '../lib/resumeReview';

interface ResumeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedResume: ExtractedResumeData;
  onboardingEdu?: EducationDetails;
  onboardingSkills?: SkillsAndExperienceDetails;
  onApplyEnrichment: (enriched: {
    skillsToAdd: string[];
    experiencesToAdd: ExperienceItem[];
    resolvedConflicts: Record<string, { value: string; source: 'onboarding' | 'resume' }>;
    resumeMetadata: Record<string, any>;
  }) => void;
}

export const ResumeReviewModal: React.FC<ResumeReviewModalProps> = ({
  isOpen,
  onClose,
  extractedResume,
  onboardingEdu,
  onboardingSkills,
  onApplyEnrichment,
}) => {
  // Compute initial comparison report
  const initialReport = useMemo(() => {
    return compareResumeWithOnboarding(extractedResume, onboardingEdu, onboardingSkills);
  }, [extractedResume, onboardingEdu, onboardingSkills]);

  // Selected new skills state
  const [selectedNewSkills, setSelectedNewSkills] = useState<Set<string>>(() => {
    const set = new Set<string>();
    initialReport.skillsComparison
      .filter((s) => s.category === 'additional_found')
      .forEach((s) => set.add(s.name));
    return set;
  });

  // Education conflict resolution state (field -> 'onboarding' | 'resume')
  const [conflictChoices, setConflictChoices] = useState<Record<string, 'onboarding' | 'resume'>>(() => {
    const map: Record<string, 'onboarding' | 'resume'> = {};
    initialReport.educationConflicts.forEach((c) => {
      map[c.field] = c.resolvedSource;
    });
    return map;
  });

  // Selected experiences state
  const [selectedExperiences, setSelectedExperiences] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialReport.suggestedExperiences.forEach((e) => {
      map[e.id] = true;
    });
    return map;
  });

  // Selected projects state
  const [selectedProjects, setSelectedProjects] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialReport.suggestedProjects.forEach((p) => {
      map[p.id] = true;
    });
    return map;
  });

  // Active review tab
  const [activeTab, setActiveTab] = useState<'skills' | 'education' | 'experience'>('skills');

  if (!isOpen) return null;

  const toggleSkill = (skillName: string) => {
    setSelectedNewSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillName)) next.delete(skillName);
      else next.add(skillName);
      return next;
    });
  };

  const selectAllSkills = () => {
    const next = new Set<string>();
    initialReport.skillsComparison
      .filter((s) => s.category === 'additional_found')
      .forEach((s) => next.add(s.name));
    setSelectedNewSkills(next);
  };

  const deselectAllSkills = () => {
    setSelectedNewSkills(new Set());
  };

  const handleApply = () => {
    // Collect new skills
    const skillsToAdd = Array.from(selectedNewSkills);

    // Collect experience items to import
    const experiencesToAdd: ExperienceItem[] = [];
    initialReport.suggestedExperiences.forEach((exp) => {
      if (selectedExperiences[exp.id]) {
        experiencesToAdd.push({
          id: exp.id,
          type: exp.type,
          title: exp.title,
          organization: exp.organization,
          role: exp.role,
          duration: exp.duration,
          technologies: exp.technologies,
          description: exp.description,
        });
      }
    });

    // Collect projects to import
    initialReport.suggestedProjects.forEach((proj) => {
      if (selectedProjects[proj.id]) {
        experiencesToAdd.push({
          id: proj.id,
          type: 'personal_projects',
          title: proj.title,
          organization: '',
          role: proj.role,
          duration: '',
          technologies: proj.technologies,
          description: proj.description,
        });
      }
    });

    // Collect resolved conflicts
    const resolvedConflicts: Record<string, { value: string; source: 'onboarding' | 'resume' }> = {};
    initialReport.educationConflicts.forEach((c) => {
      const choice = conflictChoices[c.field] || 'onboarding';
      resolvedConflicts[c.field] = {
        value: choice === 'onboarding' ? c.onboardingValue : c.resumeValue,
        source: choice,
      };
    });

    const resumeMetadata = {
      filename: extractedResume.metadata?.filename,
      file_type: extractedResume.metadata?.file_type,
      imported_skills_count: skillsToAdd.length,
      imported_experiences_count: experiencesToAdd.length,
      reviewed_at: new Date().toISOString(),
      provenance: {
        skills: 'user_confirmed_resume',
        education_conflicts: resolvedConflicts,
      },
    };

    onApplyEnrichment({
      skillsToAdd,
      experiencesToAdd,
      resolvedConflicts,
      resumeMetadata,
    });
  };

  const newSkills = initialReport.skillsComparison.filter((s) => s.category === 'additional_found');
  const alreadySkills = initialReport.skillsComparison.filter((s) => s.category === 'already_provided');
  const onboardingOnlySkills = initialReport.skillsComparison.filter((s) => s.category === 'onboarding_only');

  const totalSelections =
    selectedNewSkills.size +
    Object.values(selectedExperiences).filter(Boolean).length +
    Object.values(selectedProjects).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Review & Enrich Profile</h2>
                <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2.5 py-0.5 rounded-full">
                  AI Extracted
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare resume findings with your answers and choose what to apply to your profile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`py-3.5 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'skills'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Skills ({newSkills.length} new)
          </button>

          {initialReport.educationConflicts.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('education')}
              className={`py-3.5 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'education'
                  ? 'border-purple-600 text-purple-700 bg-white'
                  : 'border-transparent text-amber-600 hover:text-amber-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Education ({initialReport.educationConflicts.length} conflict)
            </button>
          )}

          {(initialReport.suggestedExperiences.length > 0 || initialReport.suggestedProjects.length > 0) && (
            <button
              type="button"
              onClick={() => setActiveTab('experience')}
              className={`py-3.5 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'experience'
                  ? 'border-purple-600 text-purple-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Experience & Projects (
              {initialReport.suggestedExperiences.length + initialReport.suggestedProjects.length})
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SKILLS */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              {/* Stats overview banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                  <p className="text-xl font-extrabold text-emerald-700">{newSkills.length}</p>
                  <p className="text-xs font-semibold text-emerald-600">New Skills in Resume</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3 text-center">
                  <p className="text-xl font-extrabold text-purple-700">{alreadySkills.length}</p>
                  <p className="text-xs font-semibold text-purple-600">Already in Profile</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                  <p className="text-xl font-extrabold text-slate-700">{onboardingOnlySkills.length}</p>
                  <p className="text-xs font-semibold text-slate-500">From Onboarding Only</p>
                </div>
              </div>

              {/* New skills section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Add Newly Discovered Skills ({selectedNewSkills.size}/{newSkills.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      These skills were detected in your resume. Check the ones you want to add.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllSkills}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-800 px-2.5 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      Select all
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllSkills}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {newSkills.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-sm text-slate-500">
                      No additional skills detected beyond what you already selected!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {newSkills.map((s) => {
                      const isSelected = selectedNewSkills.has(s.name);
                      return (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => toggleSkill(s.name)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/30'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Already provided section */}
              {alreadySkills.length > 0 && (
                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Already Included in Profile ({alreadySkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {alreadySkills.map((s) => (
                      <span
                        key={s.name}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
                      >
                        <CheckCircle2 className="w-3 h-3 text-purple-600" />
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDUCATION CONFLICTS */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Discrepancy Detected</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Your uploaded resume has slightly different details than what you entered in Step 2. Select
                    which version you would like to keep for your career profile.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {initialReport.educationConflicts.map((c) => {
                  const currentChoice = conflictChoices[c.field] || 'onboarding';
                  return (
                    <div key={c.field} className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {c.label}
                        </span>
                        <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
                          Choose preferred value
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option 1: Onboarding Value */}
                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            currentChoice === 'onboarding'
                              ? 'border-purple-600 bg-purple-50/50 text-purple-950 ring-1 ring-purple-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`conflict_${c.field}`}
                            checked={currentChoice === 'onboarding'}
                            onChange={() =>
                              setConflictChoices((prev) => ({ ...prev, [c.field]: 'onboarding' }))
                            }
                            className="mt-0.5 text-purple-600 focus:ring-purple-500"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-700">Onboarding Answer</span>
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                Step 2
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 mt-1">{c.onboardingValue}</p>
                          </div>
                        </label>

                        {/* Option 2: Resume Value */}
                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            currentChoice === 'resume'
                              ? 'border-purple-600 bg-purple-50/50 text-purple-950 ring-1 ring-purple-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`conflict_${c.field}`}
                            checked={currentChoice === 'resume'}
                            onChange={() =>
                              setConflictChoices((prev) => ({ ...prev, [c.field]: 'resume' }))
                            }
                            className="mt-0.5 text-purple-600 focus:ring-purple-500"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-purple-700">Resume Value</span>
                              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-medium">
                                From file
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 mt-1">{c.resumeValue}</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EXPERIENCE & PROJECTS */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              {/* Work Experience */}
              {initialReport.suggestedExperiences.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    Work Experience ({initialReport.suggestedExperiences.length})
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Select roles you want to import directly into your profile experience records:
                  </p>
                  <div className="space-y-2.5">
                    {initialReport.suggestedExperiences.map((exp) => {
                      const isChecked = Boolean(selectedExperiences[exp.id]);
                      return (
                        <label
                          key={exp.id}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-purple-400 bg-purple-50/20 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setSelectedExperiences((prev) => ({
                                ...prev,
                                [exp.id]: e.target.checked,
                              }))
                            }
                            className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-slate-900">{exp.title}</p>
                              {exp.duration && (
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {exp.duration}
                                </span>
                              )}
                            </div>
                            {exp.organization && (
                              <p className="text-xs font-semibold text-purple-700 mt-0.5">
                                {exp.organization}
                              </p>
                            )}
                            {exp.description && (
                              <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Projects */}
              {initialReport.suggestedProjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Projects ({initialReport.suggestedProjects.length})
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Select projects to add to your practical experience list:
                  </p>
                  <div className="space-y-2.5">
                    {initialReport.suggestedProjects.map((proj) => {
                      const isChecked = Boolean(selectedProjects[proj.id]);
                      return (
                        <label
                          key={proj.id}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-purple-400 bg-purple-50/20 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setSelectedProjects((prev) => ({
                                ...prev,
                                [proj.id]: e.target.checked,
                              }))
                            }
                            className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{proj.title}</p>
                            {proj.technologies && proj.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {proj.technologies.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            {proj.description && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {proj.description}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Highlights */}
              {extractedResume.additional_info && (
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Additional Highlights Detected
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(extractedResume.additional_info?.certifications || []).length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">Certifications:</span>
                        <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                          {(extractedResume.additional_info?.certifications || []).slice(0, 3).map((c, i) => (
                            <li key={i} className="truncate">{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(extractedResume.additional_info?.achievements || []).length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">Achievements:</span>
                        <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                          {(extractedResume.additional_info?.achievements || []).slice(0, 3).map((a, i) => (
                            <li key={i} className="truncate">{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl transition-colors"
          >
            Keep Original Profile (Skip Enrichment)
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 active:scale-[0.98]"
          >
            Apply Selected Enrichment ({totalSelections}) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
