'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InterviewWizard from '@/components/InterviewWizard';
import { awardCsvDataUri } from '@/lib/export';
import {
  buildSyntheticMatrixMatchFacts,
  matchStudentAwards,
  type AwardMatchResult,
  type InterviewAnswers,
} from '@/lib/interviewMatcher';
import { CURRENT_ACCEPTED_MATCH_FACTS } from '@/lib/p8mMatchingFacts';
import { shortlistAwards, type DisplayResult } from '@/lib/spreadsheetShortlist';
import { loadStudentCatalog, type CatalogQaMode } from '@/lib/studentCatalogClient';
import {
  APPLICATION_MODES,
  CYCLE_STATUSES,
  type ApplicationMode,
  type CycleStatus,
  displayVerification,
  formatCheckedDate,
  openStatusText,
  type StudentAward,
  type StudentCatalog,
  type StudentPortal,
  type StudentSource,
} from '@/lib/studentCatalog';

type Experience = 'start' | 'interview' | 'results' | 'browse';
type View = 'awards' | 'portals' | 'sources';
type Sort = 'match' | 'status' | 'name' | 'amount';
type ResultScope = 'recommended' | 'conflicts' | 'all';
type SchoolType = 'all' | 'two_year' | 'four_year' | 'trade' | 'other';

const statusStyles: Record<CycleStatus, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  upcoming: 'border-sky-200 bg-sky-50 text-sky-800',
  closed: 'border-slate-300 bg-slate-100 text-slate-700',
  unavailable: 'border-rose-200 bg-rose-50 text-rose-800',
  unknown: 'border-amber-200 bg-amber-50 text-amber-900',
};

const statusLabels: Record<CycleStatus, string> = {
  active: 'Open now',
  upcoming: 'Upcoming',
  closed: 'Closed',
  unavailable: 'Unavailable',
  unknown: 'Availability not verified',
};

const applicationLabels: Record<ApplicationMode, string> = {
  automatic_consideration: 'Automatic consideration',
  selectable_children: 'Select awards',
  eligibility_matched: 'Eligibility matching',
  shared_with_supplements: 'Shared application',
  direct_per_award: 'Direct application',
  offline: 'Paper / offline',
  unknown: 'Not verified',
};

const schoolTypeLabels: Record<Exclude<SchoolType, 'all'>, string> = {
  two_year: 'Two-year',
  four_year: 'Four-year',
  trade: 'Trade',
  other: 'Other',
};

const decisionLabels: Record<DisplayResult['decision'], string> = {
  recorded_fit: 'Fits recorded criteria',
  needs_checking: 'Needs checking',
  recorded_mismatch: 'Outside shortlist',
  match: 'Structured match',
  possible_match: 'Possible match',
  known_conflict: 'Known conflict',
};

const decisionStyles: Record<DisplayResult['decision'], string> = {
  recorded_fit: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  needs_checking: 'border-amber-200 bg-amber-50 text-amber-950',
  recorded_mismatch: 'border-slate-300 bg-slate-100 text-slate-800',
  match: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  possible_match: 'border-amber-200 bg-amber-50 text-amber-950',
  known_conflict: 'border-rose-200 bg-rose-50 text-rose-900',
};

function statusRank(status: CycleStatus): number {
  return { active: 0, upcoming: 1, unknown: 2, unavailable: 3, closed: 4 }[status];
}

