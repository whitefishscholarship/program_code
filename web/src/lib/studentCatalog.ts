import { z } from 'zod';
import { optionalAwardTagShape } from './awardTagSchema';
import { calendarDayIsBefore, explicitCalendarDay } from './dateParse';

export const STUDENT_CATALOG_SCHEMA_VERSION = '1.0.0' as const;

export const CYCLE_STATUSES = ['active', 'upcoming', 'closed', 'unavailable', 'unknown'] as const;
export const VERIFICATION_STATUSES = ['verified', 'not_yet_checked'] as const;
export const OPEN_STATUSES = ['open_now', 'opens_on', 'closed_next_not_posted'] as const;
export const APPLICATION_MODES = [
  'automatic_consideration',
  'selectable_children',
  'eligibility_matched',
  'shared_with_supplements',
  'direct_per_award',
  'offline',
  'unknown',
] as const;

export const PUBLIC_AWARD_FIELDS = [
  'publicId',
  'name',
  'summary',
  'amount',
  'eligibility',
  'cycle',
  'application',
  'sourcePublicIds',
] as const;

export const PUBLIC_SOURCE_FIELDS = [
  'publicId',
  'title',
  'recordType',
  'architecture',
  'url',
  'access',
  'availability',
  'awardCount',
] as const;

export const PUBLIC_PORTAL_FIELDS = [
  'publicId',
  'title',
  'architecture',
  'url',
  'sourcePublicIds',
] as const;

export const FORBIDDEN_PUBLIC_KEYS = [
  'evidenceIds',
  'reviewItemIds',
  'legacyRowIdentities',
  'legacySourceIdentity',
  'identityPolicy',
  'offlineAuthority',
  'private_key',
  'client_email',
  'applicant',
  'dateOfBirth',
  'address',
  'phone',
  'transcript',
] as const;

const nullableText = z.string().min(1).nullable();
const publicId = z.string().regex(/^(award|source|portal|application)-[a-f0-9]{12}$/);

export const AwardVerificationSchema = z.object({
  status: z.enum(VERIFICATION_STATUSES),
  lastChecked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  sourceUrl: z.string().url().nullable(),
  openStatus: z.enum(OPEN_STATUSES).nullable(),
  deadline: z.string().min(1).nullable(),
}).strict();

export const StudentAwardSchema = z.object({
  publicId: publicId,
  name: z.string().min(1),
  summary: nullableText,
  amount: z.object({
    label: z.string().min(1),
    minimum: z.number().nonnegative().nullable(),
    maximum: z.number().nonnegative().nullable(),
    currency: z.string().length(3).nullable(),
    state: z.enum(['known', 'variable', 'unknown', 'unparseable']),
  }),
  eligibility: z.object({
    audience: z.string().min(1),
    minimumGpa: z.number().min(0).max(5).nullable(),
    schoolTypes: z.array(z.enum(['two_year', 'four_year', 'trade', 'other'])),
    focus: nullableText,
  }),
  cycle: z.object({
    status: z.enum(CYCLE_STATUSES),
    label: z.string().min(1),
    year: z.number().int().nullable(),
    opens: nullableText,
    closes: nullableText,
    recurrence: z.enum(['annual', 'one_time', 'rolling', 'irregular', 'unknown']),
  }),
  application: z.object({
    mode: z.enum(APPLICATION_MODES),
    label: z.string().min(1),
    url: z.string().url().nullable(),
    groupPublicId: publicId.nullable(),
    supplements: z.enum(['required', 'not_required', 'mixed', 'unknown']),
  }),
  sourcePublicIds: z.array(publicId).min(1),
  verification: AwardVerificationSchema.optional(),
  verificationNote: z.string().min(1).optional(),
  ...optionalAwardTagShape,
}).strict();

