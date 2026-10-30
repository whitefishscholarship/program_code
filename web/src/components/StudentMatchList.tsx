'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  PROGRESS_LABELS,
  PROGRESS_NOTE,
  PROGRESS_ORDER,
  awardProgress,
  filterByProgress,
  progressCounts,
  readAwardProgressSafely,
  setAwardProgress,
  writeAwardProgressSafely,
  clearAwardProgressSafely,
  type AwardProgress,
  type AwardProgressMap,
  type ProgressFilter,
} from '@/lib/awardProgress';
import { relevanceByAward } from '@/lib/interviewRelevance';
import { studentFitExplanations, studentFitLabels } from '@/lib/studentFit';
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
  sortByFit,
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
  check_site: 'The listed open date has passed. Check the sponsor site.',
  opens_later: 'Get ready. These open later.',
  closed: 'Save for next year',
  not_sure: 'We could not confirm the dates',
};

const pillClass: Record<StudentStatus, string> = {
  open_now: 'pill pill-open',
  check_site: 'pill pill-unsure',
  opens_later: 'pill pill-later',
  closed: 'pill pill-closed',
  not_sure: 'pill pill-unsure',
};

const PAGE_SIZE = 10;

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
  listTitle?: string;
  headingRef?: Ref<HTMLHeadingElement>;
  resetToken?: string;
  onHide: (id: string) => void;
  onRestore: (id: string) => void;
  onUndo: () => void;
  onRefresh: () => void;
};

