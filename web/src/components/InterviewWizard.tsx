'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import DifferentiationStep from '@/components/steps/DifferentiationStep';
import {
  differentiationGroups,
  emptyDifferentiation,
  legacyFromProfile,
  toggleDifferentiation,
  withLegacySelections,
  type DifferentiationProfile,
} from '@/lib/differentiation';
import { InterviewAnswersSchema, type InterviewAnswers } from '@/lib/interviewMatcher';
import { ACTIVITY_QUESTIONS, EDUCATIONAL_STATUSES, RESIDENCE_STATES, SPECIAL_CRITERIA, SPECIAL_CRITERIA_CATEGORIES, TARGET_SCHOOL_TYPES } from '@/lib/interviewQuestions';
import { FINANCIAL_NEED_INTEREST } from '@/lib/coverageQuestions';
import type { StudentAward } from '@/lib/studentCatalog';

const KEPT_UNIQUE_CRITERIA = new Set(['chronic_health', 'black_african_american', 'hispanic_latino', 'single_parent', 'mensa', 'farmers_union']);
const UNIQUE_LABELS: Record<string, string> = {
  chronic_health: 'Long-term health issue',
  black_african_american: 'Black or African American',
  hispanic_latino: 'Hispanic or Latino',
  single_parent: 'Single parent home',
  mensa: 'Mensa member',
  farmers_union: 'Farmers Union family',
};
const UNIQUE_SECTIONS: Record<string, { title: string; hint: string }> = {
  'Health & Hardships': { title: 'Long-term health', hint: 'Share only what you want. You can skip this.' },
  'Demographics & Identity': { title: 'More about you', hint: 'Share only what you want. You can skip this.' },
  'Family, Employee, & Org Affiliations': { title: 'More family ties', hint: 'Pick a family tie if it fits. You can skip this.' },
};
const ACTIVITY_LABELS: Record<string, string> = {
  leadership: 'I lead a team or club',
  work_experience: 'I have a job',
  caregiving: 'I help care for my family',
  service: 'I help in my community',
};

type YesNo = InterviewAnswers['collegeAccepted'];
type Props = { awards: readonly StudentAward[]; initialAnswers: InterviewAnswers | null; onComplete: (answers: InterviewAnswers) => void; onCancel: () => void; syntheticQa?: boolean };

function readSeed(initial: InterviewAnswers | null) {
  const skipped = initial?.sensitiveCriteriaSkipped ?? false;
  const criteria = (initial?.selectedCriteria ?? []).filter((id) => !skipped || !SPECIAL_CRITERIA.some((item) => item.id === id && item.sensitive));
  const organizations = initial?.organizationResponse === 'none' || initial?.organizationResponse === 'not_sure' || initial?.organizationResponse === 'prefer_not_to_answer'
    ? []
    : initial?.studentOrganizations ?? [];
  return {
    profile: withLegacySelections(initial?.differentiation ?? emptyDifferentiation(), {
      criteria,
      discovery: initial?.discoveryInterests ?? [],
      organizations,
    }),
    uniqueCriteria: criteria.filter((id) => KEPT_UNIQUE_CRITERIA.has(id)),
  };
}