export const StudentSourceSchema = z.object({
  publicId: publicId,
  title: z.string().min(1),
  recordType: z.enum(['portal', 'source']),
  architecture: z.enum([
    'single_award_page', 'multi_award_page', 'directory_hub', 'paginated_catalog',
    'common_application', 'matching_portal', 'external_marketplace',
    'login_application_portal', 'document_or_pdf', 'form_only',
    'institution_umbrella', 'offline_or_automatic', 'unknown',
  ]),
  url: z.string().url().nullable(),
  access: z.enum(['public', 'authenticated', 'offline', 'unknown']),
  availability: z.enum(['complete', 'partial', 'blocked', 'unknown']),
  awardCount: z.number().int().nonnegative(),
}).strict();

export const StudentPortalSchema = z.object({
  publicId,
  title: z.string().min(1),
  architecture: StudentSourceSchema.shape.architecture,
  url: z.string().url().nullable(),
  sourcePublicIds: z.array(publicId).min(1),
}).strict();

export const StudentApplicationGroupSchema = z.object({
  publicId: publicId,
  mode: z.enum(APPLICATION_MODES),
  label: z.string().min(1),
  url: z.string().url().nullable(),
  awardPublicIds: z.array(publicId),
  supplements: z.enum(['required', 'not_required', 'mixed', 'unknown']),
}).strict();

export const StudentCatalogSchema = z.object({
  schemaVersion: z.literal(STUDENT_CATALOG_SCHEMA_VERSION),
  catalogRevision: z.string().regex(/^[a-f0-9]{64}$/),
  counts: z.object({
    sources: z.number().int().nonnegative(),
    portals: z.number().int().nonnegative(),
    awards: z.number().int().nonnegative(),
    applicationGroups: z.number().int().nonnegative(),
    cycles: z.number().int().nonnegative(),
    activeCycles: z.number().int().nonnegative(),
    upcomingCycles: z.number().int().nonnegative(),
    closedCycles: z.number().int().nonnegative(),
    unavailableCycles: z.number().int().nonnegative(),
    unknownCycles: z.number().int().nonnegative(),
    minimumObservedRecipientSlots: z.number().int().nonnegative(),
  }).strict(),
  awards: z.array(StudentAwardSchema),
  sources: z.array(StudentSourceSchema),
  portals: z.array(StudentPortalSchema),
  applicationGroups: z.array(StudentApplicationGroupSchema),
  notice: z.string().min(1),
}).strict();

export type StudentAward = z.infer<typeof StudentAwardSchema>;
export type AwardVerification = z.infer<typeof AwardVerificationSchema>;

const UNCHECKED_VERIFICATION: AwardVerification = {
  status: 'not_yet_checked',
  lastChecked: null,
  sourceUrl: null,
  openStatus: null,
  deadline: null,
};

export function displayVerification(award: StudentAward): AwardVerification {
  return award.verification ?? UNCHECKED_VERIFICATION;
}

export function formatCheckedDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

const UNSUPPORTED_AOPA_EXAM_NOTE = 'Check age limits and the FAA written-exam prerequisite. ';

export function displayMatchReason(message: string): string {
  return message.replace(UNSUPPORTED_AOPA_EXAM_NOTE, 'Check the age range stated on the official page. ');
}