export default function ScholarshipBrowser() {
  const [catalog, setCatalog] = useState<StudentCatalog | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [experience, setExperience] = useState<Experience>('interview');
  const [answers, setAnswers] = useState<InterviewAnswers | null>(null);
  const [resultScope, setResultScope] = useState<ResultScope>('recommended');
  const [view, setView] = useState<View>('awards');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | CycleStatus>('all');
  const [method, setMethod] = useState<'all' | ApplicationMode>('all');
  const [schoolType, setSchoolType] = useState<SchoolType>('all');
  const [sort, setSort] = useState<Sort>('status');
  const experienceHeadingRef = useRef<HTMLHeadingElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rawQa = process.env.NODE_ENV !== 'production'
        ? new URLSearchParams(window.location.search).get('qa')
        : null;
      const qaMode: CatalogQaMode = rawQa === 'matrix'
        ? 'matrix'
        : rawQa === 'error' && attempt === 0
          ? 'error'
          : null;
      setCatalog(await loadStudentCatalog(qaMode));
    } catch (caught) {
      setCatalog(null);
      setError(caught instanceof Error ? caught.message : 'The scholarship catalog is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [attempt]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!loading && catalog && experience !== 'interview') experienceHeadingRef.current?.focus();
  }, [catalog, experience, loading]);

  const isSyntheticMatrix = process.env.NODE_ENV !== 'production' && catalog?.catalogRevision === 'f'.repeat(64);

  const matching = useMemo(() => {
    if (!catalog || !answers) return null;
    const acceptedFacts = isSyntheticMatrix
      ? buildSyntheticMatrixMatchFacts(catalog.awards)
      : CURRENT_ACCEPTED_MATCH_FACTS;
    return isSyntheticMatrix ? matchStudentAwards(catalog.awards, answers, acceptedFacts) : shortlistAwards(catalog.awards, answers);
  }, [answers, catalog, isSyntheticMatrix]);

  const matchByAwardId = useMemo(() => new Map(
    (matching?.results ?? []).map((result) => [result.award.publicId, result]),
  ), [matching]);

  const selectedResults = useMemo(() => {
    if (!matching) return [];
    if (resultScope === 'recommended') return matching.results.filter((result) => result.decision !== 'known_conflict' && result.decision !== 'recorded_mismatch');
    if (resultScope === 'conflicts') return matching.results.filter((result) => (result.decision === 'known_conflict' || result.decision === 'recorded_mismatch'));
    return matching.results;
  }, [matching, resultScope]);

  const baseAwards = experience === 'results'
    ? selectedResults.map((result) => result.award)
    : catalog?.awards ?? [];

  const visibleAwards = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const order = new Map(baseAwards.map((award, index) => [award.publicId, index]));
    return baseAwards.filter((award) => {
      const matchesSearch = !query || [award.name, award.summary, award.amount.label, award.eligibility.focus, award.application.label]
        .filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
      const matchesStatus = status === 'all' || award.cycle.status === status;
      const matchesMethod = method === 'all' || award.application.mode === method;
      const matchesSchool = schoolType === 'all' || award.eligibility.schoolTypes.includes(schoolType);
      return matchesSearch && matchesStatus && matchesMethod && matchesSchool;
    }).sort((left, right) => {
      if (sort === 'match') return (order.get(left.publicId) ?? 0) - (order.get(right.publicId) ?? 0);
      if (sort === 'name') return left.name.localeCompare(right.name) || left.publicId.localeCompare(right.publicId);
      if (sort === 'amount') return (right.amount.maximum ?? right.amount.minimum ?? -1) - (left.amount.maximum ?? left.amount.minimum ?? -1) || left.name.localeCompare(right.name) || left.publicId.localeCompare(right.publicId);
      return statusRank(left.cycle.status) - statusRank(right.cycle.status) || left.name.localeCompare(right.name) || left.publicId.localeCompare(right.publicId);
    });
  }, [baseAwards, method, schoolType, search, sort, status]);

  const visibleSources = useMemo(() => {
    if (!catalog) return [];
    const query = search.trim().toLocaleLowerCase();
    return catalog.sources.filter((source) => !query || [source.title, source.recordType, source.architecture, source.availability]
      .join(' ').toLocaleLowerCase().includes(query));
  }, [catalog, search]);

  const visiblePortals = useMemo(() => {
    if (!catalog) return [];
    const query = search.trim().toLocaleLowerCase();
    return catalog.portals.filter((portal) => !query || [portal.title, portal.architecture]
      .join(' ').toLocaleLowerCase().includes(query));
  }, [catalog, search]);

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setMethod('all');
    setSchoolType('all');
  };

  const beginInterview = (preserveAnswers: boolean) => {
    clearFilters();
    if (!preserveAnswers) setAnswers(null);
    setExperience('interview');
  };

  const showBrowseAll = () => {
    clearFilters();
    setView('awards');
    setSort('status');
    setExperience('browse');
  };

  const resetInterview = () => {
    clearFilters();
    setAnswers(null);
    setResultScope('recommended');
    setSort('status');
    setExperience('interview');
  };

  if (loading) {
    return (
      <section aria-live="polite" aria-busy="true" className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" aria-hidden="true" />
        <h2 className="text-xl font-bold">Loading the scholarship catalog</h2>
        <p className="mt-2 text-slate-600">Preparing the private interview and complete browse-all alternative.</p>
      </section>
    );
  }

  if (error || !catalog) {
    return (
      <section role="alert" className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wider text-rose-700">Catalog unavailable</p>
        <h2 className="mt-2 text-2xl font-black">We couldn&apos;t load scholarship information.</h2>
        <p className="mt-3 text-slate-600">{error || 'Please try again.'}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-6 rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">
          Try again
        </button>
      </section>
    );
  }

  if (experience === 'start') {
    return (
      <section aria-labelledby="interview-start-heading" className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-800">Scholarship interview</p>
          <h2 ref={experienceHeadingRef} tabIndex={-1} id="interview-start-heading" className="mt-3 max-w-3xl text-4xl font-black tracking-tight outline-none sm:text-5xl">Find scholarships that fit your education plans.</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Follow four short steps to explore scholarships for your education plans.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => beginInterview(false)} className="rounded-xl bg-teal-800 px-6 py-4 text-lg font-bold text-white shadow-sm hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Start the interview</button>
            <button type="button" onClick={showBrowseAll} className="rounded-xl border-2 border-teal-800 bg-white px-6 py-4 text-lg font-bold text-teal-900 hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Browse all {catalog.counts.awards} awards</button>
          </div>
        </div>
      </section>
    );
  }

  if (experience === 'interview') {
    return (
      <InterviewWizard
        initialAnswers={answers}
        syntheticQa={isSyntheticMatrix}
        onCancel={() => answers ? setExperience('results') : showBrowseAll()}
        onComplete={(nextAnswers) => {
          setAnswers(nextAnswers);
          setResultScope('recommended');
          setView('awards');
          setSort('match');
          clearFilters();
          setExperience('results');
        }}
      />
    );
  }

  const hasFilters = Boolean(search || status !== 'all' || method !== 'all' || schoolType !== 'all');
  const isResults = experience === 'results' && matching;
  const shownCount = view === 'awards' ? visibleAwards.length : view === 'portals' ? visiblePortals.length : visibleSources.length;
  const totalCount = view === 'awards' ? baseAwards.length : view === 'portals' ? catalog.counts.portals : catalog.counts.sources;

  return (
    <section aria-labelledby="catalog-heading">
      {isResults ? (
        <div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-800">Your results</p>
              <h2 ref={experienceHeadingRef} tabIndex={-1} id="catalog-heading" className="mt-2 text-3xl font-black tracking-tight outline-none sm:text-4xl">Your scholarship shortlist.</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => beginInterview(true)} className="rounded-xl border border-teal-800 bg-white px-4 py-3 font-bold text-teal-900 hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Edit answers</button>
              <button type="button" onClick={showBrowseAll} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Browse all</button>
              <button type="button" onClick={resetInterview} className="rounded-xl bg-slate-800 px-4 py-3 font-bold text-white hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-300">Reset interview</button>
            </div>
          </div>
          <dl className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Interview result counts">
            <Count label={isSyntheticMatrix ? "Structured matches" : "Fits recorded criteria"} value={matching.counts.match} emphasis="positive" />
            <Count label={isSyntheticMatrix ? "Possible matches" : "Needs checking"} value={matching.counts.possibleMatch} emphasis="warning" />
            <Count label={isSyntheticMatrix ? "Known conflicts" : "Outside shortlist"} value={matching.counts.knownConflict} emphasis={matching.counts.knownConflict ? 'negative' : 'neutral'} />
          </dl>
          <p className="sr-only" role="status" aria-live="polite">{matching.counts.match} fit recorded criteria, {matching.counts.possibleMatch} need checking, and {matching.counts.knownConflict} are outside the shortlist.</p>
          <div role="group" aria-label="Choose interview result set" className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <ScopeButton active={resultScope === 'recommended'} onClick={() => { clearFilters(); setResultScope('recommended'); }}>Shortlist ({matching.counts.match + matching.counts.possibleMatch})</ScopeButton>
            <ScopeButton active={resultScope === 'conflicts'} onClick={() => { clearFilters(); setResultScope('conflicts'); }}>Outside shortlist ({matching.counts.knownConflict})</ScopeButton>
            <ScopeButton active={resultScope === 'all'} onClick={() => { clearFilters(); setResultScope('all'); }}>All awards ({matching.counts.total})</ScopeButton>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-800">Browse all</p>
              <h2 ref={experienceHeadingRef} tabIndex={-1} id="catalog-heading" className="mt-2 text-3xl font-black tracking-tight outline-none sm:text-4xl">See what is verified—and what is not.</h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{catalog.notice}</p>
            </div>
            <button type="button" onClick={() => beginInterview(false)} className="rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Start interview</button>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Canonical catalog counts">
            <Count label="Award records" value={catalog.counts.awards} />
            <Count label="Open cycles" value={catalog.counts.activeCycles} emphasis={catalog.counts.activeCycles === 0 ? 'warning' : 'positive'} />
            <Count label="Unknown cycles" value={catalog.counts.unknownCycles} emphasis="warning" />
            <Count label="Portal records" value={catalog.counts.portals} />
            <Count label="Source records" value={catalog.counts.sources} />
            <Count label="Minimum award slots" value={catalog.counts.minimumObservedRecipientSlots} suffix="*" />
          </dl>
          <p className="mt-2 text-xs text-slate-500">* Historical or undated minimum observed across these award records; not a count of currently open slots.</p>
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Checked October 27, 2026:</strong> {catalog.awards.filter((award) => award.verification?.status === 'verified').length} scholarships are marked Verified, with a source link and a clear open, upcoming, or closed status. The other awards are not yet checked, so an unknown cycle is not labeled open.
          </div>
        </div>
      )}

      {isResults && baseAwards.length === 0 ? (
        <NoRecommendations onEdit={() => beginInterview(true)} onBrowse={showBrowseAll} />
      ) : (
        <>
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {!isResults && (
              <div role="group" aria-label="Choose catalog record type" className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                <ScopeButton active={view === 'awards'} onClick={() => setView('awards')}>Awards ({catalog.counts.awards})</ScopeButton>
                <ScopeButton active={view === 'portals'} onClick={() => setView('portals')}>Portal records ({catalog.counts.portals})</ScopeButton>
                <ScopeButton active={view === 'sources'} onClick={() => setView('sources')}>Source records ({catalog.counts.sources})</ScopeButton>
              </div>
            )}
            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="block text-sm font-bold text-slate-800">
                Search {isResults ? 'results' : view}
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={view === 'awards' ? 'Name, amount, focus, or application method' : view === 'portals' ? 'Portal name or architecture' : 'Source host or architecture'} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100" />
              </label>
              {view === 'awards' && (
                <label className="block text-sm font-bold text-slate-800">
                  Sort
                  <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 lg:w-60">
                    {isResults && <option value="match">Best match first</option>}
                    <option value="status">Status, then name</option>
                    <option value="name">Name A–Z</option>
                    <option value="amount">Highest stated amount</option>
                  </select>
                </label>
              )}
            </div>
            {view === 'awards' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <FilterSelect label="Cycle status" value={status} onChange={(value) => setStatus(value as 'all' | CycleStatus)} options={[["all", "All statuses"], ...CYCLE_STATUSES.map((value) => [value, statusLabels[value]] as [string, string])]} />
                <FilterSelect label="Application method" value={method} onChange={(value) => setMethod(value as 'all' | ApplicationMode)} options={[["all", "All methods"], ...APPLICATION_MODES.map((value) => [value, applicationLabels[value]] as [string, string])]} />
                <FilterSelect label="School type" value={schoolType} onChange={(value) => setSchoolType(value as SchoolType)} options={[["all", "All school types"], ...Object.entries(schoolTypeLabels)]} />
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <p aria-live="polite" className="text-sm text-slate-600">Showing <strong className="text-slate-950">{shownCount}</strong> of {totalCount} {isResults ? 'selected results' : view}</p>
              <div className="flex flex-wrap items-center gap-2">
                {hasFilters && <button type="button" onClick={clearFilters} className="rounded-lg px-3 py-2 text-sm font-bold text-teal-800 underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-teal-200">Clear filters</button>}
                {view === 'awards' && visibleAwards.length > 0
                  ? <a href={awardCsvDataUri(visibleAwards)} download={`whitefish-scholarships-${new Date().toISOString().slice(0, 10)}.csv`} className="rounded-xl border-2 border-teal-800 bg-white px-4 py-2 text-center text-sm font-bold text-teal-900 hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Export {visibleAwards.length} award{visibleAwards.length === 1 ? '' : 's'} as CSV</a>
                  : view === 'awards' && <button type="button" disabled className="cursor-not-allowed rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-400">Export 0 awards as CSV</button>}
              </div>
            </div>
          </div>

          {view === 'awards' && (visibleAwards.length
            ? <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">{visibleAwards.map((award) => <AwardCard key={award.publicId} award={award} result={isResults ? matchByAwardId.get(award.publicId) : undefined} />)}</div>
            : <EmptyState noun="awards" onClear={clearFilters} />)}
          {view === 'portals' && (visiblePortals.length
            ? <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">{visiblePortals.map((portal) => <PortalCard key={portal.publicId} portal={portal} />)}</div>
            : <EmptyState noun="portals" onClear={clearFilters} />)}
          {view === 'sources' && (visibleSources.length
            ? <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleSources.map((source) => <SourceCard key={source.publicId} source={source} />)}</div>
            : <EmptyState noun="sources" onClear={clearFilters} />)}
        </>
      )}
    </section>
  );
}

