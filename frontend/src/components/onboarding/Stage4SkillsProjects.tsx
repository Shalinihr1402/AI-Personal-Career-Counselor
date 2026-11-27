import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Info,
  Code,
} from 'lucide-react';
import type { OnboardingRecord } from '../../lib/onboarding';
import {
  type SkillsAndExperienceDetails,
  type UserSkill,
  type StructuredProject,
  type ProjectType,
  type SkillProficiency,
  type SkillSource,
  type SkillClassification,
} from '../../lib/skillsTaxonomy';

interface Stage4SkillsProjectsProps {
  data: Partial<OnboardingRecord>;
  onChange: (patch: Partial<OnboardingRecord>) => void;
}

const COMMON_TECHNICAL_SKILLS = [
  'Python', 'SQL', 'JavaScript', 'TypeScript', 'React', 'HTML/CSS',
  'Excel (Advanced)', 'Power BI', 'Tableau', 'Git & GitHub', 'Java', 'C++',
  'Figma', 'Linux / Bash', 'Docker', 'REST APIs', 'R Programming',
];

const COMMON_DOMAIN_KNOWLEDGE = [
  'Financial Accounting', 'Corporate Taxation', 'Auditing Principles',
  'Financial Modeling', 'Cost Accounting', 'Company Law', 'Marketing Analytics',
  'Statistical Inference', 'Linear Algebra & Calculus', 'Macroeconomics',
  'Supply Chain Management', 'UX Research & Wireframing', 'Biochemistry',
];

const COMMON_TRANSFERABLE_SKILLS = [
  'Technical Writing', 'Public Speaking & Presentations', 'Data-Driven Decision Making',
  'Team Collaboration & Leadership', 'Problem Decomposition', 'Stakeholder Communication',
  'Research & Literature Review', 'Project Planning & Agile',
];

const PROJECT_TYPE_OPTIONS: Array<{ id: ProjectType; label: string }> = [
  { id: 'academic_coursework', label: 'Coursework Assignment / Lab Exercise' },
  { id: 'capstone_final_year', label: 'Final Year / Capstone Major Project' },
  { id: 'personal_curiosity', label: 'Personal Project / Self-Initiated Build' },
  { id: 'hackathon_competition', label: 'Hackathon / Case Competition' },
  { id: 'internship_client', label: 'Internship / Client Project' },
  { id: 'self_learning_tutorial', label: 'Guided Tutorial / Code-Along Project' },
];

