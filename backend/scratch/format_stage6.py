path = r"frontend/src/components/onboarding/Stage6ResumeReview.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

target = """          {/* Academic Background */}
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
              Education & Program
            </span>
            <p className="font-semibold text-slate-900">
              {ed?.degree ? `${ed.degree} ${ed.specialization ? `(${ed.specialization})` : ''}` : data.course || 'Degree Not Specified'}
            </p>
            <p className="text-slate-500">
              {ed?.institution || 'Institution Not Specified'} â€¢ {ed?.study_stage_value || 'Stage Not Specified'}
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
              Earning Urgency: {cp?.practical_constraints?.earning_urgency?.replace(/_/g, ' ') || 'Flexible'}
            </p>
            <p className="text-slate-500">
              Work Setting: {cp?.preferred_work_environment?.[0]?.replace(/_/g, ' ') || 'Hybrid'}
            </p>
            <p className="text-slate-500">
              Learning Bandwidth: {data.hoursPerWeek?.replace(/_/g, ' ') || '10-15 hrs/week'}
            </p>
          </div>"""

replacement = """          {/* Academic Background */}
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
              Earning Urgency: {cp?.practical_constraints?.earning_urgency ? cp.practical_constraints.earning_urgency.replace(/_/g, ' ').replace(/\\b\\w/g, (l) => l.toUpperCase()) : 'Flexible'}
            </p>
            <p className="text-slate-500">
              Work Setting: {cp?.preferred_work_environment?.[0] ? cp.preferred_work_environment[0].replace(/_/g, ' ').replace(/\\b\\w/g, (l) => l.toUpperCase()) : 'Hybrid'}
            </p>
            <p className="text-slate-500">
              Learning Bandwidth: {data.hoursPerWeek ? data.hoursPerWeek.replace(/_/g, ' ') : '10-15 hrs/week'}
            </p>
          </div>"""

if target in text:
    text = text.replace(target, replacement)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced Stage6 summary formatting successfully.")
else:
    print("Target not found directly, checking normalized.")