export function openStatusText(award: StudentAward, now: Date = new Date()): string | null {
  const verification = displayVerification(award);
  if (verification.status !== 'verified') return null;
  const sentence = (value: string) => value.endsWith('.') ? value : `${value}.`;
  const datedDeadline = verification.deadline ? explicitCalendarDay(verification.deadline) : null;
  if (datedDeadline && calendarDayIsBefore(datedDeadline, now) && verification.openStatus !== 'closed_next_not_posted') {
    return verification.deadline ? sentence(`Closed. Deadline ${verification.deadline}`) : 'Closed.';
  }
  if (verification.openStatus === 'open_now') {
    return verification.deadline ? sentence(`Open now. Deadline ${verification.deadline}`) : 'Open now.';
  }
  if (verification.openStatus === 'opens_on') {
    const opens = award.cycle.opens ? `Opens ${award.cycle.opens}.` : 'Opens on a later date.';
    return verification.deadline ? sentence(`${opens} Deadline ${verification.deadline}`) : `${opens} Exact deadline is not posted.`;
  }
  if (verification.openStatus === 'closed_next_not_posted') {
    return verification.deadline
      ? sentence(`Closed, next cycle not posted. Last deadline ${verification.deadline}`)
      : 'Closed, next cycle not posted.';
  }
  return 'Verified. No application deadline is listed.';
}
export type StudentSource = z.infer<typeof StudentSourceSchema>;
export type StudentPortal = z.infer<typeof StudentPortalSchema>;
export type StudentCatalog = z.infer<typeof StudentCatalogSchema>;
export type CycleStatus = StudentAward['cycle']['status'];
export type ApplicationMode = StudentAward['application']['mode'];

type CanonicalSource = {
  id: string;
  architecture: string;
  canonicalUrl: string | null;
  host: string | null;
  accessBehavior: 'public' | 'authenticated' | 'offline' | 'unknown';
  authority: string;
  acquisitionState: 'observed' | 'partial' | 'complete' | 'blocked' | 'failed' | 'unknown';
  legacySourceIdentity?: string | null;
};

type CanonicalScholarship = {
  id: string;
  name: string;
  sourceIds: string[];
  sourceLinks: Array<{ sourceId: string; role: string }>;
  applicationGroupIds: string[];
  cycleIds: string[];
  studentFields: {
    summary: { raw: string | null; state: string };
    awardAmount: { raw: string | null; minimum: number | null; maximum: number | null; currency: string | null; state: StudentAward['amount']['state'] };
    eligibility: {
      location: { state: string };
      minimumGpa: { value: number | null };
      schoolTypes: { values: StudentAward['eligibility']['schoolTypes'] };
      focus: { raw: string | null; state: string };
    };
  };
};

type CanonicalApplicationGroup = {
  id: string;
  mode: ApplicationMode;
  sourceIds: string[];
  scholarshipIds: string[];
  supplementalRequirements: StudentAward['application']['supplements'];
};

type CanonicalCycle = {
  id: string;
  scholarshipId: string;
  year: number | null;
  opensAt: { value: string | null; precision: string };
  closesAt: { value: string | null; precision: string };
  status: CycleStatus;
  recurrence: StudentAward['cycle']['recurrence'];
};

export type CanonicalCatalogInput = {
  sources: CanonicalSource[];
  scholarships: CanonicalScholarship[];
  applicationGroups: CanonicalApplicationGroup[];
  cycles: CanonicalCycle[];
};

export type CoverageMetricsInput = {
  childRecordDatasetSha256: string;
  recipientSlots: { observedMinimumAcrossAcceptedChildrenWithUnknownCycles: number };
};

const PORTAL_ARCHITECTURES = new Set([
  'directory_hub',
  'paginated_catalog',
  'matching_portal',
  'external_marketplace',
  'login_application_portal',
]);

export function publicEntityId(kind: 'award' | 'source' | 'portal' | 'application', canonicalId: string): string {
  const digest = canonicalId.split('_')[1];
  if (!digest || !/^[a-f0-9]{64}$/.test(digest)) throw new Error(`Invalid canonical ${kind} identity`);
  return `${kind}-${digest.slice(0, 12)}`;
}

function publicUrl(value: string | null): string | null {
  if (!value) return null;
  const parsed = new URL(value);
  return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
}

function amountLabel(amount: CanonicalScholarship['studentFields']['awardAmount']): string {
  if (amount.state === 'variable') return 'Amount varies';
  if (amount.state !== 'known' || amount.minimum === null) return 'Amount not verified';
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: amount.currency ?? 'USD', maximumFractionDigits: 0 });
  if (amount.maximum !== null && amount.maximum !== amount.minimum) {
    return `${formatter.format(amount.minimum)}–${formatter.format(amount.maximum)}`;
  }
  return formatter.format(amount.minimum);
}