function Count({ label, value, suffix = '', emphasis = 'neutral' }: { label: string; value: number; suffix?: string; emphasis?: 'neutral' | 'warning' | 'positive' | 'negative' }) {
  const color = emphasis === 'warning' ? 'border-amber-200 bg-amber-50' : emphasis === 'positive' ? 'border-emerald-200 bg-emerald-50' : emphasis === 'negative' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white';
  return <div className={`rounded-2xl border p-4 shadow-sm ${color}`}><dt className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</dt><dd className="mt-2 text-3xl font-black text-slate-950">{value}{suffix}</dd></div>;
}

function ScopeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button aria-pressed={active} type="button" onClick={onClick} className={`rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-200 ${active ? 'bg-teal-800 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>{children}</button>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold text-slate-800">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function AwardCard({ award, result }: { award: StudentAward; result?: DisplayResult }) {
  const verification = displayVerification(award);
  const verified = verification.status === 'verified';
  const openness = openStatusText(award);
  return (
    <article data-award-id={award.publicId} data-verification-status={verification.status} className="flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {result && <p className={`mb-4 w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${decisionStyles[result.decision]}`}>{decisionLabels[result.decision]}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-xl font-black leading-snug">{award.name}</h3>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[award.cycle.status]}`}><span aria-hidden="true">● </span>{award.cycle.label}</span>
      </div>
      {verified ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">Verified</span>
          {verification.lastChecked && <span className="text-slate-600">Checked {formatCheckedDate(verification.lastChecked)}</span>}
          {verification.sourceUrl && <a href={verification.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-teal-800 underline decoration-2 underline-offset-4 hover:text-teal-950 focus:outline-none focus:ring-4 focus:ring-teal-200">Official source <span className="sr-only">for {award.name}</span><span aria-hidden="true"> ↗</span></a>}
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-600">Not yet checked</p>
      )}
      {openness && <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{openness}</p>}
      <p className="mt-4 text-3xl font-black text-teal-900">{award.amount.label}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
        <Chip>{award.eligibility.audience}</Chip>
        {award.eligibility.minimumGpa !== null && <Chip>Minimum GPA {award.eligibility.minimumGpa}</Chip>}
        {award.eligibility.schoolTypes.map((type) => <Chip key={type}>{schoolTypeLabels[type]}</Chip>)}
      </div>
      {result && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="font-black text-slate-950">Why this decision</h4>
          {'relevant' in result && result.relevant && <p className="mt-2 font-bold text-teal-900">Connected to your answers — check the details below</p>}
          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
            {result.reasons.map((reason, index) => <li key={`${reason.code}-${index}`} className="flex gap-2"><span aria-hidden="true">{reason.kind === 'known_conflict' ? '×' : reason.kind === 'verification_needed' ? '?' : reason.kind === 'preference' ? '◇' : '✓'}</span><span>{reason.message}</span></li>)}
          </ul>
        </div>
      )}
      {award.summary && <p className="mt-4 break-words text-sm leading-6 text-slate-600">{award.summary}</p>}
      <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <summary className="cursor-pointer rounded-lg font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-teal-200">Details</summary>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><dt className="font-bold text-slate-950">Application method</dt><dd className="mt-1 break-words leading-6 text-slate-600">{award.application.label}</dd></div>
          <div><dt className="font-bold text-slate-950">Deadline</dt><dd className="mt-1 break-words leading-6 text-slate-600">{verification.deadline ?? (award.cycle.closes ? award.cycle.closes : 'No checked deadline')}</dd></div>
          {award.cycle.opens && <div><dt className="font-bold text-slate-950">Opens</dt><dd className="mt-1 break-words leading-6 text-slate-600">{award.cycle.opens}</dd></div>}
          <div><dt className="font-bold text-slate-950">Last checked</dt><dd className="mt-1 break-words leading-6 text-slate-600">{verification.lastChecked ? formatCheckedDate(verification.lastChecked) : 'Not yet checked'}</dd></div>
        </dl>
      </details>
      <div className="mt-auto pt-6">
        {award.application.url ? <a href={award.application.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center rounded-xl bg-teal-800 px-5 py-3 text-center font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Check official application source <span className="sr-only">for {award.name}</span><span aria-hidden="true"> ↗</span></a> : <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700">No verified online application link</p>}
        {award.cycle.status !== 'active' && <p className="mt-2 text-center text-xs leading-5 text-slate-500">This link does not mean the award is currently open.</p>}
      </div>
    </article>
  );
}