export default function InterviewWizard({ awards, initialAnswers, onComplete, onCancel }: Props) {
  const seed = useState(() => readSeed(initialAnswers))[0];
  const [gpa, setGpa] = useState(initialAnswers ? String(initialAnswers.gpa) : '');
  const [residenceState, setResidenceState] = useState(initialAnswers?.residenceState ?? null);
  const [educationalStatus, setEducationalStatus] = useState(initialAnswers?.educationalStatus ?? null);
  const [targetSchoolTypes, setTargetSchoolTypes] = useState<InterviewAnswers['targetSchoolTypes']>(initialAnswers?.targetSchoolTypes ?? []);
  const [collegeAccepted, setCollegeAccepted] = useState<YesNo>(initialAnswers?.collegeAccepted === 'prefer_not_to_answer' ? null : initialAnswers?.collegeAccepted ?? null);
  const [gapYear, setGapYear] = useState<YesNo>(initialAnswers?.gapYear === 'prefer_not_to_answer' ? null : initialAnswers?.gapYear ?? null);
  const [activities, setActivities] = useState<InterviewAnswers['activities']>((initialAnswers?.activities ?? []).filter((id) => !initialAnswers?.sensitiveCriteriaSkipped || id !== 'caregiving'));
  const [financialNeedInterest, setFinancialNeedInterest] = useState<InterviewAnswers['financialNeedInterest']>(initialAnswers?.sensitiveCriteriaSkipped || initialAnswers?.financialNeedInterest === 'prefer_not_to_answer' ? null : initialAnswers?.financialNeedInterest ?? (initialAnswers?.financialNeed ? 'yes' : null));
  const [uniqueCriteria, setUniqueCriteria] = useState<InterviewAnswers['selectedCriteria']>(seed.uniqueCriteria);
  const [profile, setProfile] = useState<DifferentiationProfile>(seed.profile);
  const [error, setError] = useState('');
  const groups = useMemo(() => differentiationGroups(awards), [awards]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  const toggleValue = <T extends string>(value: T, values: readonly T[], update: (next: T[]) => void) => {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    setError('');
  };
  const validCore = () => {
    const numericGpa = Number(gpa);
    if (gpa.trim() === '' || !Number.isFinite(numericGpa) || numericGpa < 0 || numericGpa > 4) {
      setError('Enter a GPA from 0 to 4.0.');
      return false;
    }
    if (targetSchoolTypes.length === 0) {
      setError('Choose at least one kind of school.');
      return false;
    }
    setError('');
    return true;
  };
  const submit = () => {
    if (!validCore()) return;
    const derived = legacyFromProfile(profile);
    const selectedCriteria = [...new Set([...derived.selectedCriteria, ...uniqueCriteria])];
    const parsed = InterviewAnswersSchema.safeParse({
      gpa: Number(gpa), residenceState, educationalStatus, targetSchoolTypes, collegeAccepted, gapYear, activities,
      volunteerHours: null,
      financialNeed: false,
      financialNeedInterest,
      discoveryInterests: derived.discoveryInterests,
      studentOrganizations: derived.studentOrganizations,
      organizationResponse: derived.studentOrganizations.length > 0 ? 'selected' : null,
      selectedCriteria,
      sensitiveCriteriaSkipped: false,
      preferredApplicationModes: [],
      differentiation: profile,
    });
    if (!parsed.success) { setError('Review your answers before viewing results.'); return; }
    onComplete(parsed.data);
  };

  return (
    <section aria-labelledby="interview-step-heading" className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="border-b border-slate-200 pb-6">
        <h2 ref={headingRef} tabIndex={-1} id="interview-step-heading" className="text-3xl font-black tracking-tight outline-none">Tell us about you</h2>
        <p className="mt-3 leading-6 text-slate-600">Answer this page once. Only your GPA and the kind of school you want are required. You can skip the rest. An empty box does not hide an award.</p>
      </div>
      {error && <p id="interview-error" role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900">{error}</p>}

      <div className="mt-7 space-y-7">
        <Section title="Your GPA" hint="Use your GPA from 0 to 4.0. Do not use a weighted GPA." required>
          <input id="student-gpa" type="number" required inputMode="decimal" min="0" max="4" step="0.01" value={gpa} aria-invalid={error.includes('GPA') || undefined} aria-describedby={error ? 'interview-error' : undefined} onChange={(event) => { setGpa(event.target.value); setError(''); }} className="mt-3 block w-full rounded-xl border border-slate-300 px-4 py-3 font-normal sm:max-w-xs" placeholder="For example, 3.5" />
        </Section>

        <Section title="Kind of school you want" hint="Pick every kind you might go to." required>
          <ChipRow>
            {TARGET_SCHOOL_TYPES.map(([value, label]) => (
              <LightChip key={value} id={`student-target-school-types-${value}`} label={label} checked={targetSchoolTypes.includes(value)} onChange={() => toggleValue(value, targetSchoolTypes, setTargetSchoolTypes)} />
            ))}
          </ChipRow>
        </Section>

        <Section title="Your state" hint="Pick the state where you live. You can skip this.">
          <label htmlFor="student-residence-state" className="mt-3 block text-sm font-semibold text-slate-700">State
            <select id="student-residence-state" value={residenceState ?? ''} onChange={(event) => setResidenceState((event.target.value || null) as InterviewAnswers['residenceState'])} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal text-slate-900">
              <option value="">Leave unanswered</option>
              {RESIDENCE_STATES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </Section>

        <Section title="School right now" hint="Pick one. You can skip this.">
          <ChipRow>
            {EDUCATIONAL_STATUSES.map(([value, label]) => (
              <LightChip key={value} id={`student-educational-status-${value}`} name="student-educational-status" type="radio" label={label} checked={educationalStatus === value} onChange={() => { setEducationalStatus(value); setError(''); }} onClear={() => setEducationalStatus(null)} />
            ))}
          </ChipRow>
        </Section>

        <Section title="College letter" hint="Have you been accepted to a college yet?">
          <YesNoChips id="student-college-accepted" value={collegeAccepted} onChange={setCollegeAccepted} />
        </Section>

        <Section title="Gap year" hint="Do you plan to take a year off before college?">
          <YesNoChips id="student-gap-year" value={gapYear} onChange={setGapYear} />
        </Section>

        <div>
          <h3 className="text-2xl font-black tracking-tight">What makes you different?</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Pick any chips that fit you. You can skip a group. An empty chip does not hide an award.</p>
          <DifferentiationStep groups={groups} profile={profile} onToggle={(chip) => { setProfile((current) => toggleDifferentiation(current, chip)); setError(''); }} />
        </div>

        <Section title="Things you do" hint="Pick any that fit you. You can skip these.">
          <ChipRow>
            {ACTIVITY_QUESTIONS.map((item) => (
              <LightChip key={item.id} id={item.controlId} label={ACTIVITY_LABELS[item.id] ?? item.label} checked={activities.includes(item.id)} onChange={() => toggleValue(item.id, activities, setActivities)} />
            ))}
          </ChipRow>
        </Section>

        <Section title="Family money" hint="Some scholarships look at how much money your family has. Do you want to see those?">
          <ChipRow>
            {FINANCIAL_NEED_INTEREST.filter(([value]) => value !== 'prefer_not_to_answer').map(([value, label]) => (
              <LightChip key={value} id={`financial-need-${value}`} name="financial-need-interest" type="radio" label={label} checked={financialNeedInterest === value} onChange={() => setFinancialNeedInterest(value)} onClear={() => setFinancialNeedInterest(null)} />
            ))}
          </ChipRow>
        </Section>

        {SPECIAL_CRITERIA_CATEGORIES.map((category) => {
          const items = SPECIAL_CRITERIA.filter((item) => item.category === category).map((item) => item).filter((item) => KEPT_UNIQUE_CRITERIA.has(item.id));
          if (items.length === 0) return null;
          const copy = UNIQUE_SECTIONS[category] ?? { title: category, hint: 'Share only what you want. You can skip this.' };
          return (
            <Section key={category} title={copy.title} hint={copy.hint}>
              <ChipRow>
                {items.map((item) => (
                  <LightChip key={item.id} id={item.controlId} label={UNIQUE_LABELS[item.id] ?? item.label} checked={uniqueCriteria.includes(item.id)} onChange={() => toggleValue(item.id, uniqueCriteria, setUniqueCriteria)} />
                ))}
              </ChipRow>
            </Section>
          );
        })}
      </div>

      <div className="mt-9 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row-reverse sm:items-center sm:justify-between">
        <button type="button" onClick={submit} className="rounded-xl bg-teal-800 px-6 py-3 font-bold text-white shadow-sm hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Show my results</button>
        <button type="button" onClick={onCancel} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-teal-200">{initialAnswers ? 'Return to my matches' : 'Browse all scholarships'}</button>
      </div>
    </section>
  );
}

function Section({ title, hint, required = false, children }: { title: string; hint: string; required?: boolean; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 p-4">
      <legend className="px-2 text-base font-bold text-slate-950">{title}{required ? <span className="text-rose-700"> (required)</span> : null}</legend>
      <p className="mt-1 text-sm leading-6 text-slate-600">{hint}</p>
      {children}
    </fieldset>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex flex-wrap gap-2">{children}</div>;
}

function LightChip({ id, label, checked, onChange, onClear, name, type = 'checkbox' }: { id: string; label: string; checked: boolean; onChange: () => void; onClear?: () => void; name?: string; type?: 'checkbox' | 'radio' }) {
  return (
    <label htmlFor={id} className={`relative inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-sm font-semibold outline-none has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-teal-300 ${checked ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>
      <input id={id} name={name} type={type} checked={checked} onChange={onChange} onClick={() => { if (type === 'radio' && checked) onClear?.(); }} className="sr-only" />
      {label}
    </label>
  );
}

function YesNoChips({ id, value, onChange }: { id: string; value: YesNo; onChange: (value: YesNo) => void }) {
  return (
    <ChipRow>
      {([[true, 'Yes'], [false, 'No']] as const).map(([option, label]) => (
        <LightChip key={label} id={`${id}-${label.toLowerCase()}`} name={id} type="radio" label={label} checked={value === option} onChange={() => onChange(option)} onClear={() => onChange(null)} />
      ))}
    </ChipRow>
  );
}
