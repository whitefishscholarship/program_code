'use client';

import { useEffect, useMemo, useState, type ReactNode, type Ref } from 'react';
import { differentiationHits } from '@/lib/differentiation';
import { buildStudentWorkbook, googleCalendarTemplateUrl, serializeAwardDeadlineCalendar, serializeStudentCalendar, serializeStudentCsv } from '@/lib/studentExport';
import type { InterviewAnswers } from '@/lib/interviewMatcher';
import { buildStudentHref } from '@/lib/studentLink';
import type { DisplayResult } from '@/lib/spreadsheetShortlist';
import {
  actionLabel,
  amountLabel,
  BOOKMARK_NOTE,
  deadlineLabel,
  explicitDeadlineDate,
  filterStudentAwards,
  formatListStamp,
  HIDE_BANNER,
  HIDDEN_FOOTNOTE,
  isOpeningThisMonth,
  officialUrl,
  plainStudentText,
  poolExplanation,
  poolIsSmall,
  poolRulesMissing,
  RULES_NOT_POSTED,
  sortStudentAwards,
  splitHidden,
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_ORDER,
  studentStatus,
  type StatusFilter,
  type StudentSort,
  type StudentStatus,
} from '@/lib/studentList';
import {
  APPLICATION_MODES,
  applicationModeLabel,
  displayVerification,
  type ApplicationMode,
  type StudentAward,
} from '@/lib/studentCatalog';

type SchoolType = 'all' | 'two_year' | 'four_year' | 'trade' | 'other';

const schoolTypeLabels: Record<Exclude<SchoolType, 'all'>, string> = {
  two_year: 'Two-year',
  four_year: 'Four-year',
  trade: 'Trade',
  other: 'Other',
};

const sectionHelp: Record<StudentStatus, string> = {
  open_now: 'Apply now',
  opens_later: 'Get ready. These open later.',
  closed: 'Save for next year',
  not_sure: 'We could not confirm the dates',
};

const borderColor: Record<StudentStatus, string> = {
  open_now: 'border-l-emerald-600',
  opens_later: 'border-l-sky-600',
  closed: 'border-l-slate-300',
  not_sure: 'border-l-amber-500',
};

const pillColor: Record<StudentStatus, string> = {
  open_now: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  opens_later: 'border-sky-300 bg-sky-50 text-sky-800',
  closed: 'border-slate-300 bg-slate-100 text-slate-700',
  not_sure: 'border-amber-300 bg-amber-50 text-amber-900',
};

type Props = {
  mode: 'results' | 'browse';
  awards: StudentAward[];
  allAwards: readonly StudentAward[];
  resultsById: ReadonlyMap<string, DisplayResult>;
  hiddenIds: readonly string[];
  answers: InterviewAnswers | null;
  hideBanner: boolean;
  canUndo: boolean;
  refreshNote: string;
  embedHeading?: boolean;
  headingRef?: Ref<HTMLHeadingElement>;
  onHide: (id: string) => void;
  onRestore: (id: string) => void;
  onUndo: () => void;
  onRefresh: () => void;
};

