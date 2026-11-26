/**
 * resumeReview.ts
 * Types and comparison engine for reconciling uploaded resume data with onboarding profile.
 */

import type { EducationDetails } from './educationTaxonomy';
import type { SkillsAndExperienceDetails, ExperienceType } from './skillsTaxonomy';

export interface ExtractedPersonalSummary {
  name?: string | null;
  summary?: string | null;
  career_objective?: string | null;
  designation?: string | null;
}

export interface ExtractedEducationItem {
  degree?: string | null;
  institution?: string | null;
  specialization?: string | null;
  graduation_year?: string | null;
}

export interface ExtractedExperienceItem {
  organization?: string | null;
  job_title?: string | null;
  role?: string | null;
  duration?: string | null;
  responsibilities?: string[];
  achievements?: string[];
}

export interface ExtractedProjectItem {
  title?: string | null;
  description?: string | null;
  technologies?: string[];
  role?: string | null;
}

export interface ExtractedAdditionalInfo {
  internships?: string[];
  certifications?: string[];
  achievements?: string[];
  publications?: string[];
  volunteering?: string[];
}

export interface ExtractedResumeData {
  name?: string;
  education?: string[];
  skills?: string[];
  experience?: string[];
  personal_summary?: ExtractedPersonalSummary;
  education_details?: ExtractedEducationItem[];
  skills_categorized?: {
    technical_skills: string[];
    tools_and_frameworks: string[];
    soft_skills: string[];
    domain_skills: string[];
    all_skills: string[];
  };
  experience_details?: ExtractedExperienceItem[];
  projects?: ExtractedProjectItem[];
  additional_info?: ExtractedAdditionalInfo;
  metadata?: {
    filename?: string;
    file_type?: string;
    file_size?: number;
    skills_count?: number;
    experience_count?: number;
    projects_count?: number;
    education_count?: number;
  };
}

export interface SkillComparisonItem {
  name: string;
  category: 'already_provided' | 'additional_found' | 'onboarding_only';
  selected: boolean;
  provenance: 'declared' | 'resume_extracted' | 'demonstrated' | 'verified';
  skillClassification?: 'technical' | 'domain_knowledge' | 'transferable_soft';
}

export interface EducationConflict {
  field: 'degree' | 'institution' | 'graduation_year';
  label: string;
  onboardingValue: string;
  resumeValue: string;
  resolvedSource: 'onboarding' | 'resume';
}

export interface SuggestedProjectItem {
  id: string;
  type: ExperienceType;
  title: string;
  organization: string;
  role: string;
  duration: string;
  technologies: string[];
  description: string;
  problem_solved?: string;
  individual_contribution?: string;
  outcome_or_learning?: string;
  provenance: 'resume_extracted';
  selected: boolean;
}

export interface ResumeComparisonReport {
  skillsComparison: SkillComparisonItem[];
  alreadyProvidedCount: number;
  additionalFoundCount: number;
  onboardingOnlyCount: number;
  educationConflicts: EducationConflict[];
  suggestedExperiences: Array<{
    id: string;
    type: ExperienceType;
    title: string;
    organization: string;
    role: string;
    duration: string;
    technologies: string[];
    description: string;
    selected: boolean;
  }>;
  suggestedProjects: SuggestedProjectItem[];
}

/**
 * Normalizes strings for robust fuzzy comparison (lowercase, trimmed, strip punct).
 */
