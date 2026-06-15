'use client';

import { useEffect, useMemo, useState } from 'react';
import { BrowseItem, buildBrowseList, UrgencyTone } from '@/lib/browse';

const TONE_CLASSES: Record<UrgencyTone, string> = {
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
};

type SortKey = 'deadline' | 'amount' | 'name';
type SchoolType = 'Two year' | 'Four year' | 'Trade';
type LocationFilter = 'all' | 'national' | 'local';

const SCHOOL_TYPES: SchoolType[] = ['Two year', 'Four year', 'Trade'];

// Rank for "deadline soonest" sort: real upcoming dates first (by proximity),
// then rolling, then check-site/unknown last.
function deadlineRank(item: BrowseItem): number {
    const n = item.processed.normalized;
    if (n.due_date_type === 'hard' && item.daysUntil !== null) return item.daysUntil;
    if (n.due_date_type === 'rolling') return 100000;
    return 200000;
}

export default function ScholarshipBrowser() {
    const [items, setItems] = useState<BrowseItem[] | null>(null);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortKey>('deadline');
    const [schoolTypes, setSchoolTypes] = useState<SchoolType[]>([]);
    const [location, setLocation] = useState<LocationFilter>('all');
    const [renewableOnly, setRenewableOnly] = useState(false);
    const [deadlineOnly, setDeadlineOnly] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/scholarships');
                if (!res.ok) throw new Error('Could not load scholarships. Please try again.');
                const json = await res.json();
                if (json.error) throw new Error(json.error);
                if (!cancelled) setItems(buildBrowseList(json.data || []));
            } catch (err: unknown) {
                if (!cancelled) setError(err instanceof Error ? err.message : String(err));
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const visible = useMemo(() => {
        if (!items) return [];
        const q = search.trim().toLowerCase();

        const filtered = items.filter(item => {
            const n = item.processed.normalized;
            const r = item.raw;

            if (q) {
                const hay = [r['Name of Scholarship'], r['Summary'], r['Focus']]
                    .join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }

            if (schoolTypes.length > 0) {
                // Keep "Any" scholarships (empty school_types) plus those overlapping the selection.
                const matches = n.school_types.length === 0
                    || n.school_types.some(t => schoolTypes.includes(t as SchoolType));
                if (!matches) return false;
            }

            if (location === 'national' && !n.is_national) return false;
            if (location === 'local' && n.is_national) return false;

            if (renewableOnly && !n.is_renewable) return false;

            if (deadlineOnly && n.due_date_type !== 'hard') return false;

            return true;
        });

        const sorted = [...filtered];
        if (sort === 'deadline') {
            sorted.sort((a, b) => deadlineRank(a) - deadlineRank(b));
        } else if (sort === 'amount') {
            sorted.sort((a, b) => b.amountSort - a.amountSort);
        } else {
            sorted.sort((a, b) =>
                (a.raw['Name of Scholarship'] || '').localeCompare(b.raw['Name of Scholarship'] || ''));
        }
        return sorted;
    }, [items, search, sort, schoolTypes, location, renewableOnly, deadlineOnly]);

    const toggleSchoolType = (t: SchoolType) => {
        setSchoolTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    };

    const clearFilters = () => {
        setSearch('');
        setSchoolTypes([]);
        setLocation('all');
        setRenewableOnly(false);
        setDeadlineOnly(false);
    };

    // ---- States: error / loading / empty / list ----
    if (error) {
        return (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-red-100 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Couldn&apos;t load scholarships</h2>
                <p className="text-gray-600">{error}</p>
            </div>
        );
    }

    if (!items) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h2 className="text-xl font-medium text-gray-800">Loading scholarships...</h2>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Controls */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, focus, or keyword…"
                        className="flex-1 text-black border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5"
                    />
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value as SortKey)}
                        className="text-black border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5"
                    >
                        <option value="deadline">Sort: Deadline (soonest)</option>
                        <option value="amount">Sort: Award amount (high → low)</option>
                        <option value="name">Sort: Name (A → Z)</option>
                    </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                    {SCHOOL_TYPES.map(t => {
                        const on = schoolTypes.includes(t);
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => toggleSchoolType(t)}
                                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${on
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                {t}
                            </button>
                        );
                    })}

                    <span className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true" />

                    {([['all', 'All locations'], ['local', 'In-State'], ['national', 'National']] as [LocationFilter, string][]).map(([val, label]) => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => setLocation(val)}
                            className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${location === val
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                            {label}
                        </button>
                    ))}

                    <span className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true" />

                    <button
                        type="button"
                        onClick={() => setRenewableOnly(v => !v)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${renewableOnly
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                        Renewable only
                    </button>
                    <button
                        type="button"
                        onClick={() => setDeadlineOnly(v => !v)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${deadlineOnly
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                        Has a deadline
                    </button>
                </div>
            </div>

            {/* Result count */}
            <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-sm text-gray-500">
                    Showing <strong>{visible.length}</strong> of {items.length} active scholarships
                </p>
                {(search || schoolTypes.length > 0 || location !== 'all' || renewableOnly || deadlineOnly) && (
                    <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800 underline">
                        Clear filters
                    </button>
                )}
            </div>

            {/* Cards */}
            {visible.length === 0 ? (
                <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No scholarships match these filters</h2>
                    <p className="text-gray-600">Try clearing a filter or broadening your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visible.map((item, i) => (
                        <ScholarshipCard key={`${item.raw['Name of Scholarship']}-${i}`} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ScholarshipCard({ item }: { item: BrowseItem }) {
    const r = item.raw;
    const n = item.processed.normalized;
    const gpa = r['Stated Min. GPA'];
    const field = (r['Focus'] || '').trim();
    const schoolType = (r['School Type (2-or 4-Year, or Trade)'] || '').trim();

    return (
        <div className="flex flex-col bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-gray-900 leading-snug">{r['Name of Scholarship']}</h3>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${TONE_CLASSES[item.urgency.tone]}`}>
                    {item.urgency.label}
                </span>
            </div>

            <p className="text-2xl font-bold text-gray-900 mb-3">{item.amountDisplay}</p>

            <div className="flex flex-wrap gap-1.5 mb-3">
                <Chip>{n.is_national ? 'National' : 'In-State'}</Chip>
                {schoolType && schoolType.toLowerCase() !== 'any' && <Chip>{schoolType}</Chip>}
                {gpa && gpa.toLowerCase() !== 'any' && <Chip>Min GPA {gpa}</Chip>}
                {n.is_renewable && <Chip>Renewable</Chip>}
                {field && <Chip>{field}</Chip>}
            </div>

            {r['Summary'] && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-4">{r['Summary']}</p>
            )}

            <div className="mt-auto pt-2">
                {item.applyHref ? (
                    <a
                        href={item.applyHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Apply →
                    </a>
                ) : (
                    <span className="block w-full text-center bg-gray-100 text-gray-500 px-6 py-2.5 rounded-lg font-medium">
                        See your counselor
                    </span>
                )}
            </div>
        </div>
    );
}

function Chip({ children }: { children: React.ReactNode }) {
    return (
        <span className="px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700">{children}</span>
    );
}
