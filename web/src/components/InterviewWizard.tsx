'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DifferentiationStep from '@/components/steps/DifferentiationStep';
import { differentiationGroups, emptyDifferentiation, toggleDifferentiation, type DifferentiationProfile } from '@/lib/differentiation';
import { INTERVIEW_APPLICATION_MODES, InterviewAnswersSchema, type InterviewAnswers } from '@/lib/interviewMatcher';
import { ACTIVITY_QUESTIONS, EDUCATIONAL_STATUSES, RESIDENCE_STATES, SPECIAL_CRITERIA, SPECIAL_CRITERIA_CATEGORIES, TARGET_SCHOOL_TYPES } from '@/lib/interviewQuestions';
import { COVERAGE_INTERESTS, STUDENT_ORGANIZATIONS, FINANCIAL_NEED_INTEREST } from '@/lib/coverageQuestions';
import type { StudentAward } from '@/lib/studentCatalog';

const stepHeadings = ['Start with two details', 'More details and application preferences', 'What makes you different?', 'Study plans and activities', 'Helpful scholarship connections'] as const;
const applicationModeLabels: Record<(typeof INTERVIEW_APPLICATION_MODES)[number], string> = {
  automatic_consideration: 'Automatic consideration', selectable_children: 'One application where I select awards', eligibility_matched: 'A portal that matches awards for me', shared_with_supplements: 'A shared application with possible supplements', direct_per_award: 'A separate application for each award', offline: 'Paper or counselor-provided application',
};
type Props = { awards: readonly StudentAward[]; initialAnswers: InterviewAnswers | null; onComplete: (answers: InterviewAnswers) => void; onCancel: () => void; syntheticQa?: boolean };