export const Stage4SkillsProjects: React.FC<Stage4SkillsProjectsProps> = ({ data, onChange }) => {
  const se: SkillsAndExperienceDetails = data.skills_and_experience || {
    skills: [],
    custom_skills: [],
    experience_types: [],
    experiences: [],
    structured_projects: [],
    professional_duration: 'no_experience',
    has_no_standalone_projects: false,
    academic_coursework_highlights: '',
  };

  const [activeSkillCategory, setActiveSkillCategory] = useState<'technical' | 'domain' | 'transferable'>('technical');
  const [customSkillName, setCustomSkillName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);

  // New Project Form State
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjType, setNewProjType] = useState<ProjectType>('academic_coursework');
  const [newProjProblem, setNewProjProblem] = useState('');
  const [newProjRole, setNewProjRole] = useState('');
  const [newProjTech, setNewProjTech] = useState('');
  const [newProjOutcome, setNewProjOutcome] = useState('');
  const [newProjUrl, setNewProjUrl] = useState('');

  const updateSE = (patch: Partial<SkillsAndExperienceDetails>) => {
    const updated = { ...se, ...patch };
    onChange({
      skills_and_experience: updated,
    });
  };

  // Add / Toggle Skill
  const handleToggleSkill = (
    skillName: string,
    classification: SkillClassification,
    category = 'other'
  ) => {
    const existing = se.skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
    let updatedSkills: UserSkill[];

    if (existing) {
      updatedSkills = se.skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase());
    } else {
      updatedSkills = [
        ...se.skills,
        {
          id: `skill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: skillName,
          category,
          skill_classification: classification,
          proficiency: 'beginner',
          source: 'academic_coursework',
          provenance: 'declared',
          is_custom: false,
        },
      ];
    }
    updateSE({ skills: updatedSkills });
  };

  const handleSetSkillProficiency = (skillName: string, proficiency: SkillProficiency) => {
    const updated = se.skills.map((s) =>
      s.name.toLowerCase() === skillName.toLowerCase() ? { ...s, proficiency } : s
    );
    updateSE({ skills: updated });
  };

  const handleSetSkillSource = (skillName: string, source: SkillSource) => {
    const updated = se.skills.map((s) =>
      s.name.toLowerCase() === skillName.toLowerCase() ? { ...s, source } : s
    );
    updateSE({ skills: updated });
  };

  const handleRemoveSkill = (skillName: string) => {
    updateSE({ skills: se.skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase()) });
  };

  const handleAddCustomSkill = () => {
    if (!customSkillName.trim()) return;
    const name = customSkillName.trim();
    const classification: SkillClassification =
      activeSkillCategory === 'technical'
        ? 'technical'
        : activeSkillCategory === 'domain'
        ? 'domain_knowledge'
        : 'transferable_soft';

    if (!se.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      handleToggleSkill(name, classification);
    }
    setCustomSkillName('');
  };

  // Save Structured Project
  const handleSaveProject = () => {
    if (!newProjTitle.trim() || !newProjProblem.trim()) return;
    const newProj: StructuredProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newProjTitle.trim(),
      project_type: newProjType,
      problem_solved: newProjProblem.trim(),
      individual_contribution: newProjRole.trim() || 'Primary Contributor / Solo',
      technologies: newProjTech
        ? newProjTech.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      outcome_or_learning: newProjOutcome.trim(),
      repo_or_demo_url: newProjUrl.trim() || undefined,
      provenance: 'demonstrated',
    };

    const updatedProjects = [...(se.structured_projects || []), newProj];
    updateSE({
      structured_projects: updatedProjects,
      has_no_standalone_projects: false,
    });

    // Reset Form
    setNewProjTitle('');
    setNewProjProblem('');
    setNewProjRole('');
    setNewProjTech('');
    setNewProjOutcome('');
    setNewProjUrl('');
    setIsAddingProject(false);
  };

  const handleRemoveProject = (id: string) => {
    const updated = (se.structured_projects || []).filter((p) => p.id !== id);
    updateSE({ structured_projects: updated });
  };

  const declaredSkills = se.skills || [];
  const structuredProjects = se.structured_projects || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start gap-4 pb-2 border-b border-[#E2E8F0]">
        <div className="w-12 h-12 rounded-xl bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4] flex items-center justify-center shrink-0 shadow-xs">
          <Code className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172638] tracking-tight">
            Skills, Projects & Actual Experience
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
            Evidence matters. Tell us what skills you possess, where you learned them, and any projects, capstones, or coursework you built.
          </p>
        </div>
      </div>

      {/* 1. Categorized Skills Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 space-y-4 shadow-xs">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#172638]">
            1. Skills & Knowledge Base (Tag with your real proficiency)
          </label>
          <p className="text-xs text-[#64748B]">
            Skills are separated by type to prevent treating domain theory the same as coding tools.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-[#E2E8F0] gap-2">
          <button
            type="button"
            onClick={() => setActiveSkillCategory('technical')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeSkillCategory === 'technical'
                ? 'border-[#168C89] text-[#168C89]'
                : 'border-transparent text-[#64748B] hover:text-[#172638]'
            }`}
          >
            Technical Tools & Software
          </button>
          <button
            type="button"
            onClick={() => setActiveSkillCategory('domain')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeSkillCategory === 'domain'
                ? 'border-[#168C89] text-[#168C89]'
                : 'border-transparent text-[#64748B] hover:text-[#172638]'
            }`}
          >
            Domain & Academic Knowledge
          </button>
          <button
            type="button"
            onClick={() => setActiveSkillCategory('transferable')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeSkillCategory === 'transferable'
                ? 'border-[#168C89] text-[#168C89]'
                : 'border-transparent text-[#64748B] hover:text-[#172638]'
            }`}
          >
            Transferable & Working Abilities
          </button>
        </div>

        {/* Skill Preset Badges */}
        <div className="flex flex-wrap gap-1.5 p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
          {(activeSkillCategory === 'technical'
            ? COMMON_TECHNICAL_SKILLS
            : activeSkillCategory === 'domain'
            ? COMMON_DOMAIN_KNOWLEDGE
            : COMMON_TRANSFERABLE_SKILLS
          ).map((skillName) => {
            const isSelected = declaredSkills.some(
              (s) => s.name.toLowerCase() === skillName.toLowerCase()
            );
            return (
              <button
                key={skillName}
                type="button"
                onClick={() =>
                  handleToggleSkill(
                    skillName,
                    activeSkillCategory === 'technical'
                      ? 'technical'
                      : activeSkillCategory === 'domain'
                      ? 'domain_knowledge'
                      : 'transferable_soft'
                  )
                }
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#168C89] bg-[#168C89] text-white font-medium shadow-2xs'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {skillName}
              </button>
            );
          })}
        </div>

        {/* Custom Skill Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={`Add a custom ${activeSkillCategory} skill...`}
            value={customSkillName}
            onChange={(e) => setCustomSkillName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomSkill();
              }
            }}
            className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
          />
          <button
            type="button"
            onClick={handleAddCustomSkill}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#142B4A] hover:bg-[#0E1F36] text-white transition-colors cursor-pointer shadow-xs"
          >
            Add Skill
          </button>
        </div>

        {/* Selected Skills Matrix */}
        {declaredSkills.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172638]">
              Selected Skills ({declaredSkills.length}) — Set Real Proficiency & Learning Source
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {declaredSkills.map((s) => (
                <div
                  key={s.name}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172638]">{s.name}</span>
                    <span className="text-[10px] text-[#168C89] bg-[#EAF5F4] border border-[#C5E6E4] px-1.5 py-0.5 rounded font-semibold">
                      {s.skill_classification || 'tech'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Proficiency Selector */}
                    <select
                      value={s.proficiency || 'beginner'}
                      onChange={(e) =>
                        handleSetSkillProficiency(s.name, e.target.value as SkillProficiency)
                      }
                      className="text-[11px] font-medium py-1 px-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#172638] focus:ring-1 focus:ring-[#168C89]"
                    >
                      <option value="beginner">Beginner (Learning)</option>
                      <option value="intermediate">Intermediate (Can apply)</option>
                      <option value="advanced">Advanced (Independent)</option>
                      <option value="expert">Expert (Mastery)</option>
                    </select>

                    {/* Source Selector */}
                    <select
                      value={s.source || 'academic_coursework'}
                      onChange={(e) =>
                        handleSetSkillSource(s.name, e.target.value as SkillSource)
                      }
                      className="text-[11px] font-medium py-1 px-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#172638] focus:ring-1 focus:ring-[#168C89]"
                    >
                      <option value="academic_coursework">College Course</option>
                      <option value="self_learning">Self-Taught</option>
                      <option value="personal_project">Built in Project</option>
                      <option value="internship">Internship</option>
                      <option value="certification">Certification</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s.name)}
                      className="text-[#64748B] hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Structured Projects Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#172638]">
              2. Demonstrated Projects & Practical Evidence
            </label>
            <p className="text-xs text-[#64748B]">
              Add projects, lab assignments, or capstones that demonstrate your problem-solving.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingProject(!isAddingProject)}
            className="text-xs font-semibold text-white bg-[#142B4A] hover:bg-[#0E1F36] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Project
          </button>
        </div>

        {/* Existing Projects List */}
        {structuredProjects.length > 0 && (
          <div className="space-y-3">
            {structuredProjects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172638]">{p.title}</span>
                    <span className="text-[10px] font-semibold text-[#168C89] bg-[#EAF5F4] border border-[#C5E6E4] px-2 py-0.5 rounded-full">
                      {PROJECT_TYPE_OPTIONS.find((t) => t.id === p.project_type)?.label || 'Project'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(p.id)}
                    className="text-[#64748B] hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  <strong className="text-[#172638] font-medium">Problem:</strong> {p.problem_solved}
                </p>

                {p.individual_contribution && (
                  <p className="text-xs text-[#64748B]">
                    <strong className="text-[#172638] font-medium">Your Role:</strong> {p.individual_contribution}
                  </p>
                )}

                {p.technologies && p.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.technologies.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-medium bg-[#F1F5F9] text-[#172638] px-2 py-0.5 rounded-md border border-[#E2E8F0]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Project Form Drawer */}
        {isAddingProject && (
          <div className="p-4 sm:p-5 rounded-xl border border-[#C5E6E4] bg-[#EAF5F4]/40 space-y-3.5 animate-in fade-in">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#142B4A]">
              Add Structured Project Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#172638] mb-1">
                  Project Title <span className="text-[#168C89]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. GST Billing Ledger System, Portfolio Website"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#172638] mb-1">
                  Project Type <span className="text-[#168C89]">*</span>
                </label>
                <select
                  value={newProjType}
                  onChange={(e) => setNewProjType(e.target.value as ProjectType)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
                >
                  {PROJECT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#172638] mb-1">
                Problem Solved or Task Goal <span className="text-[#168C89]">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="What real problem or academic challenge did this project solve?"
                value={newProjProblem}
                onChange={(e) => setNewProjProblem(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#172638] mb-1">
                  Your Individual Contribution / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Developer, Solo Author, Data Cleaning & Analysis"
                  value={newProjRole}
                  onChange={(e) => setNewProjRole(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#172638] mb-1">
                  Tools or Technologies Used (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python, Pandas, SQLite, Excel"
                  value={newProjTech}
                  onChange={(e) => setNewProjTech(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#172638] mb-1">
                  Outcome or Key Takeaway
                </label>
                <input
                  type="text"
                  placeholder="e.g. Achieved 94% accuracy, Deployed on Vercel, Scored A grade"
                  value={newProjOutcome}
                  onChange={(e) => setNewProjOutcome(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#172638] mb-1">
                  Repo / Demo Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://github.com/... or live URL"
                  value={newProjUrl}
                  onChange={(e) => setNewProjUrl(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingProject(false)}
                className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#172638]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProject}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-[#142B4A] text-white hover:bg-[#0E1F36]"
              >
                Save Project
              </button>
            </div>
          </div>
        )}

        {/* 3. Dignified Path for Freshers Without Projects */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(se.has_no_standalone_projects)}
              onChange={(e) => updateSE({ has_no_standalone_projects: e.target.checked })}
              className="mt-0.5 rounded text-[#168C89] focus:ring-[#168C89]"
            />
            <div>
              <span className="text-xs font-bold text-[#172638] block">
                I haven't completed standalone portfolio or commercial projects yet.
              </span>
              <span className="text-[11px] text-[#64748B] block leading-snug">
                You can highlight significant coursework assignments, case studies, or lab experiments instead. There is zero penalty.
              </span>
            </div>
          </label>

          {se.has_no_standalone_projects && (
            <div className="pt-2 border-t border-[#E2E8F0] space-y-2 animate-in fade-in">
              <label className="block text-[11px] font-semibold text-[#172638]">
                Coursework Problem-Solving & Lab Highlights
              </label>
              <textarea
                rows={2}
                value={se.academic_coursework_highlights || ''}
                onChange={(e) => updateSE({ academic_coursework_highlights: e.target.value })}
                placeholder="e.g. In semester 4, I analyzed 5 balance sheets for a corporate taxation case study; in semester 5, I solved linear programming optimization models in lab."
                className="w-full text-xs p-3 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89]"
              />
              <p className="text-[10px] text-[#64748B] flex items-center gap-1">
                <Info className="w-3 h-3 text-[#168C89]" />
                Coursework problem solving is counted as valid academic evidence by the recommendation engine.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