export default function StudentMatchList({
  mode, awards, allAwards, resultsById, hiddenIds, answers, hideBanner, canUndo, refreshNote, embedHeading = false, headingRef,
  onHide, onRestore, onUndo, onRefresh,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [openingThisMonth, setOpeningThisMonth] = useState(false);
  const [sort, setSort] = useState<StudentSort>(mode === 'results' ? 'pool' : 'deadline');
  const [method, setMethod] = useState<'all' | ApplicationMode>('all');
  const [schoolType, setSchoolType] = useState<SchoolType>('all');
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState('');
  const now = useMemo(() => new Date(), []);
  const stamp = formatListStamp(now);
  const awardById = useMemo(() => new Map(allAwards.map((award) => [award.publicId, award])), [allAwards]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const filtered = useMemo(() => filterStudentAwards(awards, {
    search,
    status: statusFilter,
    openingThisMonth,
    method,
    schoolType,
    now,
  }), [awards, method, now, openingThisMonth, schoolType, search, statusFilter]);

  const { visible, concealed } = useMemo(() => splitHidden(filtered, hiddenIds), [filtered, hiddenIds]);
  const sorted = useMemo(() => sortStudentAwards(visible, sort, now), [now, sort, visible]);
  const hiddenAwards = hiddenIds.map((id) => awardById.get(id)).filter((award): award is StudentAward => Boolean(award));
  const missingHidden = hiddenIds.length - hiddenAwards.length;
  const openingCount = awards.filter((award) => isOpeningThisMonth(award, now) && !hiddenIds.includes(award.publicId)).length;
  const datedCount = sorted.filter((award) => explicitDeadlineDate(award)).length;
  const groups = STUDENT_STATUS_ORDER.map((status) => ({
    status,
    awards: sorted.filter((award) => studentStatus(award, now) === status),
  })).filter((group) => group.awards.length > 0);

  const copyLink = async () => {
    const href = buildStudentHref(window.location.href, { answers, hiddenIds: [...hiddenIds] });
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setCopyFallback('');
    } catch {
      setCopyFallback(href);
    }
  };

  const downloadExcel = () => {
    saveFile(`whitefish-scholarships-${fileDay(now)}.xlsx`, buildStudentWorkbook(sorted, now), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };
  const downloadCsv = () => {
    saveFile(`whitefish-scholarships-${fileDay(now)}.csv`, new TextEncoder().encode(serializeStudentCsv(sorted, now)), 'text/csv;charset=utf-8');
  };
  const downloadCalendar = () => {
    saveFile(`whitefish-deadlines-${fileDay(now)}.ics`, new TextEncoder().encode(serializeStudentCalendar(sorted, now)), 'text/calendar');
  };
  const addDeadline = (award: StudentAward) => {
    const text = serializeAwardDeadlineCalendar(award, now);
    if (!text) return;
    saveFile(`whitefish-deadline-${award.publicId}.ics`, new TextEncoder().encode(text), 'text/calendar');
  };

  const hasFilters = Boolean(search || statusFilter !== 'all' || openingThisMonth || method !== 'all' || schoolType !== 'all');
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setOpeningThisMonth(false);
    setMethod('all');
    setSchoolType('all');
  };

  return (
    <div className="mt-4">
      {hideBanner && (
        <div role="status" className="mb-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">{HIDE_BANNER}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyLink()} className="rounded-lg bg-[#123c3a] px-3 py-2 text-sm font-bold text-white hover:bg-[#0d2c2a] focus:outline-none focus:ring-4 focus:ring-teal-200">Copy link</button>
            <button type="button" onClick={onUndo} disabled={!canUndo} className="rounded-lg border border-emerald-800 bg-white px-3 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-50">Undo</button>
          </div>
        </div>
      )}
      {refreshNote && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">{refreshNote}</p>}
      <div>
        {embedHeading ? (
          <h2 ref={headingRef} tabIndex={-1} id="catalog-heading" className="text-3xl font-black tracking-tight text-slate-950 outline-none">
            Your matches ({sorted.length})
          </h2>
        ) : (
          <h3 className="text-2xl font-black tracking-tight text-slate-950">All awards ({sorted.length})</h3>
        )}
        {mode === 'results' && <p className="mt-1 text-slate-600">{sort === 'pool' ? 'Smallest pools are first. Open awards are still marked in green.' : 'Start with the green ones. They are open right now.'}</p>}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <button type="button" onClick={downloadExcel} disabled={sorted.length === 0} className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300">
            Download my list (Excel)
          </button>
          <div className="max-w-xl text-sm leading-6 text-slate-700">
            <p>Deadlines change. Refresh my list checks the current list again on this device.</p>
            {answers && <p className="mt-1 font-semibold text-slate-950">{BOOKMARK_NOTE}</p>}
          </div>
          {answers && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onRefresh} className="rounded-xl border border-[#123c3a] bg-white px-4 py-3 text-sm font-bold text-[#123c3a] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Refresh my list</button>
              <button type="button" onClick={() => void copyLink()} className="rounded-xl bg-[#123c3a] px-4 py-3 text-sm font-bold text-white hover:bg-[#0d2c2a] focus:outline-none focus:ring-4 focus:ring-teal-200">Copy my link</button>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-600" aria-live="polite">{copied ? 'Link copied.' : stamp}</p>
        {copyFallback && (
          <label className="mt-3 block text-sm font-semibold text-slate-800">
            Copy this link by hand
            <input readOnly value={copyFallback} onFocus={(event) => event.currentTarget.select()} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
          </label>
        )}
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" aria-expanded={showHidden} aria-controls="hidden-awards" disabled={hiddenAwards.length === 0 && missingHidden === 0} onClick={() => setShowHidden((open) => !open)} className="rounded-lg px-2 py-1 text-left text-sm font-bold text-teal-800 underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline">
            {showHidden ? `Hide hidden (${hiddenAwards.length})` : `Show hidden (${hiddenAwards.length})`}
          </button>
          <label className="text-sm font-bold text-slate-800">
            Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value as StudentSort)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100">
              <option value="pool">Smallest pool</option>
              <option value="deadline">Soonest deadline</option>
              <option value="amount">Highest amount</option>
              <option value="name">Name A to Z</option>
            </select>
          </label>
        </div>
        {showHidden && (
          <div id="hidden-awards" className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <h3 className="font-black text-slate-950">Hidden awards ({hiddenAwards.length})</h3>
            <p className="mt-1 text-sm text-slate-600">You hid these. Click Restore to put one back on your list.</p>
            <ul className="mt-3 space-y-2">
              {hiddenAwards.map((award) => (
                <li key={award.publicId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                  <span className="text-slate-500 line-through">{award.name}</span>
                  <button type="button" onClick={() => onRestore(award.publicId)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Restore</button>
                </li>
              ))}
            </ul>
            {missingHidden > 0 && <p className="mt-3 text-sm text-slate-600">{missingHidden} hidden award{missingHidden === 1 ? ' is' : 's are'} not in this list anymore.</p>}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <label className="text-sm font-bold text-slate-800">
          Search
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name" className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100" />
        </label>
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
          <FilterButton pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All</FilterButton>
          {STUDENT_STATUS_ORDER.map((status) => (
            <FilterButton key={status} pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>{STUDENT_STATUS_LABELS[status]}</FilterButton>
          ))}
          <FilterButton pressed={openingThisMonth} onClick={() => setOpeningThisMonth((value) => !value)}>Opening this month ({openingCount})</FilterButton>
        </div>
        {mode === 'browse' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-800">How you apply
              <select value={method} onChange={(event) => setMethod(event.target.value as 'all' | ApplicationMode)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal">
                <option value="all">All ways</option>
                {APPLICATION_MODES.map((value) => <option key={value} value={value}>{applicationModeLabel(value)}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-800">School type
              <select value={schoolType} onChange={(event) => setSchoolType(event.target.value as SchoolType)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal">
                <option value="all">All school types</option>
                {Object.entries(schoolTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
        )}
        {hasFilters && <button type="button" onClick={clearFilters} className="self-start text-sm font-bold text-teal-800 underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-teal-200">Clear filters</button>}
      </div>

      {sorted.length === 0 ? (
        <p role="status" className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700">No awards match these filters. Hidden awards stay off this list until you restore them.</p>
      ) : sort === 'deadline' ? (
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <section key={group.status} aria-label={STUDENT_STATUS_LABELS[group.status]}>
              <div className="mb-3 flex flex-wrap items-baseline gap-3">
                <h3 className="text-xl font-black text-slate-950">{STUDENT_STATUS_LABELS[group.status]}</h3>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">{group.awards.length}</span>
                <p className="text-sm text-slate-600">{sectionHelp[group.status]}</p>
              </div>
              <div className="space-y-3">{group.awards.map((award) => <AwardRow key={award.publicId} award={award} now={now} result={resultsById.get(award.publicId)} profile={answers?.differentiation} onHide={onHide} onAddDeadline={addDeadline} />)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">{sorted.map((award) => <AwardRow key={award.publicId} award={award} now={now} result={resultsById.get(award.publicId)} profile={answers?.differentiation} onHide={onHide} onAddDeadline={addDeadline} />)}</div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={downloadCalendar} disabled={datedCount === 0} className="rounded-xl border border-[#123c3a] bg-white px-4 py-3 text-sm font-bold text-[#123c3a] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
          {datedCount === 0 ? 'No dated deadlines to add' : 'Add deadlines to my calendar'}
        </button>
        <button type="button" onClick={downloadCsv} disabled={sorted.length === 0} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:text-slate-400">
          Download CSV
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">The Excel file and the CSV match the awards on the screen. Hidden awards are left out. A deadline file is made on this device only when you tap the button. Add to Google Calendar opens Google with that award's public deadline filled in. No email. Nothing is sent or saved.</p>
      <p className="mt-4 text-xs leading-5 text-slate-500">{HIDDEN_FOOTNOTE}</p>
    </div>
  );
}

function FilterButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={pressed} onClick={onClick} className={`rounded-full px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-200 ${pressed ? 'bg-[#123c3a] text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50'}`}>{children}</button>;
}

function AwardRow({ award, now, result, profile, onHide, onAddDeadline }: { award: StudentAward; now: Date; result?: DisplayResult; profile?: InterviewAnswers['differentiation']; onHide: (id: string) => void; onAddDeadline: (award: StudentAward) => void }) {
  const status = studentStatus(award, now);
  const url = officialUrl(award);
  const verification = displayVerification(award);
  const why = result?.reasons.find((reason) => reason.message.trim())?.message;
  const action = actionLabel(status);
  const fits = profile ? differentiationHits(award, profile) : [];
  const rulesMissing = poolRulesMissing(award);
  const dated = Boolean(explicitDeadlineDate(award));
  const googleCalendarUrl = dated ? googleCalendarTemplateUrl(award) : null;
  return (
    <article data-award-id={award.publicId} data-verification-status={verification.status} data-student-status={status} className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${borderColor[status]}`}>
      <div className="grid grid-cols-2 items-start gap-x-3 gap-y-3 md:grid-cols-[minmax(14rem,1fr)_minmax(8.5rem,11rem)_minmax(7rem,9rem)_auto] md:gap-x-4">
        <div className="col-span-2 min-w-0 md:col-span-1">
          <h3 className="break-words text-lg font-black leading-snug text-slate-950">
            {url ? <OfficialLink href={url}>{award.name}</OfficialLink> : award.name}
          </h3>
          <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-slate-600">{award.summary ? plainStudentText(award.summary) : plainStudentText(award.eligibility.audience)}</p>
          {rulesMissing ? (
            <p className="mt-2 text-sm font-semibold text-slate-700">{RULES_NOT_POSTED}</p>
          ) : poolIsSmall(award) ? (
            <p className="mt-2 text-sm leading-6 text-slate-700"><span className="font-bold text-slate-950">Why this pool is small: </span>{poolExplanation(award)}</p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-700">{poolExplanation(award)}</p>
          )}
          {fits.length > 0 && <p className="mt-1 text-sm font-semibold text-teal-900">Fits you: {fits.join(', ')}</p>}
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-bold text-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-200">Details</summary>
            <div className="mt-3 space-y-2 break-words leading-6 text-slate-700">
              <p><span className="font-bold text-slate-950">What it is: </span>{award.summary ? plainStudentText(award.summary) : 'The official page has the details.'}</p>
              <p><span className="font-bold text-slate-950">What to do: </span>{plainStudentText(award.application.label)}</p>
              <p><span className="font-bold text-slate-950">Why it is on your list: </span>{why ? plainStudentText(why) : 'It stayed on the list because nothing you told us rules it out.'}</p>
              <p><span className="font-bold text-slate-950">Before you apply: </span>Click {action} and check the deadline on the real site. It can change.</p>
            </div>
          </details>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Amount</p>
          <p className="break-words font-bold text-slate-950">{amountLabel(award)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Deadline</p>
          <p className="break-words font-bold text-slate-950">{deadlineLabel(award)}</p>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1 md:flex-col md:items-stretch">
          <p className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${pillColor[status]}`}>{STUDENT_STATUS_LABELS[status]}</p>
          {url ? <OfficialLink href={url} button>{action}</OfficialLink> : <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-bold text-slate-600">No website listed</p>}
          <button type="button" onClick={() => onAddDeadline(award)} disabled={!dated} className="rounded-lg border border-[#123c3a] bg-white px-3 py-2 text-sm font-bold text-[#123c3a] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">{dated ? 'Add this deadline to my calendar' : 'No date to add yet'}</button>
          {googleCalendarUrl ? <OfficialLink href={googleCalendarUrl} button>Add to Google Calendar</OfficialLink> : null}
          <button type="button" onClick={() => onHide(award.publicId)} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-200">✕ Hide</button>
        </div>
      </div>
    </article>
  );
}

function OfficialLink({ href, button = false, children }: { href: string; button?: boolean; children: ReactNode }) {
  const className = button
    ? 'inline-flex items-center justify-center rounded-lg bg-[#123c3a] px-4 py-2 text-center text-sm font-bold text-white hover:bg-[#0d2c2a] focus:outline-none focus:ring-4 focus:ring-teal-200'
    : 'font-black text-slate-950 underline decoration-2 underline-offset-4 hover:text-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-200';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

function fileDay(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function saveFile(filename: string, bytes: Uint8Array, type: string): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
