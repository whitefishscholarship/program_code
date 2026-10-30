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
import { awardsForResultScope, shortlistAwards, type DisplayResult } from '@/lib/spreadsheetShortlist';
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
    return awardsForResultScope(matching.results as Array<(typeof matching.results)[number]>, resultScope);
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
      <section aria-live="polite" aria-busy="true" className="py-8 text-center">
        <div className="spinner" aria-hidden="true" />
        <h2 className="section-title">Loading your list</h2>
        <p className="lede">Getting the scholarship list. Your answers stay on this device.</p>
      </section>
    );
  }

  if (error || !catalog) {
    return (
      <section role="alert" className="mx-auto max-w-2xl py-6 text-center">
        <p className="meta-label req">Catalog unavailable</p>
        <h2 className="page-title mt-2">We could not load the scholarship list.</h2>
        <p className="lede">{error || 'Please try again.'}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)} className="btn btn-primary mt-6">
          Try again
        </button>
      </section>
    );
  }

  if (experience === 'start') {
    return (
      <section aria-labelledby="interview-start-heading">
        <div className="stage-head">
          <p className="meta-label">Scholarship interview</p>
          <h2 ref={experienceHeadingRef} tabIndex={-1} id="interview-start-heading" className="page-title mt-3 max-w-3xl outline-none">Find scholarships that fit your education plans.</h2>
          <p className="lede max-w-3xl">Answer one page of questions to explore scholarships for your education plans.</p>
          <div className="toolbar mt-8">
            <button type="button" onClick={() => { setAnswers(null); setExperience('interview'); }} className="btn btn-primary">Start the interview</button>
            <button type="button" onClick={showBrowseAll} className="btn btn-secondary">Browse all {catalog.counts.awards} awards</button>
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
      listTitle={scopeTitle(resultScope)}
      headingRef={embedHeading ? experienceHeadingRef : undefined}
      resetToken={isResults ? resultScope : 'browse'}
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
          <div className="stage-head">
            <div className="toolbar">
              <button type="button" onClick={() => setExperience('interview')} className="btn btn-tertiary">Edit answers</button>
              <button type="button" onClick={showBrowseAll} className="btn btn-secondary">Browse all</button>
              <button type="button" onClick={resetInterview} className="btn btn-primary">Start over</button>
            </div>
            <div role="group" aria-label="Choose which awards to show" className="toolbar mt-4">
              <ScopeButton active={resultScope === 'recommended'} onClick={() => setResultScope('recommended')}>My matches ({scopeCount(matching.results, 'recommended', hiddenIds)})</ScopeButton>
              <ScopeButton active={resultScope === 'conflicts'} onClick={() => setResultScope('conflicts')}>May not fit ({scopeCount(matching.results, 'conflicts', hiddenIds)})</ScopeButton>
              <ScopeButton active={resultScope === 'all'} onClick={() => setResultScope('all')}>Every award ({scopeCount(matching.results, 'all', hiddenIds)})</ScopeButton>
            </div>
          </div>
          {baseAwards.length === 0 ? (
            <>
              <h2 ref={experienceHeadingRef} tabIndex={-1} id="catalog-heading" className="page-title mt-6 outline-none">{scopeTitle(resultScope)} (0)</h2>
              <NoRecommendations onEdit={() => setExperience('interview')} onBrowse={showBrowseAll} />
            </>
          ) : list(true)}
        </div>
      ) : (
        <div>
          <div className="stage-head flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="meta-label">Browse all</p>
              <h2 ref={experienceHeadingRef} tabIndex={-1} id="catalog-heading" className="page-title mt-2 outline-none">See what is verified, and what is not.</h2>
              <p className="lede max-w-3xl">{catalog.notice}</p>
            </div>
            <button type="button" onClick={() => { setAnswers(null); setExperience('interview'); }} className="btn btn-primary">Start interview</button>
          </div>
          <dl className="stat-grid mt-8" aria-label="Catalog counts">
            <Count label="Awards" value={catalog.counts.awards} />
            <Count label="Open now" value={catalog.awards.filter((award) => studentStatus(award) === 'open_now').length} emphasis="positive" />
            <Count label="Not checked" value={catalog.awards.filter((award) => award.verification?.status !== 'verified').length} emphasis="warning" />
            <Count label="Portals" value={catalog.counts.portals} />
            <Count label="Sources" value={catalog.counts.sources} />
            <Count label="Minimum award slots" value={catalog.counts.minimumObservedRecipientSlots} suffix="*" />
          </dl>
          <p className="fine">* This is an old minimum count, not a count of open awards today.</p>
          <div className="notice mt-6 text-sm leading-6">
            <strong>Checked October 28, 2026:</strong> {catalog.awards.filter((award) => award.verification?.status === 'verified').length} scholarships are marked Verified, with a source link and a clear open, later, or closed status. The other awards are not checked yet, so they say Not sure.
          </div>
          <div role="group" aria-label="Choose catalog record type" className="toolbar panel mt-6">
            <ScopeButton active={view === 'awards'} onClick={() => setView('awards')}>Awards ({catalog.awards.filter((award) => !hiddenIds.includes(award.publicId)).length})</ScopeButton>
            <ScopeButton active={view === 'portals'} onClick={() => setView('portals')}>Portal records ({catalog.counts.portals})</ScopeButton>
            <ScopeButton active={view === 'sources'} onClick={() => setView('sources')}>Source records ({catalog.counts.sources})</ScopeButton>
          </div>
          {view === 'awards' && list(false)}
          {view !== 'awards' && (
            <div className="mt-4">
              <label className="block text-sm font-semibold">
                Search {view}
                <input type="search" value={portalSearch} onChange={(event) => setPortalSearch(event.target.value)} className="field mt-2" />
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

function Count({ label, value, suffix = '' }: { label: string; value: number; suffix?: string; emphasis?: 'neutral' | 'warning' | 'positive' }) {
  return <div className="stat"><dt>{label}</dt><dd>{value}{suffix}</dd></div>;
}

function scopeTitle(scope: ResultScope): string {
  if (scope === 'conflicts') return 'May not fit';
  if (scope === 'all') return 'Every award';
  return 'Your matches';
}

function scopeCount(results: ReadonlyArray<{ decision: string; award: { publicId: string } }>, scope: ResultScope, hiddenIds: readonly string[]): number {
  const hidden = new Set(hiddenIds);
  return awardsForResultScope(results, scope).filter((result) => !hidden.has(result.award.publicId)).length;
}

function ScopeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button aria-pressed={active} type="button" onClick={onClick} className={`chip${active ? ' is-selected' : ''}`}>{children}</button>;
}

function SourceCard({ source }: { source: StudentSource }) {
  return (
    <article className="award-card min-w-0 max-w-full overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="meta-label">{source.architecture.replaceAll('_', ' ')}</p><span className="pill pill-later capitalize">{source.recordType}</span></div>
      <h3 className="mt-2 break-words text-xl font-semibold">{source.title}</h3>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="font-semibold">Catalog state</dt><dd className="mt-1 capitalize muted">{source.availability}</dd></div><div><dt className="font-semibold">Linked awards</dt><dd className="mt-1 muted">{source.awardCount}</dd></div></dl>
      {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="title-link mt-6 inline-flex">Visit official source <span className="sr-only">{source.title}</span><span aria-hidden="true"> ↗</span></a> : <p className="fine mt-6 font-semibold">Offline source; no verified URL</p>}
    </article>
  );
}

function PortalCard({ portal }: { portal: StudentPortal }) {
  return (
    <article className="award-card min-w-0 max-w-full overflow-hidden">
      <p className="meta-label">Portal record · {portal.architecture.replaceAll('_', ' ')}</p>
      <h3 className="mt-2 break-words text-xl font-semibold">{portal.title}</h3>
      <p className="hint mt-4">Linked to {portal.sourcePublicIds.length} source record{portal.sourcePublicIds.length === 1 ? '' : 's'}.</p>
      {portal.url ? <a href={portal.url} target="_blank" rel="noopener noreferrer" className="title-link mt-6 inline-flex">Visit portal source <span className="sr-only">{portal.title}</span><span aria-hidden="true"> ↗</span></a> : <p className="fine mt-6 font-semibold">No verified online portal URL</p>}
    </article>
  );
}

function EmptyState({ noun, onClear }: { noun: string; onClear: () => void }) {
  return (
    <div role="status" className="mx-auto mt-6 max-w-2xl py-8 text-center">
      <p className="meta-label">No matching {noun}</p>
      <h3 className="section-title mt-2">Try a broader search.</h3>
      <button type="button" onClick={onClear} className="btn btn-primary mt-6">Clear search</button>
    </div>
  );
}

function NoRecommendations({ onEdit, onBrowse }: { onEdit: () => void; onBrowse: () => void }) {
  return (
    <div role="status" className="notice mx-auto mt-8 max-w-2xl p-8 text-center">
      <h3 className="section-title">None of these fit the answers you gave.</h3>
      <p className="lede">You can change your answers, or look at every award. Nothing is thrown away.</p>
      <div className="toolbar mt-6 justify-center">
        <button type="button" onClick={onEdit} className="btn btn-primary">Edit answers</button>
        <button type="button" onClick={onBrowse} className="btn btn-secondary">Browse all awards</button>
      </div>
    </div>
  );
}