export function applicationModeLabel(mode: ApplicationMode): string {
  const labels: Record<ApplicationMode, string> = {
    automatic_consideration: 'Automatic consideration',
    selectable_children: 'One application; select awards',
    eligibility_matched: 'Portal matches eligible awards',
    shared_with_supplements: 'Shared application; some awards add supplements',
    direct_per_award: 'Separate application for this award',
    offline: 'Paper or counselor-provided application',
    unknown: 'Application method not verified',
  };
  return labels[mode];
}

export function cycleStatusLabel(status: CycleStatus): string {
  const labels: Record<CycleStatus, string> = {
    active: 'Open now',
    upcoming: 'Upcoming',
    closed: 'Closed',
    unavailable: 'Currently unavailable',
    unknown: 'Availability not verified',
  };
  return labels[status];
}

function dateLabel(fact: CanonicalCycle['opensAt'], year: number | null): string | null {
  if (!fact.value || fact.precision === 'unknown') return null;
  if (fact.precision === 'annual_rule' && year === null) return `${fact.value} each year (year not verified)`;
  return fact.value;
}

function applicationUrl(
  group: CanonicalApplicationGroup | undefined,
  scholarship: CanonicalScholarship,
  sourceById: Map<string, CanonicalSource>,
): string | null {
  const applicationLinkIds = scholarship.sourceLinks.filter((link) => link.role === 'application').map((link) => link.sourceId);
  const candidates = [...applicationLinkIds, ...(group?.sourceIds ?? [])];
  for (const id of candidates) {
    const source = sourceById.get(id);
    if (!source) continue;
    if (source.authority === 'official_application' || applicationLinkIds.includes(id)) {
      const url = publicUrl(source.canonicalUrl);
      if (url) return url;
    }
  }
  return null;
}

function availability(state: CanonicalSource['acquisitionState']): StudentSource['availability'] {
  if (state === 'complete') return 'complete';
  if (state === 'partial' || state === 'observed') return 'partial';
  if (state === 'blocked' || state === 'failed') return 'blocked';
  return 'unknown';
}

