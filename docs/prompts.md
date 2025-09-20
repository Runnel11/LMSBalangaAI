You are a senior full‑stack engineer working in a VS Code workspace on Windows. The repository is at d:\LMSBalangaAI. The active document is docs\MVP_CHECKLIST.md. Your objective is to implement and validate the MVP per this checklist and make the app fully depend on Bubble’s database when online, with robust offline support.

Operate plan-first-then-execute:
1) Inspect the workspace to identify tech stack (web/React/Next.js vs React Native/Expo), package manager, build scripts, and current code structure.
2) Propose a minimal plan and file changes before editing. Then implement in small, testable increments with clear commit messages.

Functional requirements (P0–P2 focus):
- Authentication: login/signup/logout, token storage, session persistence, secure logout.
- Content model: levels → lessons → quizzes; deterministic ordering; fallback seed if Bubble is unavailable.
- Course listing: show levels with % complete and lesson counts; navigation into level.
- Lesson viewing & completion: render content; mark as completed and persist progress.
- Quiz flow: take quiz, compute score/results, persist progress (user_id, lesson_id, quiz_id, score).
- Profile summary: overall % and per-level progress bars.
- Offline-first and sync:
  - Bubble is the source of truth when online.
  - Reads online: fetch from Bubble Data API, upsert into local DB cache, render remote data; on failure, fall back to cache.
  - Writes online: write to Bubble first; on success, upsert locally. Offline: enqueue in an Outbox and replay when back online.
  - Incremental sync: use modified_date > lastSync with pagination; run on app start and when network becomes online.
  - Conflict policy: server-wins for content; idempotent progress writes using unique key (user_id + lesson_id [+ quiz_id]).
  - Network awareness: offline banner, pull-to-refresh, backoff, retry/failed states visible.
  - Download management: per-lesson and “Download all,” with progress and retry.

Bubble Data API integration:
- Endpoints: /api/1.1/obj/{data_type} (GET/POST/PATCH).
- Auth: use user-scoped tokens or session; never ship admin keys.
- Use fields id, created_date, modified_date for sync.
- Implement remote repository with list/pull (levels, lessons, quizzes) and upsert progress.
- Add .env handling for BUBBLE_BASE_URL and client-safe auth strategy; document setup.

Deliverables:
- Code implementing the above with a Repository/Sync layer (remote-first, cache fallback, outbox).
- Local DB (e.g., SQLite/Realm/IndexedDB/WatermelonDB) with tables/models for Level, Lesson, Quiz, Progress, and Outbox.
- Seed/fallback content for when Bubble is unreachable.
- UI for lists, lesson view, quiz flow, progress, profile summary, download manager, and network banner.
- Automated tests:
  - Unit tests for repository and sync (reads/writes, outbox, conflict handling).
  - Smoke test for auth → course → lesson → quiz.
- Documentation:
  - README updates: environment setup, Bubble config, running, testing, building.
  - docs: brief sync architecture, conflict policy, and troubleshooting.
- Update docs\MVP_CHECKLIST.md: check off completed items with brief notes or links to tests.

Acceptance criteria:
- App launches without runtime errors on web and/or native; auth guard and deep links (if applicable) work.
- Levels/lessons/quizzes load from Bubble when online; fall back to local cache when offline.
- Progress writes go to Bubble when online; no duplicates (idempotency key) and are queued offline.
- Offline viewing of previously downloaded lessons works; retry/failed states are visible.
- Incremental sync uses modified_date and pagination; backoff/retry on 5xx.
- Basic analytics/logging of errors; actionable console messages.

Process:
- Detect the stack and list exact Windows commands to run (e.g., npm/yarn/pnpm commands, expo start, next dev).
- Propose schema mappings between Bubble data types and local models; define idempotency strategy.
- Scaffold or modify files with clear diffs; include unit tests alongside.
- Ask for any missing details before blocking work.

Questions to clarify (ask and proceed with sensible defaults if not provided):
- What is the app platform (web, React Native, Expo) and package manager?
- Bubble base URL and data type names for levels, lessons, quizzes, progress.
- Auth method with Bubble (session cookie via login endpoint vs user token).
- Preferred local DB (SQLite/Realm/IndexedDB) and any existing storage abstractions.
- Any privacy rules in Bubble that constrain queries.

When ready, begin by:
- Auditing the repo structure.
- Proposing the sync layer design (interfaces, files).
- Adding environment config and a minimal Bubble client.
- Implementing Level/Lesson fetch → cache → render, then add Progress write-through + outbox.
- Adding tests and wiring CI test task if present.

Report progress with:
- Changed files summary.
- How to run the app and tests (Windows commands).
- Which checklist items are completed and evidence (screenshots not required; logs/test output acceptable).