export default function InterviewWizard({ awards, initialAnswers, onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [gpa, setGpa] = useState(initialAnswers ? String(initialAnswers.gpa) : '');
  const [residenceState, setResidenceState] = useState(initialAnswers?.residenceState ?? null);
  const [educationalStatus, setEducationalStatus] = useState(initialAnswers?.educationalStatus ?? null);
  const [targetSchoolTypes, setTargetSchoolTypes] = useState<InterviewAnswers['targetSchoolTypes']>(initialAnswers?.targetSchoolTypes ?? []);
  const [collegeAccepted, setCollegeAccepted] = useState<InterviewAnswers['collegeAccepted']>(initialAnswers?.collegeAccepted === 'prefer_not_to_answer' ? null : initialAnswers?.collegeAccepted ?? null);
  const [gapYear, setGapYear] = useState<InterviewAnswers['gapYear']>(initialAnswers?.gapYear === 'prefer_not_to_answer' ? null : initialAnswers?.gapYear ?? null);
  const [activities, setActivities] = useState<InterviewAnswers['activities']>((initialAnswers?.activities ?? []).filter(id => !initialAnswers?.sensitiveCriteriaSkipped || id !== 'caregiving'));
  const [financialNeedInterest, setFinancialNeedInterest] = useState<InterviewAnswers['financialNeedInterest']>(initialAnswers?.sensitiveCriteriaSkipped || initialAnswers?.financialNeedInterest === 'prefer_not_to_answer' ? null : initialAnswers?.financialNeedInterest ?? (initialAnswers?.financialNeed ? 'yes' : null));
  const [discoveryInterests, setDiscoveryInterests] = useState<NonNullable<InterviewAnswers['discoveryInterests']>>(initialAnswers?.discoveryInterests ?? []);
  const [studentOrganizations, setStudentOrganizations] = useState<NonNullable<InterviewAnswers['studentOrganizations']>>(initialAnswers?.organizationResponse === 'prefer_not_to_answer' ? [] : initialAnswers?.studentOrganizations ?? []);
  const [organizationResponse, setOrganizationResponse] = useState<InterviewAnswers['organizationResponse']>(initialAnswers?.organizationResponse === 'prefer_not_to_answer' ? null : initialAnswers?.organizationResponse ?? null);
  const [selectedCriteria, setSelectedCriteria] = useState<InterviewAnswers['selectedCriteria']>((initialAnswers?.selectedCriteria ?? []).filter(id => !initialAnswers?.sensitiveCriteriaSkipped || !SPECIAL_CRITERIA.some(item => item.id === id && item.sensitive)));
  const [preferredApplicationModes, setPreferredApplicationModes] = useState<InterviewAnswers['preferredApplicationModes']>(initialAnswers?.preferredApplicationModes ?? []);
  const [profile, setProfile] = useState<DifferentiationProfile>(initialAnswers?.differentiation ?? emptyDifferentiation());
  const [error, setError] = useState('');
  const groups = useMemo(() => differentiationGroups(awards), [awards]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const toggle = <T extends string>(value: T, values: readonly T[], update: (next: T[]) => void) => {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    setError('');
  };
  const validCore = () => {
    const numericGpa = Number(gpa);
    if (gpa.trim() === '' || !Number.isFinite(numericGpa) || numericGpa < 0 || numericGpa > 4) { setError('Enter an unweighted GPA from 0 to 4.0.'); setStep(0); return false; }
    if (targetSchoolTypes.length === 0) { setError('Choose at least one target school type.'); setStep(0); return false; }
    setError(''); return true;
  };
  const submit = () => {
    if (step !== stepHeadings.length - 1 || !validCore()) return;
    const parsed = InterviewAnswersSchema.safeParse({
      gpa: Number(gpa), residenceState, educationalStatus, targetSchoolTypes, collegeAccepted, gapYear, activities,
      volunteerHours: null,
      financialNeed: false, financialNeedInterest, discoveryInterests, studentOrganizations, organizationResponse,
      selectedCriteria, sensitiveCriteriaSkipped: false, preferredApplicationModes, differentiation: profile,
    });
    if (!parsed.success) { setError('Review your answers before viewing results.'); return; }
    onComplete(parsed.data);
  };
  const goTo = (next: number) => { if (validCore()) setStep(next); };
  const renderCriteria = (categories: string[]) => categories.map((category) => (
    <details key={category} open className="rounded-2xl border border-slate-200 p-4">
      <summary className="cursor-pointer rounded-lg font-bold focus:outline-none focus:ring-4 focus:ring-teal-200">{category}</summary>
      <CheckboxGroup legend={category}>{SPECIAL_CRITERIA.filter((item) => item.category === category).map((item) => <Choice key={item.id} id={item.controlId} label={item.label} detail={item.detail ?? undefined} checked={selectedCriteria.includes(item.id)} onChange={() => { toggle(item.id, selectedCriteria, setSelectedCriteria); }} />)}</CheckboxGroup>
    </details>
  ));

  return (
    <section aria-labelledby="interview-step-heading" className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-800">Step {step + 1} of {stepHeadings.length}</p>
        <h2 ref={headingRef} tabIndex={-1} id="interview-step-heading" className="mt-2 text-3xl font-black tracking-tight outline-none">{stepHeadings[step]}</h2>
        <p className="mt-3 leading-6 text-slate-600">{step === 0 ? 'Follow five short steps to build your scholarship shortlist. Only your GPA and target school type are required.' : step === 2 ? 'Pick any boxes that fit you. You can skip this step. Leaving a box empty does not hide an award.' : 'Select what applies to you, then continue. You can leave other answers blank and go back to make changes.'}</p>
      </div>
      {error && <p id="interview-error" role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900">{error}</p>}

      {step === 0 && <div className="mt-7 space-y-8">
        <label htmlFor="student-gpa" className="block text-base font-bold text-slate-900">Unweighted GPA <Required /><input id="student-gpa" type="number" required inputMode="decimal" min="0" max="4" step="0.01" value={gpa} onChange={(event) => { setGpa(event.target.value); setError(''); }} className="mt-3 block w-full rounded-xl border border-slate-300 px-4 py-3 font-normal sm:max-w-xs" placeholder="For example, 3.5" /></label>
        <CheckboxGroup legend="Target school type (select all that apply)" required>{TARGET_SCHOOL_TYPES.map(([value, label]) => <Choice key={value} id={`student-target-school-types-${value}`} label={label} checked={targetSchoolTypes.includes(value)} onChange={() => toggle(value, targetSchoolTypes, setTargetSchoolTypes)} />)}</CheckboxGroup>
      </div>}

      {step === 1 && <div className="mt-7 space-y-7">
        <div className="grid gap-6 sm:grid-cols-2">
          <label htmlFor="student-residence-state" className="block text-base font-bold">State of residence <Optional /><select id="student-residence-state" value={residenceState ?? ''} onChange={(event) => setResidenceState((event.target.value || null) as InterviewAnswers['residenceState'])} className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"><option value="">Leave unanswered</option>{RESIDENCE_STATES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label htmlFor="student-educational-status" className="block text-base font-bold">Current educational status <Optional /><select id="student-educational-status" value={educationalStatus ?? ''} onChange={(event) => setEducationalStatus((event.target.value || null) as InterviewAnswers['educationalStatus'])} className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"><option value="">Leave unanswered</option>{EDUCATIONAL_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <div className="grid gap-6 sm:grid-cols-2"><OptionalYesNo id="student-college-accepted" legend="Have you been accepted to a college yet?" value={collegeAccepted} onChange={setCollegeAccepted} /><OptionalYesNo id="student-gap-year" legend="Are you planning to take a gap year?" value={gapYear} onChange={setGapYear} /></div>
        <CheckboxGroup legend="Application formats you prefer">{INTERVIEW_APPLICATION_MODES.map((value) => <Choice key={value} id={`application-mode-${value}`} label={applicationModeLabels[value]} checked={preferredApplicationModes.includes(value)} onChange={() => toggle(value, preferredApplicationModes, setPreferredApplicationModes)} />)}</CheckboxGroup>
      </div>}

      {step === 2 && <DifferentiationStep groups={groups} profile={profile} onToggle={(chip) => { setProfile((current) => toggleDifferentiation(current, chip)); setError(''); }} />}

      {step === 3 && <div className="mt-7 space-y-7">
        <CheckboxGroup legend="Education interests">{COVERAGE_INTERESTS.map(item => <Choice key={item.id} id={`discovery-${item.id}`} label={item.label} checked={discoveryInterests.includes(item.id)} onChange={() => toggle(item.id, discoveryInterests, setDiscoveryInterests)} />)}</CheckboxGroup>
        {renderCriteria(['Career Interests', 'Extracurriculars & Activities'])}
        <CheckboxGroup legend="Activities and responsibilities">{ACTIVITY_QUESTIONS.map((item) => <Choice key={item.id} id={item.controlId} label={item.label} checked={activities.includes(item.id)} onChange={() => { toggle(item.id, activities, setActivities); }} />)}</CheckboxGroup>
      </div>}

      {step === 4 && <div className="mt-7 space-y-7">
        <fieldset className="rounded-2xl border border-slate-200 p-4">
          <legend className="px-2 font-bold">Would you like to see scholarships that consider financial need? <Optional /></legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{FINANCIAL_NEED_INTEREST.filter(([value]) => value !== 'prefer_not_to_answer').map(([value, label]) => <label key={value} className="flex items-center rounded-xl border border-slate-300 p-3"><input type="radio" name="financial-need-interest" id={`financial-need-${value}`} checked={financialNeedInterest === value} onChange={() => setFinancialNeedInterest(value)} className="h-5 w-5 text-teal-700" /><span className="ml-3">{label}</span></label>)}</div>
          {financialNeedInterest != null && <ClearAnswer id="clear-financial-need" label="financial need" onClear={() => setFinancialNeedInterest(null)} />}
        </fieldset>
        <CheckboxGroup legend="Are you a member of any of these student organizations?">{STUDENT_ORGANIZATIONS.map(item => <Choice key={item.id} id={`organization-${item.id}`} label={item.label} checked={studentOrganizations.includes(item.id)} onChange={() => { const next = studentOrganizations.includes(item.id) ? studentOrganizations.filter(id => id !== item.id) : [...studentOrganizations, item.id]; setStudentOrganizations(next); setOrganizationResponse(next.length ? 'selected' : null); }} />)}</CheckboxGroup>
        <div role="group" aria-label="Other organization answers" className="grid gap-3 sm:grid-cols-2">{([['none', 'None of these'], ['not_sure', 'Not sure']] as const).map(([value, label]) => <label key={value} className="flex items-center rounded-xl border border-slate-300 p-3"><input type="radio" id={`organization-${value}`} name="organization-response" checked={organizationResponse === value} onChange={() => { setOrganizationResponse(value); setStudentOrganizations([]); }} className="h-5 w-5 text-teal-700" /><span className="ml-3">{label}</span></label>)}</div>
        {(organizationResponse != null || studentOrganizations.length > 0) && <ClearAnswer id="clear-organizations" label="student organizations" onClear={() => { setStudentOrganizations([]); setOrganizationResponse(null); }} />}
        {renderCriteria(SPECIAL_CRITERIA_CATEGORIES.filter(category => category !== 'Career Interests' && category !== 'Extracurriculars & Activities'))}
      </div>}

      <div className="mt-9 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row-reverse sm:items-center sm:justify-between">
        <button type="button" onClick={step < stepHeadings.length - 1 ? () => goTo(step + 1) : submit} className="rounded-xl bg-teal-800 px-6 py-3 font-bold text-white shadow-sm hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">{step < stepHeadings.length - 1 ? 'Continue' : 'Show my results'}</button>
        {step > 0
          ? <button type="button" onClick={() => { setError(''); setStep(current => current - 1); }} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Back</button>
          : <button type="button" onClick={onCancel} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-teal-200">{initialAnswers ? 'Back to results' : 'Browse all scholarships'}</button>}
      </div>
    </section>
  );
}

function Required() { return <span className="text-rose-700">(required)</span>; }
function Optional() { return <span className="font-normal text-slate-500">(optional)</span>; }
function CheckboxGroup({ legend, detail, required = false, children }: { legend: string; detail?: string; required?: boolean; children: React.ReactNode }) { return <fieldset className="mt-7"><legend className="text-base font-bold text-slate-900">{legend} {required ? <Required /> : <Optional />}</legend>{detail && <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>}<div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div></fieldset>; }
function Choice({ id, label, detail, checked, disabled = false, onChange }: { id: string; label: string; detail?: string; checked: boolean; disabled?: boolean; onChange: () => void }) { return <label htmlFor={id} className={`flex items-start rounded-xl border p-4 transition-colors ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : checked ? 'cursor-pointer border-teal-700 bg-teal-50 text-teal-950' : 'cursor-pointer border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}><input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-600" /><span className="ml-3"><span className="block font-semibold">{label}</span>{detail && <span className="mt-1 block text-sm font-normal leading-5 text-slate-600">{detail}</span>}</span></label>; }
function OptionalYesNo({ id, legend, value, onChange }: { id: string; legend: string; value: InterviewAnswers['collegeAccepted']; onChange: (value: InterviewAnswers['collegeAccepted']) => void }) { return <fieldset><legend className="text-base font-bold">{legend} <Optional /></legend><div className="mt-3 grid gap-2">{([[true, 'Yes'], [false, 'No']] as const).map(([option, label]) => <label key={String(option)} className="flex items-center rounded-xl border border-slate-300 px-4 py-3"><input type="radio" name={id} checked={value === option} onChange={() => onChange(option)} className="h-5 w-5 text-teal-700 focus:ring-teal-600" /><span className="ml-3">{label}</span></label>)}</div>{value != null && <ClearAnswer id={`clear-${id}`} label={legend} onClear={() => onChange(null)} />}</fieldset>; }
function ClearAnswer({ id, label, onClear }: { id: string; label: string; onClear: () => void }) { return <button id={id} type="button" aria-label={`Clear answer: ${label}`} onClick={onClear} className="mt-3 rounded px-2 py-1 text-sm font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-teal-200">Clear answer</button>; }
