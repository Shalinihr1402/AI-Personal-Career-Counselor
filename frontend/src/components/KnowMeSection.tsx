import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import {
  KNOWN_FOR_OPTIONS,
  MAX_VALUES,
  SITUATION_QUESTIONS,
  SUBJECT_OPTIONS,
  VALUE_OPTIONS,
  type KnowMe,
} from '../lib/knowMe';

export type KnowMeSectionId = 'values' | 'strengths' | 'situation';

interface Props {
  section: KnowMeSectionId;
  value: KnowMe;
  onChange: (patch: Partial<KnowMe>) => void;
}

const chip = (active: boolean) =>
  `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border transition-colors ${
    active
      ? 'bg-purple-600 border-purple-600 text-white'
      : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
  }`;

function toggle(list: string[], item: string, max?: number): string[] {
  if (list.includes(item)) return list.filter((x) => x !== item);
  if (max && list.length >= max) return list;
  return [...list, item];
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (o: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button key={o} type="button" onClick={() => onToggle(o)} className={chip(active)} aria-pressed={active}>
            {o}
            {active && <Check className="w-3.5 h-3.5" />}
          </button>
        );
      })}
    </div>
  );
}

export default function KnowMeSection({ section, value, onChange }: Props) {
  if (section === 'values') {
    const full = value.values.length >= MAX_VALUES;
    return (
      <div className="space-y-3">
        <p className="text-slate-500 text-sm">
          Pick the <strong>{MAX_VALUES} things that matter most</strong> to you in a career. There are no wrong
          answers — this helps us weigh trade-offs honestly.
        </p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {VALUE_OPTIONS.map((o) => {
            const active = value.values.includes(o.value);
            const disabled = !active && full;
            return (
              <button
                key={o.value}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => onChange({ values: toggle(value.values, o.value, MAX_VALUES) })}
                className={`text-left rounded-2xl border-2 p-4 transition-all ${
                  active
                    ? 'border-purple-600 bg-purple-50/60'
                    : disabled
                      ? 'border-slate-100 bg-white opacity-50 cursor-not-allowed'
                      : 'border-slate-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">{o.value}</span>
                  {active && (
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {value.values.indexOf(o.value) + 1}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{o.hint}</p>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 text-right">
          {value.values.length}/{MAX_VALUES} chosen
        </p>
      </div>
    );
  }

  if (section === 'strengths') {
    return (
      <div className="space-y-3">
        <Card title="Subjects you're strong in" hint="Where you usually score well. Pick any.">
          <ChipGroup
            options={SUBJECT_OPTIONS}
            selected={value.subjectsStrong}
            onToggle={(o) => onChange({ subjectsStrong: toggle(value.subjectsStrong, o) })}
          />
        </Card>
        <Card title="Subjects you enjoy" hint="Can be different from the ones you're good at.">
          <ChipGroup
            options={SUBJECT_OPTIONS}
            selected={value.subjectsEnjoy}
            onToggle={(o) => onChange({ subjectsEnjoy: toggle(value.subjectsEnjoy, o) })}
          />
        </Card>
        <Card title="What do friends usually come to you for?" hint="Pick up to 3.">
          <ChipGroup
            options={KNOWN_FOR_OPTIONS}
            selected={value.knownFor}
            onToggle={(o) => onChange({ knownFor: toggle(value.knownFor, o, 3) })}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-slate-500 text-sm">
        A good counselor considers your real situation, not just your interests. This stays private.
      </p>
      {SITUATION_QUESTIONS.map((q) => (
        <Card key={q.key} title={q.question}>
          <div className="flex flex-wrap gap-2">
            {q.options.map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={value[q.key] === o}
                onClick={() => onChange({ [q.key]: o } as Partial<KnowMe>)}
                className={chip(value[q.key] === o)}
              >
                {o}
              </button>
            ))}
          </div>
          {q.key === 'familyExpectation' && value.familyExpectation && value.familyExpectation !== 'I’m free to choose' && (
            <input
              value={value.familyNote}
              onChange={(e) => onChange({ familyNote: e.target.value })}
              maxLength={120}
              placeholder="Optional — e.g. they'd like engineering or a government job"
              className="mt-3 w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
            />
          )}
        </Card>
      ))}
    </div>
  );
}