export function buildStudentCatalog(input: CanonicalCatalogInput, metrics: CoverageMetricsInput): StudentCatalog {
  const sourceById = new Map(input.sources.map((source) => [source.id, source]));
  const groupById = new Map(input.applicationGroups.map((group) => [group.id, group]));
  const cycleById = new Map(input.cycles.map((cycle) => [cycle.id, cycle]));

  const awards: StudentAward[] = input.scholarships.map((scholarship) => {
    const cycle = scholarship.cycleIds.map((id) => cycleById.get(id)).filter(Boolean)[0];
    if (!cycle) throw new Error(`Scholarship ${scholarship.name} has no cycle`);
    const group = scholarship.applicationGroupIds.map((id) => groupById.get(id)).filter(Boolean)[0];
    const mode = group?.mode ?? 'direct_per_award';
    return StudentAwardSchema.parse({
      publicId: publicEntityId('award', scholarship.id),
      name: scholarship.name,
      summary: scholarship.studentFields.summary.state === 'known' ? scholarship.studentFields.summary.raw : null,
      amount: {
        label: amountLabel(scholarship.studentFields.awardAmount),
        minimum: scholarship.studentFields.awardAmount.minimum,
        maximum: scholarship.studentFields.awardAmount.maximum,
        currency: scholarship.studentFields.awardAmount.currency,
        state: scholarship.studentFields.awardAmount.state,
      },
      eligibility: {
        audience: scholarship.studentFields.eligibility.location.state === 'known' ? 'Montana students' : 'Audience details not verified',
        minimumGpa: scholarship.studentFields.eligibility.minimumGpa.value,
        schoolTypes: scholarship.studentFields.eligibility.schoolTypes.values,
        focus: scholarship.studentFields.eligibility.focus.state === 'known' ? scholarship.studentFields.eligibility.focus.raw : null,
      },
      cycle: {
        status: cycle.status,
        label: cycleStatusLabel(cycle.status),
        year: cycle.year,
        opens: dateLabel(cycle.opensAt, cycle.year),
        closes: dateLabel(cycle.closesAt, cycle.year),
        recurrence: cycle.recurrence,
      },
      application: {
        mode,
        label: applicationModeLabel(mode),
        url: applicationUrl(group, scholarship, sourceById),
        groupPublicId: group ? publicEntityId('application', group.id) : null,
        supplements: group?.supplementalRequirements ?? 'unknown',
      },
      sourcePublicIds: scholarship.sourceIds.map((id) => publicEntityId('source', id)),
    });
  }).sort((a, b) => {
    const rank: Record<CycleStatus, number> = { active: 0, upcoming: 1, unknown: 2, unavailable: 3, closed: 4 };
    return rank[a.cycle.status] - rank[b.cycle.status] || a.name.localeCompare(b.name);
  });

  const awardIdByCanonical = new Map(input.scholarships.map((award) => [award.id, publicEntityId('award', award.id)]));
  const applicationGroups = input.applicationGroups.map((group) => StudentApplicationGroupSchema.parse({
    publicId: publicEntityId('application', group.id),
    mode: group.mode,
    label: applicationModeLabel(group.mode),
    url: applicationUrl(group, input.scholarships.find((award) => award.applicationGroupIds.includes(group.id))!, sourceById),
    awardPublicIds: group.scholarshipIds.map((id) => awardIdByCanonical.get(id)).filter((id): id is string => Boolean(id)),
    supplements: group.supplementalRequirements,
  }));

  const sources = input.sources.map((source) => {
    const url = publicUrl(source.canonicalUrl);
    return StudentSourceSchema.parse({
      publicId: publicEntityId('source', source.id),
      title: source.host ?? (url ? new URL(url).hostname : 'Offline source'),
      recordType: PORTAL_ARCHITECTURES.has(source.architecture) ? 'portal' : 'source',
      architecture: source.architecture,
      url,
      access: source.accessBehavior,
      availability: availability(source.acquisitionState),
      awardCount: input.scholarships.filter((award) => award.sourceIds.includes(source.id)).length,
    });
  }).sort((a, b) => a.title.localeCompare(b.title));

  const portals = sources.filter((source) => source.recordType === 'portal').map((source) => StudentPortalSchema.parse({
    publicId: source.publicId.replace('source-', 'portal-'),
    title: source.title,
    architecture: source.architecture,
    url: source.url,
    sourcePublicIds: [source.publicId],
  }));

  const countStatus = (status: CycleStatus) => input.cycles.filter((cycle) => cycle.status === status).length;
  return StudentCatalogSchema.parse({
    schemaVersion: STUDENT_CATALOG_SCHEMA_VERSION,
    catalogRevision: metrics.childRecordDatasetSha256,
    counts: {
      sources: input.sources.length,
      portals: portals.length,
      awards: awards.length,
      applicationGroups: applicationGroups.length,
      cycles: input.cycles.length,
      activeCycles: countStatus('active'),
      upcomingCycles: countStatus('upcoming'),
      closedCycles: countStatus('closed'),
      unavailableCycles: countStatus('unavailable'),
      unknownCycles: countStatus('unknown'),
      minimumObservedRecipientSlots: metrics.recipientSlots.observedMinimumAcrossAcceptedChildrenWithUnknownCycles,
    },
    awards,
    sources,
    portals,
    applicationGroups,
    notice: 'Cycle availability is shown only when verified for a specific cycle. Yearless annual dates remain unavailable until confirmed on an official source.',
  });
}

export function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => collectObjectKeys(item, keys));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      collectObjectKeys(child, keys);
    }
  }
  return keys;
}
