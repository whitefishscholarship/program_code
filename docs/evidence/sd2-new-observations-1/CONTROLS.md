# Actual campaign request controls

Policy review accepted6c15e35 before adapter implementation; policy-review.json retains
its exact independent zero-finding decision. adapter.py and entry.py are the actual
request integration. There is no source CLI and importing either file makes no request.
The only source gateway is Campaign.run_next(expected_head). Never invoke _request
outside it. No source requests or real journal provisioning occurred in enabling stage.

Existing journal.py is unchanged. The adapter reuses its canonical encode/read,
exclusive fsync/no-replace primitives, lock and _append protocol. It does not subclass
or unlock synthetic eligibility, reset/import an old store, or run old synthetic tests.
Exclusive new campaign provisioning is allowed only after actual delivered-policy and
final independent-control review gates. A separate sibling custody directory anchors
each intent before dispatch, and each sanitized result before the next cursor advance.
Both local and independent receipt sequences must match exact event hashes. Current
external head, one active intent,100total and ordered target are checked under lock.
Missing/cancelled/error responses consume the target and keep its slot occupied;
no subsequent request is possible. No repair API exists. A new timestamp alone cannot
clear anything. Deletion/partial event/custody loss or stale head fails closed.

Each request first verifies exact scope/control hashes, historical saved-affinity
receipt hashes, current metadata freshness<=15minutes, direct-child canonical final
attestation, final review actual liveControls PASS, delivered main ancestry and freshly
authenticated exact main/project/Production revision. entry.py only produces bounded
metadata receipts using existing configured Git SSH and Whitefish Vercel CLI identity;
it neither reads credentials nor invokes vercel curl or a protection bypass. Existing
VERCEL_TOKEN ambient override is excluded. No new account grant/config/CI effects.
If provider/main is newer than receipt, refresh metadata only and preserve old receipt.

Transport sd2.public-program-https-v1 uses one HTTPS GET, DNS public-address validation,
a numeric pinned connection with original-host TLS verification, no proxy/cookie/auth,
redirect handling, retries or child fetch. Non-HTML/status/content-encoding/oversize
responses are held without secondary reads. Saved unsafe/insufficient affinity or
native/form/login/recipient/biographical locators skip before request. Response body
stays transient in process memory; no body/error prose reaches prompts/logs/receipts.
Only a minimumGPA scalar0..4 with one unambiguous matched minimum and one saved input
can be proposed. All other selected fields remain explicitly held-unknown. Every value
is proposed-quarantined, with target/time/body hash and exact field binding; none proves
award/cycle identity, eligibility completeness, source silence or factual acceptance.
There are no free-text evidence clauses in this conservative first projection.

Integration tests patch only the transport/gates inside test-owned temporary stores;
real source/provider requests are never used to test controls. Tests cover actual
adapter dispatch ordering/callback loss/interrupt/restart/no retry/stale head/custody
failure and deletion/cap100, output privacy/ambiguity, redirect and private DNS refusal,
original saved-affinity binding and real pre-attestation gate refusal. The original
completed synthetic suite is not replayed. Scope remains100targets/185saved inputs/
853field occurrences816unique; unsupported fields are never dropped.

Final independent review must inspect actual code and tests, not trust this narrative.
Its canonical check liveControls must equal PASS to permit later run_next. Effective
activation is derived from attestation+delivery+current gates; BUILD_STATE stays blocked.

Independent actual-control review001 rejected two high findings; the exact rejected
record is retained. Remediation pins one absolute store and one absolute custody path,
claims refs/sd2-campaign/SD2-NEW-OBSERVATIONS-1 atomically once across all repository
worktrees before provisioning, and anchors the current event sequence/hash in a second
shared Git ref. Every event/custody write must complete an exact old-object CAS update
of that external cursor before source dispatch or cursor advance. Its reflog preserves
append history. Both store/custody snapshot rollback, deletion, alternate roots, loss
or mismatch of the external current cursor fail closed. There is no delete/reset/ref
reclaim API. The only refs created are these local campaign custody refs in the later
research stage, with no push/deployment effect; the M1 monitoring state ref stays off.
No real campaign refs or stores have been created during this enabling stage.

Durability hardening also sets command-only Git core.fsync=loose-object,reference and
core.fsyncMethod=fsync, then explicitly fsyncs loose objects, ref/reflog files and all
ancestor directories. Failure stops before dispatch.17integration tests pass; no host
power-cut simulation is claimed. Independent review002 diagnostic limitation is in
remediation.json; final exact review003 is the authoritative actual-control review.
