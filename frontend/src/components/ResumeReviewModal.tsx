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
  FileText,
  ShieldCheck,
} from 'lucide-react';
import type { EducationDetails } from '../lib/educationTaxonomy';
import type { SkillsAndExperienceDetails, ExperienceItem, StructuredProject, UserSkill } from '../lib/skillsTaxonomy';
import {
  type ExtractedResumeData,
  compareResumeWithOnboarding,
} from '../lib/resumeReview';

export interface ResumeEnrichmentPayload {
  skillsToAdd: UserSkill[];
  experiencesToAdd: ExperienceItem[];
  projectsToAdd: StructuredProject[];
  resolvedConflicts: Record<string, { value: string; source: 'onboarding' | 'resume' }>;
  resumeMetadata: Record<string, any>;
}

interface ResumeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedResume: ExtractedResumeData;
  onboardingEdu?: EducationDetails;
  onboardingSkills?: SkillsAndExperienceDetails;
  onApplyEnrichment: (enriched: ResumeEnrichmentPayload) => void;
}

export const ResumeReviewModal: React.FC<ResumeReviewModalProps> = ({
  isOpen,
  onClose,
  extractedResume,
  onboardingEdu,
  onboardingSkills,
  onApplyEnrichment,
}) => {
  // Compute comparison report
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

  // Education conflict resolution state
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
    // Collect new skills with explicit provenance = 'resume_extracted' and NO auto-intermediate rating
    const skillsToAdd: UserSkill[] = initialReport.skillsComparison
      .filter((s) => s.category === 'additional_found' && selectedNewSkills.has(s.name))
      .map((s) => ({
        id: `res_skill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: s.name,
        category: 'other',
        skill_classification: s.skillClassification || 'technical',
        proficiency: 'not_sure', // Explicit: Never auto-assigned intermediate
        provenance: 'resume_extracted',
        is_custom: true,
      }));

    // Collect experience items
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

    // Collect projects to import into structured_projects with provenance = 'resume_extracted'
    const projectsToAdd: StructuredProject[] = [];
    initialReport.suggestedProjects.forEach((proj) => {
      if (selectedProjects[proj.id]) {
        projectsToAdd.push({
          id: proj.id,
          title: proj.title,
          project_type: 'personal_curiosity',
          problem_solved: proj.problem_solved || proj.description || '',
          individual_contribution: proj.individual_contribution || proj.role || 'Contributor',
          technologies: proj.technologies || [],
          outcome_or_learning: proj.outcome_or_learning || proj.description || '',
          provenance: 'resume_extracted',
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
      imported_projects_count: projectsToAdd.length,
      reviewed_at: new Date().toISOString(),
      provenance: {
        skills: 'resume_extracted',
        education_conflicts: resolvedConflicts,
      },
    };

    onApplyEnrichment({
      skillsToAdd,
      experiencesToAdd,
      projectsToAdd,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center text-[#168C89]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#172638]">Review & Reconcile Resume</h2>
              <p className="text-xs text-[#64748B]">
                Confirm extracted items and resolve discrepancies before updating your profile.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#172638] rounded-lg hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'skills'
                ? 'border-[#168C89] text-[#168C89] bg-white shadow-2xs'
                : 'border-transparent text-[#64748B] hover:text-[#172638]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Skills ({newSkills.length} new)
          </button>

          {initialReport.educationConflicts.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('education')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'education'
                  ? 'border-amber-600 text-amber-900 bg-white shadow-2xs'
                  : 'border-transparent text-amber-700 hover:text-amber-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Education Discrepancies ({initialReport.educationConflicts.length})
            </button>
          )}

          {(initialReport.suggestedExperiences.length > 0 || initialReport.suggestedProjects.length > 0) && (
            <button
              type="button"
              onClick={() => setActiveTab('experience')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'experience'
                  ? 'border-[#168C89] text-[#168C89] bg-white shadow-2xs'
                  : 'border-transparent text-[#64748B] hover:text-[#172638]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Projects & Experience ({initialReport.suggestedExperiences.length + initialReport.suggestedProjects.length})
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SKILLS */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              {/* Evidence Provenance Notice */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 font-medium">Evidence Provenance Guardrail:</strong> Extracted resume skills are imported with unverified status (<code className="bg-slate-200/80 px-1 py-0.5 rounded text-[11px]">resume_extracted</code>). They are not automatically granted intermediate or expert proficiency without demonstration.
                </p>
              </div>

              {/* Stats overview banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                  <p className="text-xl font-bold text-slate-900">{newSkills.length}</p>
                  <p className="text-[11px] font-medium text-slate-500">Found in Resume</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                  <p className="text-xl font-bold text-slate-900">{alreadySkills.length}</p>
                  <p className="text-[11px] font-medium text-slate-500">Already Confirmed</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                  <p className="text-xl font-bold text-slate-900">{onboardingOnlySkills.length}</p>
                  <p className="text-[11px] font-medium text-slate-500">From Onboarding Only</p>
                </div>
              </div>

              {/* New skills section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                      Add Newly Discovered Skills ({selectedNewSkills.size}/{newSkills.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Uncheck any skills from your resume that you do not want included in your profile.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllSkills}
                      className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllSkills}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {newSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    {newSkills.map((s) => {
                      const isSelected = selectedNewSkills.has(s.name);
                      return (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => toggleSkill(s.name)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : null}
                          <span>{s.name}</span>
                          <span className={`text-[10px] ml-1 px-1.5 py-0.2 rounded font-normal ${
                            isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {s.skillClassification || 'tech'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                    No new skills discovered. All resume skills are already represented.
                  </div>
                )}
              </div>

              {/* Already in profile */}
              {alreadySkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Confirmed in Both Resume & Onboarding ({alreadySkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {alreadySkills.map((s) => (
                      <span
                        key={s.name}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                      >
                        <CheckCircle2 className="w-3 h-3 text-slate-600" />
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Discrepancy Detected</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Your uploaded resume has slightly different details than what you entered in Step 2. Select which version you would like to keep for your verified profile.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {initialReport.educationConflicts.map((c) => {
                  const currentChoice = conflictChoices[c.field] || 'onboarding';
                  return (
                    <div key={c.field} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          {c.label}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                          Choose preferred version
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option 1: Onboarding Value */}
                        <label
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                            currentChoice === 'onboarding'
                              ? 'border-slate-900 bg-slate-50/80 shadow-2xs'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`conflict_${c.field}`}
                            checked={currentChoice === 'onboarding'}
                            onChange={() =>
                              setConflictChoices((prev) => ({
                                ...prev,
                                [c.field]: 'onboarding',
                              }))
                            }
                            className="mt-0.5 text-slate-900 focus:ring-slate-900"
                          />
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                              From Your Onboarding Input
                            </span>
                            <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                              {c.onboardingValue || '(Empty)'}
                            </span>
                          </div>
                        </label>

                        {/* Option 2: Resume Value */}
                        <label
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                            currentChoice === 'resume'
                              ? 'border-slate-900 bg-slate-50/80 shadow-2xs'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`conflict_${c.field}`}
                            checked={currentChoice === 'resume'}
                            onChange={() =>
                              setConflictChoices((prev) => ({
                                ...prev,
                                [c.field]: 'resume',
                              }))
                            }
                            className="mt-0.5 text-slate-900 focus:ring-slate-900"
                          />
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                              Found in Uploaded Resume
                            </span>
                            <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                              {c.resumeValue || '(Empty)'}
                            </span>
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
              {/* Structured Projects */}
              {initialReport.suggestedProjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-700" />
                    Projects ({initialReport.suggestedProjects.length})
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Select projects to add to your practical evidence portfolio (<code className="text-[11px]">resume_extracted</code>):
                  </p>
                  <div className="space-y-2.5">
                    {initialReport.suggestedProjects.map((proj) => {
                      const isChecked = Boolean(selectedProjects[proj.id]);
                      return (
                        <label
                          key={proj.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-slate-900 bg-slate-50/50 shadow-2xs'
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
                            className="mt-1 rounded text-slate-900 focus:ring-slate-900"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900">{proj.title}</p>
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {proj.role || 'Contributor'}
                              </span>
                            </div>
                            {proj.technologies && proj.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {proj.technologies.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            {proj.description && (
                              <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
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

              {/* Work Experience */}
              {initialReport.suggestedExperiences.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-700" />
                    Work Experience ({initialReport.suggestedExperiences.length})
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Select roles you want to import into your profile experience records:
                  </p>
                  <div className="space-y-2.5">
                    {initialReport.suggestedExperiences.map((exp) => {
                      const isChecked = Boolean(selectedExperiences[exp.id]);
                      return (
                        <label
                          key={exp.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-slate-900 bg-slate-50/50 shadow-2xs'
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
                            className="mt-1 rounded text-slate-900 focus:ring-slate-900"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900">{exp.title}</p>
                              {exp.duration && (
                                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  {exp.duration}
                                </span>
                              )}
                            </div>
                            {exp.organization && (
                              <p className="text-xs font-medium text-slate-600 mt-0.5">
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#64748B] hover:text-[#172638] px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Keep Original Profile (Skip Enrichment)
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="bg-[#142B4A] hover:bg-[#0E1F36] text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>Apply Selected Enrichment ({totalSelections})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
