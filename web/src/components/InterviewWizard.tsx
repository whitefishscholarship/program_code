'use client';

import { useEffect, useRef, useState } from 'react';
import {
  INTERVIEW_APPLICATION_MODES,
  INTERVIEW_SCHOOL_TYPES,
  InterviewAnswersSchema,
  type InterviewAnswers,
} from '@/lib/interviewMatcher';

const schoolTypeLabels: Record<(typeof INTERVIEW_SCHOOL_TYPES)[number], string> = {
  two_year: 'Two-year college',
  four_year: 'Four-year college',
  trade: 'Trade or technical school',
  other: 'Another education path',
};

const applicationModeLabels: Record<(typeof INTERVIEW_APPLICATION_MODES)[number], string> = {
  automatic_consideration: 'Automatic consideration',
  selectable_children: 'One application where I select awards',
  eligibility_matched: 'A portal that matches awards for me',
  shared_with_supplements: 'A shared application with possible supplements',
  direct_per_award: 'A separate application for each award',
  offline: 'Paper or counselor-provided application',
};

type InterviewWizardProps = {
  initialAnswers: InterviewAnswers | null;
  onComplete: (answers: InterviewAnswers) => void;
  onCancel: () => void;
};

export default function InterviewWizard({ initialAnswers, onComplete, onCancel }: InterviewWizardProps) {
  const [step, setStep] = useState(0);
  const [gpa, setGpa] = useState(initialAnswers ? String(initialAnswers.gpa) : '');
  const [schoolTypes, setSchoolTypes] = useState<InterviewAnswers['schoolTypes']>(initialAnswers?.schoolTypes ?? []);
  const [preferredApplicationModes, setPreferredApplicationModes] = useState<InterviewAnswers['preferredApplicationModes']>(initialAnswers?.preferredApplicationModes ?? []);
  const [error, setError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const toggleSchoolType = (value: InterviewAnswers['schoolTypes'][number]) => {
    setSchoolTypes((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
    setError('');
  };

  const toggleApplicationMode = (value: InterviewAnswers['preferredApplicationModes'][number]) => {
    setPreferredApplicationModes((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  };

  const continueFromRequired = () => {
    const numericGpa = Number(gpa);
    if (gpa.trim() === '' || !Number.isFinite(numericGpa) || numericGpa < 0 || numericGpa > 4) {
      setError('Enter an unweighted GPA from 0 to 4.0.');
      return;
    }
    if (schoolTypes.length === 0) {
      setError('Choose at least one school type.');
      return;
    }
    setError('');
    setStep(1);
  };

  const submit = () => {
    const parsed = InterviewAnswersSchema.safeParse({
      gpa: Number(gpa),
      schoolTypes,
      preferredApplicationModes,
    });
    if (!parsed.success) {
      setError('Review the required answers before viewing matches.');
      setStep(0);
      return;
    }
    setError('');
    onComplete(parsed.data);
  };

  return (
    <section aria-labelledby="interview-step-heading" className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-800">Step {step + 1} of 2</p>
        <h2 ref={headingRef} tabIndex={-1} id="interview-step-heading" className="mt-2 text-3xl font-black tracking-tight outline-none">
          {step === 0 ? 'Tell us about your education plans.' : 'Choose optional application preferences.'}
        </h2>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Interview progress" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-teal-700 transition-[width]" style={{ width: step === 0 ? '50%' : '100%' }} />
        </div>
      </div>

      <p className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950">
        Your answers stay only in this page&apos;s temporary memory. They are not saved, sent, logged, added to the address bar, or included in exports.
      </p>

      {error && <p id="interview-error" role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900">{error}</p>}

      {step === 0 ? (
        <div className="mt-7 space-y-8">
          <label htmlFor="student-gpa" className="block text-base font-bold text-slate-900">
            Unweighted GPA <span className="text-rose-700">(required)</span>
            <span className="mt-1 block text-sm font-normal leading-6 text-slate-600">A structured published minimum can create a known conflict. Missing scholarship GPA facts never exclude an award.</span>
            <input
              id="student-gpa"
              name="student-gpa"
              type="number"
              required
              inputMode="decimal"
              min="0"
              max="4"
              step="0.01"
              value={gpa}
              aria-describedby={error ? 'interview-error' : undefined}
              onChange={(event) => { setGpa(event.target.value); setError(''); }}
              className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-950 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 sm:max-w-xs"
              placeholder="For example, 3.5"
            />
          </label>

          <fieldset aria-describedby={error ? 'interview-error' : undefined}>
            <legend className="text-base font-bold text-slate-900">School types you are considering <span className="text-rose-700">(choose at least one)</span></legend>
            <p className="mt-1 text-sm leading-6 text-slate-600">Only structured school-type facts can create a known conflict.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {INTERVIEW_SCHOOL_TYPES.map((value) => (
                <label key={value} className={`flex cursor-pointer items-center rounded-xl border p-4 font-semibold transition-colors ${schoolTypes.includes(value) ? 'border-teal-700 bg-teal-50 text-teal-950' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={schoolTypes.includes(value)} onChange={() => toggleSchoolType(value)} className="h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600" />
                  <span className="ml-3">{schoolTypeLabels[value]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : (
        <fieldset className="mt-7">
          <legend className="text-base font-bold text-slate-900">Application formats you prefer <span className="font-normal text-slate-500">(optional)</span></legend>
          <p className="mt-1 text-sm leading-6 text-slate-600">These choices change ranking only. They never decide whether you qualify.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {INTERVIEW_APPLICATION_MODES.map((value) => (
              <label key={value} className={`flex cursor-pointer items-start rounded-xl border p-4 font-semibold transition-colors ${preferredApplicationModes.includes(value) ? 'border-teal-700 bg-teal-50 text-teal-950' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>
                <input type="checkbox" checked={preferredApplicationModes.includes(value)} onChange={() => toggleApplicationMode(value)} className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-600" />
                <span className="ml-3">{applicationModeLabels[value]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-9 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={step === 0 ? onCancel : () => { setError(''); setStep(0); }} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200">
          {step === 0 ? 'Back to start' : 'Previous'}
        </button>
        <button type="button" onClick={step === 0 ? continueFromRequired : submit} className="rounded-xl bg-teal-800 px-6 py-3 font-bold text-white shadow-sm hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">
          {step === 0 ? 'Continue' : 'Show my matches'}
        </button>
      </div>
    </section>
  );
}
