# LMS MVP Checklist

This is a living checklist of the core features and quality gates for the LMS app, prioritized from MVP-critical to nice-to-have.

## P0 — Critical stability and startup

- App boot & routing stability
  - [ ] App launches without runtime errors on web and native
  - [ ] Tabs render behind auth guard; unauthenticated users redirected to /auth/login
  - [ ] Deep links for course/lesson/quiz open the right screens
- Error boundary & crash visibility
  - [ ] Global error UI with recovery action (Back to Home)
  - [ ] Console/logs include actionable messages

## P1 — Core learning flow (MVP)

- Authentication
  - [ ] Login/signup/logout flows
  - [ ] Token stored securely; session persists; logout clears
- Content model (levels → lessons → quizzes)
  - [ ] DB initialized with levels/lessons/quizzes; deterministic order
  - [ ] Fallback seed if Bubble sync unavailable
- Course listing with progress
  - [ ] Home shows levels with % and lesson counts
  - [ ] Tap navigates to a level
- Lesson viewing & completion
  - [ ] Lesson content renders
  - [ ] Mark as completed stores progress
- Quiz flow and scoring
  - [ ] Take quiz, see score/results
  - [ ] Save progress (lesson_id, quiz_id, score)
- Profile summary
  - [ ] Overall % and per-level bars reflect stored progress

## P2 — Offline-first and sync

- Download management
  - [ ] Per-lesson download and "Download all" with progress
  - [ ] Retry/failed states are visible
- Offline viewing
  - [ ] Lessons open without network; is_downloaded state correct
- Network awareness
  - [ ] Offline banner; pull-to-refresh; backoff
- Bubble sync
  - [ ] Pull levels/lessons/quizzes
  - [ ] Push user progress; no duplicates

## P3 — Engagement and depth

- Certificates
  - [ ] Level 100% grants a certificate; count shown
- Jobs board
  - [ ] Filtered by user level; CTA for apply or blocked state
- Community (read-only)
  - [ ] List and view posts; empty/error states
- Settings
  - [ ] Account info; notification preference placeholder; theme toggle optional

## P4 — Quality, polish, and scale

- Accessibility (a11y)
  - [ ] Labels/roles on buttons and progress bars; color contrast; keyboard nav on web
- Theming/UI consistency
  - [ ] Harmonized colors/typography; dark mode pass
- Analytics/diagnostics
  - [ ] Basic screen events; error reporting
- Automated tests
  - [ ] Unit tests for DB/services; smoke test for auth→course→lesson→quiz
- Performance
  - [ ] Smooth lists; avoid heavy assets; tree-shake unused modules
