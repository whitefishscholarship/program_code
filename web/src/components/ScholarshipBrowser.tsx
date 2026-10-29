'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InterviewWizard from '@/components/InterviewWizard';
import StudentMatchList from '@/components/StudentMatchList';
import {
  buildSyntheticMatrixMatchFacts,
  matchStudentAwards,
  type InterviewAnswers,
} from '@/lib/interviewMatcher';
import { CURRENT_ACCEPTED_MATCH_FACTS } from '@/lib/p8mMatchingFacts';
import { shortlistAwards, type DisplayResult } from '@/lib/spreadsheetShortlist';
import { decodeStudentLink, encodeStudentLink, writeStudentFragment } from '@/lib/studentLink';
import { hideAwardId, restoreAwardId, studentStatus } from '@/lib/studentList';
import { loadStudentCatalog, type CatalogQaMode } from '@/lib/studentCatalogClient';
import type { StudentCatalog, StudentPortal, StudentSource } from '@/lib/studentCatalog';

type Experience = 'start' | 'interview' | 'results' | 'browse';
type View = 'awards' | 'portals' | 'sources';
type ResultScope = 'recommended' | 'conflicts' | 'all';

export default function ScholarshipBrowser() {
  const [catalog, setCatalog] = useState<StudentCatalog | null>(null);
  const [error, setError] = useState('');
  const [refreshNote, setRefreshNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [linkReady, setLinkReady] = useState(false);
  const [experience, setExperience] = useState<Experience>('interview');
  const [answers, setAnswers] = useState<InterviewAnswers | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [undoIds, setUndoIds] = useState<string[] | null>(null);
  const [hideBanner, setHideBanner] = useState(false);
  const [resultScope, setResultScope] = useState<ResultScope>('recommended');
  const [view, setView] = useState<View>('awards');
  const [portalSearch, setPortalSearch] = useState('');
  const experienceHeadingRef = useRef<HTMLHeadingElement>(null);
  const catalogRef = useRef<StudentCatalog | null>(null);
  catalogRef.current = catalog;

  const load = useCallback(async () => {
    const quiet = catalogRef.current !== null;
    if (!quiet) setLoading(true);
    setError('');
    setRefreshNote('');
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
      const message = caught instanceof Error ? caught.message : 'The scholarship catalog is temporarily unavailable.';
      if (catalogRef.current) setRefreshNote('We could not refresh the list. Your current list is still here.');
      else {
        setCatalog(null);
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [attempt]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const decoded = decodeStudentLink(window.location.hash);
    if (decoded?.answers) {
      setAnswers(decoded.answers);
      setResultScope('recommended');
      setView('awards');
      setExperience('results');
    }
    if (decoded?.hiddenIds.length) setHiddenIds(decoded.hiddenIds);
    setLinkReady(true);
  }, []);
  useEffect(() => {
    if (!linkReady) return;
    const encoded = answers || hiddenIds.length > 0 ? encodeStudentLink({ answers, hiddenIds }) : '';
    writeStudentFragment(encoded);
  }, [answers, hiddenIds, linkReady]);
  useEffect(() => {
    if (!loading && linkReady && catalog && experience !== 'interview') experienceHeadingRef.current?.focus();
  }, [catalog, experience, linkReady, loading]);

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
    if (resultScope === 'conflicts') return matching.results.filter((result) => result.decision === 'known_conflict' || result.decision === 'recorded_mismatch');
    return matching.results;
  }, [matching, resultScope]);

  const visibleSources = useMemo(() => {
    if (!catalog) return [];
    const query = portalSearch.trim().toLocaleLowerCase();
    return catalog.sources.filter((source) => !query || [source.title, source.recordType, source.architecture, source.availability]
      .join(' ').toLocaleLowerCase().includes(query));
  }, [catalog, portalSearch]);

  const visiblePortals = useMemo(() => {
    if (!catalog) return [];
    const query = portalSearch.trim().toLocaleLowerCase();
    return catalog.portals.filter((portal) => !query || [portal.title, portal.architecture]
      .join(' ').toLocaleLowerCase().includes(query));
  }, [catalog, portalSearch]);

  const showBrowseAll = () => {
    setView('awards');
    setExperience('browse');
  };

  const resetInterview = () => {
    setAnswers(null);
    setHiddenIds([]);
    setUndoIds(null);
    setHideBanner(false);
    setResultScope('recommended');
    setExperience('interview');
  };

  const hideOne = (id: string) => {
    setUndoIds(hiddenIds);
    setHiddenIds(hideAwardId(hiddenIds, id));
    setHideBanner(true);
  };

  const undoHide = () => {
    if (undoIds) setHiddenIds(undoIds);
    setUndoIds(null);
    setHideBanner(false);
  };

  const restoreOne = (id: string) => {
    const next = restoreAwardId(hiddenIds, id);
    setHiddenIds(next);
    if (undoIds && undoIds.join('|') === next.join('|')) {
      setUndoIds(null);
      setHideBanner(false);
    }
  };

  if (!linkReady || loading) {
    return (
      <section aria-live="polite" aria-busy="true" className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" aria-hidden="true" />
        <h2 className="text-xl font-bold">Loading your list</h2>
        <p className="mt-2 text-slate-600">Getting the scholarship list. Your answers stay on this device.</p>
      </section>
    );
  }

  if (error || !catalog) {
    return (
      <section role="alert" className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wider text-rose-700">Catalog unavailable</p>
        <h2 className="mt-2 text-2xl font-black">We could not load the scholarship list.</h2>
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
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Follow five short steps to explore scholarships for your education plans.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => { setAnswers(null); setExperience('interview'); }} className="rounded-xl bg-teal-800 px-6 py-4 text-lg font-bold text-white shadow-sm hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Start the interview</button>
            <button type="button" onClick={showBrowseAll} className="rounded-xl border-2 border-teal-800 bg-white px-6 py-4 text-lg font-bold text-teal-900 hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Browse all {catalog.counts.awards} awards</button>
          </div>
        </div>
      </section>
    );
  }

  if (experience === 'interview') {
    return (
      <InterviewWizard
        awards={catalog.awards}
        initialAnswers={answers}
        syntheticQa={isSyntheticMatrix}
        onCancel={() => answers ? setExperience('results') : showBrowseAll()}
        onComplete={(nextAnswers) => {
          setAnswers(nextAnswers);
          setResultScope('recommended');
          setView('awards');
          setExperience('results');
        }}
      />
    );
  }

  const isResults = experience === 'results' && matching;
  const baseAwards = isResults ? selectedResults.map((result) => result.award) : catalog.awards;
  const list = (embedHeading: boolean) => (
    <StudentMatchList
      mode={isResults ? 'results' : 'browse'}
      awards={baseAwards}
      allAwards={catalog.awards}
      resultsById={matchByAwardId}
      hiddenIds={hiddenIds}
      answers={answers}
      hideBanner={hideBanner}
      canUndo={undoIds !== null}
      refreshNote={refreshNote}
      embedHeading={embedHeading}
      headingRef={embedHeading ? experienceHeadingRef : undefined}
      onHide={hideOne}
      onRestore={restoreOne}
      onUndo={undoHide}
      onRefresh={() => { void load(); }}
    />
  );

  return (
    <section aria-labelledby="catalog-heading">
      {isResults ? (
        <div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setExperience('interview')} className="rounded-xl border border-teal-800 bg-white px-4 py-3 font-bold text-teal-900 hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Edit answers</button>
            <button type="button" onClick={showBrowseAll} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Browse all</button>
            <button type="button" onClick={resetInterview} className="rounded-xl bg-slate-800 px-4 py-3 font-bold text-white hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-300">Start over</button>
          </div>
          <div role="group" aria-label="Choose which awards to show" className="mt-4 flex flex-wrap gap-2">
            <ScopeButton active={resultScope === 'recommended'} onClick={() => setResultScope('recommended')}>My matches ({matching.counts.match + matching.counts.possibleMatch})</ScopeButton>
            <ScopeButton active={resultScope === 'conflicts'} onClick={() => setResultScope('conflicts')}>May not fit ({matching.counts.knownConflict})</ScopeButton>
            <ScopeButton active={resultScope === 'all'} onClick={() => setResultScope('all')}>Every award ({matching.counts.total})</ScopeButton>
          </div>
          {baseAwards.length === 0 ? (
            <>
              <h2 ref={experienceHeadingRef} tabIndex={-1} id="catalog-heading" className="mt-6 text-3xl font-black tracking-tight outline-none">Your matches (0)</h2>
              <NoRecommendations onEdit={() => setExperience('interview')} onBrowse={showBrowseAll} />
            </>
          ) : list(true)}
        </div>
      ) : (
        <div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-800">Browse all</p>
              <h2 ref={experienceHeadingRef} tabIndex={-1} id="catalog-heading" className="mt-2 text-3xl font-black tracking-tight outline-none sm:text-4xl">See what is verified, and what is not.</h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{catalog.notice}</p>
            </div>
            <button type="button" onClick={() => { setAnswers(null); setExperience('interview'); }} className="rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Start interview</button>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Catalog counts">
            <Count label="Awards" value={catalog.counts.awards} />
            <Count label="Open now" value={catalog.awards.filter((award) => studentStatus(award) === 'open_now').length} emphasis="positive" />
            <Count label="Not checked" value={catalog.awards.filter((award) => award.verification?.status !== 'verified').length} emphasis="warning" />
            <Count label="Portals" value={catalog.counts.portals} />
            <Count label="Sources" value={catalog.counts.sources} />
            <Count label="Minimum award slots" value={catalog.counts.minimumObservedRecipientSlots} suffix="*" />
          </dl>
          <p className="mt-2 text-xs text-slate-500">* This is an old minimum count, not a count of open awards today.</p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Checked October 28, 2026:</strong> {catalog.awards.filter((award) => award.verification?.status === 'verified').length} scholarships are marked Verified, with a source link and a clear open, later, or closed status. The other awards are not checked yet, so they say Not sure.
          </div>
          <div role="group" aria-label="Choose catalog record type" className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <ScopeButton active={view === 'awards'} onClick={() => setView('awards')}>Awards ({catalog.counts.awards})</ScopeButton>
            <ScopeButton active={view === 'portals'} onClick={() => setView('portals')}>Portal records ({catalog.counts.portals})</ScopeButton>
            <ScopeButton active={view === 'sources'} onClick={() => setView('sources')}>Source records ({catalog.counts.sources})</ScopeButton>
          </div>
          {view === 'awards' && list(false)}
          {view !== 'awards' && (
            <div className="mt-4">
              <label className="block text-sm font-bold text-slate-800">
                Search {view}
                <input type="search" value={portalSearch} onChange={(event) => setPortalSearch(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal focus:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100" />
              </label>
              {view === 'portals' && (visiblePortals.length
                ? <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">{visiblePortals.map((portal) => <PortalCard key={portal.publicId} portal={portal} />)}</div>
                : <EmptyState noun="portals" onClear={() => setPortalSearch('')} />)}
              {view === 'sources' && (visibleSources.length
                ? <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleSources.map((source) => <SourceCard key={source.publicId} source={source} />)}</div>
                : <EmptyState noun="sources" onClear={() => setPortalSearch('')} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Count({ label, value, suffix = '', emphasis = 'neutral' }: { label: string; value: number; suffix?: string; emphasis?: 'neutral' | 'warning' | 'positive' }) {
  const color = emphasis === 'warning' ? 'border-amber-200 bg-amber-50' : emphasis === 'positive' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white';
  return <div className={`rounded-2xl border p-4 shadow-sm ${color}`}><dt className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</dt><dd className="mt-2 text-3xl font-black text-slate-950">{value}{suffix}</dd></div>;
}

function ScopeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button aria-pressed={active} type="button" onClick={onClick} className={`rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-200 ${active ? 'bg-teal-800 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}>{children}</button>;
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
      <p className="mt-4 text-sm text-slate-600">Linked to {portal.sourcePublicIds.length} source record{portal.sourcePublicIds.length === 1 ? '' : 's'}.</p>
      {portal.url ? <a href={portal.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex font-bold text-teal-800 underline decoration-2 underline-offset-4 hover:text-teal-950 focus:outline-none focus:ring-4 focus:ring-teal-200">Visit portal source <span className="sr-only">{portal.title}</span><span aria-hidden="true"> ↗</span></a> : <p className="mt-6 text-sm font-bold text-slate-600">No verified online portal URL</p>}
    </article>
  );
}

function EmptyState({ noun, onClear }: { noun: string; onClear: () => void }) {
  return (
    <div role="status" className="mx-auto mt-6 max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm font-bold uppercase tracking-wider text-amber-800">No matching {noun}</p>
      <h3 className="mt-2 text-2xl font-black">Try a broader search.</h3>
      <button type="button" onClick={onClear} className="mt-6 rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Clear search</button>
    </div>
  );
}

function NoRecommendations({ onEdit, onBrowse }: { onEdit: () => void; onBrowse: () => void }) {
  return (
    <div role="status" className="mx-auto mt-8 max-w-2xl rounded-3xl border border-amber-200 bg-white p-10 text-center shadow-sm">
      <h3 className="text-2xl font-black">None of these fit the answers you gave.</h3>
      <p className="mt-3 text-slate-600">You can change your answers, or look at every award. Nothing is thrown away.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={onEdit} className="rounded-xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-300">Edit answers</button>
        <button type="button" onClick={onBrowse} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200">Browse all awards</button>
      </div>
    </div>
  );
}
