# Implementation evidence and limits

The clean matching handoff was verified before creating this packet. The prospective
policy was committed at40c91ff and independently reviewed PASS before implementation.
No source requests, raw trace/provider-body inspection, native/workbook access or
old acquisition execution occurred. Existing dependencies were reused; no install.

The new journal serializes every validation and append with a process lock. Exclusive
0444 event files and exclusive receipts are fsynced along with each containing
directory before return. Reserve/result are separate durable events. A crash between
event and receipt permanently blocks audit; there is no truncation/recovery API.
Unanswered intents and unknown results remain spent and occupy host/global slots.
A fixed synthetic_call writes its result before returning; no live callback is exposed.
All real397 target bindings are held. Native metadata and content remain separately
reserved historical calls, with no live native pathway added.

External receipt pinning detects rollback against that receipt. A caller that loses
all receipts cannot prove absence of a removed complete suffix. A hostile administrator
can remove both files or change lock paths; this is not tamper-proof storage. Hardware
power-loss durability is not empirically established by process-kill/fsync tests. These
limits prohibit claiming this harness alone makes any real acquisition safe.

Early author checks: the first reconciliation assertion detected five saved host
representations (original null versus triage empty string at orders52/71/152/186/201).
Both exact representations now remain explicit and all five are held. No historical
bytes were repaired or normalized. The first27-test run had one fixture permission
error when deliberately tampering with its new read-only anchor. The test now changes
only the fictional fixture permission before the adversarial mutation. Subsequent
synthetic matrix passed; final lossless logs are in validation.json. Shared Git index
permissions required a permitted local commit retry; no published history changed.

Metadata subtraction independently reproduces72 theoretical expanded targets after
recorded controller frontiers, but the original audit expressly lacks complete dispatch
visibility. Exact never-dispatched proof is NOT ESTABLISHED. Zero targets are cleared.
All397 prior outcome/field/input/owner/trigger/action bindings are hash/pointer-bound;
all272 quarantines and125 other holds remain. 68 is conservative explicit calls,
never exact acquisition attempts or underlying HTTP. Original source execution FAIL,
prior privacy incident/ten-excerpt purge, unknown external-provider erasure and hash-only
native/completeness limits stay authoritative. No current fact/identity claim follows.

Original open-items and14 gate bindings are copied byte-for-byte and verified against
their historical source. Build/fresh-main-target, safety/privacy/native completeness,
human review including Kelsey/Jaycee limits, custody/preservation/recovery/permission,
student/publication, M1/SD5 and reserved effects stay open at original triggers.

The first frozen candidate964f5ff was independently rejected for H1: mutating APIs
allowed omitted external head pins. Its exact manifest and FAIL review are preserved
in rejected-candidate-001, and its Git tree is immutable. Author remediation requires
a valid current external receipt for reserve/result/synthetic_call; fixed synthetic_call
passes its durable reservation head to its immediate result.35tests now pass, including
missing/None/malformed/stale pins and restart after a complete two-file suffix loss.
Caller-held receipt trust and persistence outside the event store remain prerequisites;
read-only unpinned audit is observational, never replacement authority. A lost/stale
receipt blocks writes, including a result that loses a concurrency race. No reset,
head refresh/recovery or dispatch integration is added. No source was contacted.