function normalizeStr(s: string | null | undefined): string {
  if (!s) return '';
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Compare extracted resume against user's onboarding data.
 */
export function compareResumeWithOnboarding(
  resume: ExtractedResumeData,
  onboardingEdu?: EducationDetails,
  onboardingSkills?: SkillsAndExperienceDetails,
): ResumeComparisonReport {
  // 1. SKILLS COMPARISON
  const onboardingSkillNames = (onboardingSkills?.skills || []).map((s) => s.name);
  const onboardingSkillMap = new Map<string, string>();
  onboardingSkillNames.forEach((name) => onboardingSkillMap.set(normalizeStr(name), name));

  // Extracted skills
  const extractedSkills =
    resume.skills_categorized?.all_skills ||
    resume.skills ||
    [];

  const extractedSkillMap = new Map<string, string>();
  extractedSkills.forEach((name) => {
    if (name && name.trim()) {
      extractedSkillMap.set(normalizeStr(name), name.trim());
    }
  });

  const technicalSet = new Set((resume.skills_categorized?.technical_skills || []).map(normalizeStr));
  const toolsSet = new Set((resume.skills_categorized?.tools_and_frameworks || []).map(normalizeStr));
  const domainSet = new Set((resume.skills_categorized?.domain_skills || []).map(normalizeStr));
  const softSet = new Set((resume.skills_categorized?.soft_skills || []).map(normalizeStr));

  const classify = (norm: string): 'technical' | 'domain_knowledge' | 'transferable_soft' => {
    if (technicalSet.has(norm) || toolsSet.has(norm)) return 'technical';
    if (domainSet.has(norm)) return 'domain_knowledge';
    if (softSet.has(norm)) return 'transferable_soft';
    return 'technical';
  };

  const skillsComparison: SkillComparisonItem[] = [];

  // Match: in both onboarding and resume
  const matchedNormalized = new Set<string>();
  onboardingSkillMap.forEach((onboardingName, norm) => {
    if (extractedSkillMap.has(norm)) {
      matchedNormalized.add(norm);
      skillsComparison.push({
        name: onboardingName,
        category: 'already_provided',
        selected: true,
        provenance: 'declared',
        skillClassification: classify(norm),
      });
    }
  });

  // Additional in resume (not in onboarding)
  extractedSkillMap.forEach((resumeName, norm) => {
    if (!onboardingSkillMap.has(norm)) {
      skillsComparison.push({
        name: resumeName,
        category: 'additional_found',
        selected: true, // Selected by default for easy review
        provenance: 'resume_extracted',
        skillClassification: classify(norm),
      });
    }
  });

  // In onboarding only (not detected in resume)
  onboardingSkillMap.forEach((onboardingName, norm) => {
    if (!extractedSkillMap.has(norm)) {
      skillsComparison.push({
        name: onboardingName,
        category: 'onboarding_only',
        selected: true,
        provenance: 'declared',
        skillClassification: classify(norm),
      });
    }
  });

  const alreadyProvidedCount = skillsComparison.filter((s) => s.category === 'already_provided').length;
  const additionalFoundCount = skillsComparison.filter((s) => s.category === 'additional_found').length;
  const onboardingOnlyCount = skillsComparison.filter((s) => s.category === 'onboarding_only').length;

  // 2. EDUCATION COMPARISON & CONFLICT DETECTION
  const educationConflicts: EducationConflict[] = [];
  const primaryResumeEdu = resume.education_details?.[0];

  if (onboardingEdu && primaryResumeEdu) {
    // Check graduation year conflict
    const onbGrad = onboardingEdu.graduation_year?.trim();
    const resGrad = primaryResumeEdu.graduation_year?.trim();
    if (onbGrad && resGrad && normalizeStr(onbGrad) !== normalizeStr(resGrad)) {
      educationConflicts.push({
        field: 'graduation_year',
        label: 'Graduation Year',
        onboardingValue: onbGrad,
        resumeValue: resGrad,
        resolvedSource: 'onboarding', // Default to what user entered in onboarding
      });
    }

    // Check degree conflict
    const onbDegree = onboardingEdu.degree === 'other' ? onboardingEdu.degree_other : onboardingEdu.degree;
    const resDegree = primaryResumeEdu.degree;
    if (onbDegree && resDegree && normalizeStr(onbDegree) !== normalizeStr(resDegree)) {
      educationConflicts.push({
        field: 'degree',
        label: 'Degree / Qualification',
        onboardingValue: onbDegree,
        resumeValue: resDegree,
        resolvedSource: 'onboarding',
      });
    }

    // Check institution conflict
    const onbInst = onboardingEdu.institution?.trim();
    const resInst = primaryResumeEdu.institution?.trim();
    if (onbInst && resInst && normalizeStr(onbInst) !== normalizeStr(resInst)) {
      educationConflicts.push({
        field: 'institution',
        label: 'College / University',
        onboardingValue: onbInst,
        resumeValue: resInst,
        resolvedSource: 'onboarding',
      });
    }
  }

  // 3. EXPERIENCE SUGGESTIONS
  const suggestedExperiences: ResumeComparisonReport['suggestedExperiences'] = [];
  (resume.experience_details || []).forEach((exp, idx) => {
    const title = exp.job_title || exp.role || `Role at ${exp.organization || 'Company'}`;
    suggestedExperiences.push({
      id: `res_exp_${idx}_${Date.now()}`,
      type: 'full_time',
      title: title.trim(),
      organization: (exp.organization || '').trim(),
      role: (exp.role || exp.job_title || '').trim(),
      duration: (exp.duration || '').trim(),
      technologies: [],
      description: [
        ...(exp.responsibilities || []),
        ...(exp.achievements || []),
      ].join('. '),
      selected: true,
    });
  });

  // 4. PROJECT SUGGESTIONS
  const suggestedProjects: ResumeComparisonReport['suggestedProjects'] = [];
  (resume.projects || []).forEach((proj, idx) => {
    if (proj.title) {
      suggestedProjects.push({
        id: `res_proj_${idx}_${Date.now()}`,
        type: 'personal_projects',
        title: proj.title.trim(),
        organization: '',
        role: (proj.role || 'Contributor').trim(),
        duration: '',
        technologies: proj.technologies || [],
        description: (proj.description || '').trim(),
        problem_solved: (proj.description || '').trim(),
        individual_contribution: (proj.role || 'Contributor').trim(),
        outcome_or_learning: (proj.description || '').trim(),
        provenance: 'resume_extracted',
        selected: true,
      });
    }
  });

  return {
    skillsComparison,
    alreadyProvidedCount,
    additionalFoundCount,
    onboardingOnlyCount,
    educationConflicts,
    suggestedExperiences,
    suggestedProjects,
  };
}
