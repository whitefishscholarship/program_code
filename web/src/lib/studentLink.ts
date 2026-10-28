import { InterviewAnswersSchema, type InterviewAnswers } from './interviewMatcher';

// Student answers and hidden award ids live only in the URL fragment.
// Browsers do not send the fragment to the server. Never put this state in
// the query string, storage, cookies, or a request body.

const AWARD_ID = /^award-[a-f0-9]{12}$/;
const MAX_FRAGMENT_LENGTH = 100_000;

export type StudentLinkState = {
  answers: InterviewAnswers | null;
  hiddenIds: string[];
};

export function uniqueAwardIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of ids) {
    if (!AWARD_ID.test(id) || seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
  }
  return unique;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid fragment');
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replaceAll('-', '+').replaceAll('_', '/'));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function encodeStudentLink(state: StudentLinkState): string {
  const hiddenIds = uniqueAwardIds(state.hiddenIds);
  if (!state.answers && hiddenIds.length === 0) return '';
  const payload = JSON.stringify({ v: 1, a: state.answers, h: hiddenIds });
  return `wfs1.${bytesToBase64Url(new TextEncoder().encode(payload))}`;
}

export function decodeStudentLink(fragment: string): StudentLinkState | null {
  const raw = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (!raw || raw.length > MAX_FRAGMENT_LENGTH) return null;
  let body = raw;
  try {
    body = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (body.startsWith('wfs1.')) body = body.slice(5);
  if (!body || body.length > MAX_FRAGMENT_LENGTH) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body)));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const record = parsed as { v?: unknown; a?: unknown; h?: unknown };
  if (record.v !== 1) return null;
  const hiddenIds = Array.isArray(record.h)
    ? uniqueAwardIds(record.h.filter((id): id is string => typeof id === 'string'))
    : [];
  if (record.a == null) return { answers: null, hiddenIds };
  const answers = InterviewAnswersSchema.safeParse(record.a);
  if (!answers.success) return null;
  return { answers: answers.data, hiddenIds };
}

export function buildStudentHref(currentHref: string, state: StudentLinkState): string {
  const url = new URL(currentHref, 'http://localhost');
  for (const key of ['a', 'answers', 'gpa', 'hidden', 'h']) url.searchParams.delete(key);
  const encoded = encodeStudentLink(state);
  url.hash = encoded;
  return url.toString();
}

export function writeStudentFragment(encoded: string): void {
  if (typeof window === 'undefined') return;
  const current = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  let currentDecoded = current;
  try {
    currentDecoded = decodeURIComponent(current);
  } catch {
    currentDecoded = current;
  }
  if (encoded) {
    if (currentDecoded === encoded) return;
    const next = `${window.location.pathname}${window.location.search}#${encoded}`;
    window.history.replaceState(null, '', next);
    return;
  }
  if (current && decodeStudentLink(current)) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
}