function SourceCard({ source }: { source: StudentSource }) {
  return (
    <article className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wider text-teal-800">{source.architecture.replaceAll('_', ' ')}</p><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700">{source.recordType}</span></div>
      <h3 className="mt-2 break-words text-xl font-black">{source.title}</h3>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="font-bold">Catalog state</dt><dd className="mt-1 capitalize text-slate-600">{source.availability}</dd></div><div><dt className="font-bold">Linked awards</dt><dd className="mt-1 text-slate-600">{source.awardCount}</dd></div></dl>
      {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex font-bold text-teal-800 underline decoration-2 underline-offset-4 hover:text-teal-950 focus:outline-none focus:ring-4 focus:ring-teal-200">Visit official source <span className="sr-only">{source.title}</span><span aria-hidden="true"> ↗</span></a> : <p className="mt-6 text-sm font-bold text-slate-600">Offline source; no verified URL</p>}
    </article>
  );
}

function PortalCard({ portal }: { portal: StudentPortal }) {
  return (
    <article className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Portal record · {portal.architecture.replaceAll('_', ' ')}</p>
      <h3 className="mt-2 break-words text-xl font-black">{portal.title}</h3>
      <p className="mt-4 text-sm text-slate-600">Linked to {portal.sourcePublicIds.length} canonical source{portal.sourcePublicIds.length === 1 ? '' : 's'}.</p>
      {portal.url ? <a href={portal.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex font-bold text-teal-800 underline decoration-2 underline-offset-4 hover:text-teal-950 focus:outline-none focus:ring-4 focus:ring-teal-200">Visit portal source <span className="sr-only">{portal.title}</span><span aria-hidden="true"> ↗</span></a> : <p className="mt-6 text-sm font-bold text-slate-600">No verified online portal URL</p>}
    </article>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1">{children}</span>;
}

function EmptyState({ noun, onClear }: { noun: string; onClear: () => void }) {
  return (
    <div role="status" className="mx-auto mt-6 max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm font-bold uppercase tracking-wider text-amber-800">No matching {noun}</p>
      <h3 className="mt-2 text-2xl font-black">Try a broader search.</h3>
      <p className="mt-3 text-slate-600">The underlying catalog or interview result counts have not changed; only this filtered view is empty.</p>
      <button type="button" onClick={onClear} className="mt-6 rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Clear filters</button>
    </div>
  );
}

function NoRecommendations({ onEdit, onBrowse }: { onEdit: () => void; onBrowse: () => void }) {
  return (
    <div role="status" className="mx-auto mt-8 max-w-2xl rounded-3xl border border-amber-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm font-bold uppercase tracking-wider text-amber-800">No recommended results in this view</p>
      <h3 className="mt-2 text-2xl font-black">Review known conflicts or broaden your answers.</h3>
      <p className="mt-3 text-slate-600">Nothing was silently discarded. Known conflicts remain available above, and the complete catalog is always one click away.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={onEdit} className="rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Edit answers</button>
        <button type="button" onClick={onBrowse} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Browse all awards</button>
      </div>
    </div>
  );
}
