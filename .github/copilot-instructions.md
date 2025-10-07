## Copilot / AI Agent instructions for this repository

Purpose: Help an automated coding assistant be immediately productive in this Expo + React Native codebase.

- Quick start (most common dev flows)
  - Install: `npm install`
  - Start Metro / dev server: `npm run start` (runs `expo start`) — open device/emulator from the Metro UI.
  - Run Android emulator / device: `npm run android` (runs `expo run:android`). The native gradle wrapper is in `android/`.
  - Run iOS simulator (mac only): `npm run ios` (runs `expo run:ios`).
  - Run web: `npm run web` (runs `expo start --web`).
  - Reset starter project: `npm run reset-project` (script: `scripts/reset-project.js`) — this moves starter code to `app-example` and creates a fresh `app/`.

- High-level architecture (what to know)
  - This is an Expo router (file-based routing) app. The App routes live in the `app/` directory. Look for dynamic routes like `app/lesson/[lessonId].tsx`, `app/course/[levelId].tsx`, and `app/community/[postId].tsx`.
  - `expo-router` is configured via `package.json` (`main: "expo-router/entry"`) and `app.json` experiments (typedRoutes enabled).
  - UI components are under `components/` (reusable components in `components/ui`) and additional UI/helpers live under `src/components/ui` and `src/utils` (e.g. `src/utils/logger.ts`).
  - Platform assets are in `assets/images` with platform subfolders `assets/images/android` and `assets/images/ios` for native icons.

- Data / backend integration patterns
  - Primary static/test data files live in `bubble_data/` and are formatted for Bubble.io CSV imports (see `bubble_data/README.md`).
  - There are convenience test scripts for backend/API checks: `test_bubble_endpoints.js`, `test_app_startup_simulation.js`, `test_initial_loading*.js`, and `test-login-errors.js`. Run them with `node <script>`.
  - EAS config is in `eas.json` and `app.json` includes `extra.eas.projectId` — CI or release builds may use EAS (Expo Application Services).

- Important conventions & patterns to follow
  - File-based routing: add pages under `app/`. Dynamic segments use bracket notation (`[id].tsx`). Keep route UI and data-loading code together.
  - Themed components: small wrappers like `components/themed-text.tsx` and `components/themed-view.tsx` are used across the app — reuse them for color / theme consistency.
  - Shared UI in `components/ui/*` and `src/components/ui/*` — follow existing API shapes (e.g. `collapsible.tsx`, `icon-symbol.tsx`).
  - Data is often passed as JSON fields (see `quizzes.csv` in `bubble_data/` where `questions` is escaped JSON). Code that parses or renders quiz data should expect JSON strings or arrays depending on which CSV set was used.
  - Small utility scripts live in `scripts/` (image generation, reset, quiz utilities). Prefer adding non-runtime helpers there.

- Debugging notes & gotchas
  - If editing native code or grabbing a fresh Android emulator, run `npm run android` which uses `android/gradlew` under the hood.
  - Expo Reanimated and gesture-handler are present — follow their usual installation patterns (native rebuild if adding or changing Reanimated config).
  - Metro/Expo caching: when hot-reload behaves oddly, restart `expo start` or clear Metro cache via the Metro UI (or `expo start -c`).

- Files and places to inspect for context/examples
  - Routing & pages: `app/` (e.g. `app/course/[levelId].tsx`, `app/lesson/[lessonId].tsx`, `app/(tabs)/index.tsx`)
  - Reusable UI: `components/` and `src/components/ui/` (e.g. `components/ui/collapsible.tsx`)
  - Data payloads: `bubble_data/*` (CSV sets and `bubble_data/README.md` explain import formats)
  - Dev scripts & tests: `scripts/` and `test_*.js` at repo root
  - Build configs: `package.json`, `app.json`, `eas.json`, `android/` folder for native gradle

- What you should not change without a human check
  - `app.json` and `eas.json` (project identifiers, icons, and build settings) — changes may affect CI/EAS.
  - `package.json` scripts that integrate with Expo tooling unless adding new helper commands.

If any of these sections are unclear or you want more detail for a specific workflow (EAS builds, Bubble API calls, or where to add unit tests), tell me which area to expand and I'll iterate.
