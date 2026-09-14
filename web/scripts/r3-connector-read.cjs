'use strict';

// Local orchestration only. Never return or persist the raw connector response.
const validTime = value => {
  if (typeof value !== 'string') return false;
  const parts = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!parts || !Number.isFinite(Date.parse(value))) return false;
  return new Date(value).toISOString() === `${parts[1]}.${(parts[2] || '').padEnd(3, '0')}Z`;
};

function sanitizeRevisionObservation(response, fileId, modifiedTime) {
  const out = { status: 'BLOCKED', fileId, currentRevisionId: null, currentRevisionModifiedTime: null,
    fileModifiedTime: null, returnedRevisionCount: null, currentRevisionRecordMatches: 0, editorIdentityRetained: false,
    reasons: [] };
  if (!response || response.isError) { out.reasons.push('connector_error_or_missing_response'); return out; }
  const s = response.structuredContent;
  if (s && s.result && Object.keys(s).some(k => k !== 'result')) out.reasons.push('unexpected_structured_wrapper_fields');
  const data = s && (s.result || s);
  if (!data || typeof data !== 'object') { out.reasons.push('missing_structured_revision_result'); return out; }
  const allowed = ['fileId', 'currentRevisionId', 'previousRevisionId', 'revisions'];
  if (Object.keys(data).some(k => !allowed.includes(k))) out.reasons.push('unexpected_revision_envelope_fields');
  if (data.fileId !== fileId) out.reasons.push('file_identity_mismatch');
  const revisions = Array.isArray(data.revisions) ? data.revisions : [];
  if (!Array.isArray(data.revisions)) out.reasons.push('missing_revision_records');
  out.returnedRevisionCount = revisions.length;
  if (revisions.length >= 1000) out.reasons.push('revision_page_cap_reached');
  const fields = ['id', 'mimeType', 'modifiedTime', 'keepForever', 'published', 'originalFilename', 'size', 'lastModifyingUser'];
  const userFields = ['displayName', 'emailAddress', 'me', 'permissionId', 'photoLink'];
  for (const r of revisions) {
    if (!r || typeof r !== 'object' || Object.keys(r).some(k => !fields.includes(k))) {
      out.reasons.push('unexpected_revision_record_fields'); break;
    }
    if (r.lastModifyingUser != null && (typeof r.lastModifyingUser !== 'object' || Object.keys(r.lastModifyingUser).some(k => !userFields.includes(k)))) {
      out.reasons.push('unexpected_editor_metadata_fields'); break;
    }
  }
  const token = data.currentRevisionId;
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(token)) {
    out.reasons.push('missing_or_invalid_tool_current_revision'); return out;
  }
  const matches = revisions.filter(r => r && r.id === token);
  out.currentRevisionRecordMatches = matches.length;
  if (matches.length !== 1) out.reasons.push('ambiguous_or_missing_current_revision_record');
  const time = matches.length === 1 ? matches[0].modifiedTime : null;
  if (!validTime(modifiedTime) || !validTime(time)) out.reasons.push('missing_or_invalid_independent_timestamp');
  if (matches.length === 1 && matches[0].mimeType != null && matches[0].mimeType !== 'application/vnd.google-apps.spreadsheet')
    out.reasons.push('revision_mime_type_mismatch');
  if (out.reasons.length === 0) {
    out.status = 'PASS'; out.currentRevisionId = token; out.currentRevisionModifiedTime = time; out.fileModifiedTime = modifiedTime;
  }
  return out;
}

// A passing single observation does not accept a capture. The caller must also prove
// exact sheet/header/range/projection completeness and equal native-cell digests.
function validateFreshnessSequence(observations, captures, attempt) {
  const errors = [];
  if (![2, 3].includes(attempt)) errors.push('attempt_outside_remaining_authority');
  if (!Array.isArray(observations) || observations.length !== 4 || !Array.isArray(captures) || captures.length !== 2)
    return [...errors, 'four_observations_and_two_captures_required'];
  const first = observations[0]?.result;
  for (const o of observations) {
    const r = o?.result;
    if (!r || r.status !== 'PASS' || !validTime(r.fileModifiedTime) || !validTime(r.currentRevisionModifiedTime) ||
        typeof r.currentRevisionId !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(r.currentRevisionId) ||
        r.currentRevisionRecordMatches !== 1 || !Number.isInteger(r.returnedRevisionCount) || r.returnedRevisionCount < 1 || r.returnedRevisionCount >= 1000 ||
        r.editorIdentityRetained !== false) errors.push('invalid_freshness_observation');
    for (const key of ['fileId', 'currentRevisionId', 'currentRevisionModifiedTime', 'fileModifiedTime'])
      if (r?.[key] !== first?.[key]) errors.push('unstable_' + key);
  }
  if (first?.fileId !== '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4') errors.push('wrong_workbook');
  const order = [observations[0], captures[0], observations[1], observations[2], captures[1], observations[3]];
  let end = -Infinity;
  for (const item of order) {
    if (!validTime(item?.startedAt) || !validTime(item?.completedAt) || Date.parse(item.startedAt) < end || Date.parse(item.completedAt) < Date.parse(item.startedAt))
      errors.push('unproven_capture_observation_order');
    end = Date.parse(item?.completedAt);
  }
  for (const c of captures)
    if (c?.range !== "'Master Database'!A1:O417" || c?.sheetId !== 0 || c?.complete !== true || !/^[a-f0-9]{64}$/.test(c?.sha256 || '') ||
        c?.cellFields !== 'userEnteredValue,effectiveValue,formattedValue,hyperlink,textFormatRuns(startIndex,format(link)),userEnteredFormat(numberFormat),effectiveFormat(numberFormat)')
      errors.push('invalid_complete_bounded_capture');
  if (captures[0]?.sha256 !== captures[1]?.sha256) errors.push('unequal_capture_digests');
  return [...new Set(errors)];
}

module.exports = { sanitizeRevisionObservation, validateFreshnessSequence };
