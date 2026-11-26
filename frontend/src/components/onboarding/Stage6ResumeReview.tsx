import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  AlertTriangle,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import type { OnboardingRecord } from '../../lib/onboarding';
import { ResumeReviewModal, type ResumeEnrichmentPayload } from '../ResumeReviewModal';
import type { ExtractedResumeData } from '../../lib/resumeReview';
import { API_BASE } from '../../lib/api';

interface Stage6ResumeReviewProps {
  data: Partial<OnboardingRecord>;
  onChange: (patch: Partial<OnboardingRecord>) => void;
  saveError: string | null;
}

export const Stage6ResumeReview: React.FC<Stage6ResumeReviewProps> = ({
  data,
  onChange,
  saveError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ExtractedResumeData | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Resume Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['pdf', 'docx', 'doc'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      setUploadError('Please upload a PDF (.pdf) or Word document (.docx, .doc).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds 5MB size limit.');
      return;
    }

    setUploadError(null);
    setResumeLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/api/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to process resume');
      }

      const parsed: ExtractedResumeData = await res.json();
      setParsedData(parsed);

      // Save raw resume metadata to profile
      onChange({
        resume: {
          name: file.name,
          skills: parsed.skills || [],
          education: parsed.education || [],
          experience: parsed.experience || [],
        },
      });

      // Automatically open review modal for non-destructive reconciliation
      setIsReviewModalOpen(true);
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred while parsing the resume.');
    } finally {
      setResumeLoading(false);
    }
  };

  // Non-destructive enrichment callback
  const handleApplyEnrichment = (enriched: ResumeEnrichmentPayload) => {
    const currentSe = data.skills_and_experience || {
      skills: [],
      custom_skills: [],
      experience_types: [],
      experiences: [],
      structured_projects: [],
      professional_duration: 'no_experience',
    };

    const currentSkills = currentSe.skills || [];
    const existingSkillNames = new Set(currentSkills.map((s) => s.name.toLowerCase()));

    // Filter skills that do not already exist, preserving their provenance = 'resume_extracted'
    const newSkills = enriched.skillsToAdd.filter(
      (s) => !existingSkillNames.has(s.name.toLowerCase())
    );

    const mergedSkills = [...currentSkills, ...newSkills];
    const mergedExperiences = [...currentSe.experiences, ...enriched.experiencesToAdd];

    // Merge structured projects without overwriting
    const existingProjects = currentSe.structured_projects || [];
    const existingProjTitles = new Set(existingProjects.map((p) => p.title.toLowerCase()));
    const newProjects = enriched.projectsToAdd.filter(
      (p) => !existingProjTitles.has(p.title.toLowerCase())
    );
    const mergedProjects = [...existingProjects, ...newProjects];

    const updatedSe = {
      ...currentSe,
      skills: mergedSkills,
      experiences: mergedExperiences,
      structured_projects: mergedProjects,
      has_no_standalone_projects: mergedProjects.length > 0 ? false : currentSe.has_no_standalone_projects,
    };

    // Education conflict resolution without silent overwrites
    let updatedEdu = data.education_details;
    if (enriched.resolvedConflicts && updatedEdu) {
      const rc = enriched.resolvedConflicts;
      updatedEdu = {
        ...updatedEdu,
        ...(rc.degree ? { degree: rc.degree.value } : {}),
        ...(rc.institution ? { institution: rc.institution.value } : {}),
        ...(rc.graduation_year ? { graduation_year: rc.graduation_year.value } : {}),
      };
    }

    onChange({
      skills_and_experience: updatedSe,
      education_details: updatedEdu,
    });

    setIsReviewModalOpen(false);
  };

  const ed = data.education_details;
  const se = data.skills_and_experience;
  const cp = data.career_preferences;
  const declaredSkills = se?.skills || [];
  const projects = se?.structured_projects || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-left space-y-1.5 border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider">
          Stage 6 of 6
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Review & Profile Confirmation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Upload an optional resume for automated extraction, or review your verified profile below before entering the Career Discovery Assessment.
        </p>
      </div>

      {/* 1. Optional Resume Upload Box */}
      <div className="p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-700 shadow-2xs">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Have a Resume or CV? (Optional)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            PDF, Word (.docx, .doc) up to 5 MB. We will extract details and let you review them side-by-side.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="pt-1">
          <button
            type="button"
            disabled={resumeLoading}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {resumeLoading ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Parsing Resume...
              </span>
            ) : data.resume?.name ? (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <Check className="w-3.5 h-3.5" /> Replace Resume: {data.resume.name}
              </span>
            ) : (
              'Browse File to Upload'
            )}
          </button>
        </div>

        {uploadError && (
          <p className="text-xs text-rose-600 font-medium flex items-center justify-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {uploadError}
          </p>
        )}

        {parsedData && !isReviewModalOpen && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="text-xs text-slate-700 hover:text-slate-900 font-semibold underline"
            >
              Reopen Resume Reconciliation Modal
            </button>
          </div>
        )}
      </div>

      {/* 2. Profile Summary Confirmation Card */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 shadow-2xs text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            Verified Profile Summary
          </h3>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2 py-0.5 rounded">
            Ready for Assessment
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Academic Background */}
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
              Education & Program
            </span>
            <p className="font-semibold text-slate-900">
              {ed?.degree
                ? `${ed.degree.replace(/_/g, ' ').toUpperCase()} ${ed.specialization ? `(${ed.specialization})` : ''}`
                : data.course || 'Degree Not Specified'}
            </p>
            <p className="text-slate-500">
              {ed?.institution || 'Institution Not Specified'} • {ed?.study_stage_value || 'Stage Not Specified'}
            </p>
            {(ed?.academic_strengths || []).length > 0 && (
              <p className="text-slate-600 text-[11px] pt-1">
                <strong className="text-slate-700">Academic Strengths:</strong> {ed?.academic_strengths?.join(', ')}
              </p>
            )}
            {(ed?.subjects_enjoyed || []).length > 0 && (
              <p className="text-slate-600 text-[11px]">
                <strong className="text-slate-700">Subjects Enjoyed:</strong> {ed?.subjects_enjoyed?.join(', ')}
              </p>
            )}
          </div>

          {/* Practical Constraints */}
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
              Priorities & Constraints
            </span>
            <p className="font-semibold text-slate-900">
              Earning Urgency: {cp?.practical_constraints?.earning_urgency ? cp.practical_constraints.earning_urgency.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Flexible'}
            </p>
            <p className="text-slate-500">
              Work Setting: {cp?.preferred_work_environment?.[0] ? cp.preferred_work_environment[0].replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Hybrid'}
            </p>
            <p className="text-slate-500">
              Learning Bandwidth: {data.hoursPerWeek ? data.hoursPerWeek.replace(/_/g, ' ') : '10-15 hrs/week'}
            </p>
          </div>
        </div>

        {/* Skills & Evidence Stats */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-base font-bold text-slate-900 block">{declaredSkills.length}</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
              Declared Skills
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-base font-bold text-slate-900 block">{projects.length}</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
              Projects Added
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-base font-bold text-slate-900 block">
              {data.interests?.length || 0}
            </span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
              Domains Picked
            </span>
          </div>
        </div>
      </div>

      {/* Review Modal Trigger */}
      {parsedData && (
        <ResumeReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          extractedResume={parsedData}
          onboardingEdu={data.education_details}
          onboardingSkills={data.skills_and_experience}
          onApplyEnrichment={handleApplyEnrichment}
        />
      )}

      {/* Save Error */}
      {saveError && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}
    </div>
  );
};
