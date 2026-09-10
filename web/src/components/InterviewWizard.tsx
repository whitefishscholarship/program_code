'use client';

import { useEffect, useRef, useState } from 'react';
import { INTERVIEW_APPLICATION_MODES, InterviewAnswersSchema, type InterviewAnswers } from '@/lib/interviewMatcher';
import { SHORTLIST_NOTICE } from '@/lib/spreadsheetShortlist';
import { ACTIVITY_QUESTIONS, EDUCATIONAL_STATUSES, RESIDENCE_STATES, SPECIAL_CRITERIA, SPECIAL_CRITERIA_CATEGORIES, TARGET_SCHOOL_TYPES, VOLUNTEER_HOURS } from '@/lib/interviewQuestions';

const TOTAL_STEPS = 4;
const stepHeadings = ['Academic background', 'Activities and responsibilities', 'Special criteria and interests', 'Application preferences'] as const;
const applicationModeLabels: Record<(typeof INTERVIEW_APPLICATION_MODES)[number], string> = {
  automatic_consideration: 'Automatic consideration', selectable_children: 'One application where I select awards', eligibility_matched: 'A portal that matches awards for me', shared_with_supplements: 'A shared application with possible supplements', direct_per_award: 'A separate application for each award', offline: 'Paper or counselor-provided application',
};

type Props = { initialAnswers: InterviewAnswers | null; onComplete: (answers: InterviewAnswers) => void; onCancel: () => void; syntheticQa?: boolean };

