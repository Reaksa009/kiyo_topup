# Active context

**Current focus** (one short paragraph): Phase 2H production readiness and deployment hardening.

**In progress**:

- [x] Audit server/frontend environment boundaries and remove credential editing from Settings UI/API.
- [x] Add safe health probes, environment-isolation validation, credential/log/index dry-run tooling, and deployment runbook.
- [x] Run final security regression, full verification, and read-only index preflight.
- [x] Run full verification.

**Decisions (recent)**:

- G2Bulk contract behavior remains unchanged pending official documentation.
- Fallback catalogue remains display-only; checkout requires an authoritative MongoDB package.
- Provider game IDs are not inferred from legacy slugs; they remain unset until verified provider data is available.
- No official G2Bulk endpoint, auth, response, status, currency, or price-unit documentation is stored in the repository.
- Price-review activation requires a verified server-side observed provider cost; Phase 2D makes no provider calls.
- Existing banner `imageUrl`, `linkUrl`, `active`, and `position` records remain supported; new responsive fields are additive.
- Provider sync remains documentation-gated and must not be enabled in production yet.

**Open questions**:

- Existing Settings secrets remain unencrypted at rest; migrate operational credentials to Vercel environment variables or an external secret manager in a later phase.

_Update when the task or branch focus changes._
