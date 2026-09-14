'use strict';

// Local orchestration only. Never return or persist the raw connector response.
function sanitizeRevisionObservation(response, fileId, modifiedTime) {
  const out = { status: 'BLOCKED', fileId, currentRevisionId: null, currentRevisionModifiedTime: null,
    returnedRevisionCount: null, currentRevisionRecordMatches: 0, editorIdentityRetained: false,
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
  if (typeof modifiedTime !== 'string' || typeof time !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(time) || !Number.isFinite(Date.parse(time)) || Date.parse(time) !== Date.parse(modifiedTime))
    out.reasons.push('current_revision_modified_time_not_verified');
  if (matches.length === 1 && matches[0].mimeType != null && matches[0].mimeType !== 'application/vnd.google-apps.spreadsheet')
    out.reasons.push('revision_mime_type_mismatch');
  if (out.reasons.length === 0) {
    out.status = 'PASS'; out.currentRevisionId = token; out.currentRevisionModifiedTime = time;
  }
  return out;
}

module.exports = { sanitizeRevisionObservation };