export default function InterviewWizard({ initialAnswers, onComplete, onCancel, syntheticQa = false }: Props) {
  const [step, setStep] = useState(0);
  const [gpa, setGpa] = useState(initialAnswers ? String(initialAnswers.gpa) : '');
  const [residenceState, setResidenceState] = useState(initialAnswers?.residenceState ?? '');
  const [educationalStatus, setEducationalStatus] = useState(initialAnswers?.educationalStatus ?? '');
  const [targetSchoolTypes, setTargetSchoolTypes] = useState<InterviewAnswers['targetSchoolTypes']>(initialAnswers?.targetSchoolTypes ?? []);
  const [collegeAccepted, setCollegeAccepted] = useState<InterviewAnswers['collegeAccepted']>(initialAnswers?.collegeAccepted ?? null);
  const [gapYear, setGapYear] = useState<InterviewAnswers['gapYear']>(initialAnswers?.gapYear ?? null);
  const [activities, setActivities] = useState<InterviewAnswers['activities']>(initialAnswers?.activities ?? []);
  const [volunteerHours, setVolunteerHours] = useState<InterviewAnswers['volunteerHours']>(initialAnswers?.volunteerHours ?? null);
  const [financialNeed, setFinancialNeed] = useState(initialAnswers?.financialNeed ?? false);
  const [selectedCriteria, setSelectedCriteria] = useState<InterviewAnswers['selectedCriteria']>(initialAnswers?.selectedCriteria ?? []);
  const [sensitiveCriteriaSkipped, setSensitiveCriteriaSkipped] = useState(initialAnswers?.sensitiveCriteriaSkipped ?? false);
  const [preferredApplicationModes, setPreferredApplicationModes] = useState<InterviewAnswers['preferredApplicationModes']>(initialAnswers?.preferredApplicationModes ?? []);
  const [error, setError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const toggle = <T extends string>(value: T, values: readonly T[], update: (next: T[]) => void) => {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    setError('');
  };
  const setSkipSensitive = (checked: boolean) => {
    setSensitiveCriteriaSkipped(checked);
    if (checked) {
      const sensitiveIds = new Set<string>(SPECIAL_CRITERIA.filter((item) => item.sensitive).map((item) => item.id));
      setSelectedCriteria((current) => current.filter((id) => !sensitiveIds.has(id)));
      setActivities((current) => current.filter((id) => id !== 'caregiving'));
      setFinancialNeed(false);
    }
  };
  const continueStep = () => {
    if (step === 0) {
      const numericGpa = Number(gpa);
      if (gpa.trim() === '' || !Number.isFinite(numericGpa) || numericGpa < 0 || numericGpa > 4) { setError('Enter an unweighted GPA from 0 to 4.0.'); return; }
      if (!residenceState) { setError('Choose your state of residence.'); return; }
      if (!educationalStatus) { setError('Choose your current educational status.'); return; }
      if (targetSchoolTypes.length === 0) { setError('Choose at least one target school type.'); return; }
    }
    setError(''); setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  };
  const submit = () => {
    const parsed = InterviewAnswersSchema.safeParse({
      gpa: Number(gpa), residenceState, educationalStatus, targetSchoolTypes, collegeAccepted, gapYear, activities,
      volunteerHours: activities.includes('service') ? volunteerHours : null,
      financialNeed, selectedCriteria, sensitiveCriteriaSkipped, preferredApplicationModes,
    });
    if (!parsed.success) { setError('Review the required academic answers before viewing results.'); setStep(0); return; }
    setError(''); onComplete(parsed.data);
  };

  return (
    <section aria-labelledby="interview-step-heading" className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-800">Step {step + 1} of {TOTAL_STEPS}</p>
        <h2 ref={headingRef} tabIndex={-1} id="interview-step-heading" className="mt-2 text-3xl font-black tracking-tight outline-none">{stepHeadings[step]}</h2>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Interview progress" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step + 1}><div className="h-full rounded-full bg-teal-700 transition-[width]" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} /></div>
      </div>
      <p className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950">Your answers stay only in this page&apos;s temporary memory. They are not saved, sent, logged, added to the address bar, or included in exports.</p>
      <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{syntheticQa ? <><strong>Test fixture:</strong> synthetic accepted facts are enabled only for this development QA route.</> : <>{SHORTLIST_NOTICE}</>}</p>
      {error && <p id="interview-error" role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900">{error}</p>}

      {step === 0 && <div className="mt-7 space-y-8">
        <label htmlFor="student-gpa" className="block text-base font-bold text-slate-900">Unweighted GPA <Required /><input id="student-gpa" type="number" required inputMode="decimal" min="0" max="4" step="0.01" value={gpa} onChange={(event) => { setGpa(event.target.value); setError(''); }} className="mt-3 block w-full rounded-xl border border-slate-300 px-4 py-3 font-normal sm:max-w-xs" placeholder="For example, 3.5" /></label>
        <div className="grid gap-6 sm:grid-cols-2">
          <label htmlFor="student-residence-state" className="block text-base font-bold">State of residence <Required /><select id="student-residence-state" required value={residenceState} onChange={(event) => { setResidenceState(event.target.value as InterviewAnswers['residenceState']); setError(''); }} className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"><option value="">Choose a state</option>{RESIDENCE_STATES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label htmlFor="student-educational-status" className="block text-base font-bold">Current educational status <Required /><select id="student-educational-status" required value={educationalStatus} onChange={(event) => { setEducationalStatus(event.target.value as InterviewAnswers['educationalStatus']); setError(''); }} className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"><option value="">Choose a status</option>{EDUCATIONAL_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <CheckboxGroup legend="Target school type (select all that apply)" required>{TARGET_SCHOOL_TYPES.map(([value, label]) => <Choice key={value} id={`student-target-school-types-${value}`} label={label} checked={targetSchoolTypes.includes(value)} onChange={() => toggle(value, targetSchoolTypes, setTargetSchoolTypes)} />)}</CheckboxGroup>
        <div className="grid gap-6 sm:grid-cols-2"><OptionalYesNo id="student-college-accepted" legend="Have you been accepted to a college yet?" value={collegeAccepted} onChange={setCollegeAccepted} /><OptionalYesNo id="student-gap-year" legend="Are you planning to take a gap year?" value={gapYear} onChange={setGapYear} /></div>
      </div>}

      {step === 1 && <div className="mt-7 space-y-7">
        <CheckboxGroup legend="Select anything that applies to you">{ACTIVITY_QUESTIONS.map((item) => <Choice key={item.id} id={item.controlId} label={item.label} checked={activities.includes(item.id)} disabled={item.sensitive && sensitiveCriteriaSkipped} onChange={() => { if (item.sensitive) setSensitiveCriteriaSkipped(false); if (item.id === 'service' && activities.includes('service')) setVolunteerHours(null); toggle(item.id, activities, setActivities); }} />)}</CheckboxGroup>
        {activities.includes('service') && <label htmlFor="student-volunteer-hours" className="block text-base font-bold">Approximately how many volunteer hours have you completed? <Optional /><select id="student-volunteer-hours" value={volunteerHours ?? ''} onChange={(event) => setVolunteerHours((event.target.value || null) as InterviewAnswers['volunteerHours'])} className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal sm:max-w-sm"><option value="">Choose a range</option>{VOLUNTEER_HOURS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
        <Choice id="student-financial-need" label="I have acute financial need (for example, free/reduced lunch or Pell Grant eligibility)" checked={financialNeed} disabled={sensitiveCriteriaSkipped} onChange={() => { setSensitiveCriteriaSkipped(false); setFinancialNeed((current) => !current); }} detail="Optional and sensitive. Leaving this unchecked is unknown, not a negative answer." />
        <SensitiveSkip checked={sensitiveCriteriaSkipped} onChange={setSkipSensitive} />
      </div>}

      {step === 2 && <div className="mt-7 space-y-8">
        <p className="text-sm leading-6 text-slate-600">All 38 former special-criteria choices are restored below. Select only what you want to disclose. An unchecked item is unknown, not “no.” Career and athletic choices may only rank results when an accepted award-bound fact exists.</p>
        <SensitiveSkip checked={sensitiveCriteriaSkipped} onChange={setSkipSensitive} />
        {SPECIAL_CRITERIA_CATEGORIES.map((category) => <CheckboxGroup key={category} legend={category}>{SPECIAL_CRITERIA.filter((item) => item.category === category).map((item) => <Choice key={item.id} id={item.controlId} label={item.label} detail={item.detail ?? undefined} checked={selectedCriteria.includes(item.id)} disabled={item.sensitive && sensitiveCriteriaSkipped} onChange={() => { if (item.sensitive) setSensitiveCriteriaSkipped(false); toggle(item.id, selectedCriteria, setSelectedCriteria); }} />)}</CheckboxGroup>)}
      </div>}

      {step === 3 && <CheckboxGroup legend="Application formats you prefer" detail="Preferences affect order when the reviewed spreadsheet records a matching application format. They never decide whether you qualify.">{INTERVIEW_APPLICATION_MODES.map((value) => <Choice key={value} id={`application-mode-${value}`} label={applicationModeLabels[value]} checked={preferredApplicationModes.includes(value)} onChange={() => toggle(value, preferredApplicationModes, setPreferredApplicationModes)} />)}</CheckboxGroup>}

      <div className="mt-9 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={step === 0 ? onCancel : () => { setError(''); setStep((current) => current - 1); }} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200">{step === 0 ? (initialAnswers ? 'Back to results' : 'Browse all scholarships') : 'Previous'}</button>
        <button type="button" onClick={step === TOTAL_STEPS - 1 ? submit : continueStep} className="rounded-xl bg-teal-800 px-6 py-3 font-bold text-white shadow-sm hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">{step === TOTAL_STEPS - 1 ? 'Show my results' : 'Continue'}</button>
      </div>
    </section>
  );
}

function Required() { return <span className="text-rose-700">(required)</span>; }
function Optional() { return <span className="font-normal text-slate-500">(optional)</span>; }
function CheckboxGroup({ legend, detail, required = false, children }: { legend: string; detail?: string; required?: boolean; children: React.ReactNode }) { return <fieldset className="mt-7"><legend className="text-base font-bold text-slate-900">{legend} {required ? <Required /> : <Optional />}</legend>{detail && <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>}<div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div></fieldset>; }
function Choice({ id, label, detail, checked, disabled = false, onChange }: { id: string; label: string; detail?: string; checked: boolean; disabled?: boolean; onChange: () => void }) { return <label htmlFor={id} className={`flex items-start rounded-xl border p-4 transition-colors ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : checked ? 'cursor-pointer border-teal-700 bg-teal-50 text-teal-950' : 'cursor-pointer border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}><input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-600" /><span className="ml-3"><span className="block font-semibold">{label}</span>{detail && <span className="mt-1 block text-sm font-normal leading-5 text-slate-600">{detail}</span>}</span></label>; }
function OptionalYesNo({ id, legend, value, onChange }: { id: string; legend: string; value: InterviewAnswers['collegeAccepted']; onChange: (value: InterviewAnswers['collegeAccepted']) => void }) { return <fieldset><legend className="text-base font-bold">{legend} <Optional /></legend><div className="mt-3 grid gap-2">{([[true, 'Yes'], [false, 'No'], ['prefer_not_to_answer', 'Prefer not to answer']] as const).map(([option, label]) => <label key={String(option)} className="flex items-center rounded-xl border border-slate-300 px-4 py-3"><input type="radio" name={id} checked={value === option} onChange={() => onChange(option)} className="h-5 w-5 text-teal-700 focus:ring-teal-600" /><span className="ml-3">{label}</span></label>)}</div></fieldset>; }
function SensitiveSkip({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) { return <label htmlFor="student-sensitive-prefer-not" className="flex items-start rounded-xl border border-slate-300 bg-slate-50 p-4"><input id="student-sensitive-prefer-not" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-600" /><span className="ml-3"><span className="block font-bold">Prefer not to answer sensitive questions</span><span className="mt-1 block text-sm leading-5 text-slate-600">This clears sensitive selections. Skipped and unchecked answers never count against you.</span></span></label>; }