export default function StudentMatchList({
  mode, awards, allAwards, resultsById, hiddenIds, answers, hideBanner, canUndo, refreshNote, embedHeading = false, listTitle = 'Your matches', headingRef, resetToken = '',
  onHide, onRestore, onUndo, onRefresh,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [openingThisMonth, setOpeningThisMonth] = useState(false);
  const [sort, setSort] = useState<StudentSort>(mode === 'results' ? 'match' : 'deadline');
  const [method, setMethod] = useState<'all' | ApplicationMode>('all');
  const [schoolType, setSchoolType] = useState<SchoolType>('all');
  const [progress, setProgress] = useState<AwardProgressMap>({});
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
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

  useEffect(() => {
    setProgress(readAwardProgressSafely(() => window.localStorage));
  }, []);

  const filtered = useMemo(() => filterStudentAwards(awards, {
    search,
    status: statusFilter,
    openingThisMonth,
    method,
    schoolType,
    now,
  }), [awards, method, now, openingThisMonth, schoolType, search, statusFilter]);

  const { visible, concealed } = useMemo(() => splitHidden(filtered, hiddenIds), [filtered, hiddenIds]);
  const progressTotals = useMemo(() => progressCounts(visible, progress), [progress, visible]);
  const progressed = useMemo(() => filterByProgress(visible, progress, progressFilter), [progress, progressFilter, visible]);
  const relevance = useMemo(() => (answers ? relevanceByAward(answers) : null), [answers]);
  const sorted = useMemo(() => {
    if (sort === 'match') return sortByFit(progressed, (award) => studentFitLabels(award, answers, relevance ?? undefined).length > 0);
    return sortStudentAwards(progressed, sort, now);
  }, [answers, now, progressed, relevance, sort]);
  const hiddenAwards = hiddenIds.map((id) => awardById.get(id)).filter((award): award is StudentAward => Boolean(award));
  const missingHidden = hiddenIds.length - hiddenAwards.length;
  const openingCount = awards.filter((award) => isOpeningThisMonth(award, now) && !hiddenIds.includes(award.publicId)).length;
  const datedCount = sorted.filter((award) => explicitDeadlineDate(award)).length;

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
  const hasProgress = Object.keys(progress).length > 0;
  const changeProgress = (id: string, status: AwardProgress) => {
    setProgress((current) => {
      const next = setAwardProgress(current, id, status);
      writeAwardProgressSafely(() => window.localStorage, next);
      return next;
    });
  };
  const clearProgress = () => {
    setProgress({});
    clearAwardProgressSafely(() => window.localStorage);
  };
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setOpeningThisMonth(false);
    setMethod('all');
    setSchoolType('all');
  };

  const filterSignature = [search, statusFilter, openingThisMonth ? 'month' : '', method, schoolType, progressFilter, resetToken].join('|');
  const [page, setPage] = useState(1);
  const [seenFilter, setSeenFilter] = useState(filterSignature);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  if (seenFilter !== filterSignature) {
    setSeenFilter(filterSignature);
    setPage(1);
  } else if (page > pageCount) {
    setPage(pageCount);
  }
  const currentPage = Math.min(page, pageCount);
  const seenPage = useRef(currentPage);
  useEffect(() => {
    if (seenPage.current === currentPage) return;
    seenPage.current = currentPage;
    window.scrollTo(0, 0);
  }, [currentPage]);
  const pageStart = sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
  const pageAwards = sorted.slice(pageStart, pageStart + PAGE_SIZE);
  const rangeStart = sorted.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = pageStart + pageAwards.length;
  const pageGroups = STUDENT_STATUS_ORDER.map((status) => ({
    status,
    awards: pageAwards.filter((award) => studentStatus(award, now) === status),
  })).filter((group) => group.awards.length > 0);

  return (
    <div className="mt-4">
      {hideBanner && (
        <div role="status" className="banner mb-4">
          <p className="text-sm font-semibold">{HIDE_BANNER}</p>
          <div className="toolbar">
            <button type="button" onClick={() => void copyLink()} className="btn btn-primary">Copy link</button>
            <button type="button" onClick={onUndo} disabled={!canUndo} className="btn btn-tertiary">Undo</button>
          </div>
        </div>
      )}
      {refreshNote && <p role="status" className="notice mb-4 text-sm font-semibold">{refreshNote}</p>}
      <div className={embedHeading ? 'stage-head' : undefined}>
        {embedHeading ? (
          <h2 ref={headingRef} tabIndex={-1} id="catalog-heading" className="page-title outline-none">
            {listTitle} ({sorted.length})
          </h2>
        ) : (
          <h3 className="section-title">All awards ({sorted.length})</h3>
        )}
        {mode === 'results' && <p className="lede">{sort === 'match' ? 'Awards that fit your answers come first. Every award stays on the list.' : sort === 'pool' ? 'Smallest pools are first. Open awards are still marked in green.' : 'Start with the green ones. They are open right now.'}</p>}
      </div>

      <div className="panel mt-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <button type="button" onClick={downloadExcel} disabled={sorted.length === 0} className="btn btn-primary">
            Download my list (Excel)
          </button>
          <div className="max-w-xl text-sm leading-6">
            <p>Deadlines change. Refresh my list checks the current list again on this device.</p>
            {answers && <p className="mt-1 font-semibold">{BOOKMARK_NOTE}</p>}
          </div>
          {answers && (
            <div className="toolbar">
              <button type="button" onClick={onRefresh} className="btn btn-tertiary">Refresh my list</button>
              <button type="button" onClick={() => void copyLink()} className="btn btn-primary">Copy my link</button>
            </div>
          )}
        </div>
        <p className="muted mt-3 text-sm" aria-live="polite">{copied ? 'Link copied.' : stamp}</p>
        {copyFallback && (
          <label className="mt-3 block text-sm font-semibold">
            Copy this link by hand
            <input readOnly value={copyFallback} onFocus={(event) => event.currentTarget.select()} className="field mt-1" />
          </label>
        )}
        <div className="mt-4 flex flex-col gap-3 border-t border-white/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" aria-expanded={showHidden} aria-controls="hidden-awards" disabled={hiddenAwards.length === 0 && missingHidden === 0} onClick={() => setShowHidden((open) => !open)} className="text-link text-left text-sm disabled:cursor-not-allowed disabled:opacity-50">
            {showHidden ? `Hide hidden (${hiddenAwards.length})` : `Show hidden (${hiddenAwards.length})`}
          </button>
          <label className="text-sm font-semibold">
            Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value as StudentSort)} className="field field-inline">
              {mode === 'results' && <option value="match">Best match</option>}
              <option value="pool">Smallest pool</option>
              <option value="deadline">Soonest deadline</option>
              <option value="amount">Highest amount</option>
              <option value="name">Name A to Z</option>
            </select>
          </label>
        </div>
        {showHidden && (
          <div id="hidden-awards" className="hidden-box">
            <h3 className="font-semibold">Hidden awards ({hiddenAwards.length})</h3>
            <p className="hint">You hid these. Click Restore to put one back on your list.</p>
            <ul className="mt-3 space-y-2">
              {hiddenAwards.map((award) => (
                <li key={award.publicId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/50 px-3 py-2">
                  <span className="muted line-through">{award.name}</span>
                  <button type="button" onClick={() => onRestore(award.publicId)} className="btn btn-tertiary">Restore</button>
                </li>
              ))}
            </ul>
            {missingHidden > 0 && <p className="hint mt-3">{missingHidden} hidden award{missingHidden === 1 ? ' is' : 's are'} not in this list anymore.</p>}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <label className="text-sm font-semibold">
          Search
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name" className="field mt-1" />
        </label>
        <div role="group" aria-label="Filter by status" className="chip-row mt-0">
          <FilterButton pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All</FilterButton>
          {STUDENT_STATUS_ORDER.map((status) => (
            <FilterButton key={status} pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>{STUDENT_STATUS_LABELS[status]}</FilterButton>
          ))}
          <FilterButton pressed={openingThisMonth} onClick={() => setOpeningThisMonth((value) => !value)}>Opening this month ({openingCount})</FilterButton>
        </div>
        {mode === 'browse' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">How you apply
              <select value={method} onChange={(event) => setMethod(event.target.value as 'all' | ApplicationMode)} className="field mt-1">
                <option value="all">All ways</option>
                {APPLICATION_MODES.map((value) => <option key={value} value={value}>{applicationModeLabel(value)}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">School type
              <select value={schoolType} onChange={(event) => setSchoolType(event.target.value as SchoolType)} className="field mt-1">
                <option value="all">All school types</option>
                {Object.entries(schoolTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
        )}
        {hasFilters && <button type="button" onClick={clearFilters} className="text-link self-start text-sm">Clear filters</button>}
      </div>

      <div className="mt-4">
        <div role="group" aria-label="Filter by progress" className="chip-row mt-0">
          <span className="self-center text-sm font-semibold">My progress</span>
          <FilterButton pressed={progressFilter === 'all'} onClick={() => setProgressFilter('all')}>All ({progressTotals.all})</FilterButton>
          {PROGRESS_ORDER.map((status) => (
            <FilterButton key={status} pressed={progressFilter === status} onClick={() => setProgressFilter(status)}>{PROGRESS_LABELS[status]} ({progressTotals[status]})</FilterButton>
          ))}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="hint">{PROGRESS_NOTE}</p>
          <button type="button" onClick={clearProgress} disabled={!hasProgress} className="btn btn-tertiary self-start">Clear progress</button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p role="status" className="panel mt-6 p-8 text-center">No awards match these filters. Hidden awards stay off this list until you restore them.</p>
      ) : sort === 'deadline' ? (
        <div className="mt-6 space-y-8">
          {pageGroups.map((group) => (
            <section key={group.status} aria-label={STUDENT_STATUS_LABELS[group.status]}>
              <div className="mb-3 flex flex-wrap items-baseline gap-3">
                <h3 className="section-title text-xl">{STUDENT_STATUS_LABELS[group.status]}</h3>
                <span className="pill pill-closed">{group.awards.length}</span>
                <p className="hint">{sectionHelp[group.status]}</p>
              </div>
              <div className="card-stack">{group.awards.map((award) => <AwardRow key={award.publicId} award={award} now={now} result={resultsById.get(award.publicId)} answers={answers} relevance={relevance} progress={awardProgress(progress, award.publicId)} onProgress={changeProgress} onHide={onHide} onAddDeadline={addDeadline} />)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="card-stack mt-6">{pageAwards.map((award) => <AwardRow key={award.publicId} award={award} now={now} result={resultsById.get(award.publicId)} answers={answers} relevance={relevance} progress={awardProgress(progress, award.publicId)} onProgress={changeProgress} onHide={onHide} onAddDeadline={addDeadline} />)}</div>
      )}

      {sorted.length > 0 && (
        <nav className="pager" aria-label="Award pages">
          <p className="pager-count">Showing {rangeStart}-{rangeEnd} of {sorted.length}</p>
          <div className="pager-row">
            <button type="button" className="btn btn-tertiary page-nav" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} aria-label="Previous page">‹</button>
            {pageItems(currentPage, pageCount).map((item, index) => item === 'gap' ? (
              <span key={`gap-${index}`} className="page-gap" aria-hidden="true">...</span>
            ) : (
              <button key={item} type="button" className={`btn page-num ${item === currentPage ? 'btn-primary' : 'btn-tertiary'}`} aria-current={item === currentPage ? 'page' : undefined} aria-label={`Page ${item}`} onClick={() => setPage(item)}>{item}</button>
            ))}
            <button type="button" className="btn btn-tertiary page-nav" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount} aria-label="Next page">›</button>
          </div>
        </nav>
      )}

      <div className="toolbar mt-6">
        <button type="button" onClick={downloadCalendar} disabled={datedCount === 0} className="btn btn-secondary">
          {datedCount === 0 ? 'No dated deadlines to add' : 'Add deadlines to my calendar'}
        </button>
        <button type="button" onClick={downloadCsv} disabled={sorted.length === 0} className="btn btn-tertiary">
          Download CSV
        </button>
      </div>
      <p className="fine">The Excel file and the CSV match the awards on the screen. Hidden awards are left out. A deadline file is made on this device only when you tap the button. Add to Google Calendar opens Google with that award's public deadline filled in. No email. Nothing is sent or saved.</p>
      <p className="fine">{HIDDEN_FOOTNOTE}</p>
    </div>
  );
}

function FilterButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={pressed} onClick={onClick} className={`chip${pressed ? ' is-selected' : ''}`}>{children}</button>;
}

function pageItems(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set<number>([1, total]);
  const from = current <= 3 ? 1 : current >= total - 2 ? Math.max(1, total - 2) : current - 1;
  const to = current <= 3 ? Math.min(3, total) : current >= total - 2 ? total : current + 1;
  for (let number = from; number <= to; number += 1) pages.add(number);
  const ordered = [...pages].filter((number) => number >= 1 && number <= total).sort((left, right) => left - right);
  const items: Array<number | 'gap'> = [];
  for (let index = 0; index < ordered.length; index += 1) {
    if (index > 0 && ordered[index] - ordered[index - 1] > 1) items.push('gap');
    items.push(ordered[index]);
  }
  return items;
}

function AwardRow({ award, now, result, answers, relevance, progress, onProgress, onHide, onAddDeadline }: { award: StudentAward; now: Date; result?: DisplayResult; answers: InterviewAnswers | null; relevance: ReturnType<typeof relevanceByAward> | null; progress: AwardProgress; onProgress: (id: string, status: AwardProgress) => void; onHide: (id: string) => void; onAddDeadline: (award: StudentAward) => void }) {
  const status = studentStatus(award, now);
  const url = officialUrl(award);
  const verification = displayVerification(award);
  const fit = studentFitExplanations(award, answers, relevance ?? undefined);
  const conflict = result?.decision === 'recorded_mismatch'
    ? result.reasons.find((reason) => (
      (reason.code === 'recorded_gpa' && reason.message.includes('below that minimum'))
      || (reason.code === 'recorded_school' && reason.message.includes('differ from this award'))
    ))
    : undefined;
  const why = conflict?.message ?? (fit.length > 0 ? fit.map((item) => item.message).join(' ') : undefined);
  const action = actionLabel(status);
  const fits = fit.map((item) => item.label);
  const rulesMissing = poolRulesMissing(award);
  const dated = Boolean(explicitDeadlineDate(award));
  const googleCalendarUrl = dated ? googleCalendarTemplateUrl(award) : null;
  return (
    <article data-award-id={award.publicId} data-verification-status={verification.status} data-student-status={status} className="award-card">
      <div className="grid grid-cols-2 items-start gap-x-3 gap-y-3 md:grid-cols-[minmax(14rem,1fr)_minmax(8.5rem,11rem)_minmax(7rem,9rem)_auto] md:gap-x-4">
        <div className="col-span-2 min-w-0 md:col-span-1">
          <h3 className="break-words text-lg font-semibold leading-snug">
            {url ? <OfficialLink href={url}>{award.name}</OfficialLink> : award.name}
          </h3>
          <p className="muted mt-1 line-clamp-2 break-words text-sm leading-6">{award.summary ? plainStudentText(award.summary) : plainStudentText(award.eligibility.audience)}</p>
          {rulesMissing ? (
            <p className="mt-2 text-sm font-semibold">{RULES_NOT_POSTED}</p>
          ) : poolIsSmall(award) ? (
            <p className="mt-2 text-sm leading-6"><span className="font-semibold">Why this pool is small: </span>{poolExplanation(award)}</p>
          ) : (
            <p className="mt-2 text-sm leading-6">{poolExplanation(award)}</p>
          )}
          {fits.length > 0 && <p className="mt-1 text-sm font-semibold">Fits you: {fits.join(', ')}</p>}
          <details className="mt-2 text-sm">
            <summary className="details-toggle">Details</summary>
            <div className="mt-3 space-y-2 break-words leading-6">
              <p><span className="font-semibold">What it is: </span>{award.summary ? plainStudentText(award.summary) : 'The official page has the details.'}</p>
              <p><span className="font-semibold">What to do: </span>{plainStudentText(award.application.label)}</p>
              <p><span className="font-semibold">Why it is on your list: </span>{why ? plainStudentText(why) : 'It stayed on the list because nothing you told us rules it out.'}</p>
              <p><span className="font-semibold">Before you apply: </span>Click {action} and check the deadline on the real site. It can change.</p>
            </div>
          </details>
        </div>
        <div className="min-w-0">
          <p className="meta-label">Amount</p>
          <p className="break-words font-semibold">{amountLabel(award)}</p>
        </div>
        <div className="min-w-0">
          <p className="meta-label">Deadline</p>
          <p className="break-words font-semibold">{deadlineLabel(award)}</p>
        </div>
        <div className="award-actions col-span-2 md:col-span-1">
          <p className={pillClass[status]}>{STUDENT_STATUS_LABELS[status]}</p>
          {url ? <OfficialLink href={url} button>{action}</OfficialLink> : <p className="pill pill-closed">No website listed</p>}
          <button type="button" onClick={() => onAddDeadline(award)} disabled={!dated} className="btn btn-secondary">{dated ? 'Add this deadline to my calendar' : 'No date to add yet'}</button>
          {googleCalendarUrl ? <OfficialLink href={googleCalendarUrl} tone="tertiary">{`Add to Google Calendar`}</OfficialLink> : null}
          <div>
            <p className="meta-label">My progress</p>
            <div role="group" aria-label={`Progress for ${award.name}`} className="chip-row mt-1">
              {PROGRESS_ORDER.map((status) => (
                <button key={status} type="button" aria-pressed={progress === status} onClick={() => onProgress(award.publicId, status)} className={`chip${progress === status ? ' is-selected' : ''}`}>{PROGRESS_LABELS[status]}</button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => onHide(award.publicId)} className="btn btn-quiet">✕ Hide</button>
        </div>
      </div>
    </article>
  );
}

function OfficialLink({ href, button = false, tone = 'primary', children }: { href: string; button?: boolean; tone?: 'primary' | 'tertiary'; children: ReactNode }) {
  const className = button || tone === 'tertiary'
    ? `btn ${tone === 'tertiary' ? 'btn-tertiary' : 'btn-primary'}`
    : 'title-link';
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
