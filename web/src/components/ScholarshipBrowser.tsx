'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { awardCsvDataUri } from '@/lib/export';
import {
  APPLICATION_MODES,
  CYCLE_STATUSES,
  StudentCatalogSchema,
  type ApplicationMode,
  type CycleStatus,
  type StudentAward,
  type StudentCatalog,
  type StudentSource,
} from '@/lib/studentCatalog';

type View = 'awards' | 'portals';
type Sort = 'status' | 'name' | 'amount';
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

function statusRank(status: CycleStatus): number {
  return { active: 0, upcoming: 1, unknown: 2, unavailable: 3, closed: 4 }[status];
}

export default function ScholarshipBrowser() {
  const [catalog, setCatalog] = useState<StudentCatalog | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<View>('awards');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | CycleStatus>('all');
  const [method, setMethod] = useState<'all' | ApplicationMode>('all');
  const [schoolType, setSchoolType] = useState<SchoolType>('all');
  const [sort, setSort] = useState<Sort>('status');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).get('qa') === 'error') {
        throw new Error('The scholarship catalog is temporarily unavailable.');
      }
      const qa = process.env.NODE_ENV !== 'production' ? new URLSearchParams(window.location.search).get('qa') : null;
      const response = await fetch(qa === 'matrix' ? '/api/scholarships?qa=matrix' : '/api/scholarships', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('The scholarship catalog is temporarily unavailable.');
      setCatalog(StudentCatalogSchema.parse(await response.json()));
    } catch (caught) {
      setCatalog(null);
      setError(caught instanceof Error ? caught.message : 'The scholarship catalog is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [attempt]);

  useEffect(() => { void load(); }, [load]);

  const visibleAwards = useMemo(() => {
    if (!catalog) return [];
    const query = search.trim().toLocaleLowerCase();
    const awards = catalog.awards.filter((award) => {
      const matchesSearch = !query || [award.name, award.summary, award.amount.label, award.eligibility.focus, award.application.label]
        .filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
      const matchesStatus = status === 'all' || award.cycle.status === status;
      const matchesMethod = method === 'all' || award.application.mode === method;
      const matchesSchool = schoolType === 'all' || award.eligibility.schoolTypes.includes(schoolType);
      return matchesSearch && matchesStatus && matchesMethod && matchesSchool;
    });
    return awards.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'amount') return (b.amount.maximum ?? b.amount.minimum ?? -1) - (a.amount.maximum ?? a.amount.minimum ?? -1) || a.name.localeCompare(b.name);
      return statusRank(a.cycle.status) - statusRank(b.cycle.status) || a.name.localeCompare(b.name);
    });
  }, [catalog, method, schoolType, search, sort, status]);

  const visibleSources = useMemo(() => {
    if (!catalog) return [];
    const query = search.trim().toLocaleLowerCase();
    return catalog.sources.filter((source) => !query || [source.title, source.recordType, source.architecture, source.availability]
      .join(' ').toLocaleLowerCase().includes(query));
  }, [catalog, search]);

  const hasFilters = Boolean(search || status !== 'all' || method !== 'all' || schoolType !== 'all');
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setMethod('all');
    setSchoolType('all');
  };

  if (loading) {
    return (
      <section aria-live="polite" aria-busy="true" className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" aria-hidden="true" />
        <h2 className="text-xl font-bold">Loading the scholarship catalog</h2>
        <p className="mt-2 text-slate-600">Keeping awards, portals, and cycle status separate.</p>
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

  return (
    <section aria-labelledby="catalog-heading">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-800">Current catalog</p>
          <h2 id="catalog-heading" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">See what is verified—and what is not.</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{catalog.notice}</p>
        </div>
        {visibleAwards.length > 0 ? (
          <a href={awardCsvDataUri(visibleAwards)} download={`whitefish-scholarships-${new Date().toISOString().slice(0, 10)}.csv`} className="rounded-xl border-2 border-teal-800 bg-white px-5 py-3 text-center font-bold text-teal-900 shadow-sm hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-200">
            Export {visibleAwards.length} award{visibleAwards.length === 1 ? '' : 's'} as CSV
          </a>
        ) : (
          <button type="button" disabled className="cursor-not-allowed rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-bold text-slate-400">Export 0 awards as CSV</button>
        )}
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
        <strong>Availability note:</strong> all {catalog.counts.unknownCycles} modeled cycles use annual date rules without a verified year. They are listed for research, not labeled open.
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div role="tablist" aria-label="Catalog record type" className="flex gap-2 border-b border-slate-200 pb-4">
          <button role="tab" aria-selected={view === 'awards'} type="button" onClick={() => setView('awards')} className={`rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-200 ${view === 'awards' ? 'bg-teal-800 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>Awards ({catalog.counts.awards})</button>
          <button role="tab" aria-selected={view === 'portals'} type="button" onClick={() => setView('portals')} className={`rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-200 ${view === 'portals' ? 'bg-teal-800 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>Sources &amp; portals ({catalog.counts.sources})</button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block text-sm font-bold text-slate-800">
            Search {view === 'awards' ? 'awards' : 'sources'}
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={view === 'awards' ? 'Name, amount, focus, or application method' : 'Source name or architecture'} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100" />
          </label>
          {view === 'awards' && (
            <label className="block text-sm font-bold text-slate-800">
              Sort
              <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 lg:w-56">
                <option value="status">Status, then name</option>
                <option value="name">Name A–Z</option>
                <option value="amount">Highest stated amount</option>
              </select>
            </label>
          )}
        </div>

        {view === 'awards' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <FilterSelect label="Cycle status" value={status} onChange={(value) => setStatus(value as 'all' | CycleStatus)} options={[['all', 'All statuses'], ...CYCLE_STATUSES.map((value) => [value, statusLabels[value]] as [string, string])]} />
            <FilterSelect label="Application method" value={method} onChange={(value) => setMethod(value as 'all' | ApplicationMode)} options={[['all', 'All methods'], ...APPLICATION_MODES.map((value) => [value, applicationLabels[value]] as [string, string])]} />
            <FilterSelect label="School type" value={schoolType} onChange={(value) => setSchoolType(value as SchoolType)} options={[['all', 'All school types'], ...Object.entries(schoolTypeLabels)]} />
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p aria-live="polite" className="text-sm text-slate-600">
            Showing <strong className="text-slate-950">{view === 'awards' ? visibleAwards.length : visibleSources.length}</strong> of {view === 'awards' ? catalog.counts.awards : catalog.counts.sources} {view === 'awards' ? 'awards' : 'sources'}
          </p>
          {hasFilters && <button type="button" onClick={clearFilters} className="rounded-lg px-3 py-2 text-sm font-bold text-teal-800 underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-teal-200">Clear filters</button>}
        </div>
      </div>

      {view === 'awards' ? (
        visibleAwards.length ? <div className="mt-6 grid gap-5 lg:grid-cols-2">{visibleAwards.map((award) => <AwardCard key={award.publicId} award={award} />)}</div> : <EmptyState noun="awards" onClear={clearFilters} />
      ) : (
        visibleSources.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleSources.map((source) => <SourceCard key={source.publicId} source={source} />)}</div> : <EmptyState noun="sources" onClear={clearFilters} />
      )}
    </section>
  );
}

function Count({ label, value, suffix = '', emphasis = 'neutral' }: { label: string; value: number; suffix?: string; emphasis?: 'neutral' | 'warning' | 'positive' }) {
  const color = emphasis === 'warning' ? 'border-amber-200 bg-amber-50' : emphasis === 'positive' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white';
  return <div className={`rounded-2xl border p-4 shadow-sm ${color}`}><dt className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</dt><dd className="mt-2 text-3xl font-black text-slate-950">{value}{suffix}</dd></div>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold text-slate-800">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function AwardCard({ award }: { award: StudentAward }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-xl font-black leading-snug">{award.name}</h3>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[award.cycle.status]}`}><span aria-hidden="true">● </span>{award.cycle.label}</span>
      </div>
      <p className="mt-4 text-3xl font-black text-teal-900">{award.amount.label}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
        <Chip>{award.eligibility.audience}</Chip>
        {award.eligibility.minimumGpa !== null && <Chip>Minimum GPA {award.eligibility.minimumGpa}</Chip>}
        {award.eligibility.schoolTypes.map((type) => <Chip key={type}>{schoolTypeLabels[type]}</Chip>)}
      </div>
      {award.summary && <p className="mt-4 text-sm leading-6 text-slate-600">{award.summary}</p>}
      <dl className="mt-5 grid gap-4 border-t border-slate-200 pt-5 text-sm sm:grid-cols-2">
        <div><dt className="font-bold text-slate-950">Application method</dt><dd className="mt-1 leading-6 text-slate-600">{award.application.label}</dd></div>
        <div><dt className="font-bold text-slate-950">Cycle details</dt><dd className="mt-1 leading-6 text-slate-600">{award.cycle.closes ? `Annual close rule: ${award.cycle.closes}` : 'No verified closing date'}</dd></div>
      </dl>
      <div className="mt-auto pt-6">
        {award.application.url ? <a href={award.application.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Check official application source <span className="sr-only">for {award.name}</span><span aria-hidden="true"> ↗</span></a> : <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700">No verified online application link</p>}
        {award.cycle.status !== 'active' && <p className="mt-2 text-center text-xs leading-5 text-slate-500">This link does not mean the award is currently open.</p>}
      </div>
    </article>
  );
}

function SourceCard({ source }: { source: StudentSource }) {
  const architecture = source.architecture.replaceAll('_', ' ');
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wider text-teal-800">{architecture}</p><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700">{source.recordType}</span></div>
      <h3 className="mt-2 text-xl font-black break-words">{source.title}</h3>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="font-bold">Catalog state</dt><dd className="mt-1 capitalize text-slate-600">{source.availability}</dd></div>
        <div><dt className="font-bold">Linked awards</dt><dd className="mt-1 text-slate-600">{source.awardCount}</dd></div>
      </dl>
      {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex font-bold text-teal-800 underline decoration-2 underline-offset-4 hover:text-teal-950 focus:outline-none focus:ring-4 focus:ring-teal-200">Visit official source <span className="sr-only">{source.title}</span><span aria-hidden="true"> ↗</span></a> : <p className="mt-6 text-sm font-bold text-slate-600">Offline source; no verified URL</p>}
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
      <p className="mt-3 text-slate-600">The canonical catalog counts above have not changed; only this filtered view is empty.</p>
      <button type="button" onClick={onClear} className="mt-6 rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Clear filters</button>
    </div>
  );
}
