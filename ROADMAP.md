# Personal Fork Roadmap

This is the execution plan for converting the upstream Bluesky `social-app` into a personal-use, web-only client. Four streams, executed in this canonical order:

- **Stream 1 — Project & infra cleanup.** Auxiliary projects, tests, husky. Pure deletions; no semantic changes.
- **Stream 2 — Feature & subsystem removals.** GrowthBook → constants, Age Assurance, geolocation/regional moderation, contacts, live-events/app-config workers, interrupt overlays, analytics, storage rewrite, residual cleanup, codemod sweep, English-only catalog. Largest stream.
- **Stream 3 — Reanimated removal.** Replace `react-native-reanimated` preset animations and value-driven worklets with CSS / Web Animations API. Also retires `react-native-gesture-handler` and `react-native-keyboard-controller` (which imports Reanimated at module load and must go first via a web shim). Removes the largest "native-shaped" dep from the web bundle.
- **Stream 4 — Build & platform de-mobilization.** Remove Sentry, strip Expo + native packages, in-house the remaining `@bsky.app/*` packages (minimal — public import surfaces stay stable; redesigns deferred), collapse platform branches, and finally migrate webpack → rsbuild.

**Appendix A** captures a longer-horizon migration off `react-native-web` and a full ALF redesign. That work is **explicitly deferred** — it is not on the immediate execution path.

## Why this ordering

- **Stream 1 first.** Auxiliary subprojects and test/husky infrastructure are independent of everything else and shrink the repo immediately. Pure deletions, no semantic risk.
- **Stream 2 before Stream 3.** Deleting analytics/geolocation/AA/contacts/overlays removes ~150 source callsites and a handful of `EXPO_PUBLIC_*` env vars. Some of those files contain Reanimated usage that Stream 3 would otherwise have to migrate before deleting.
- **Storage rewrite (2.8) and codemod sweep (2.10) live LATE in Stream 2 by design.** The earlier draft had them as Stream 1 (Phases 1.3 / 1.4), but both run into a churn problem: rewriting storage adapters or running a Lingui v5 codemod across ~390 files only to delete a large fraction of those files in Phases 2.1-2.7 wastes work. Running the storage rewrite AFTER GrowthBook / AA / analytics importers are deleted means fewer importers to port; running the codemod AFTER Stream 2 UI deletions means fewer files to mod. Both phases stay before Phase 2.11's English-only catalog refresh, which is the closing sweep.
- **Stream 3 before Stream 4.** Stream 4's Expo strip and rsbuild migration are simpler once Reanimated is out: no Reanimated Babel plugin in the rsbuild config, the `expo-blur` / `expo-linear-gradient` shims don't need `Animated.createAnimatedComponent` compatibility, and `react-native-gesture-handler` (which is intertwined with Reanimated and only reaches web via Reanimated-wrapping components) goes with Reanimated. `react-native-keyboard-controller` imports Reanimated at module load and must be replaced with a web shim *before* the dep removal — that's now its own Phase 3.1.
- **Within Stream 4: Sentry first, Expo strip second.** Sentry removal is independent and smaller; clearing webpack/app-root/logging noise first reduces complexity going into the high-risk shim work.
- **Within Stream 4: platform-source collapse before native-project cleanup.** Phase 4.5 deletes `.native.tsx` / `.ios.tsx` / `.android.tsx` source files (and VideoFeed, `expo-video`, `@bsky.app/video`) — that's what makes the typecheck-tied dep removals safe. Phase 4.6 then drops `ios/`, `android/`, `modules/`, and native scripts. Build configs (`app.config.js`, `babel.config.js`, `webpack.config.js`) stay until Phase 4.7 because `expo export:web` still reads them.
- **Stream 4 reorders the build migration to the END of the stream.** The original plan was "introduce rsbuild side-by-side first, strip Expo against rsbuild." That created two problems: rsbuild had to know about `.web.*` extension ordering, `@bsky.app/*` exemptions, and dozens of Expo-package edge cases that would be deleted shortly anyway. The better path is to do the Expo strip / Sentry removal / `@bsky.app/*` in-housing / native cleanup / platform-branch collapse **on the existing webpack build** (`@expo/webpack-config` doesn't depend on individual `expo-*` runtime packages being installed — it provides the schema), and only at the end swap webpack → rsbuild. At that point all `.web.*` siblings have been renamed to `.tsx`, native files are deleted, gesture-handler is gone, the `@bsky.app/*` packages are in-housed, and rsbuild's defaults are sufficient.

## Conventions

- Each phase starts with motivation, ends with a verifiable "done when".
- Where a phase suggests grep commands, run them — they are the verification mechanism. **Add `--glob '!ROADMAP.md'`** to verification greps so this document doesn't show up as a stale source reference forever.
- `rg` is preferred over `grep`; `--glob '!locale/**' --glob '!**/*.po'` is used throughout to skip Lingui catalog files that retain stale source references.
- **Treat call-site lists as live inventories, not absolute claims.** Statements like "only X uses this" or "the importers are A, B, C" reflect the fork state at the time the phase was written. Re-run the relevant grep at execution time and work from that result — the codebase may have drifted.
- **Verification gate per phase — match depth to risk.** Phases that remove packages, edit build config (`app.config.js`, `babel.config.js`, `webpack.config.js`, `rsbuild.config.ts`, `tsconfig*.json`'s `paths`), or rename/delete assets must end with `yarn build-web` — `yarn typecheck` alone misses Expo plugin / `expo export:web` / asset / module-resolution failures. For phases that only touch source code (no dep removals, no build-config edits), `yarn lint && yarn typecheck` is enough to gate the commit; skip the full build to keep iteration fast. When in doubt, run the full build.
- Work directly on `main`. Each phase lands as its own commit — no feature branches, no PRs. Some phases are big enough that they should be split into multiple atomic commits during execution (Phase 2.7 analytics → quarantine / utility moves / call-site deletion; Phase 4.3 Expo strip → per-package shim batches; Phase 3.2 / 3.3 → per-visual-batch). Keep `yarn build-web` green at every commit — Phase 1.1 wires `yarn typecheck` into that script, so green build implies green types.
- **Scratch inventory files** (`.inventory-*.txt` etc.) are written to repo root by several phases. Add `.inventory-*` to your local `.git/info/exclude` before generating, or write them under a clearly-ignored path — they are not part of the commit.
- **Stay 1:1 with upstream where you can.** The goal of this roadmap is *removal*, not redesign. Files we keep should match upstream `bluesky-social/social-app` as closely as possible — minus native concerns, deleted features, and the build-tool swap. The cherry-pick queue exists precisely so bug fixes and improvements can flow from upstream over time; every gratuitous divergence is friction on that pipeline. Big redesigns (Tailwind / DOM primitives / RNW removal) live in Appendix A and only run after Streams 1-4 stabilize.
- **Stay in scope.** Each phase has a defined target — apply only the edits that target requires. If you notice something else that looks wrong (a component that "should" use a different abstraction, an inconsistent prop name, a missing memo, a helper that could be tidier), leave it alone. Drive-by refactors balloon diffs, collide with later phases (which may delete the file you "improved"), and turn a reviewable commit into one that has to be unpicked. Note the observation in the commit message or as a follow-up bullet in the relevant phase; don't act on it.
- **Mechanical mass-refactors: reach for a codemod.** Several phases in this roadmap are explicit codemod targets: Phase 2.1c (gate→constant), Phase 2.6a (wrapper unwind), Phase 2.7c (analytics callsites), Phase 2.10 (Lingui v5), Phase 3.2 (preset animations), and especially **Phase 4.5 (platform-constant collapse — ~600 callsites in 178 files)**. When a change is the same edit repeated across dozens of files, write a jscodeshift script instead of hand-editing. **Be generous about what the codemod handles:** JSX interpolation collapse (`{false && X}` → drop), style array filtering, dep-array literal stripping, dead-branch deletion, unused-import cleanup — bundling these into the same transform is faster than doing them as a manual post-pass. Iterate the transform until the diff looks right, then run.
  - `jscodeshift` isn't a checked-in dev dep — invoke via `npx jscodeshift -t <transform.js> <files> --parser=tsx`. Phase 2.10's existing `.jscodeshift/` directory is precedent: codemods that aren't checked-in dev deps either, run on demand.
  - **Recovery is cheap.** A bad codemod run is `git checkout -- src/` away from reverted. That's the value over hand edits — iterate the transform until the diff looks right, no risk of orphan partial edits.
  - **Commit messages should name the transform.** If a one-shot script ran against more than a handful of files, paste the relevant rules into the commit body so the diff is reviewable. Keep the transform file under `.jscodeshift/` if you want to re-run later; delete if it's truly one-shot.
- **Stubs vs adapters — classify before you write.** Stream 4 introduces two distinct kinds of replacement under `src/shims/...`:
  - **Temporary scaffolds** — no-op providers, pass-through hook wrappers, build-only stubs introduced solely to keep typecheck/build green through a multi-commit phase. These have an explicit retirement plan: inline at every caller, delete once no caller remains, or fold into a real primitive in a later phase. Capture the plan in a header comment (current callers, real replacement, target phase). If a scaffold survives its target phase, that's a bug — re-evaluate.
  - **Promoted local web adapters** — stable web implementations of an API surface the fork keeps long-term. `expo-image` (sized `<img>` + lazy + prefetch + cache no-op + `ImageBackground` + `onLoad` dimensions), `expo-file-system` (IndexedDB / Blob-backed draft storage), `expo-clipboard` / `expo-linking` / `expo-localization` (thin browser-API wrappers) are all in this bucket. These get a stable import path (e.g. `#/components/Image`, `#/lib/clipboard`) and **no** retirement promise — they're the final state, not scaffolding. Don't pretend they're temporary just because the file lives under `shims/`.
- **Typecheck spans all of `src/`, not just web-resolved files.** `tsconfig.check.json` covers the whole source tree. A package can be `yarn remove`d only when every importing file in `src/` is either (a) deleted, (b) aliased to a shim that resolves, or (c) rewritten to not import it — including `.native.tsx` / `.ios.tsx` / `.android.tsx` siblings and files that are bundle-shadowed but still typecheck-visible. "Web-unreachable" is not the same as "removable." This footgun bites Stream 4 most often, but applies anywhere.
- **Dependency-removal invariant — single commit, all of these.** For every `yarn remove <pkg>`:
  - `package.json` + `yarn.lock` updated
  - matching `patches/<pkg>+*.patch` and `.patch.md` deleted
  - `app.config.js` plugin entries removed if present
  - webpack / tsconfig / rsbuild aliases removed if the shim is being retired (or added if shim is replacing it)
  - `babel.config.js` plugin/preset entries removed if relevant
  - `yarn install` re-run, then `yarn build-web` (or `yarn lint && yarn typecheck` per the verification-gate rule)

  Splitting these across commits leaves `patch-package` failing on the next install or aliases pointing at a missing module.

---

# Stream 1 — Project & infra cleanup

Mechanical removals. Two phases. Pure deletions — the storage rewrite and codemod sweep that previously lived here have moved to Stream 2 (Phases 2.8 and 2.10) so they run after the feature deletions retire their importers.

## Phase 1.1 — Delete auxiliary projects

**Motivation:** these are separately deployable products/services not needed for a personal SPA. Removing them up front shrinks the repo and removes a category of build/CI noise.

**Caveat:** `bskyweb` was the Go SSR/static-host daemon that injected dynamic OG meta tags for share-link previews **and** served `index.html` for unknown routes so the SPA could resolve them client-side. For personal use the OG-tag loss is acceptable — shared links will only show the static tags in `web/index.html`. The route-fallback loss is **not** automatic: when deployed statically, app routes like `/profile/...`, `/settings`, `/messages/...` will 404 on direct visit / hard-refresh unless the host rewrites all unknown routes to `/index.html`. Configure that at the static host (`historyApiFallback` already covers `yarn dev` via Phase 4.7's rsbuild config; production deploys need the host-side rule). If you later care about public link previews, add static OG tags to `web/index.html` or build a tiny edge meta-injector. Do **not** resurrect `bskyweb`.

**Checklist:**
- [x] `rm -rf bskyembed bskylink bskyogcard bskyweb .github`
- [x] `rm -f Dockerfile Dockerfile.bskylink Dockerfile.bskyogcard Dockerfile.embedr`
- [x] `rm -f scripts/post-embed-build.js scripts/post-web-build.js`
- [x] In `package.json`: delete `build-embed` script. Edit `build-web` to drop the `&& node ./scripts/post-web-build.js` suffix **and** prepend `yarn typecheck && ` so the build script gates on types (tsgo is fast enough that this doesn't hurt iteration). End state for now: `"build-web": "yarn typecheck && expo export:web"` — the second half gets swapped to `rsbuild build` in Phase 4.7
- [x] In `tsconfig.json`: remove `bskyweb`, `bskyembed` from `exclude` if present
- [x] In `web/index.html`: update/remove the comment referencing `bskyweb/templates/base.html`
- [x] Makefile / lint config still reference the deleted projects:
  ```sh
  rg -l "bskyweb|bskyembed|bskylink|bskyogcard" Makefile eslint.config.mjs
  ```
  - `Makefile`: strip `bskyweb` / `bskyembed` targets (the `deps`, `build-web`, and `build-embed` targets all reach in)
  - `eslint.config.mjs`: remove the ignore entries **and** the active `bskyogcard` Node-module override. The override has rule config attached — it's not a plain ignore
- [x] Delete the "Embed post" dialog and its share-menu entry — keeping it alive means tracking the hosted `embed.bsky.app` script and the upstream `bskyembed` project, which is out of scope for a personal fork. Concretely:
  - `rm src/components/dialogs/Embed.tsx`
  - In `src/components/PostControls/ShareMenu/ShareMenuItems.web.tsx`: drop the `EmbedDialog` import, the `embedPostControl` dialog control, the `canEmbed` flag, the `postDropdownEmbedBtn` `Menu.Item`, and the `<EmbedDialog ... />` render block. The `gtMobile` / `useBreakpoints` import becomes unused once `canEmbed` is gone — drop it too
  - In `src/lib/constants.ts`: remove `EMBED_SERVICE` and `EMBED_SCRIPT` (no other importers once the dialog is gone — re-grep to confirm)
- [x] Source-comment leftovers (not build-breaking but break the "only docs" rule of the final grep): `src/style.css`, `src/components/Loader.web.tsx`, `README.md`, `.gitignore`

**Done when:**
- `rg "bskyweb|bskyembed|bskylink|bskyogcard" --glob '!yarn.lock'` returns only documentation/comment hits, if any
- `yarn install --frozen-lockfile && yarn build-web` succeeds (Phase 1.1 changes the web build script by removing `scripts/post-web-build.js`)

## Phase 1.2 — Remove test, E2E, perf, and husky infrastructure

**Motivation:** explicit goal of the fork — no Jest, Maestro, Flashlight, or Husky.

**Checklist:**
- [x] `rm -rf __tests__ __mocks__ __e2e__ jest .husky dev-env .perf eslint/__tests__` — easy to miss: the top-level `__mocks__/` (contains `@gorhom/bottom-sheet.tsx`, `expo-localization.js`, etc.) and the lint plugin's own `eslint/__tests__/`
- [x] `rm -rf src/screens/E2E` — in-source E2E test screens (`SharedPreferencesTesterScreen` at fork time). These are referenced from `src/Navigation.tsx` import + route registration — drop both. Not under `__e2e__/` because they're test harnesses living inside the route tree
- [x] In-source test files: enumerate and delete. Leaving these red-lights Phase 2.0's `yarn typecheck`/`yarn lint`:
  ```sh
  rg --files -g '**/__tests__/**' -g '**/__mocks__/**' -g '**/*.test.{ts,tsx,js,jsx}' src
  ```
- [x] **Order guard:** remove `package.json`'s `prepare` script **before** removing husky. `prepare: husky install` runs on every `yarn install`; reversing the order breaks installs
- [x] In `package.json`, remove: `prepare`, `test`, `test-watch`, `test-ci`, `test-coverage`, all `e2e:*` / `perf:*` scripts; top-level `jest` block; `lint-staged` block; the dev deps `husky`, `jest`, `jest-expo`, `jest-junit`, `babel-jest`, `@types/jest`, `@testing-library/react-native`, `lint-staged`
- [x] In `tsconfig.json`: drop `"jest"` from `compilerOptions.types`
- [x] `Makefile`: strip the `test` target
- [x] `eslint.config.mjs`: drop the `.husky/**` ignore, the `**/__mocks__/*.ts` ignore, the `@jest/globals` whitelist, and the Jest-globals override block for test files
- [x] Docs/gitignore leftovers (`docs/testing.md`, `.gitignore`'s `.perf/`): delete, or accept as allowed doc hits in the final grep
- [x] **`CLAUDE.md` is agent-facing instruction, not docs.** Edit it to remove the Jest / E2E / Husky / lint-staged guidance so future Claude sessions don't try to use those conventions. Don't just leave it as an "allowed hit" — outdated agent instructions cause executor confusion
- [x] Final grep — should have no active hits:
  ```sh
  rg "jest|maestro|flashlight|husky|lint-staged|__tests__|__e2e__|dev-env" --glob '!locale/**' --glob '!yarn.lock'
  rg "@jest/globals|describe\\(|jest\\." src
  ```
  `yarn.lock` retains transitive Jest deps (Metro, `terser-webpack-plugin` pull `jest-worker`; `react-native` pulls `babel-jest`, etc.). Do **not** hand-edit it

**Done when:**
- `package.json` has no test/E2E/perf/husky scripts
- Negative searches above only find allowed doc hits
- Local gate (no CI exists since 1.1 deleted `.github/`):
  ```sh
  yarn install --frozen-lockfile
  yarn intl:build
  yarn lint
  yarn typecheck
  ```
  passes.


---

# Stream 2 — Feature & subsystem removals

**TL;DR**: phases are numbered in execution order. Collapse feature-gate call sites to constants first; introduce the local `DebugFeedContext` preference before deleting GrowthBook; then remove **Age Assurance → Geolocation+Contacts → live-events/app-config workers → Interrupt overlays → Analytics → Storage rewrite → Residual cleanup → Codemod sweep → English-only catalog refresh**. Do **not** delete definitions first and chase TS errors — that creates interleaved failures across unrelated subsystems.

## Phase 2.0 — Inventory & guardrails

**Motivation:** capture the current coupling before starting so each phase is verifiable independently.

**Checklist:**
- [x] `yarn install`
- [x] `yarn typecheck` (capture baseline status)
- [x] `yarn lint` (capture baseline status)
- [x] Add `.inventory-*` to your local exclude so the scratch files don't show up as tracked:
  ```sh
  echo '.inventory-*.txt' >> .git/info/exclude
  ```
- [x] Save these inventory outputs:
  ```sh
  rg -n "Features\.|features\.enabled|features\.isOn|useFeatureGate|#/analytics/features|GrowthBook|@growthbook" src --glob '!locale/**' --glob '!**/*.po' > .inventory-features.txt
  rg -n "from '#/ageAssurance|from '#/components/ageAssurance|ageAssurance|AgeAssurance|age-assurance" src --glob '!locale/**' --glob '!**/*.po' > .inventory-ageAssurance.txt
  rg -n "from '#/geolocation|geolocationServiceResponse|mergedGeolocation|deviceGeolocation|GEOLOCATION_" src --glob '!locale/**' --glob '!**/*.po' > .inventory-geolocation.txt
  rg -n "from '#/analytics|from '#/analytics/" src --glob '!locale/**' --glob '!**/*.po' > .inventory-analytics.txt
  rg -n "contacts|FindContacts|find-contacts|expo-contacts|expo-sms" src package.json app.config.js --glob '!locale/**' --glob '!**/*.po' > .inventory-contacts.txt
  rg -n "liveEvents|LiveEvent|LIVE_EVENTS|appConfig|AppConfig|APP_CONFIG|app-config|useAppConfig" src .env.example package.json app.config.js --glob '!locale/**' --glob '!**/*.po' > .inventory-workers.txt
  ```

**Footguns:**
- `src/components/ageAssurance/` is **separate** from `src/ageAssurance/` and must be removed too.
- `src/state/session/additional-moderation-authorities.ts` is regional moderation but is **not** under `src/geolocation/`.

## Phase 2.1 — Replace GrowthBook gates with local constants/preferences

**Motivation:** feature flags are the smallest, cleanest seam. Remove dynamic GrowthBook behavior without touching analytics metrics yet.

### 2.1a — Add local debug preference for `DebugFeedContext`

- [x] Create `src/state/preferences/debug.tsx` following the pattern in **`src/state/preferences/trending.tsx`** (NOT `kawaii.tsx`). `trending.tsx` does `Boolean(persisted.get(key))`, which correctly coerces `undefined` from old persisted state to `false`. `persisted.tryParse()` returns the stored object as-is — schema defaults don't backfill missing keys
- [x] Add persisted schema key in `src/state/persisted/schema.ts`:
  ```ts
  debugFeedContextEnabled: z.boolean().optional()
  ```
  with default `false`
- [x] Export hooks `useDebugFeedContextEnabled()` (non-optional boolean return) and `useSetDebugFeedContextEnabled()` from `src/state/preferences/index.tsx`
- [x] Wrap `Provider` with `<DebugPreferencesProvider>`
- [x] Add a UI toggle in the currently-reachable debug screen. At fork time `src/Navigation.tsx` routes the `Debug` route to `StorybookScreen`, not `DebugScreen`; pick whichever screen is actually wired to a navigable entry point. Don't add a toggle to dead code
- [x] Verify: `rg -n "DebugFeedContext|DiscoverDebug|feedContext" src/components src/view src/screens`

### 2.1b — Define static constants for the remaining gates

Create `src/lib/feature-flags.ts` with **explicit constants** (not an enum):

```ts
export const IS_BSKY_TEAM = false
// IMPORTANT: these are *_DISABLED gates — the call sites read them as
// `if (!Disable)` (e.g. `Settings.tsx:211-213` shows contacts only when
// !ImportContactsSettingsDisable; `liveNow/index.tsx:62,75-77` disables when
// the flag is true). Setting them to `true` HARD-DISABLES the features.
// Contacts goes away entirely in Phase 2.4, so hard-disable is correct there.
// Live Now stays — flip the beta gate OFF (i.e. enabled for everyone). The
// upstream allowlist (twitch.tv, stream.place, bluecast.app — `DEFAULT_ALLOWED_DOMAINS`
// in `src/features/liveNow/index.tsx`) is what limits which streaming services
// work; the per-DID `liveNow.allow` / `liveNow.exceptions` overrides come from
// the app-config worker, which Phase 2.5 replaces with empty static defaults.
export const IMPORT_CONTACTS_ONBOARDING_DISABLED = true
export const IMPORT_CONTACTS_SETTINGS_DISABLED = true
export const LIVE_NOW_BETA_DISABLED = false
// The rest are positive gates and should be `true` so the features stay on
// (this matches upstream production behavior with GrowthBook returning true):
export const IMAGE_UPLOADS_HIGH_RESOLUTION = true
export const IMAGE_UPLOADS_BLOB_SIZE_2MB_ENABLED = true
export const GROUP_CHATS_ENABLED = true
export const GROUP_CHATS_HAS_BEEN_RELEASED = true
export const DMS_NEW_MESSAGE_COMPOSER_ENABLED = true
export const COMPOSER_LANGUAGE_DETECTION_ENABLED = true
export const POST_GALLERY_EMBED_ENABLED = true
```

Do **not** include `AATest`. Verify each default value matches the upstream production behavior — read the call site for each gate and confirm whether you want the feature on or off.

### 2.1c — Migrate every gate call site

Enumerate:
```sh
rg -n "features\.enabled|features\.isOn|Features\.|AATest|DebugFeedContext" src --glob '!locale/**' --glob '!**/*.po'
```

**Most callsites are mechanical and codemod-able.** Write a small jscodeshift transform that maps `ax.features.enabled(ax.features.GroupChats)` / `features.isOn(Features.GroupChats)` etc. to the matching constant from `#/lib/feature-flags`. The full mapping:

| Source pattern | Target |
|---|---|
| `ax.features.enabled(ax.features.GroupChats)` | `GROUP_CHATS_ENABLED` |
| `ax.features.enabled(ax.features.GroupChatsHasBeenReleased)` | `GROUP_CHATS_HAS_BEEN_RELEASED` |
| `ax.features.enabled(ax.features.NewMessageComposer)` | `DMS_NEW_MESSAGE_COMPOSER_ENABLED` |
| `ax.features.enabled(ax.features.LiveNowBetaDisable)` | `LIVE_NOW_BETA_DISABLED` |
| `ax.features.enabled(ax.features.ImportContactsOnboardingDisable)` | `IMPORT_CONTACTS_ONBOARDING_DISABLED` |
| `ax.features.enabled(ax.features.ImportContactsSettingsDisable)` | `IMPORT_CONTACTS_SETTINGS_DISABLED` |
| `ax.features.enabled(ax.features.ImageUploadsHighResolution)` | `IMAGE_UPLOADS_HIGH_RESOLUTION` |
| ...and so on for every gate | matching constant |

After the codemod runs, `ax.features` callsites collapse to pure constant reads — Phase 4.5's platform-collapse codemod can then dead-eliminate any resulting `if (true) {...}` / `if (false) {...}` branches if you want a one-pass cleanup. Run the codemod, then handle the non-obvious cases manually:

- [x] `src/Navigation.tsx` — delete the `AATest` route registration entirely (not just the gate read)
- [x] `src/components/images/Gallery/maybeApplyGalleryOffsetStyles.ts` — imports `#/analytics/features` directly, bypassing React context. Replace with a **static import** of the constants in `#/lib/feature-flags`. Don't introduce `useAnalytics()` or a hook here
- [x] `src/components/dialogs/nuxs/utils.ts` — has type-level coupling through `AnalyticsContextType['features']`. Drop the `features` param from `EnabledCheckProps` entirely
- [x] `src/components/dialogs/nuxs/index.tsx` — currently keeps `const ax = useAnalytics()` only to thread `features: ax.features` into the NUX `enabledCheck` (and uses it as an effect dep). Once `EnabledCheckProps.features` is gone, remove `useAnalytics` here too
- [x] `src/screens/Signup/state.ts` — holds extra `AnalyticsContextType` references

**Footgun:** feature names ending in `Disable` invert the boolean — read each conditional carefully.

**Done when:**
```sh
# Primary done grep (catches runtime calls):
rg -n "features\.enabled|features\.isOn|Features\.|#/analytics/features|GrowthBook|@growthbook|AATest" src --glob '!locale/**' --glob '!**/*.po'
# Extra grep for type-level coupling not caught above:
rg -n "AnalyticsContextType\['features'\]|features: ax\.features|props\.features" src/components/dialogs/nuxs src
# Gate (catches breakage early, separate from Phase 2.2):
yarn typecheck
yarn lint
```
all should be clean.

## Phase 2.2 — Delete GrowthBook (analytics kept alive temporarily)

**Motivation:** remove the remote feature-flag subsystem before the larger analytics removal.

**Checklist:**
- [x] In `src/analytics/index.tsx`, remove: `Features`, `features as feats`, `init`, `refresh`, `setAttributes`, `AnalyticsFeaturesContext`, and the `features` field from `AnalyticsContextType`. **Also relax `useAnalytics()`**: it currently throws when no feature provider is in the tree (`src/analytics/index.tsx:230-237`). After this phase the base `<AnalyticsContext>` is the only wrapper — make `useAnalytics()` return that directly without the feature guard, and delete the stale "must be inside Features provider" comment
- [x] In `src/App.web.tsx` **and** `src/App.native.tsx`: remove imports of `AnalyticsFeaturesContext` and `features`; remove the `<AnalyticsFeaturesContext>` wrapper; replace `await features.init` with no-op readiness. `App.native.tsx` is **not** optional here — `yarn typecheck` still compiles native files and would fail otherwise (`App.native.tsx:74-79,126,155-207`)
- [x] In `src/state/session/agent.ts`: remove `import {features} from '#/analytics'`; remove the `gates = features.refresh(...)` promises from `createAgentAndResume`, `createAgentAndLogin`, `createAgentAndCreateAccount`; remove `gates` from `resolvers`
- [x] `rm -rf src/analytics/features`
- [x] `yarn remove @growthbook/growthbook @growthbook/growthbook-react`
- [x] Remove from `src/env/common.ts` and `.env.example`: `EXPO_PUBLIC_GROWTHBOOK_API_HOST`, `EXPO_PUBLIC_GROWTHBOOK_CLIENT_KEY`, `GROWTHBOOK_API_HOST`, `GROWTHBOOK_CLIENT_KEY`
- [x] `src/analytics/PassiveAnalytics.tsx` imports `#/analytics/features` — delete or stub it now

**Footguns:**
- `AnalyticsContextType` consumers may still expect `features` to exist.
- Session startup currently `await`s GrowthBook for logged-out users; make sure `isReady` still flips.

**Done when:**
```sh
# Source + config (Stream 1 must have already deleted dev-env or include dev-env/yarn.lock here):
rg -n "GrowthBook|growthbook|GROWTHBOOK|AnalyticsFeaturesContext|features\.init|features\.refresh|#/analytics/features" src .env.example src/env/common.ts package.json yarn.lock
yarn typecheck
```
has no relevant source hits (lockfile transitive references from `react-native` / Metro are expected and OK) and passes.

## Phase 2.3 — Remove Age Assurance

**Motivation:** AA is a major geolocation consumer and injects access-blocking UI at the shell root. Removing it first simplifies geolocation deletion.

**Checklist:**
- [x] In `src/App.web.tsx` and `src/App.native.tsx`: remove `prefetchAgeAssuranceConfig`, `AgeAssuranceV2Provider`, `void prefetchAgeAssuranceConfig()`, the `<AgeAssuranceV2Provider>` wrapper
- [x] In `src/view/shell/index.web.tsx` and `src/view/shell/index.tsx`: remove `AgeAssuranceRedirectDialog`, `useAgeAssurance`, `NoAccessScreen`, `RedirectOverlay` imports + uses. **Narrow scope:** only the `aa.state.access === None` branch goes away. Keep the surrounding account-state gates (takedown / deactivated branches at `index.web.tsx:162-180`, `index.tsx:211-247`) — they're independent of AA. The policy-update overlay portal is also mounted in the same files; leave it intact in this phase and let Phase 2.6c remove it as a unit
- [x] Sweep all of `src` (commonly-missed areas: `src/lib`, `src/geolocation`, Messages):
  ```sh
  rg -n "useAgeAssurance|AgeAssurance|ageAssurance" src --glob '!locale/**' --glob '!**/*.po'
  # Also catches hyphenated leftovers in intent strings / query-cache keys:
  rg -n "age-assurance|ageassurance|app\\.bsky\\.ageassurance" src --glob '!locale/**' --glob '!**/*.po'
  ```
  Edit each hit. Most are mechanical import/usage removals; the non-mechanical cases are called out below. Known hyphenated leftovers at fork time: `src/lib/hooks/useIntentHandler.ts` has an `'age-assurance'` intent type/case; `src/ageAssurance/data.tsx` creates `react-query-cache-age-assurance` / `age-assurance-query-client` storage keys (include those in Phase 2.9's storage-key sweep)
- [x] **Session readiness (non-mechanical):** in `src/state/session/index.tsx` and `src/state/session/agent.ts`, resume/login/create-account currently pass `aa` into `agent.prepare({resolvers})`. Remove `prefetchAgeAssuranceData`, `setBirthdateForDid`, `setCreatedAtForDid`, `getAndComputeAgeAssuranceState`, `AgeAssuranceAccess`, and the age-check branch in `restrictChatSettings` — but ensure session still becomes ready without the `aa` field
- [x] **Birthdate stays.** Still needed for account creation (`agent.setPersonalDetails({birthDate})`), settings (`useBirthdateMutation`), and handle availability. Move the generic age helpers AA was using (`MIN_ACCESS_AGE`, `isUnderAge`) out of `src/ageAssurance/` to `src/lib/age.ts`. Delete only the AA patching and the AA-driven chat-restriction policy
- [x] **Signup StepInfo simplification (behavior change, not just import removal).** Signup uses `useAgeAssuranceRegionConfigWithFallback`, `MIN_ACCESS_AGE`, `isUnderAge` for regional minimum-age policy and shows GPS/location correction UI. Replace with a static minimum-age constant in `src/lib/age.ts` and delete the regional-age + device-location UI
- [x] **Cross-imports to fix before `rm`:** `src/geolocation/debug.ts` imports `#/ageAssurance/debug`. `src/state/queries/messages/restrictChatSettings.ts` imports AA cache helpers. `src/state/birthdate.ts` imports AA helpers (simplify; don't delete the birthdate path)
- [x] `rm -rf src/ageAssurance src/components/ageAssurance`

**Footguns / intentional behavior changes:**
- Removing AA changes adult-content visibility for birthdate-restricted accounts (`makeAgeRestrictedModerationPrefs` was clamping moderation prefs). Fine for a personal fork; be aware
- AA also gates **chat-related UI affordances** beyond the shell access overlay. LeftNav / bottom bar / notification badge / message count logic check `aa.flags.chatDisabled` or AA access state. Removing AA re-enables those affordances unconditionally. Intentional for a personal fork — flag the change explicitly in the commit message so future readers don't think it's a regression

**Done when:**
```sh
rg -n "from '#/ageAssurance|from '#/components/ageAssurance|AgeAssurance|ageAssurance" src --glob '!locale/**' --glob '!**/*.po'
# Catches decoupled-but-still-active chat-restriction code (the AA-name greps above won't):
rg -n "restrictChatSettings|allowIncoming: 'none'|chat\.bsky\.actor\.declaration" src --glob '!locale/**' --glob '!**/*.po'
yarn typecheck
```
has no source hits (apart from intentionally retained copy you plan to delete in residual cleanup) and passes.

## Phase 2.4 — Remove geolocation + regional moderation

**Motivation:** with AA gone, the remaining geolocation users are mostly defaults, contact availability, analytics metadata, and regional moderation.

**Decision: contacts are deleted, not retained.** This fork has no use for "find contacts on Bluesky", and removing geolocation makes phone-number entry simpler (locale-default instead of GPS-default). Deleting contacts also removes the `expo-contacts` dep and the SMS invite flow.

**Checklist:**
- [x] **First** decouple analytics. In `src/analytics/index.tsx` + `src/analytics/metadata.ts`, remove `useGeolocationServiceResponse`, the `device.get(['geolocationServiceResponse'])` call, `GeolocationMetadata`, and `countryCode`/`regionCode` logger metadata
- [x] Sweep direct consumers and edit each:
  ```sh
  rg -n "from '#/geolocation|geolocationServiceResponse|mergedGeolocation|deviceGeolocation|GEOLOCATION_" src --glob '!locale/**' --glob '!**/*.po'
  ```
  Most callers are mechanical removals. App startup (`App.web.tsx` + `App.native.tsx` — drop the provider mount and `prefetchGeolocation`), NUX coupling (drop the `geolocation` param from `EnabledCheckProps`), and Storybook (delete or stub the geolocation panel) are obvious from the grep
- [x] **Regional moderation (non-mechanical, behavior change):** `src/state/session/additional-moderation-authorities.ts` currently defaults to **all** regional labelers when no geolocation exists, and treats them as non-configurable. Simply deleting geolocation reads leaves regional labelers permanently enabled. Replace `MODERATION_AUTHORITIES_DIDS` and `configureAdditionalModerationAuthorities()` with a fixed empty list (or a small opt-in list), and clear `isNonConfigurableModerationAuthority()` so leftover entries can be toggled off. **User-visible behavior change:** this disables the previously auto-added country/EU labelers entirely — call it out in the commit message
- [x] **Contacts deletion (full sweep — not just the country allowlist):** `rm -rf src/components/contacts src/screens/Onboarding/StepFindContacts src/screens/Onboarding/StepFindContactsIntro`. Then enumerate remaining callers (`rg "contacts|FindContacts|useContactAllowlist|expo-contacts|expo-sms" src`) and clean each. The non-obvious ones: `src/Navigation.tsx` statically registers the Find Contacts routes even when menu gates are off — delete the route registrations + `CommonNavigatorParams` entries in `routes.ts` + `lib/routes/types.ts`. **`expo-sms` also goes with contacts** — `src/components/contacts/screens/ViewMatches.tsx` is the only importer; it's deleted by the `rm -rf` above. Run `yarn remove expo-contacts expo-sms`
- [x] **`app.config.js` plugin entries** must be removed alongside the packages, otherwise `expo export:web` trips on missing native plugins: remove the `expo-location` entry (~line 418) and the `expo-contacts` entry (~line 420). Re-run `rg "expo-location|expo-contacts|expo-sms" app.config.js` to confirm
- [x] **Locale-default fallbacks:** `src/components/InternationalPhoneCodeSelect.tsx` → locale instead of `useGeolocation()` (likely not needed after contacts deletion); `src/lib/currency.ts` → locale-derived country or fixed `'usd'`
- [x] `src/screens/Signup/StepInfo/index.tsx` → delete the device-location UI (Phase 2.3 already moved age helpers to static `src/lib/age.ts`); then `src/components/dialogs/DeviceLocationRequestDialog.tsx` is unused — delete
- [x] Storage + env keys: `src/storage/schema.ts` (`geolocation`, `geolocationServiceResponse`, `deviceGeolocation`, `mergedGeolocation`), `src/env/common.ts` + `.env.example` (`GEOLOCATION_*_URL`)
- [x] `src/geolocation/device.ts` imports `expo-location` / `expo-modules-core` with **no** `.web.ts` shadow. Finish the sweep first so nothing pulls `#/geolocation`; then `rm -rf src/geolocation` + `yarn remove expo-location` (delete matching patches too)

**Footguns:**
- Regional moderation lives in `additional-moderation-authorities.ts`, not under `src/geolocation/`. The "no geolocation = all regional labelers" default is a real gotcha.
- Phone-code and currency still need deterministic fallbacks — locale-derived or fixed.

**Done when:**
```sh
rg -n "from '#/geolocation|geolocationServiceResponse|mergedGeolocation|deviceGeolocation|GEOLOCATION_|expo-location" src package.json .env.example --glob '!locale/**' --glob '!**/*.po'
yarn typecheck
```
has no source hits.

## Phase 2.5 — Remove `live-events` and `app-config` workers

**Motivation:** upstream `social-app` calls two bsky-team Cloudflare workers — `live-events` (powers the Live Events feed banners) and `app-config` (provides server-side per-DID allowlist overrides for the Live Now beta). Neither is useful in a personal fork: the workers are run by Bluesky for Bluesky and there's no auth-bridge to use them. Live Events is being removed entirely; Live Now stays on (Phase 2.1 enables the beta for the current account) but the allowlist falls back to the hardcoded `DEFAULT_ALLOWED_DOMAINS` in `src/features/liveNow/index.tsx` — no per-DID overrides.

**Scope clarification:**
- **Goes:** `src/features/liveEvents/` (whole directory), `src/state/appConfig.tsx`, env vars `LIVE_EVENTS_*` and `APP_CONFIG_*`
- **Stays:** the `liveNow` feature ("Go Live") — separate from `liveEvents` despite the naming overlap. User explicitly wants the UI to stay even though the beta gate is off

**Checklist:**

- [x] **live-events:**
  - [x] `rm -rf src/features/liveEvents`
  - [x] `src/App.web.tsx` + `src/App.native.tsx`: remove the `liveEvents/context` provider mount
  - [x] `src/components/FeedCard.tsx`: drop `useActiveLiveEventFeedUris` and the live-indicator block (~lines 37, 133, 146)
  - [x] `src/analytics/metrics/types.ts`: delete the `liveEvents:*` metric definitions (the surrounding `src/analytics/` directory dies entirely in Phase 2.7 — this edit just retires the live-events-specific entries early so the analytics sweep is cleaner)
  - [x] `src/env/common.ts` + `.env.example`: remove `LIVE_EVENTS_DEV_URL`, `LIVE_EVENTS_PROD_URL`, `LIVE_EVENTS_URL`
- [x] **app-config:**
  - [x] `rm src/state/appConfig.tsx`
  - [x] `src/App.web.tsx` + `src/App.native.tsx`: remove the `appConfig` provider mount + `prefetchAppConfig` calls
  - [x] `src/features/liveNow/index.tsx`: replace `const {liveNow} = useAppConfig()` with a static `{allow: [], exceptions: []}`. With `LIVE_NOW_BETA_DISABLED = false` from Phase 2.1, the feature IS reachable — the empty `allow` array means no additions to `DEFAULT_ALLOWED_DOMAINS` (twitch / stream.place / bluecast), and empty `exceptions` means no per-DID overrides. Edit `DEFAULT_ALLOWED_DOMAINS` directly if you want to support more streaming services
  - [x] `src/env/common.ts` + `.env.example`: remove `APP_CONFIG_DEV_URL`, `APP_CONFIG_PROD_URL`, `APP_CONFIG_URL`
**Done when:**
```sh
rg -n "liveEvents|LiveEvent|LIVE_EVENTS|appConfig|AppConfig|useAppConfig|APP_CONFIG|app-config" \
   src .env.example package.json app.config.js --glob '!locale/**' --glob '!**/*.po' --glob '!ROADMAP.md'
yarn typecheck && yarn build-web
```
returns nothing (or only `liveNow` hits — intentionally retained) and passes. The expanded grep catches `LiveEvent*` symbol forms and `useAppConfig` — known callers at fork time include `SidebarLiveEventFeedsBanner` (RightNav), `DiscoverFeedLiveEventFeedsAndTrendingBanner` (PostFeed), `ExploreScreenLiveEventFeedsBanner` (Explore), `useActiveLiveEventFeedUris` (FeedCard).

## Phase 2.6 — Remove interrupt overlays and soft-paywall nudges

**Motivation:** three upstream UX patterns interrupt or gate users for compliance / engagement reasons that don't apply to a single-user fork: the email-verification soft-paywall (blocks DMs and posting, hangs a banner across the shell), the birthdate-change cooldown (locks birthdate edits for 48h after a change), and the policy-update overlay (full-screen privacy/terms acknowledgment that blocks every portal-mounted UI). None protect AT Protocol functionality. Removing them deletes one root-shell portal gate, ~12 wrapper-hook callsites, and a category of dialog code.

The three sub-phases are independent — apply in any order, one commit each. Phase 2.11's Lingui catalog refresh later sweeps the orphaned strings.

### 2.6a — Email verification dialogs (keep email update)

**Scope:**
- **Goes:** the soft-paywall around posting/messaging for unverified accounts, the verification-reminder banner, the `bluesky://intent/verify-email` deep-link dialog, and the `EmailVerificationProvider` mounted at the App root.
- **Stays:** the user-initiated email-*update* flow (`Update.tsx` + `useUpdateEmail` + `useRequestEmailUpdate`) and the 2FA-disable flow that piggybacks on `agent.com.atproto.server.updateEmail`. Changing your own email address is unrelated to forced verification.

**Checklist:**
- [x] `rm src/components/dialogs/EmailDialog/screens/Verify.tsx src/components/dialogs/EmailDialog/screens/VerificationReminder.tsx`
- [x] `rm src/components/dialogs/EmailDialog/data/useRequestEmailVerification.ts src/components/dialogs/EmailDialog/data/useConfirmEmail.ts`
- [x] `rm src/components/intents/VerifyEmailIntentDialog.tsx`; in `src/components/intents/IntentDialogs.tsx`, drop the `<VerifyEmailIntentDialog />` mount and its import
- [x] `rm src/state/email-verification.tsx`; remove `<EmailVerificationProvider>` from both `src/App.web.tsx` and `src/App.native.tsx`
- [x] In `src/state/shell/reminders.ts`, delete `shouldRequestEmailConfirmation()` and `snoozeEmailConfirmationPrompt()`. Remove the caller in `src/state/session/agent.ts` (signup path)
- [x] `rm src/lib/hooks/useRequireEmailVerification.tsx`. **Codemod-able sweep — write a jscodeshift transform** that handles the ~11 consumers (`SubscribeProfileButton`, `StarterPackDialog`, `ProfileStarterPacks`, `NewChatDialog`, `MessageProfileButton`, `useOpenComposer`, `ChatList`, `MemberMenu`, `Lists`, `ModerationModlists`, `Profile` — re-grep at execution time). The transform:
  - Delete `const requireEmailVerification = useRequireEmailVerification()`
  - Rewrite `requireEmailVerification(action)` → `action`
  - Rewrite `requireEmailVerification(action, options)` → `action` (drop the options object)
  - Rewrite `requireEmailVerification(() => { body })` → inline the body, or `(() => { body })` if it stays callback-shaped
  - Drop the import line
  
  Enumerate before / verify after:
  ```sh
  rg -n "useRequireEmailVerification|requireEmailVerification" src
  ```
- [x] **Direct `useEmail()` / `needsEmailVerification` consumers — separate sweep.** The DM gating doesn't go through the wrapper; it reads the hook directly. Edit each:
  - `src/screens/Messages/components/MessageInput.tsx` — remove the `useEmail()` import and the `needsEmailVerification` conditional that disables send
  - `src/screens/Messages/components/MessageComposer.tsx` — same pattern
  - `src/screens/Messages/components/RequestButtons.tsx` — gate on accept/decline
  - `src/screens/Messages/Conversation.tsx` — gate on reply
  
  Grep for stragglers: `rg -n "useEmail|needsEmailVerification" src --glob '!locale/**' --glob '!**/*.po'`
- [x] **Settings + nav-level verification UI.** Several screens display a "Verify your email" affordance independent of the wrapper:
  - `src/screens/Settings/AccountSettings.tsx:84-110` renders a "Verify your email" settings row — delete the row
  - `src/screens/Settings/Settings.tsx:404-412` has a DevOptions "unsnooze email reminder" entry that writes `reminders.lastEmailConfirm` — delete
  - `src/Navigation.tsx:1026-1031` opens the `VerificationReminder` screen on launch — delete the dispatch
  - `src/components/dialogs/EmailDialog/screens/Manage2FA/index.tsx:18-35` redirects unverified users to `ScreenID.Verify`. With `Verify` gone, remove the redirect (the 2FA flow should now assume the email is usable as-is)
- [x] In `src/components/dialogs/EmailDialog/types.ts`, drop `ScreenID.Verify` and `ScreenID.VerificationReminder`; in `src/components/dialogs/EmailDialog/index.tsx`, drop the matching `switch` cases (`Update` is the only remaining screen)
- [x] In `src/components/dialogs/EmailDialog/screens/Update.tsx`, drop the post-update `useRequestEmailVerification` chain — once verification is gone, the auto-send-confirm-email-after-update step is dead UI
- [x] Verify:
  ```sh
  rg -n "VerifyEmail|verifyEmail|EmailVerificationProvider|useRequireEmailVerification|useEmail\b|needsEmailVerification|requestEmailConfirmation|confirmEmail\(|ScreenID\.Verify|VerificationReminder" src --glob '!locale/**' --glob '!**/*.po'
  ```
  Should be empty. **Expected to remain:** `requestEmailUpdate` and `updateEmail(...)` (the update flow stays), plus session-state plumbing for `emailConfirmed` (`src/state/session/agent.ts`, `src/state/session/index.tsx`) — that field is harmless server metadata once nothing reads it, no need to chase it out of the session schema.

**Intentional behavior changes** (flag in commit message):
- Unverified accounts can post, reply, DM, subscribe, share starter packs, and open the composer without any nudge.
- The `bluesky://intent/verify-email?code=...` deep link becomes a no-op (its dialog is gone). The intent handler in `src/lib/hooks/useIntentHandler.ts` will need its `verify-email` case removed — sweep it in the same commit.

### 2.6b — Birthdate-change cooldown (keep birthdate setting)

**Scope:**
- **Goes:** the 48-hour cooldown between birthdate edits, the "you recently changed your birthdate, wait a day or two" locked-state dialog branch, and the `birthdateLastUpdatedAt` persisted field.
- **Stays:** birthdate setting itself, `useBirthdateMutation`, `MIN_ACCESS_AGE` / `isUnderAge` helpers (relocated to `src/lib/age.ts` in Phase 2.3), and the signup birthdate plumbing. The cooldown was anti-abuse scaffolding; for a single-user fork it's pure friction.

**Dependency note:** Phase 2.3 already trims the AA-coupled parts of `src/state/birthdate.ts`. This phase deletes the snooze layer that survives 2.3.

**Checklist:**
- [x] In `src/state/birthdate.ts`: delete `BIRTHDATE_DELAY_HOURS`, `snoozeBirthdateUpdateAllowedForDid`, `hasSnoozedBirthdateUpdateForDid`, and `useIsBirthdateUpdateAllowed`. In `useBirthdateMutation`, drop the trailing `snoozeBirthdateUpdateAllowedForDid()` call. If the file is empty after this and the AA edits from 2.3, `rm src/state/birthdate.ts` and move `useBirthdateMutation` to its consumer (or a sibling state file)
- [x] `src/state/session/agent.ts`: drop the `snoozeBirthdateUpdateAllowedForDid()` call on login/account fetch (and the import)
- [x] `src/components/dialogs/BirthDateSettings.tsx`: collapse the conditional — delete the locked-state branch (the "wait a day or two" dialog at ~lines 52-115) and render the editable form unconditionally. Drop the `useIsBirthdateUpdateAllowed` import
- [x] `src/screens/Moderation/index.tsx`: drop the `useIsBirthdateUpdateAllowed` import (Phase 2.3 deletes the `NoAccessScreen` it fed, but the import line may survive)
- [x] `src/storage/schema.ts`: delete `birthdateLastUpdatedAt` from the `Account` type. **Stale persisted blobs are tolerated** — Zod's `.passthrough()` / extra-field handling won't reject them, but the data becomes dead. Acceptable for a personal fork; don't write a migration
- [x] Verify:
  ```sh
  rg -n "useIsBirthdateUpdateAllowed|snoozeBirthdateUpdate|hasSnoozedBirthdateUpdate|BIRTHDATE_DELAY_HOURS|birthdateLastUpdatedAt" src --glob '!locale/**' --glob '!**/*.po'
  ```
  Should be empty.

### 2.6c — Policy-update overlay

**Scope:**
- **Goes:** the full-screen privacy/terms acknowledgment overlay, the portal-blocking gate at the shell root, the NUX-based server sync, and the device-storage completion flag.
- **Stays:** static "view privacy policy" / "view terms" links in Settings / About (those point at `bsky.social/about/support/*`, are plain anchor tags, and are independent of the update mechanism). The fork doesn't operate the PDS — there's no policy to surface to the user.

**Note on Phase 2.3 cross-reference:** Phase 2.3 above instructs leaving the policy-update overlay portal intact. That guidance was scoped to that phase, not a long-term commitment —  2.6c is where it gets removed.

**Checklist:**
- [x] `rm -rf src/components/PolicyUpdateOverlay`
- [x] In `src/App.web.tsx` and `src/App.native.tsx`: remove `<PolicyUpdateOverlayProvider>` and its import
- [x] In `src/view/shell/index.tsx` and `src/view/shell/index.web.tsx`: drop the `usePolicyUpdateContext()` hook, the `policyUpdateState.completed` conditional around `<PortalOutlet />` / `<BottomSheetOutlet />`, and the `<PolicyUpdateOverlayPortalOutlet />` mount. Both outlets render unconditionally afterward
- [x] In `src/view/shell/createNativeStackNavigatorWithAuth.tsx:39,213-214`: drop the `<PolicyUpdateOverlay />` import and render. This file is typecheck-visible even though the web shell doesn't reach it at runtime — leaving it referencing the deleted component breaks typecheck
- [x] In `src/screens/Signup/StepInfo/index.tsx`: drop the `usePreemptivelyCompleteActivePolicyUpdate()` call and its import
- [x] In `src/state/queries/nuxs/definitions.ts`: drop `Nux.PolicyUpdate202508` from the enum (`:19-22`), its arm in the `AppNux` discriminated union (`:52-55`), **and** its entry in `NuxSchemas` (`:82-90`). All three references must go together — leaving any one breaks compile
- [x] In `src/storage/schema.ts`: drop `policyUpdateDebugOverride` and the `[PolicyUpdate202508]` key from the `Device` type
- [x] In `src/screens/Settings/Settings.tsx` (`DevOptions`): drop the policy-update DevOptions controls — the debug-override toggle and the "reset" button that calls `device.set([PolicyUpdate202508], false)` + `agent.bskyAppRemoveNuxs([...])`. Other NUX debug controls stay
- [x] In `src/logger/types.ts`: drop the `PolicyUpdate = 'policy-update'` context entry once `src/components/PolicyUpdateOverlay/logger.ts` is gone
- [x] Verify:
  ```sh
  rg -n "PolicyUpdate|policy-update|policyUpdate|PolicyUpdateOverlay" src --glob '!locale/**' --glob '!**/*.po'
  ```
  Should be empty. Static `<a href="...about/privacy-policy">` markup survives if it lives in Settings/About — that's fine; the camelCase grep won't hit it.

**Footgun:** `Nux.PolicyUpdate202508` is dated. If upstream introduces `PolicyUpdate2026XX` later and the fork re-syncs the `nuxs/definitions.ts` enum, the new ID will reappear under a different name — re-apply this phase to the new ID. Don't try to write the removal in a generic "any PolicyUpdate*" form

**Done when:**
```sh
rg -n "VerifyEmail|verifyEmail|requestEmailConfirmation|useIsBirthdateUpdateAllowed|snoozeBirthdate|PolicyUpdate|policy-update|policyUpdateOverlay" src --glob '!locale/**' --glob '!**/*.po'
yarn typecheck && yarn build-web
```
returns no source hits (locale `.po` strings will be cleaned up by Phase 2.11's catalog refresh) and passes. App boots: no policy overlay, birthdate editable any time, posting/messaging works without a verification banner.

## Phase 2.7 — Quarantine then remove analytics

**Motivation:** analytics has the broadest call surface (~150 importers in `src/` at fork time; the older "~176" figure preceded the AA/geolocation/contacts/liveEvents deletions in Phases 2.3-2.4 and 2.8, which each retire some of those callsites). Re-run `rg -l "useAnalytics|ax\.metric|ax\.logger|#/analytics" src` at execution time for the current count. Do this phase in two passes: first turn analytics into a no-op (2.7a/b), then delete the directory and sweep call-sites (2.7c).

### 2.7a — Quarantine as no-op

- [x] In `src/analytics/index.tsx` and `src/analytics/metrics/index.ts`: make `metric()` a no-op and remove `MetricsClient` usage
- [x] In `src/view/shell/index.web.tsx` and `src/view/shell/index.tsx`: remove `<PassiveAnalytics />`
- [x] Delete/empty `src/analytics/PassiveAnalytics.tsx`
- [x] Remove from `src/env/common.ts` and `.env.example`: `EXPO_PUBLIC_METRICS_API_HOST`, `METRICS_API_HOST`
- [x] **Bitdrift** (observability sibling — only used for metrics-style telemetry; can go now): remove all references and the package
  - `yarn remove @bitdrift/react-native`
  - Remove from `src/env/common.ts` + `.env.example`: `EXPO_PUBLIC_BITDRIFT_API_KEY`
  - Remove `bitdrift` plugin entry from `app.config.js` (~line 291)
  - Remove any `import ... from '@bitdrift/react-native'` from source
  - `rg "@bitdrift|bitdrift|BITDRIFT" src .env.example package.json app.config.js`
- [x] Verify: `rg -n "MetricsClient|events.bsky.app|METRICS_API_HOST|experiment:viewed|feature:viewed|PassiveAnalytics|@bitdrift|bitdrift" src .env.example`

### 2.7b — Move (or delete) retained utilities out of `src/analytics/`

Before deleting the directory, relocate the things that are still useful — and **delete** the things that only existed to support metrics:

- [x] `src/analytics/identifiers/device.ts` (`getDeviceId`) → **rewrite + relocate**. Current file has three functions (`getAndMigrateDeviceId`, `getDeviceId`, `getDeviceIdOrThrow`) wrapped in analytics scaffolding (logger context, AsyncStorage migration from the legacy `STATSIG_LOCAL_STORAGE_STABLE_ID` key, lazy init through the analytics provider). For a personal fork: no legacy data to migrate, no analytics provider to init through. Collapse to a single function in `src/lib/device-id.ts`:
  ```ts
  import {device} from '#/storage'

  export function getDeviceId(): string {
    let id = device.get(['deviceId'])
    if (!id) {
      id = crypto.randomUUID()
      device.set(['deviceId'], id)
    }
    return id
  }
  ```
  Retarget the three callers (`AboutSettings.tsx`, `drafts/state/api.ts`, `drafts/state/queries.ts`) to `#/lib/device-id`. Drop the `?? 'N/A'` / `?? 'unknown'` fallbacks at call sites — the new signature always returns a string. Also delete `setupDeviceId` from `src/analytics/index.tsx` (no migration to bootstrap)
- [x] Delete with the rest of analytics: `identifiers/session.ts` (`nativeSessionId` was analytics-only), `metrics/utils.ts` (`toClout` — drop the 2 callers in `state/queries/post.ts` / `profile.ts` at the same time), `utils.ts useMeta`, `metadata.ts` navigation helpers
- [x] Enumerate every importer and fix:
  ```sh
  rg -n "from '#/analytics/identifiers|from '#/analytics/metrics|from '#/analytics/metadata|from '#/analytics/utils" src --glob '!locale/**' --glob '!**/*.po'
  ```
  `src/Navigation.tsx` mixes nav metadata, metrics, and the now-deleted `AATest` gate at lines ~1016-1068 — sweep all three at once

### 2.7c — Remove all React analytics call sites

```sh
rg -n "useAnalytics|useAnalyticsBase|AnalyticsContext|AnalyticsContextType|ax\.metric|ax\.logger|utils\.useMeta|useMeta" src --glob '!locale/**' --glob '!**/*.po'
```

**Two-pass approach: codemod for the bulk, manual for the contextual decisions.**

**Codemod pass** — write a jscodeshift transform that handles the mechanical chunks:
- Delete `ax.metric(...)` expression statements entirely (no return value, no side effects worth keeping). Also catches `ax.metric('event:name', {payload})` since it's the same expression-statement shape
- Unwrap `<AnalyticsContext>{children}</AnalyticsContext>` and `<AnalyticsContext metadata={...}>{children}</AnalyticsContext>` → render the children directly (drop the wrapper element + drop the `metadata={...}` prop on consumers)
- Delete `const ax = useAnalytics()` declarations where `ax` becomes unused after the previous two rewrites. (Run the previous two passes first; then a follow-up pass deletes orphan declarations. Or: run the codemod, then `yarn lint --fix` with `no-unused-vars` to catch them)
- Delete `import {useAnalytics} from '#/analytics'` when the import becomes unused

**Manual pass — contextual judgment required:**
- [x] `ax.logger.X(...)` → `logger.X(...)` from `#/logger`. **Don't codemod this blindly** — analytics-logger callsites were often context-bound children (`Logger.create(Logger.Context.Notifications)`, `FeedFeedback`, `ReportDialog`). Use the equivalent `Logger.create(Logger.Context.X)` at the rewrite site so log filtering still works. Bare `logger.error(...)` drops the context — only fine where context wasn't meaningful to begin with
- [x] `AnalyticsContextType` function-param types → narrow to local types or remove the plumbing (each occurrence is one-off; not codemod-able)
- [x] `type Metrics[...]` used only for payload typing → replace with local literal-union/object types (one-off)
- [x] `rm -rf src/analytics` once `rg "from '#/analytics" src` is empty

**Footgun:** some files only import `type Metrics` for payload typing, not for actual tracking — the codemod won't see them since they're type-only imports. The done-grep below catches them.

**Done when:**
```sh
rg -n "from '#/analytics|from '#/analytics/|useAnalytics|AnalyticsContext|AnalyticsContextType|ax\.metric|ax\.logger|MetricsClient|METRICS_API_HOST" src .env.example package.json --glob '!locale/**' --glob '!**/*.po'
yarn typecheck
yarn lint
```
returns nothing and passes.

## Phase 2.8 — Rewrite storage to `localStorage` directly

**Motivation:** the fork's two storage layers (`src/storage/` new API, `src/state/persisted/` old API) currently route through `@bsky.app/react-native-mmkv` and `@react-native-async-storage/async-storage` — both abstractions that exist to bridge native and web. In a web-only fork, `localStorage` is the real backend either way; the indirection costs deps and complexity without buying anything. By the time this phase runs, Stream 2 has already deleted GrowthBook / AA / geolocation / live-events / interrupt-overlays / analytics — those subsystems' storage callers are gone, so the rewrite touches fewer files than it would have done earlier.

**Why this lives here (not Stream 1):** earlier drafts had this in Stream 1, but porting storage adapters for code that Stream 2 was about to delete (analytics device-ID, AA cache, GrowthBook cache) was wasted work. Running here means a smaller, cleaner rewrite. Package removal is still constrained by **all TypeScript-compiled importers**, not just web-reachable runtime paths (`tsconfig.check.json` covers all of `src/`).

**Checklist:**

- [x] **Audit MMKV importers before removal:**
  ```sh
  rg -n "@bsky.app/react-native-mmkv|new MMKV\\b|\\bMMKV\\b" src package.json
  ```
  At fork time the importers were `src/storage/index.ts`, `src/storage/archive/db/index.ts`, and `src/analytics/features/index.ts`. The analytics-features importer dies in Phase 2.2 (GrowthBook removal); the archive importer is still standing. Re-run the grep at execution time; act on what you find
- [x] Rewrite `src/storage/index.ts`: replace the `MMKV` import with a small `localStorage`-backed implementation. Keep the public `Storage<Scopes, Schema>` API (`get`, `set`, `remove`, `removeMany`, `removeAll`, `addOnValueChangedListener`) so callers don't change. Namespace keys with the existing `id` config (e.g. `bsky_device:<key>`). This intentionally switches to colon-prefixed keys without migrating old web MMKV keys.
  - **localStorage key compatibility:** existing web MMKV keys are `` `${id}\${key}` `` (backslash separator), **not** `` `${id}:${key}` ``. Switching to colon-separated namespacing means losing old persisted preferences. That's acceptable for a personal fork — flag the loss explicitly. If you want non-disruptive, read-old-key-once on miss and write back under the new key
  - **`removeAll()`** must iterate this storage's namespace/prefix and remove only those keys. Do **not** call `localStorage.clear()` — it wipes other storage scopes and the persisted-query data
  - **`addOnValueChangedListener()`** must return `{remove(): void}` because callers do `sub.remove()`. Use `window.addEventListener('storage', ...)` (not `window.onstorage = ...`); filter incoming events by `event.storageArea === window.localStorage` and by the fully-namespaced key. For same-tab updates, emit manually inside `set` / `remove` / `removeAll` / `removeMany`. Preserve the JSON envelope shape the existing code uses (`JSON.stringify({data})`)
  - **Restricted-mode safety:** `localStorage.setItem` can throw in private/quota-exceeded contexts. Match the existing `src/state/persisted/index.web.ts` pattern and try/catch reads + writes
  - Verify by toggling a setting in one tab and watching another tab update without a refresh
- [x] **Rewrite / archive `src/storage/archive/db/index.ts`** — if it's not load-bearing for any currently-shipping screen, delete it; otherwise port to `localStorage` with the same approach as the main storage rewrite
- [x] Rewrite `src/state/session/agent-config.ts` (tiny — `saveLabelers` / `readLabelers` over `localStorage` with the same `agent-labelers:<did>` key shape)
- [x] **Rewrite `src/state/persisted/index.ts`** to use `localStorage` directly. This file imports `@react-native-async-storage/async-storage` and is the old persisted-store backbone. By this point the other AsyncStorage importers (`ageAssurance/data.tsx`, `analytics/identifiers/device.ts`) are gone from Phases 2.3 and 2.7 — so rewriting this file is the last step before Phase 2.9's `yarn remove @react-native-async-storage/async-storage`
- [x] Audit `src/lib/react-query.tsx`: it uses `createAsyncStoragePersister` from `@tanstack/query-async-storage-persister` backed by `#/lib/persisted-query-storage`. Keep `createAsyncStoragePersister` — the `@tanstack/query-sync-storage-persister` package is deprecated, and the async persister accepts a sync `Storage` interface. Either pass `localStorage` directly (`createAsyncStoragePersister({storage: localStorage})`) or keep routing through `#/lib/persisted-query-storage` once that module is rewritten to wrap `localStorage`
- [x] `yarn remove @bsky.app/react-native-mmkv` (re-check `ls patches/` for a matching patch and delete in the same commit)
- [x] **`@react-native-async-storage/async-storage` removal lands in Phase 2.9** (next phase) — by the time this phase finishes, Stream 2's earlier deletions have retired every importer except `src/state/persisted/index.ts`, which this phase rewrites
- [x] **`react-native-uuid` removal is deferred to Phase 4.8.** The native variant `src/lib/media/manip.ts` is typecheck-visible until Phase 4.6 collapses it to the web variant. Don't try to remove the dep here

**Done when:**
- `rg "@bsky.app/react-native-mmkv|from 'react-native-mmkv'|\\bMMKV\\b" src package.json yarn.lock` returns nothing
- `rg "@react-native-async-storage/async-storage" src` returns at most `src/state/persisted/index.ts` (which this phase rewrote) — Phase 2.9 then runs `yarn remove @react-native-async-storage/async-storage`
- `yarn typecheck && yarn build-web` passes
- Storage round-trips work in the browser (set in DevTools console, refresh, value present)
- Cross-tab listener fires (toggle in one tab, observe in another)

## Phase 2.9 — Residual cleanup

**Motivation:** after the big directories are gone, sweep dead storage keys, env vars, deps, Sentry/logger contexts, and query keys.

**Checklist:**
- [x] Dead imports: `rg -n "#/(analytics|ageAssurance|geolocation)" src --glob '!locale/**' --glob '!**/*.po'`
- [x] Dead env vars: `rg -n "GROWTHBOOK|GEOLOCATION|METRICS_API_HOST|events\.bsky\.app|ip\.bsky\.app" . src app.config.* eas.json package.json` (note: `app.config.*` / `eas.json` will be deleted in Stream 4)
- [x] Dead package deps: `rg -n "@growthbook|expo-location" package.json yarn.lock src`, then `yarn install`
- [x] **`@react-native-async-storage/async-storage` closeout** (deferred from Phase 2.8). Phase 2.8 rewrote `src/state/persisted/index.ts` away from AsyncStorage but left the remaining importers to die with their owning features: `src/ageAssurance/data.tsx` (deleted in Phase 2.3) and `src/analytics/identifiers/device.ts` (deleted in Phase 2.7). Verify zero importers and remove:
  ```sh
  rg -n "@react-native-async-storage/async-storage" src package.json yarn.lock
  yarn remove @react-native-async-storage/async-storage
  ```
  Phase 4.8's package-cleanup section also lists this — landing it here keeps the dep tree clean throughout Stream 4 rather than only at the end
- [x] Dead persisted keys (sweep): `rg -n "nativeSessionId|nativeSessionIdLastEventAt|geolocation|geolocationServiceResponse|deviceGeolocation|mergedGeolocation|bsky_features_cache|STATSIG_LOCAL_STORAGE_STABLE_ID" src --glob '!locale/**' --glob '!**/*.po'`
- [x] **Intentionally retained keys** (do NOT delete in this sweep): `deviceId` (still needed for local drafts and About settings), `debugFeedContextEnabled` (added in Phase 2.1a — this is the local replacement for the GrowthBook gate)
- [x] Trim `src/storage/schema.ts` and `src/state/persisted/schema.ts` to remove dead keys only
- [x] Sentry/logger leftovers: `rg -n "Sentry\.(setContext|setTag|setExtra|setUser)|scope\.set|AgeAssurance|Geolocation|Growthbook|growthbook" src --glob '!locale/**' --glob '!**/*.po'` — remaining `scope.setExtras` in error-report attachments is unrelated
- [x] In `src/logger/types.ts`, remove logger contexts `AgeAssurance`, `Geolocation`, `Growthbook` once no callers remain
- [x] Query keys / params: `rg -n "ageAssurance|geolocation|geo|countryCode|regionCode|deviceGeolocation|mergedGeolocation|feature:viewed|experiment:viewed|growthbook" src --glob '!locale/**' --glob '!**/*.po'` — remaining hits are locale/phone/currency/link-metadata uses, not deleted feature keys
- [x] Final verification: `yarn typecheck && yarn lint && yarn build-web`

**Footguns:**
- `countryCode` may still be valid for phone-number / locale purposes; don't blindly delete.
- Locale `.po` files retain old source comments until extraction is rerun — treat separately.
- The current `persisted/schema.ts` uses `z.object(...)`; removing keys is generally fine, but **adding** new required keys would invalidate old persisted blobs.

**Done when:**
- No source imports remain for the deleted directories.
- No GrowthBook/geolocation/metrics env vars remain.
- App launches logged-out and logged-in without any remote GrowthBook, geolocation, AA, or metrics calls.

## Phase 2.10 — Apply unmigrated upstream codemods, then delete `.jscodeshift`

**Motivation:** `.jscodeshift/` ships three one-shot upstream codemods that haven't been fully applied to the codebase. Once they're run across the remaining unmigrated files, the directory is dead weight. Running this late in Stream 2 (after Phases 2.1-2.9 delete swaths of feature code) means the lingui-v5 sweep touches a smaller file set — the deletions retire ~244 of the ~390 fork-time targets before the codemod ever sees them.

**Why this lives here (not Stream 1):** earlier drafts had this as Phase 2.10. Running the lingui-v5 codemod across the full ~390 files only to delete a large fraction of them in Streams 1-2 was wasted churn. Running here means smaller diff, fewer false positives, and the deletions take care of part of the work for free.

**State at fork time** (re-run the greps before executing — counts will drift, especially after Stream 2 deletions):

| Codemod | Target pattern | Unmigrated files |
|---|---|---|
| `repo/react-import.js` | `import React from 'react'` + `React.X` namespace calls | 0 at last check — re-verify; if zero, drop the codemod sweep |
| `repo/toast-v2.js` | `from '#/view/com/util/Toast'` | 1 |
| `file/lingui-v5.js` | `from '@lingui/core/macro'` + `` _(msg`...`) `` | ~390 pre-Stream-2; expect ~150 after Stream 2 deletions land |

`jscodeshift` isn't a dev dep in `package.json` — invoke via `npx jscodeshift`.

**Checklist** (one commit per codemod sweep so the lingui-v5 diff doesn't drown the others):

- [ ] **`repo/react-import.js`:**
  ```sh
  rg -l "import React from 'react'" src
  # apply to each result, then verify:
  rg "import React from 'react'|React\\.(useEffect|useState|useMemo|useRef|useCallback|useContext|forwardRef|memo|Fragment)" src
  ```
- [ ] **`repo/toast-v2.js`:**
  ```sh
  rg -l "from '#/view/com/util/Toast'" src
  # apply to each result, then verify:
  rg "from '#/view/com/util/Toast'" src
  ```
- [ ] **`file/lingui-v5.js`:**
  ```sh
  # Enumerate then batch:
  rg -l "from '@lingui/core/macro'|_\\(msg\`" src \
    | xargs -n 50 npx jscodeshift -t .jscodeshift/file/lingui-v5.js --parser=tsx
  # Verify no remaining v4 patterns:
  rg "from '@lingui/core/macro'|_\\(msg\`" src
  ```
  This is mechanical but produces a large diff. Land as its own commit titled something like "Apply lingui v5 codemod across remaining files". After landing, smoke-test the UI — codemod failures usually show up as runtime-only translation lookups returning the raw key
- [ ] **Per-codemod gate:** after each sweep, `yarn typecheck && yarn build-web` before moving on
- [ ] `rm -rf .jscodeshift` in a final commit
- [ ] Cross-reference CLAUDE.md's "Refactor existing uses of `` _(msg`foo`) `` to use `` l`foo` ``" — this phase is the bulk-execution of that guidance; CLAUDE.md can stop mentioning it once 2.10 lands

**Footguns:**
- The lingui-v5 codemod is named `file/lingui-v5.js` because upstream invokes it per-file. Batched invocation via `xargs -n 50 jscodeshift` works but skip files that already use `@lingui/react/macro` — the codemod is mostly idempotent but the diff churn is wasted on already-migrated files. The `-l` grep before xargs already filters those out
- `npx jscodeshift` downloads jscodeshift on first run — be online, or `yarn add -D jscodeshift` first and remove after the sweep

**Done when:**
```sh
rg "from '@lingui/core/macro'|_\\(msg\`|from '#/view/com/util/Toast'|^import React from 'react'" src
ls .jscodeshift 2>/dev/null
```
both return nothing.

## Phase 2.11 — Reduce to English-only (drop Crowdin, narrow locales) + refresh Lingui catalog

**Motivation:** this is a personal fork; multi-language support and the Crowdin translation pipeline are explicit non-goals. Keep Lingui itself — it still powers `<Trans>` / `<Plural>` / `l\`\`` and is small — but narrow it to the single English catalog. Also reconcile the catalog now that Stream 2 has deleted swaths of UI (`DeviceLocationRequestDialog`, `AgeAssuranceAccountCard`, regional signup copy, etc.).

**Scope clarification — what stays vs. what goes:**
- **Goes:** *App* language (the UI language selector + the 47 non-`en` catalogs + Crowdin pipeline + the `@formatjs/intl-*` polyfills, which are native-only anyway)
- **Stays:** *Content* language preferences and the post-language detection in the composer. Filtering feeds by detected post language is independent of UI language

**Checklist:**

- [ ] **Delete non-English catalogs:**
  ```sh
  cd src/locale/locales && ls | grep -vx 'en' | xargs rm -rf
  ```
  This removes 47 locale directories. `en` is the only survivor (drop `en-GB` too unless you specifically want it — it's just a thin override)
- [ ] **Crowdin removal:**
  - `rm -f crowdin.yml`
  - `yarn remove @crowdin/cli`
  - In `package.json` scripts, delete `intl:pull`, `intl:push`, `intl:push-sources`, `intl:release` (all four invoke `crowdin`)
  - (The nightly Crowdin GitHub Action is already gone — Phase 1.1 deleted `.github/`)
- [ ] **Documentation cleanup:**
  - `rm -f docs/localization.md`
- [ ] **`src/locale/i18n.web.ts`** — collapse the 48-arm `switch` in `dynamicActivate` to just the `en` case. Drop all the other `import('./locales/<x>/messages')` / `import('date-fns/locale/<x>')` arms. The function effectively becomes a single-locale loader (and can be inlined to a top-level import + `i18n.load`/`i18n.activate` pair)
- [ ] **`src/locale/i18n.ts`** — same narrowing. (This file gets deleted entirely in Phase 4.5 platform-branch collapse, but doing it here keeps `yarn typecheck` green throughout Stream 2.) The `@formatjs/intl-*` polyfill imports stay in `i18n.ts` until Phase 4.5 deletes the file — **don't `yarn remove @formatjs/intl-*` in this phase**
- [ ] **`src/locale/languages.ts`** — narrow `AppLanguage` enum to just `en` (or delete the enum and replace its uses with the literal `'en'`). `LANGUAGES` and the `Language` interface are about *content* languages and stay
- [ ] **`src/locale/helpers.ts`** — `sanitizeAppLanguageSetting()` becomes trivial: always returns `'en'`. Delete the device-locale-matching logic (it was for picking the closest supported UI locale)
- [ ] **`src/state/preferences/languages.tsx`** — keep `contentLanguages`, `postLanguage`, etc. Narrow the `setAppLanguage` API to `'en'` only, or delete it outright (every caller now passes `'en'`)
- [ ] **`lingui.config.ts`** — narrow the `locales` array to `['en']`. Otherwise `lingui compile` / future extractions will look for the deleted catalog directories and either fail or no-op confusingly
- [ ] **App-language UI lives in more places than Settings.** Delete `src/components/AppLanguageDropdown.tsx` (or stub it to a one-option `'English'` display) and remove its consumers: `src/view/shell/desktop/RightNav.tsx`, `src/view/shell/NavSignupCard.tsx`, `src/view/com/auth/SplashScreen.web.tsx`, `src/screens/Signup/index.tsx`, plus the Settings entry. Recommended: delete the component entirely — a one-option language selector is dead UI. The content-language picker (post-language detection, etc.) stays
- [ ] Drop `intl:extract:all` from `package.json` scripts (the `:all` variant exists to extract every locale; with only `en`, simplify `intl:build` to call `intl:extract`)
- [ ] **Refresh the catalog** against the trimmed Stream 2 UI: `yarn intl:extract --clean --locale en && yarn intl:compile`. Then verify nothing stale survived:
  ```sh
  rg "AgeAssurance|ageAssurance|geolocation|DeviceLocationRequest|FindContacts" src/locale/locales/en/messages.po
  ```
  Hits at this point are real bugs (source still references AA/geolocation/contacts); zero hits = clean
- [ ] Commit the regenerated `messages.po` and `messages.ts`

**Footguns:**
- Upstream CLAUDE.md says nightly CI normally handles `intl:extract` / `intl:compile`. After ripping out the Crowdin pipeline + nightly workflow, that's no longer true — extract+compile runs locally for any commit touching user-facing strings
- Don't accidentally rip out post-language detection (`src/view/com/composer/select-language/*`, `lande` dep). That's the language of the *post you're writing*, not the app UI

---

# Stream 3 — Remove Reanimated (and verify gesture-handler is web-clean)

**Motivation:** `react-native-reanimated` is the largest "native-shaped" dep still in the web bundle. On web it's a JS shim that runs animations on the main thread anyway, so the bundle cost isn't buying us anything; replacing it with CSS transitions / Web Animations API removes a large dependency surface and simplifies the Stream 4 shim contracts. `react-native-gesture-handler` *appears* to have zero web callers after parent-shadow pruning, which would let it be removed alongside Reanimated with no rewrite work — verify in Phase 3.0 before relying on this.

**Stream 3 runs before Stream 4.** This is canonical, not optional. With Reanimated out: Stream 4's `expo-blur` / `expo-linear-gradient` shims are plain components (no `Animated.createAnimatedComponent` compat), the rsbuild Babel chain doesn't carry `react-native-reanimated/plugin`, and the inventory work in Stream 4 doesn't have to disentangle worklets from native modules.

**Why `react-native-keyboard-controller` lives in this stream (Phase 3.1).** The package imports Reanimated at module load (`node_modules/react-native-keyboard-controller/src/index.ts`, `animated.tsx`) — every web-loading file that imports `KeyboardProvider` / `KeyboardAvoidingView` / `KeyboardAwareScrollView` / `KeyboardStickyView` / hooks transitively pulls Reanimated. As long as keyboard-controller is in the dep tree, `yarn remove react-native-reanimated` breaks the web build. So the keyboard-controller web shim has to land before Phase 3.4's dep removals — that's its own Phase 3.1 below, ahead of the animation rewrites in 3.2 and 3.3.

**Typecheck scope reminder.** `tsconfig.check.json` covers all of `src/`, so Reanimated/RNGH imports anywhere in `src` — including `.native.tsx` / `.ios.tsx` / `.android.tsx` files — fail `yarn typecheck` after the deps are removed. The "transitively-shadowed leftovers OK" framing is only true for *bundle reachability*, not typecheck. Stream 3 must remove every Reanimated/RNGH import from `src`, native variants included. (Alternative: narrow typecheck scope before Phase 3.4 — not recommended.)

## Phase 3.0 — Inventory

**Motivation:** scope the actual web-reachable Reanimated/gesture-handler surface (native-only files don't count). Fork-time numbers: ~83 web-shipping reanimated files / ~473 worklet-API call sites. Verify gesture-handler before treating it as a pure deletion — earlier scoping called "1 web file" which became 0 after transitive shadow pruning, but reverify.

**Checklist:**
- [ ] Capture broad inventory (extend beyond `src/`):
  ```sh
  rg -n "react-native-reanimated|react-native-gesture-handler" \
     src index.js index.web.js package.json babel.config.js webpack.config.js tsconfig*.json patches \
     --glob '!locale/**' --glob '!**/*.po' > .inventory-reanimated.txt
  ```
  At fork time non-`src` hits typically include: `index.js` (bare RNGH side-effect import), `package.json` (deps + `expo.install.exclude`), `babel.config.js` (reanimated plugin), `webpack.config.js` (RNGH alias), `tsconfig.json` (reanimated plugin config if present), `patches/react-native-reanimated+*.patch`, and `patches/react-native-keyboard-controller+*.patch` (which uses Reanimated APIs)
- [ ] Tag each file as **web-shipping** vs **shadowed/native-only**. A file is shadowed if (1) its filename has a `.native.tsx` / `.ios.tsx` / `.android.tsx` suffix, (2) a `.web.tsx` / `.web.ts` sibling exists at the same base path, or (3) **(transitive)** every importer chain reaching it enters through a file shadowed by (1) or (2). Don't skip rule 3 — e.g. `src/components/Lightbox/pager/ImagePager.tsx` has no `.web` sibling but is only reached via `Lightbox.tsx`, which is shadowed by `Lightbox.web.tsx`. **Tagging informs prioritization, not exclusion** — every Reanimated/RNGH import in `src` (shadowed or not) has to be removed before Phase 3.4 because typecheck spans all `src`
- [ ] Save a `createAnimatedComponent` callsite list separately — these wrap third-party components (BlurView, LinearGradient, AnimatedCheck's SVG) for animated styles **or animated props** and need targeted handling, not the preset sweep
- [ ] Use `rg "from 'react-native-reanimated'" src` (import-source grep) as the ground truth for "Reanimated is gone." A hand-picked API token list misses long-tail exports like `useReducedMotion`, `useAnimatedProps`, `useDerivedValue`, `useScrollViewOffset`, `useFrameCallback`, `scrollTo`, `interpolateColor`, `Keyframe`

**Footgun:** `Animated` imported from `'react-native'` (legacy RN Animated API) is **separate** from `react-native-reanimated`. Two callers at fork time (`src/view/shell/Composer.tsx`, `src/lib/hooks/useAnimatedValue.ts`) — leave them; they live or die with RNW (Appendix A).

## Phase 3.1 — Replace `react-native-keyboard-controller` with a web shim

**Motivation:** keyboard-controller imports Reanimated at module load (see Stream 3 intro). Removing Reanimated in Phase 3.4 fails the build unless keyboard-controller is gone first. A thin pass-through shim covers the web case — there's no on-screen keyboard to manage, so the entire surface can be no-ops or React passthroughs.

**Required shim surface** (re-grep at execution time):
- `KeyboardProvider` — passthrough that renders children
- `KeyboardAvoidingView` — passthrough that renders children (or thin `View` wrapper if behavior is unused)
- `KeyboardAwareScrollView` — render as a `ScrollView`; ignore keyboard-aware props
- `KeyboardGestureArea` — passthrough
- `KeyboardChatScrollView` — same as `KeyboardAwareScrollView`
- **`KeyboardStickyView`** — passthrough. Used by `src/view/com/composer/KeyboardAccessory.tsx` and the vendored re-export at `src/screens/Messages/components/vendor/KeyboardStickyView.tsx`. Easy to miss — re-check importers
- Hooks: `useKeyboardHandler`, `useReanimatedKeyboardAnimation`, `useKeyboardContext`, `useKeyboardState`, etc. — return zero-valued objects (`{ height: 0, ... }`) and no-op callbacks
- `KeyboardEvents` API — no-op emitter

**Checklist:**
- [ ] Create `src/shims/react-native-keyboard-controller/index.ts` exporting the surface above. Header-comment with the retirement plan per the Conventions classification — this is likely a long-lived adapter, not temporary scaffolding (the app continues to use these components on web; the shim replaces their internals)
- [ ] Add the alias to `webpack.config.js` (active build) AND `tsconfig.json` `compilerOptions.paths` so `yarn typecheck` resolves the shim. Phase 4.7 ports the same alias to `rsbuild.config.ts` `resolve.alias`
- [ ] In `src/App.web.tsx`: replace the live `KeyboardProvider` import with the shim's passthrough (the alias does this automatically once configured)
- [ ] Don't preemptively rebuild the keyboard model. The shim returns zeros for keyboard height / animation values; if a concrete composer-focus UX bug emerges on mobile browsers, add a `visualViewport`-based polyfill **then**, not now
- [ ] `yarn remove react-native-keyboard-controller` + delete the matching patch (`patches/react-native-keyboard-controller+*.patch` at fork time imports `scrollTo`/`useAnimatedReaction` — becomes stale)
- [ ] Verify:
  ```sh
  rg "react-native-keyboard-controller" src package.json yarn.lock webpack.config.js
  yarn install
  yarn typecheck && yarn build-web
  ```
  Source should return zero hits; lockfile transitives are fine

**Done when:**
- `react-native-keyboard-controller` is gone from `package.json` / `yarn.lock`
- `src/shims/react-native-keyboard-controller/` resolves for every import path callers used (via webpack + tsconfig alias)
- Composer keyboard accessory still renders on web; no crash on focus
- Build is green — this unblocks Phase 3.4's `yarn remove react-native-reanimated`

## Phase 3.2 — Replace preset entering/exiting animations

**Motivation:** the preset animations (`FadeIn`, `FadeOut`, `SlideIn*`, `SlideOut*`, `ZoomIn*`, `ZoomOut*`, `LinearTransition`, `LayoutAnim`) are the largest mechanical chunk (~200 web-shipping callsites at fork time). They translate directly to CSS transitions or the Web Animations API.

**Checklist:**
- [ ] Build the replacement layer under `src/lib/animations/` (or `src/components/Animated/` — pick one, don't scatter). Start with `<FadeView>` for opacity, `<SlideView direction=...>` for translate, `<ZoomView>` for scale. Derive the prop shape from the first few callsites — most upstream calls use `.duration()` / `.delay()` / `.easing()` modifiers and rely on "remain mounted during exit until transition completes" semantics
- [ ] **Codemod the mechanical bulk.** Write a jscodeshift transform that rewrites:
  - **Element renames first:** `<Animated.View>` → `<View>`, `<Animated.ScrollView>` → `<ScrollView>`, `<Animated.FlatList>` → `<FlatList>` etc. where the only Reanimated-flavored props are `entering` / `exiting` / `layout` (no `animatedProps`, no `style={useAnimatedStyle(...)}`)
  - **Preset entering/exiting with modifier chains:** the transform parses `entering={FadeIn.duration(200).delay(50).easing(Easing.out(Easing.cubic))}` and emits the equivalent `<FadeView durationIn={200} delayIn={50} easingIn="ease-out-cubic">`. Same shape for `exiting={...}`. Modifier methods to handle: `.duration(N)`, `.delay(N)`, `.easing(fn)`, `.springify()` (replace with the closest CSS-equivalent easing), `.damping(N)` / `.stiffness(N)` (springify settings — best-effort mapping)
  - **Preset names without modifiers:** `entering={FadeIn}` → `<FadeView fade="in">`, etc. Map every preset: `FadeIn`, `FadeOut`, `SlideInLeft` / `SlideInRight` / `SlideInUp` / `SlideInDown`, `SlideOut*`, `ZoomIn`, `ZoomOut`, `ZoomInDown` / `ZoomInUp` / `ZoomInLeft` / `ZoomInRight`, `ZoomOut*`, `LayoutAnim`
  - **`Easing.XXX` → CSS easing string:** `Easing.linear` → `'linear'`, `Easing.ease` → `'ease'`, `Easing.out(Easing.cubic)` → `'ease-out-cubic'`, `Easing.bezier(a,b,c,d)` → `'cubic-bezier(a,b,c,d)'`. Build a complete mapping table — every Easing form upstream uses
  - **Drop the `from 'react-native-reanimated'` import** for preset names + `Easing` once all uses are rewritten. The transform's final pass: walk imports, remove specifiers that became unused
  
  The codemod runs across all ~200 callsites in one commit. The replacement-layer component API (`<FadeView>`, `<SlideView>`, ...) needs to be designed BEFORE the codemod runs — derive the prop shape from 5-10 representative callsites and lock it in
- [ ] **`LinearTransition` is case-by-case — NOT a codemod target.** Some uses are decorative (drop them); others are real layout polish on form controls (`src/components/forms/Toggle/index.tsx`, `src/components/dms/SystemMessageGroup.tsx`) — for those, use CSS `transition` on `transform`/size, or a localized FLIP transition. Only drop when wrapped in `native(...)` or visually irrelevant. The codemod should leave `LinearTransition` callsites untouched (or annotate them with a TODO comment)
- [ ] **Custom keyframed entering/exiting functions** (`ScaleAndFade`, `ShrinkAndPop`, `LikeIcon`, etc.) — also out of codemod scope. Each is a bespoke `Keyframe(...).duration().build()` author-defined animation. Replace per Phase 3.3's matrix row for keyframed animations
- [ ] Verify per-batch with `yarn typecheck && yarn build-web` between meaningful slices so regressions stay localized

**Done when:**
```sh
rg -n "from 'react-native-reanimated'" src --glob '!locale/**' --glob '!**/*.po'
```
returns only transitively-shadowed files.

## Phase 3.3 — Replace value-driven animations

**Motivation:** the next-largest pattern is `useSharedValue + useAnimatedStyle + withTiming/withSpring` driving a single style property over time. Each callsite is local; the per-site decision is which web primitive replaces it.

**Decision matrix:**

| Reanimated pattern | Web replacement |
|---|---|
| `withTiming` on a single number → style | CSS transition on the consuming style property; React owns the target value. **Interruption note:** CSS transitions retarget cleanly from current computed value, so changing the target mid-transition is fine. Caveats: not for drag-/scroll-following values (high-frequency target changes thrash); don't remount the element mid-transition (resets state); for exit animations, gate unmount on `transitionend` |
| `withSpring` for overshoot-clamped binary UI state (e.g. shell `minimal-mode`, scroll-aware bars) | Plain `ease-out` or `ease-in-out`. Not a real spring — just a settling motion |
| `withSpring` for gesture-/velocity-driven physics | Rewrite the behavior explicitly (manual rAF + impulse decay). For a web-only fork, "keep native-only" is dead code — pick the rewrite. Don't fake it with a single cubic-bezier — the result looks wrong under varying input velocity |
| `withDecay` | Same as gesture-driven `withSpring` above — rewrite explicitly |
| `withSequence` / `withDelay` / `withRepeat` | CSS keyframes (`@keyframes` + `animation: name duration delay iterations`), CSS `animation-delay` / `animation-iteration-count`, or Web Animations API timelines with `iterations` / `delay` |
| `cancelAnimation` | For CSS transitions: retarget by changing the React-owned state. For CSS animations: clear `element.style.animation` or remove the class. For Web Animations API: call `.cancel()` on the returned `Animation`. For manual rAF: clear the handle |
| `useDerivedValue` | `useMemo` / a derived expression / plain local computation; if the derivation represents a continuous animation, hoist it to CSS / WAAPI / rAF instead of recomputing on every frame |
| `interpolate` | plain math (it was already plain math, just sync now) |
| `interpolateColor` | CSS transition between concrete colors (cheapest), or interpolate manually in JS (parse → lerp → format) when CSS can't reach the target prop |
| Keyframe-like (interpolate over time) | Web Animations API: `element.animate([{...}, {...}], {duration, easing})` |
| `Keyframe(...).duration()...build()` + custom entering/exiting functions (`ScaleAndFade`, `ShrinkAndPop`, `LikeIcon`, etc.) | CSS `@keyframes` + a `<KeyframedView>` helper, or WAAPI driven from a small `useKeyframes` hook. Not the same as the preset-component sweep — these are bespoke author-defined keyframes; preserve the timing function and stage timings |
| `useAnimatedReaction` — reaction to value changes | `useEffect` watching the value (and if the source was an `interpolate(...)` chain, evaluate that math in React land now). **First-render footgun:** compute the derived target synchronously in `useState`/`useMemo` so first-paint visibility/border state doesn't flash — `useEffect` runs after commit |
| `useAnimatedScrollHandler` (list scroll state, composer sticky bookkeeping, video visibility) | Normal RNW `onScroll`; compute offsets from the event; rAF-throttle JS state callbacks. **Don't put per-frame scroll offsets into React state** if the visual must track every frame — use CSS sticky, imperative rAF style writes, or observers. For visibility loops like `ExternalPlayer`'s `useFrameCallback + measure`, prefer `IntersectionObserver` over a rAF polling rewrite |
| `useEvent` / `useHandler` (custom event plumbing — used in `src/view/com/pager/Pager.tsx:20-25,181-205` for pager position/transition events) | Replace with ordinary component callbacks (`onPageScroll`, `onPageSelected`, `onPageScrollStateChanged` props). Preserve event ordering; use a `useRef` for mutable drag state if the callback chain needs cross-event mutability. No worklet shenanigans on web |
| `useAnimatedRef` + `measure` | `useRef` + `element.getBoundingClientRect()` |
| `runOnJS` / `runOnUI` | delete — irrelevant on web |
| `Animated.View` / `Animated.ScrollView` / `Animated.FlatList` used as plain component alias (no animated props) | Replace with the corresponding `react-native` / RNW component. These read as "Animated" but carry no animation; they need a rename, not a rewrite |
| `createAnimatedComponent(Foo)` wrapping ONLY animated style | Use `Foo` directly + drive the style with CSS class/state |
| `createAnimatedComponent(Foo)` wrapping animated **props** (SVG `strokeDashoffset` in `AnimatedCheck`, BlurView `intensity` in `GrowableBanner`, RN `scrollIndicatorInsets`, `TextInput.scrollEnabled` in MessageInput, AnimatedPressable wrappers) | Prop-by-prop rewrite — CSS variable + custom property for SVG, React state for component props, or Web Animations API for keyframed props. **Not a drop-in deletion** |
| **Type imports** (`SharedValue`, `AnimatedRef`, `AnimatedStyle`, `ScrollHandlers`, `ReanimatedScrollEvent`, `FlatListPropsWithLayout`) | Replace with the appropriate plain TS types or `MutableRefObject<T>` / `RefObject<T>` / standard event types. These don't go away on their own — `from 'react-native-reanimated'` type-only imports still trip the import-source grep and break typecheck after package removal |

**Checklist:**
- [ ] Walk the inventory file-by-file, applying the matrix
- [ ] For each `createAnimatedComponent` wrapper, audit whether it was animating style or props; pick the right replacement
- [ ] Verify per-meaningful-slice with `yarn build-web` and a visual smoke check

**Footguns:**
- `runOnJS`/`runOnUI` callsites are a tell — that file was using worklets to coordinate with the JS thread. Verify the rewrite doesn't double-call or reorder
- `useAnimatedReaction` mirroring an `interpolate(...)` chain becomes a `useEffect` with the interpolation done synchronously in React — watch for off-by-one frames on first render

## Phase 3.4 — Remove the dependencies

**Prerequisites that must already be true** (re-verify before running any `yarn remove`):
- The `react-native-keyboard-controller` shim work from Phase 4.3's disposition table has been done and the package is removed. (Reanimated removal will fail while keyboard-controller is still in the tree — see Stream 3 intro.)
- Every Reanimated/RNGH import in `src` has been removed, including `.native.tsx` / `.ios.tsx` / `.android.tsx` files. (Typecheck spans all `src` — shadowed-but-imported isn't safe.)
- No remaining type-only imports (`SharedValue`, `AnimatedRef`, etc.) — see the matrix row in Phase 3.3.

**Checklist:**
- [ ] `yarn remove react-native-reanimated react-native-gesture-handler react-native-keyboard-controller`
- [ ] Delete the matching patches:
  ```sh
  rm -f patches/react-native-reanimated+*.patch patches/react-native-reanimated+*.patch.md
  rm -f patches/react-native-keyboard-controller+*.patch patches/react-native-keyboard-controller+*.patch.md
  ```
  At fork time `patches/react-native-reanimated+3.19.1.patch` patches `PerformanceMonitor` to return null; the keyboard-controller patch imports `scrollTo`/`useAnimatedReaction` — both become stale once the deps are gone
- [ ] Delete `react-native-reanimated/plugin` from `babel.config.js` (currently the LAST entry per Reanimated docs)
- [ ] Delete the bare RNGH side-effect import from `index.js` (the native entry — gets fully deleted in Phase 4.6, but the import line breaks `yarn install`/lockfile-rebuild sooner)
- [ ] Remove any RNGH alias from `webpack.config.js` (fork-time webpack config has one)
- [ ] Remove the `expo.install.exclude` entries for these packages in `package.json` if present
- [ ] In `src/App.web.tsx`: confirm no `GestureHandlerRootView` or `KeyboardProvider` imports remain (fork-time `App.web.tsx` imports `KeyboardProvider`; the keyboard-controller shim work above replaces it)
- [ ] Re-run `yarn install` and `yarn build-web` to confirm the build is clean
- [ ] Final search — covers configs and side-effect/dynamic imports the `from '...'` form would miss:
  ```sh
  # Primary: import-source + side-effect form, broad path set
  rg "react-native-reanimated|react-native-gesture-handler|react-native-keyboard-controller" \
     src index.js index.web.js package.json babel.config.js webpack.config.js tsconfig*.json patches \
     --glob '!ROADMAP.md'
  # Secondary (API surface scan in src, including native variants since typecheck sees them):
  rg "useSharedValue|useAnimatedStyle|useAnimatedProps|useReducedMotion|useScrollViewOffset|useFrameCallback|useAnimatedRef|useDerivedValue|measure\(|cancelAnimation|withTiming|withSpring|withSequence|withDecay|withRepeat|withDelay|runOnJS|runOnUI|createAnimatedComponent|interpolateColor|Keyframe|FadeIn|FadeOut|SlideIn|SlideOut|ZoomIn|ZoomOut|LinearTransition|LayoutAnimationConfig|SharedValue|AnimatedRef|AnimatedStyle|ReanimatedScrollEvent" src \
     --glob '!locale/**' --glob '!**/*.po'
  ```
  Both should return nothing.

**Done when:**
- All three deps are gone from `package.json` and `yarn.lock`
- `yarn typecheck && yarn build-web` succeeds without the Reanimated Babel plugin in the chain
- Visual smoke: animated UI (toasts, dialog open/close, image carousels, video scrubber, composer keyboard accessory) still works

---

# Stream 4 — Build & platform de-mobilization

**TL;DR:** strip Expo (with shims under `src/shims/` for high-fanout APIs), remove Sentry, in-house the remaining `@bsky.app/*` packages, collapse platform branches — **then** swap webpack → rsbuild as the last phase. The build migration is last because everything above shrinks what the build config needs to know about (no `.web.*` extension ordering, no Reanimated Babel plugin, no Expo-package exemptions).

## Phase 4.0 — Build baseline checkpoint

- [ ] `yarn install`
- [ ] Capture snapshots (`@bsky.app/expo-*` packages are in-house Expo modules and must be included; `src/locale/**` is excluded because catalog comments produce thousands of noise hits):
  ```sh
  rg -n "from ['\"](@?expo|expo-|@expo/|@bsky\.app/expo)|require\(['\"](@?expo|expo-|@expo/|@bsky\.app/expo)|@sentry/react-native|from ['\"][^'\"]*modules/" \
    src index.web.js index.js -g '!src/locale/**' > .inventory-expo-imports.txt
  rg "expo|sentry|metro|@react-native" package.json > .inventory-expo-package.txt
  ```

**Footgun:** `.web.tsx` resolution order matters during Phases 4.3-4.6 (still on webpack via `@expo/webpack-config`, which has it baked in). It stops mattering at Phase 4.5 — that phase collapses every `.web.tsx` into a plain `.tsx`, so the rsbuild config in Phase 4.7 doesn't need to special-case platform extensions.

## Phase 4.1 — Rewrite the web entry point

**Motivation:** drop the `expo/registerRootComponent` dependency at the entry point before the rest of the Expo strip. Also drop `src/platform/polyfills.web.ts` — for modern browsers in 2026, none of its three pieces are needed.

**Prerequisite — rewrite the three `setImmediate()` callers** (the only thing in `polyfills.web.ts` that actually has runtime callers; `Array.prototype.findLast` is in every browser since 2022, and the dev-only RNW console-error hijack is QoL):
- [ ] `src/components/dms/AddMembersFlow.tsx` — `setImmediate(fn)` → `setTimeout(fn, 0)` (or `queueMicrotask(fn)` if order vs paint doesn't matter)
- [ ] `src/components/dms/InitiateChatFlow.tsx` — same
- [ ] `src/components/dialogs/SearchablePeopleList.tsx` — same
- [ ] While at it: in `src/state/cache/thread-mutes.tsx`, remove the stale `// @ts-ignore findLast is polyfilled - esb` comment (modern TS knows about `findLast`)

Replace `index.web.js` with:

```js
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import App from '#/App'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root element')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] `rm src/platform/polyfills.web.ts src/platform/markBundleStartTime.web.ts`
- [ ] Drop the bundle-start-time perf line from `src/Navigation.tsx` (reads `global.__BUNDLE_START_TIME__` — sole reader of the deleted module)
- [ ] `yarn remove array.prototype.findlast setimmediate` (and remove their `@types/*` siblings if present)
- [ ] Ensure `web/index.html` contains `<div id="root"></div>`
- [ ] Keep `index.js` (native entry) temporarily; delete in Phase 4.6 (native cleanup)

## Phase 4.2 — Remove Sentry React Native

**Motivation:** explicit decision — no error reporting in this fork, period. Don't add `@sentry/rspack-plugin` or any browser-Sentry replacement later.

- [ ] In `src/App.web.tsx`: drop `import '#/logger/sentry/setup'`, drop `import * as Sentry from '@sentry/react-native'`, change `export default Sentry.wrap(App)` to `export default App`
- [ ] `src/logger/reporting/sendErrorReport.ts` imports `#/logger/sentry/lib` and calls `Sentry.withScope`. Delete the file (and audit callers), or replace with a console no-op
- [ ] `rm -rf src/logger/sentry/ src/logger/transports/sentry.ts`. In `src/logger/index.tsx`, drop `sentryTransport` (use `consoleTransport` in production, or `[]`)
- [ ] `yarn remove @sentry/react-native @sentry/webpack-plugin` + `rm -f patches/@sentry+*`
- [ ] Strip Sentry from build configs in-place (rsbuild migration in 4.7 deletes `webpack.config.js` entirely, but you're still on webpack here): `webpack.config.js` (sentryWebpackPlugin import + `SENTRY_AUTH_TOKEN` block), `metro.config.js` (Metro wiring), `app.config.js` (plugin entry — file deletes in 4.7 anyway), Dockerfiles (sourcemap upload section, if 1.1 didn't already remove them), `package.json` (`upload-native-sourcemaps` script, `SENTRY_AUTH_TOKEN` logic)
- [ ] Verify: `rg "Sentry|@sentry|sentry|SENTRY_AUTH_TOKEN" src package.json webpack.config.js metro.config.js app.config.js Dockerfile* .env.example`

## Phase 4.3 — Strip Expo, package by package, with shims

**Motivation:** remove Expo without leaving a huge red build window. Add shims for high-fanout APIs first, swap aliases, then peel packages off.

**Phase 4.3a — Guarded-import sweep (MUST run before any `yarn remove`).** Files that import a native Expo package at module top level but only call into it from an `IS_NATIVE`-guarded branch still pull the package at module load — the bundler resolves imports unconditionally, so the runtime guard doesn't help. `tsconfig.check.json` also typechecks them. Run:
```sh
rg -l "from ['\"]expo|from ['\"]@expo|expo-|@bsky\.app/expo|@mozzius/expo" src \
  | xargs rg -ln "IS_WEB|IS_NATIVE|IS_IOS|IS_ANDROID|platform\("
```
For each hit, choose one of: (a) replace the file with a pure web no-op (drop the top-level expo import), (b) split into `Module.web.ts` / `Module.native.ts` so the bundler picks the right one, or (c) delete the file if it's only reachable from native paths. Known fork-time examples: `src/lib/haptics.ts`, `src/lib/deviceName.ts`, `src/lib/hooks/useOpenLink.ts`, `src/lib/hooks/useIntentHandler.ts`, `src/lib/hooks/usePermissions.ts`, `src/lib/media/save-image.ts`, `src/lib/media/manip.ts` (has `.web.ts` sibling — platform-collapse rename), `src/alf/util/systemUI.ts`, `src/view/com/composer/drafts/DraftItem.tsx`. (This sweep was originally drafted under Phase 4.5; lifted here because removing the corresponding packages before the sweep is what fails.)

**Abort rule for shims.** If a shim's surface starts growing beyond a thin adapter — caller list growing, prop normalization piling up, behavioral parity becoming load-bearing — stop. That shim is a "promoted local web adapter" per the Conventions classification, not temporary scaffolding. Move it out of `src/shims/` into a stable import path (`#/components/Image`, `#/lib/clipboard`, etc.), update the header comment, and stop pretending it's getting deleted. Bad outcome: a shim grows into a real adapter while still living under `shims/` with a "TODO: replace with X" comment that never resolves.

**Critical — runtime Expo vs build-tool Expo are different cleanup paths:**
- *Runtime* Expo packages (everything in the disposition table below) — remove in Phase 4.3.
- *Build-tool* Expo (`expo` as a bare CLI package, `@expo/webpack-config`, `babel-preset-expo`) — **keep until Phase 4.7**. The current `build-web` script is `expo export:web`; the webpack pipeline is `@expo/webpack-config`; `babel.config.js` uses `babel-preset-expo`. Removing any of these mid-stream breaks the build. Phase 4.7 swaps `expo export:web` → `rsbuild build` and `babel-preset-expo` → the rsbuild babel chain; only then are these safe to `yarn remove`.

The `expo` package itself has runtime importers (`index.web.js` `registerRootComponent`, native VideoFeed paths). Phase 4.1 already retired `registerRootComponent`. After all *source* imports of `expo` are gone, the package still has to stay installed as a build-tool dep until 4.7 — its absence breaks `@expo/webpack-config` and `babel-preset-expo`. Plan: in 4.3, drop runtime imports of `expo` but **keep `expo` in `package.json` dependencies**; remove it in 4.7 together with `@expo/webpack-config` and `babel-preset-expo`.

**Shim aliasing must work for the active build, not just the future one.** Phase 4.3 runs on webpack (via `@expo/webpack-config`). The aliasing checklist for each shim:
- Add the alias to `webpack.config.js` via `withAlias` (or however the existing config exposes resolve aliases)
- Add the same alias to `tsconfig.json` `compilerOptions.paths` so `yarn typecheck` resolves the shim
- Phase 4.7 ports the same aliases into `rsbuild.config.ts` `resolve.alias`

Without the webpack + tsconfig aliases, future Claude sessions will write correct shims that the active build never resolves.

**Cross-cutting rule — patches:** `postinstall` runs `patch-package`. After every `yarn remove <pkg>` (here, in 4.2 for Sentry, in 2.4 for `expo-location`, in 3.4 for reanimated), also delete the matching patch:
```sh
rm -f patches/<pkg>+*.patch patches/<pkg>+*.patch.md
yarn install   # confirms patch-package no longer fails
```
Don't trust any hard-coded list of known patches — at fork time `ls patches/` shows entries for `@sentry+react-native`, `expo-font`, `expo-glass-effect`, `expo-haptics`, `expo-image`, `expo-image-picker`, `expo-media-library`, `expo-modules-core`, `expo-notifications`, `expo-paste-input`, `expo-updates`, `react-native-keyboard-controller`, `react-native-reanimated`, and others. Run `ls patches/` before each `yarn remove` and delete the matching patches in the same commit.

### Disposition table

| Package | Action | Web replacement |
|---|---|---|
| `expo` (runtime imports) | **drop imports in 4.3** | All source imports of bare `expo` are gone after Phase 4.1 rewrites `index.web.js` (the only web caller of `registerRootComponent`). The remaining bare-`expo` callers (`src/screens/VideoFeed/*`) are native-only; their shadowed `.web.*` siblings have no expo dependency |
| `expo` (the package itself) | **defer `yarn remove` to 4.7** | `@expo/webpack-config` and `babel-preset-expo` both depend on `expo` being installed. Remove all three together in Phase 4.7 |
| `expo-dev-client` | delete | none |
| `expo-build-properties` | delete | native config only |
| `@expo/webpack-config` | **defer `yarn remove` to 4.7** | replaced by `rsbuild.config.ts` — only safe to remove after `build-web` swaps to rsbuild |
| `babel-preset-expo` | **defer `yarn remove` to 4.7** | replaced by `@rsbuild/plugin-babel` chain; until then `babel.config.js` still references it |
| `jest-expo` | delete | already removed in Stream 1 |
| `@expo/html-elements` | delete | verify with `rg "@expo/html-elements"` |
| `expo-application` | delete | use `package.json` version in `src/env/` |
| `expo-blur` | replace | local `BlurView` shim → CSS `backdrop-filter` |
| `expo-camera` | delete or replace | `<input type="file" accept="image/*" capture>` if needed |
| `expo-clipboard` | replace | `navigator.clipboard` + textarea fallback |
| `expo-contacts` | delete | contacts already gutted in Stream 2 |
| `expo-device` | replace | `navigator.userAgent`, `matchMedia`; haptics → no-op |
| `expo-file-system` | replace | `File`, `Blob`, `fetch`, IndexedDB; existing `.web` upload paths |
| `expo-font` | delete (pair with font CSS move) | Move `@font-face` rules into `src/style.css` referencing `assets/fonts/inter/*.woff2` in the same commit that runs `yarn remove expo-font`. Don't defer the font move to Phase 4.7 — the app loses fonts otherwise. Webpack still owns the asset pipeline at this point; Phase 4.7 just inherits whatever `src/style.css` already imports |
| `expo-glass-effect` | replace | CSS or no-op shim |
| `expo-haptics` | delete | no-op `#/lib/haptics.web` |
| `expo-image` | replace | shim → `<img>` (high-fanout, add early) |
| `expo-image-manipulator` | replace | existing canvas-based `src/lib/media/manip.web.ts` |
| `expo-image-picker` | replace | existing `src/lib/media/picker.shared.ts` / file input; move `ImagePickerAsset` type local |
| `expo-intent-launcher` | delete | Android-only |
| `expo-keep-awake` | delete | existing `KeepAwake.web.tsx` no-op |
| `expo-linear-gradient` | replace | local `LinearGradient` shim → CSS `linear-gradient(...)` |
| `expo-linking` | replace | `window.location`, `URL`, `history`, `window.open` |
| `expo-localization` | replace | `navigator.languages`, `Intl.Locale` |
| `expo-location` | replace/delete | already gone in Stream 2 if `yarn remove expo-location` worked |
| `expo-media-library` | replace | download anchor / `navigator.share` |
| `expo-notifications` | **shim + delete** | Not a pure delete — `expo-notifications` is imported at top level by `src/Navigation.tsx`, `src/lib/hooks/useNotificationHandler.ts`, `src/lib/notifications/notifications.ts`, **and `src/screens/Settings/NotificationSettings/index.tsx`** (settings UI for push prefs). All four are typecheck-visible (the `IS_NATIVE` guards are inside functions, but the import resolves at module load). Either (a) add a no-op shim aliased in Phase 4.7's `resolve.alias`, or (b) split each module with a `.web.ts` sibling that doesn't import expo-notifications. The NotificationSettings screen also needs its UI deleted (or stubbed to "Notifications aren't supported in this build") since none of the settings have any effect. Then `yarn remove expo-notifications` |
| `expo-paste-input` | replace | existing Tiptap editor |
| `expo-privacy-sensitive` | delete | no-op wrapper |
| `expo-screen-orientation` | delete | no-op |
| `expo-sharing` | replace | `navigator.share` + copy/download fallback |
| `expo-sms` | replace/delete | `sms:` link or drop contact-invite flow |
| `expo-splash-screen` | delete | static HTML splash + `Splash.web.tsx` |
| `expo-system-ui` | delete | CSS/`theme-color` updates |
| `expo-updates` | delete | remove OTA settings UI |
| `expo-video` | **defer `yarn remove` to Phase 4.5** | Existing `.web` path (`VideoEmbedInnerWeb.tsx`) renders a `<video>` element directly; it doesn't import `expo-video`. The remaining importers (`src/screens/VideoFeed/index.tsx`, `src/screens/VideoFeed/components/Scrubber.tsx`, `src/view/shell/index.tsx`) are bundle-shadowed but **still typecheck-visible** until Phase 4.5 deletes the native files. Removing the dep in 4.3 will fail `yarn typecheck`. Hold the `yarn remove` until 4.5 collapses the platforms; only re-verify in 4.3 that no `.web.*` files import `expo-video` |
| `expo-video-thumbnails` | replace | `<video>` + canvas or omit draft thumbnail |
| `expo-web-browser` | replace | `window.open` or normal links |
| `@bsky.app/expo-guess-language` | replace | existing `lande` dep |
| `@bsky.app/expo-image-crop-tool` | delete | existing web `EditImageDialog`; localize `OpenCropperOptions` type |
| `@bsky.app/expo-scroll-edge-effect` | replace | no-op component/hook |
| `@bsky.app/expo-translate-text` | delete | existing web Google Translate provider |
| `@mozzius/expo-dynamic-app-icon` | delete | remove app-icon settings |
| `react-native-keyboard-controller` | **replace in Stream 3, not here** | local shim (see contract below). Covers `KeyboardProvider`, `KeyboardAwareScrollView`, `KeyboardAvoidingView`, `KeyboardGestureArea`, `KeyboardChatScrollView`, and — easy to miss — **`KeyboardStickyView`** (used by `src/view/com/composer/KeyboardAccessory.tsx` and the vendored re-export at `src/screens/Messages/components/vendor/KeyboardStickyView.tsx`). Plus the hooks and `KeyboardEvents` API. **The package imports Reanimated at module load**, so the shim swap must happen in Stream 3 before Phase 3.4's `yarn remove react-native-reanimated`. Phase 4.3 only re-verifies it stayed gone |
| `@discord/bottom-sheet` | **replace or delete + portal exports** | Direct dep + `patches/@discord+bottom-sheet+4.6.1.patch`. Direct importers at fork time: `src/view/com/modals/Modal.tsx`, `src/view/com/modals/util.tsx`, `src/view/com/util/BottomSheetCustomBackdrop.tsx`. **Additionally**, `modules/bottom-sheet` re-exports portal helpers (`BottomSheetPortalProvider`, `BottomSheetOutlet`) that `src/view/shell/index.tsx` and `src/view/com/composer/Composer.tsx` import via `from 'modules/bottom-sheet'` — those are web-reachable and have to be replaced with plain React portals before `modules/bottom-sheet` can be deleted. Two paths for the native deps: (a) if `src/view/com/modals/*` is fully superseded by `src/components/Dialog/index.web.tsx`, delete the legacy modal path; (b) otherwise port the three callers to the web dialog/portal layer. Then `yarn remove @discord/bottom-sheet` + delete the patch |

### Ordered execution

1. Create `src/shims/` and add shims for the high-fanout APIs first. For each, grep the callers to derive the exact surface needed (the lists below describe fork-time usage — re-grep at execution time). Non-obvious notes:
   - **`expo-image`** is the highest-fanout. Bare `<img>` boots but breaks feed layout, lazy loading, placeholders, blur, and cache controls — implement those. Required surface:
     - Export both `Image` *and* `ImageBackground` (the latter is used in `src/components/Post/Embed/VideoEmbed/index.tsx` and `src/components/WelcomeModal.tsx`)
     - Export the types callers consume: `ImageErrorEventData`, `ImageStyle` as needed
     - `onLoad` must emit `e.source.width` / `e.source.height` (callers read those for layout measurement)
     - `onDisplay` fires after image load (`src/components/ContextMenu/index.tsx` uses it)
     - Map `contentFit` → CSS `object-fit`
     - Preserve `loading="lazy"` (the upstream `expo-image+3.0.11.patch` adds this — keep the behavior)
     - `Image.prefetch(string | string[])` and `Image.clearDiskCache()` / `Image.clearMemoryCache()` exist as static methods (the cache ones can be no-ops)
     - Tolerate `placeholder`, `placeholderContentFit`, `transition`, `cachePolicy`, `recyclingKey`, `priority` props (no-op or best-effort)
     - Normalize `source` forms: `{uri: string}`, bare `string`, and `require(...)` module values
   - **`expo-linear-gradient`** — `<View>` with `backgroundImage: linear-gradient(...)`. Stream 3 ran first, so `Animated.createAnimatedComponent(LinearGradient)` callsites are gone — plain component
   - **`expo-blur`** — `<div>` with `backdrop-filter: blur()` + `-webkit-backdrop-filter`. Stream 3 ran first, so `animatedProps`-driven `intensity` is gone — plain numeric prop. Fall back to translucent-only if `backdrop-filter` is unsupported
   - **`expo-clipboard`** — only `setStringAsync` / `setUrlAsync` are called (no reads). `navigator.clipboard.writeText`; optional `execCommand` fallback
   - **`expo-file-system`** has real web callers that need a concrete contract, not generic judgment:
     - `src/view/com/composer/SelectMediaButton.tsx` imports `File` — replace with the browser `File` type or a thin wrapper
     - `src/view/com/composer/drafts/state/storage.ts` imports `Directory`, `File`, `Paths` — pick a real web backend for draft media: IndexedDB (`idb` or hand-rolled), or `localStorage`-stored metadata + `Blob`/object URL for binary, or drop local draft-media persistence entirely. The choice is load-bearing; make it explicitly
     - `src/lib/api/upload-blob.ts` imports `copyAsync` from `expo-file-system/legacy` — on web this is usually a JPEG-copy workaround that `fetch` + `Blob` can replace directly; verify and delete the workaround rather than shimming it
     - `src/view/com/composer/Composer.tsx:47,411-417` uses `FileSystem.File` in an Android-only branch — collapse the branch (Phase 4.5 platform-collapse) so the import goes away rather than shimming
     - `src/state/gallery.ts`, `src/lib/media/video/upload.ts`, `src/screens/Settings/AboutSettings.tsx` — each imports `expo-file-system`; audit at execution time and either shim or rewrite per the contract above
     - **Subpath shim:** the alias must cover both `expo-file-system` AND `expo-file-system/legacy`. Add both entries to `webpack.config.js`, `tsconfig.json paths`, and the later `rsbuild.config.ts resolve.alias`. A single root alias does not catch deep imports
   - **`expo-linking`** — only `useLinkingURL()` is used. Back with `window.location.href` + `popstate`; patch `pushState`/`replaceState` if app-dispatched changes need observation
   - **`expo-localization`** — only `getLocales()` is used. Build from `navigator.languages`; derive `languageTag` / `languageCode` / `regionCode` via `Intl.Locale`
   - **`react-native-keyboard-controller`** — covered in Stream 3, not here. Pass-through wrappers on web; hooks return zeros / no-op. Don't preemptively rebuild the keyboard model — add a `visualViewport` polyfill only if a concrete composer-focus UX issue emerges
2. Alias each shim in `webpack.config.js` (active build) *and* `tsconfig.json` `compilerOptions.paths`. Phase 4.7 will port the same aliases to `rsbuild.config.ts` `resolve.alias`
3. Replace type-only imports with local types: `rg "type .*expo-image-picker|type .*expo-location|type .*expo-translate-text" src`
4. Remove native-only feature UI (notifications registration/settings, contacts import, app-icon settings, OTA screen)
5. Replace `modules/` imports before deleting the `modules/` directory:
   - `modules/bottom-sheet` — **partial replacement needed.** The native BottomSheet UI is shadowed on web, but `modules/bottom-sheet/index.ts` also exports portal helpers (`BottomSheetPortalProvider`, `FullWindowOverlay`-style wrappers) imported by `src/view/shell/index.tsx` and `src/view/com/composer/Composer.tsx` — both web-reachable. Replace those portal exports with web equivalents (radix or plain React portals) before deleting `modules/`
   - `expo-bluesky-swiss-army` → local `PlatformInfo`, `Referrer`, `SharedPrefs`, `updateActiveViewAsync`
   - `expo-background-notification-handler` → no-op provider/hook
   - `expo-scroll-forwarder` → no-op wrapper
   - `expo-bluesky-gif-view` → **adapter, not a drop-in `<img>`**. Callers use ref methods (`playAsync` / `pauseAsync` / `toggleAsync`). The existing web implementation at `modules/expo-bluesky-gif-view/src/GifView.web.tsx` is a controlled `<video>` with those exact methods — promote that file into `src/components/GifView/` and re-point the import
   - `expo-emoji-picker` → **adapter**. DMs export the native module from `src/components/dms/EmojiPopup.tsx`; the web picker lives at `src/components/EmojiPicker/index.web.tsx` with a different API. Write a small adapter, or rewrite the few DM callers
6. Only **after** imports are migrated: `yarn remove` the Expo packages

**Loop until clean** (covers source + build configs — `index.web.js` registerRootComponent, `babel.config.js`'s `babel-preset-expo`, `app.config.js`'s Expo plugin entries, `webpack.config.js`'s `@expo/webpack-config`, and `package.json`'s `resolutions` entries like `**/@expo/image-utils`):
```sh
rg "from ['\"]expo|from ['\"]@expo|@bsky.app/expo|@mozzius/expo|expo-" \
   src package.json index.web.js babel.config.js app.config.js webpack.config.js
rg "modules/" src
```

**Footgun:** some files without a `.web` suffix import native Expo modules but are shadowed by `.web` siblings at resolve time. Preserve the extension ordering before deleting either side.

## Phase 4.4 — In-house remaining `@bsky.app/*` packages

**Motivation:** the fork will diverge from upstream over time, and npm dep boundaries create publish/version friction for code you want to freely mutate. After Phase 4.3 retires the `@bsky.app/expo-*` siblings (and Phase 2.8 already rewrote the storage layer away from `@bsky.app/react-native-mmkv`), three non-Expo packages remain — inline them so the `@bsky.app/*` surface is fully under fork control.

**Scope:** minimal in-housing. Keep current public import surfaces stable so consumers don't change behavior. No API redesigns. (The full ALF redesign — Tailwind, CSS variables, `cx()`, DOM primitives — stays in Appendix A and only runs alongside RNW removal.)

**Disposition table:**

| Package | Web reachable? | Action |
|---|---|---|
| `@bsky.app/alf` | yes | inline under `src/alf/base/` — see 4.4a |
| `@bsky.app/sift` | yes (autocomplete) | inline under `src/lib/sift/` — see 4.4b |
| `@bsky.app/tapper` | yes (composer) | inline under `src/lib/tapper/` — see 4.4c |
| `@bsky.app/react-native-mmkv` | (already gone in Phase 2.8) | — |
| `@bsky.app/video` | **no** — every importer (`List.tsx`, `VideoPreview.tsx`, `VideoEmbedInnerNative.tsx`) is in a file with a `.web.*` sibling | no inlining — `yarn remove` alongside native cleanup in Phase 4.6 |

All packages ship raw source under `node_modules/.../src/` — copy from there directly. The general loop is the same for each: survey the package layout, copy `src/` into the target directory preserving module structure, retarget all `from '@bsky.app/<pkg>'` imports in our source, `yarn remove`, verify `rg "@bsky.app/<pkg>" src package.json yarn.lock` is empty.

### 4.4a — `@bsky.app/alf`

The largest of the three. The target layout under `src/alf/base/` mirrors the upstream `src/` tree: subdirs `atoms/`, `platform/`, `utils/`, `utils/flatten/`, plus top-level `themes.ts`, `palette.ts`, `tokens.ts`, `types.ts`. Platform variants are **module-scoped** (`atoms/index.native.ts`, `utils/flatten/index.web.ts`), not file-scoped — preserve that layout.

- [ ] Inventory + survey layout:
  ```sh
  rg -n "@bsky.app/alf" src package.json
  find node_modules/@bsky.app/alf/src -type f \( -name '*.web.*' -o -name '*.native.*' \)
  ```
- [ ] Copy `node_modules/@bsky.app/alf/src/` → `src/alf/base/` (preserve module structure)
- [ ] **Skip native variants entirely.** Don't copy `platform/index.native.ts` OR `atoms/index.native.ts`. Upstream `atoms/index.native.ts` imports `{ios, isFabric}` from `../platform`, so if you copy native atoms AND simplify platform exports (next bullet, which drops `isFabric`), typecheck fails. The fork is web-only — there's no platform resolution for these to feed; skipping both keeps the in-housing clean. (Aside: if a stray import of native atoms shows up after the copy, that file is in scope for the Phase 4.5 platform-branch collapse, not for 4.4.)
- [ ] **Simplify the platform helpers** in `src/alf/base/platform/index.ts` since this fork is web-only. The upstream helpers conditionally check `isWeb` / `isIOS` etc.; with `isWeb=true` hardcoded those conditionals are always evaluated but always pick the same branch. Replace with direct identities — `web = <T>(v: T): T => v` (true identity), `ios = android = native = (): undefined => undefined`, `platform = <T>(specifics: {web?: T, default?: T}) => specifics.web ?? specifics.default`. Drop the `isIOS`/`isAndroid`/`isNative`/`isFabric` exports — they duplicate `#/env` constants and have no surviving callers worth keeping (the native-atom file that consumed them is already not copied per the previous bullet). This makes the helpers semantically web-only across the 413 callsites in 178 files (`rg -c "\\b(web|native|ios|android|platform)\\(" src`) without touching any of them yet — call-site simplification is opportunistic in Phase 4.5
- [ ] Retarget intra-`src/alf/` imports to `#/alf/base/*` — including the sub-path imports `@bsky.app/alf/dist/tokens` and `@bsky.app/alf/dist/utils`
- [ ] Retarget external consumers (7 files use `{utils}` or `{type ThemeName}` — `rg "from '@bsky.app/alf'" src` to enumerate). Repoint to `#/alf`, not `#/alf/base/*` directly, so the public surface stays the gate
- [ ] `yarn remove @bsky.app/alf`
- [ ] Update `src/alf/README.md` with one or two sentences on the in-housing

**Footguns:**
- `src/alf/themes.ts` imports `createThemes`, `DEFAULT_PALETTE`, `DEFAULT_SUBDUED_PALETTE` as **runtime values**, not type-only. Vendor `themes.ts` + `palette.ts` accordingly — easy to miss if you skim for named exports
- Resist redesign. No Tailwind / CSS vars / `cx()` / DOM primitives yet — those are post-RNW work in Appendix A

### 4.4b — `@bsky.app/sift`

5 source files (autocomplete component), with module-scoped `.web.ts` variants for `computeStyles` and `useKeyboardHandling`.

- [ ] Copy `node_modules/@bsky.app/sift/src/` → `src/lib/sift/`
- [ ] Retarget `from '@bsky.app/sift'` imports (use `rg` to enumerate — around 7 callers at fork time across `Autocomplete*`, `Composer/index.tsx`, `view/shell/desktop/Search.tsx`)
- [ ] `yarn remove @bsky.app/sift`

### 4.4c — `@bsky.app/tapper`

4 source files (rich-text editor utilities), pure JS, no platform variants. Single caller at fork time: `src/components/Composer/index.tsx`.

- [ ] Copy `node_modules/@bsky.app/tapper/src/` → `src/lib/tapper/`
- [ ] Retarget the import in `Composer/index.tsx`
- [ ] `yarn remove @bsky.app/tapper`

**Done when:**
- `rg "@bsky.app/(alf|sift|tapper|react-native-mmkv|video)" src package.json yarn.lock` returns nothing
- `rg '"@bsky\\.app/' package.json yarn.lock` returns nothing (catches any in-house package still referenced)
- `yarn typecheck && yarn build-web` passes
- App boots and looks identical to before the in-housing

## Phase 4.5 — Collapse residual platform branches

**Motivation:** thousands of platform-flag checks scattered across `src/`. Folding them is purely mechanical: every `IS_NATIVE` is `false`, every `IS_WEB` is `true`, every `Platform.OS` is `'web'`, every `web(x)` is `x`, every `ios(x)` / `android(x)` / `native(x)` is `undefined`. This is the canonical jscodeshift target in the roadmap — don't sweep ~600+ callsites by hand.

### 4.5a — Run the platform-collapse codemod

Write a single jscodeshift transform under `.jscodeshift/repo/collapse-platform.js` that does the inline-and-fold. Land as **one commit**: large diff but mechanically reviewable.

**Constants to fold to literals** (re-verify exports in `src/env/index.web.ts`, `src/env/common.ts`, and `src/alf/base/platform/index.ts` before running — the list may have drifted):

| Symbol | Folds to | Source |
|---|---|---|
| `IS_NATIVE` | `false` | `#/env` |
| `IS_WEB` | `true` | `#/env` |
| `IS_IOS` | `false` | `#/env` |
| `IS_ANDROID` | `false` | `#/env` |
| `IS_LIQUID_GLASS` | `false` | `#/env` (iOS 26+ only) |
| `IS_TRANSLATION_SUPPORTED` | `false` | `#/env` (iOS Apple Translation only) |
| `IS_TESTFLIGHT` | `false` | `#/env/common` (iOS TestFlight only) |
| `Platform.OS` | `'web'` | `react-native` |

**Stays — these are runtime browser checks and must not fold:** `IS_WEB_MOBILE`, `IS_WEB_MOBILE_IOS`, `IS_WEB_MOBILE_ANDROID`, `IS_WEB_TOUCH_DEVICE`, `IS_WEB_SAFARI`, `IS_WEB_FIREFOX`, `IS_HIGH_DPI`, `IS_DEV`, `IS_INTERNAL`, `__DEV__`. The codemod must allowlist by name — substring-matching on `IS_` would catch these.

**Helpers to fold** (web-only `#/alf` platform helpers, Phase 4.4 already simplified the implementations):

| Pattern | Folds to |
|---|---|
| `web(x)` | `x` (identity) |
| `ios(x)` | `undefined` |
| `android(x)` | `undefined` |
| `native(x)` | `undefined` |
| `platform({web, ios, android, default, ...})` | `web` if present, else `default`, else `undefined` |

**Downstream simplifications the same pass should do** (so the diff doesn't ship raw `if (false) {...}` everywhere):

| Pattern after fold | Folds to |
|---|---|
| `if (false) { A } else { B }` | `B` (drop the then-branch; if no else, drop the whole `if`) |
| `if (true) { A } else { B }` | `A` (drop the else-branch) |
| `false ? A : B` | `B` |
| `true ? A : B` | `A` |
| `false && X` | `false` |
| `true && X` | `X` |
| `false \|\| X` | `X` |
| `true \|\| X` | `true` |
| `!false` | `true` |
| `!true` | `false` |
| `Platform.OS === 'web'` | `true` |
| `Platform.OS === 'ios'` / `=== 'android'` | `false` |
| `Platform.OS !== 'web'` | `false` |

**Cleanups the codemod ALSO does** (do them in the same transform — manually doing them across hundreds of files is the slow path):

- **JSX interpolation collapse:** `{true && X}` → `{X}`. `{false && X}` → remove the entire `{...}` child node (React was skipping it anyway; the source becomes cleaner). Same for `{false ? A : B}` → `{B}`, `{true ? A : B}` → `{A}`
- **Style array filtering:** `[a, false, b]` and `[a, true, b]` → `[a, b]` (drop the literal). RN/RNW tolerates falsy entries at runtime, but the source stays cleaner if they're filtered. Skip filtering if the array becomes a single element (`[x]` vs `x` is a style API distinction)
- **`useEffect` / `useMemo` / `useCallback` dependency arrays:** `[true, foo]` → `[foo]`. Strip literal values from dep arrays — they're stable-identity, contribute nothing
- **Dead-branch deletion:** `if (false) { ... }` → delete the entire statement (not just the branch). `if (true) { A } else { B }` → replace with `A` as a block (or inline if single statement). This avoids TypeScript narrowing complaints in dead branches and avoids leaving `if (false)` corpses for the manual pass to clean up
- **Empty-block cleanup:** if a function body collapses to `{}` after dead-branch deletion, leave it (the codemod doesn't try to inline functions at callers; that's manual review territory)
- **Iterate to fixed point:** folding one constant can reveal more constants to fold (e.g. `if (web(IS_NATIVE)) {...}` → `if (web(false)) {...}` → `if (false) {...}` → deleted). The codemod should re-apply itself until no changes, OR document that it must be run multiple times. Easier path: build the transform as one visitor that walks the AST and applies all rules in one pass per file, repeating per-file until the AST stabilizes
- **Unused-import cleanup:** after folding, `import {IS_NATIVE, Platform} from '...'` becomes dead. Drop unused specifiers; drop the whole import if all specifiers go. This catches the `Platform` import from `react-native` once `Platform.OS` is folded out

### 4.5b — Manual touch-up pass (small)

After the codemod lands, the remaining work is bounded:
- [ ] `yarn typecheck` — fix anything the codemod couldn't reach. Most common cause: function whose body collapsed to a no-op now has a return-type mismatch, or a parameter became unused. Quick to fix
- [ ] `yarn build-web` — sanity check
- [ ] **Refactoring opportunities the codemod creates but doesn't take.** Examples:
  - A function whose body is now a single expression — inline at callers if the function is in scope
  - A `useMemo` whose only purpose was a platform conditional, now memoizing a constant — drop the hook
  - A component file that became a thin wrapper after the conditional disappeared — consider deleting and pointing callers at the wrapped component directly

  These are judgment calls. **Skip per the "stay in scope" convention** unless the file in question is already in another phase's scope
- [ ] **Prose comments referencing the platform conditional** — codemod can't update English text accurately. Grep for stale comments referencing iOS / Android / native / `IS_NATIVE` and fix or delete:
  ```sh
  rg "// .*(IS_NATIVE|iOS only|Android only|native only|web only)" src
  ```
- [ ] Verify no callsites of the folded helpers remain:
  ```sh
  rg "IS_NATIVE|IS_IOS|IS_ANDROID|IS_LIQUID_GLASS|IS_TRANSLATION_SUPPORTED|IS_TESTFLIGHT|Platform\.OS|\\b(web|ios|android|native|platform)\(" src --glob '!locale/**'
  ```
  Expected hits: only `IS_WEB_MOBILE` / `IS_WEB_TOUCH_DEVICE` / etc. (the dynamic browser-detection allowlist) and any `web`/`native`/etc. that happen to be local variable names (not the helpers). Spot-check that nothing real survives

**Recovery:** if the codemod produces a diff that's worse than expected, `git checkout -- src/` reverts cleanly. Iterate on the transform, re-run. That's the value of doing this as a codemod rather than ~600 hand edits.

### 4.5c — Delete native-only source files

- [ ] **Module-load guarded-import sweep is part of Phase 4.3a** — by the time you reach 4.5, those files should already be split / no-op'd / deleted, and any remaining `IS_WEB`-guarded expo imports are real bugs to address as you encounter them
- [ ] Delete native-only files once the codemod and typecheck confirm nothing resolves to them: `src/App.native.tsx`, `*.ios.tsx`, `*.android.tsx`, `*.native.tsx`, `index.js`
- [ ] Rename `.web.tsx`/`.web.ts` → `.tsx`/`.ts` once their non-web siblings are gone (this is what makes Phase 4.7's rsbuild config simple)
- [ ] First targets:
  - `src/env/`: **don't flatten the whole module into constants.** `src/env/index.web.ts` already exports the right static booleans (`IS_NATIVE=false`, `IS_WEB=true`, …) AND computes browser-specific flags dynamically (mobile-Safari detection, etc.). Delete `src/env/index.ts` (the native variant), then rename `src/env/index.web.ts` → `src/env/index.ts`. Keep the dynamic browser-flag logic. **Also delete `GCP_PROJECT_ID` from `src/env/common.ts`** — it only feeds the Android Play Integrity warmup and gets unreferenced as soon as the IS_ANDROID branches collapse
  - `src/Navigation.tsx` notification/linking imports
  - **VideoFeed feature deletion.** `src/screens/VideoFeed/` is a TikTok-style swipeable video feed that ships as a `null` stub on web (`VideoFeed.web.tsx` returns nothing) — the platform collapse alone would just delete the native file and leave a no-op route. Better: delete the whole feature explicitly. `rm -rf src/screens/VideoFeed`, drop the `VideoFeed: '/video-feed'` entry from `src/routes.ts`, and drop the import + `<Stack.Screen name="VideoFeed">` registration from `src/Navigation.tsx`. Then re-verify the deferred `yarn remove expo-video` (the only non-`.web` importer was `VideoFeed/index.tsx` + `Scrubber.tsx`)
  - `src/lib/notifications/*` — careful with `resetBadgeCount()`. It calls `BackgroundNotificationHandler` and `expo-notifications` **without** an `IS_NATIVE` guard at fork time, but is reached on web from `src/state/queries/notifications/unread.tsx`'s `markAllRead()`. Explicitly stub or delete it — not just "trim imports"
  - `src/screens/Signup/index.tsx`: remove the `ReactNativeDeviceAttest.warmupIntegrity(GCP_PROJECT_ID)` block (Android-only attestation warmup) and the `GCP_PROJECT_ID` import
  - `src/screens/Signup/StepCaptcha/index.tsx`: collapse `const CAPTCHA_PATH = IS_WEB || GCP_PROJECT_ID === 0 ? '/gate/signup' : '/gate/signup/attempt-attest'` to just `'/gate/signup'`. Delete the `StepCaptchaNative` component and `ReactNativeDeviceAttest` import
  - `src/screens/Settings/components/OTAInfo.tsx`
  - `src/screens/Settings/AppIconSettings/*`
  - `src/Splash.tsx` (native variant — `Splash.web.tsx` wins)
  - `src/locale/i18n.ts` (native variant — `i18n.web.ts` wins). This is the last referrer of the `@formatjs/intl-*` polyfills. After this file is gone, `yarn remove @formatjs/intl-locale @formatjs/intl-pluralrules @formatjs/intl-numberformat @formatjs/intl-displaynames` (and any `@formatjs/intl-*/locale-data/*` siblings) — modern browsers have native `Intl` and Phase 2.11 narrowed us to English only
- [ ] **Deferred dep removals — execute at the end of this phase.** Several packages were marked "defer to 4.5" by earlier phases because their last importers were typecheck-visible native files. After the deletions above land, those packages are orphan and removable:
  ```sh
  yarn remove expo-video @bsky.app/video
  ```
  (Add other deferred-to-4.5 entries here as they accumulate during execution — search for "defer ... to Phase 4.5" in earlier sections of this document.) Re-verify with `rg -n "from ['\"]expo-video|@bsky.app/video" src` — must be empty before `yarn remove`.

**Footgun:** `Platform.OS === 'web'` does **not** distinguish mobile-browser from desktop-browser — `Platform.OS` only ever returns `'ios'`, `'android'`, or `'web'`. Collapsing `Platform.OS === 'web'` to `true` is safe. If a callsite needs mobile-vs-desktop differentiation, the existing flags exported from `src/env/index.web.ts` are what to look for: `IS_WEB_MOBILE`, `IS_WEB_MOBILE_IOS`, `IS_WEB_MOBILE_ANDROID`, `IS_WEB_TOUCH_DEVICE`, `IS_WEB_FIREFOX` (all backed by `matchMedia` / `navigator.userAgent`). Those stay even after the platform-branch collapse.

## Phase 4.6 — Native project & asset cleanup

By this point Phase 4.5 has deleted every `.native.tsx` / `.ios.tsx` / `.android.tsx` source file — so the native *projects* and build artifacts that backed them can go too. Build configs (`app.config.js`, `babel.config.js`, `webpack.config.js`) stay until Phase 4.7 because the current `build-web` script is still `expo export:web` and reads them.

```sh
rm -rf ios android modules plugins code-signing
rm -f eas.json metro.config.js Gemfile Gemfile.lock
rm -f google-services.json google-services.json.example  # tracked example + gitignored actual file
rm -f .buckconfig .easignore
rm -f scripts/useBuildNumberEnv.sh scripts/useBuildNumberEnvWithBump.sh scripts/bundleUpdate.sh scripts/bundleUpdate.js
rm -f scripts/updateExtensions.sh scripts/setGitHubOutput.sh
rm -rf scripts/push-notification  # simulator/APNS-only — README.md + send.sh
```

**Stays until Phase 4.7:** `app.config.js` (read by `expo export:web`), `babel.config.js` (references `babel-preset-expo`), `webpack.config.js` (the active build pipeline). All three get deleted in the rsbuild migration commit.

**Asset triage — do NOT `rm -rf assets`:**
- Keep anything referenced from `src/`, `web/`, or the build config. Fork-time keep-list: `assets/favicon.png`, `assets/fonts/inter/*.woff2`, `assets/icons/`, `assets/icons/flags/*` (used by `src/lib/international-telephone-codes.ts` — survives if phone-code locale fallback in Phase 2.4 kept the picker; gone if not), `assets/images/onboarding/*`, `assets/images/*`, `assets/kawaii.png`, `assets/kawaii_smol.png`, `assets/logo.png`
- Find safe deletes (cross-check against the platform-branch collapse in Phase 4.5, since `rg "assets/"` will turn up refs in about-to-be-deleted shadowed files):
  ```sh
  rg "require\\([^)]*assets/|['\"]/?assets/|assets/" src web rsbuild.config.ts webpack.config.js package.json
  find assets -type f | sort
  ```
- Likely-safe (native-only) categories: `app-icons/**` (referenced only by `AppIconSettings/*` which Phase 4.3 deletes), Android adaptive icons, DM notification sounds, native splash images (Splash.web.tsx uses inline SVG)
- **Verify by build.** Some assets are imported dynamically — watch the browser console for 404s after deletion.

## Phase 4.7 — Migrate webpack → rsbuild

**Motivation:** at this point the strip is done: no `expo-*` runtime packages, no Sentry, all `@bsky.app/*` packages are in-housed (Phase 4.4) or deleted (4.5), native files are gone, platform branches are collapsed to plain `.tsx`, and `react-native-reanimated`/`react-native-gesture-handler`/`react-native-keyboard-controller` were removed in Stream 3. The webpack build (currently via `@expo/webpack-config`) has gotten us here; now swap it for rsbuild in a single phase. Because everything above already happened, the rsbuild config is short — no `.web.*` extension prepending, no `node_modules` exemptions for in-house packages, no Reanimated Babel plugin, no gesture-handler stub alias.

### Add / drop dependencies and the deferred build configs

```sh
yarn add -D @rsbuild/core @rsbuild/plugin-react @rsbuild/plugin-babel babel-loader
yarn remove expo @expo/webpack-config babel-preset-expo babel-plugin-module-resolver @babel/preset-env @babel/preset-react @babel/preset-typescript webpack-bundle-analyzer @pmmmwh/react-refresh-webpack-plugin @sentry/webpack-plugin
rm -f webpack.config.js app.config.js babel.config.js
```

The `expo` / `@expo/webpack-config` / `babel-preset-expo` trio is deferred from Phase 4.3 to here — these are build-tool deps that the active webpack pipeline depended on. Same with `app.config.js` (deferred from Phase 4.6 — `expo export:web` reads it) and `babel.config.js` (references `babel-preset-expo`). After the `build-web` script swaps to `rsbuild build` below, all of these are safe to remove in this commit.

Keep: `@babel/core`, `@lingui/babel-plugin-lingui-macro`, `babel-plugin-react-compiler`.

**Architecture:** `@rsbuild/plugin-react` enables SWC for transpile/JSX/TS + React Fast Refresh. `@rsbuild/plugin-babel` adds a second pass that runs only the Lingui macro and React Compiler — both are still Babel-only in 2026 (per Rspack's React docs). The plugin order inside `babelLoaderOptions` is critical: Lingui macro must expand **before** React Compiler sees the code, otherwise the compiler memoizes stale macro calls. SWC doesn't type-check; `yarn typecheck` runs separately, but the `build-web` script chains it (wired up in Phase 1.1) so a successful build implies passing types.

**Future optimization:** `@lingui/swc-plugin` exists and supports Lingui v5/v6 but is flagged experimental with no semver guarantees. Adopt once stable — combined with a future React Compiler SWC plugin, it would let us drop `babel-loader` and `@rsbuild/plugin-babel` entirely.

### Create `rsbuild.config.ts`

```ts
import path from 'node:path'
import {defineConfig} from '@rsbuild/core'
import {pluginReact} from '@rsbuild/plugin-react'
import {pluginBabel} from '@rsbuild/plugin-babel'

// Regenerate this list from a live grep at the time you write the config.
// By this point (post-Streams 1/2/3 + Phases 4.2-4.6) the env-key surface is
// much smaller than the upstream baseline — METRICS/GROWTHBOOK/SENTRY_DSN/
// BITDRIFT/GEOLOCATION/LIVE_EVENTS/APP_CONFIG/JEST_WORKER_ID are gone, and
// EXPO_PUBLIC_GCP_PROJECT_ID (Android-only Play Integrity attestation, dead
// once Phase 4.5 constant-folds IS_ANDROID → false) goes with the native code.
//
//   rg -oN "process\.env\.[A-Z_][A-Z0-9_]*" src index.web.js | sort -u
const publicEnvKeys = [
  'EXPO_PUBLIC_RELEASE_VERSION',
  'EXPO_PUBLIC_ENV',
  'EXPO_PUBLIC_BUNDLE_IDENTIFIER',
  'EXPO_PUBLIC_BUNDLE_DATE',
  'EXPO_PUBLIC_LOG_LEVEL',
  'EXPO_PUBLIC_LOG_DEBUG',
  'EXPO_PUBLIC_BLUESKY_PROXY_DID',
  'EXPO_PUBLIC_CHAT_PROXY_DID',
]

const define = Object.fromEntries(
  publicEnvKeys.map(key => [`process.env.${key}`, JSON.stringify(process.env[key])]),
)

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.[jt]sx?$/,
      exclude: /[\\/]node_modules[\\/]/,
      babelLoaderOptions(opts) {
        opts.plugins ||= []
        // Lingui macro must run BEFORE React Compiler sees the code.
        opts.plugins.unshift(
          '@lingui/babel-plugin-lingui-macro',
          ['babel-plugin-react-compiler', {target: '19'}],
        )
      },
    }),
  ],
  source: {
    entry: {index: path.resolve(__dirname, 'index.web.js')},
    define: {
      ...define,
      // Rsbuild defines process.env.NODE_ENV by default but NOT __DEV__,
      // which RNW internals and some app files still read.
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    },
  },
  html: {
    // Template has no <title> tag (removed in this phase) so html.title is honored.
    template: path.resolve(__dirname, 'web/index.html'),
    title: 'Bluesky',
    favicon: path.resolve(__dirname, 'assets/favicon.png'),
  },
  resolve: {
    alias: {
      '#': path.resolve(__dirname, 'src'),
      crypto: path.resolve(__dirname, 'src/platform/crypto.ts'),
      'react-native$': 'react-native-web',
      'react-native-webview': 'react-native-web-webview',
      // Existing kludge from webpack.config.js — force ESM build of unicode-segmenter.
      'unicode-segmenter/grapheme': require
        .resolve('unicode-segmenter/grapheme')
        .replace(/\.cjs$/, '.js'),
    },
  },
  server: {
    port: 19006,
    historyApiFallback: true,
  },
  output: {
    distPath: {root: 'web-build'},
    cleanDistPath: true,
  },
})
```

### Adjust `web/index.html`

- [ ] **Remove** the `<title>%WEB_TITLE%</title>` tag entirely. Rsbuild's html plugin only injects `<title>` from `html.title` when the template has no `<title>` element; if you keep one, the config is silently ignored
- [ ] Remove the hardcoded `<link rel="stylesheet" href="/static/style.css">` — `src/App.web.tsx` already imports `./style.css`
- [ ] **Fonts.** Phase 4.3 already moved `@font-face` rules into `src/style.css` (paired with the `expo-font` removal) — verify that's still the case and that the paths use relative `url('../assets/fonts/inter/...')`. Rsbuild's default asset pipeline picks these up and emits hashed filenames automatically. If for any reason the fonts still reference Expo's `/static/media/*.woff2` paths, move them now — Rsbuild won't emit those paths.

### Rsbuild gotchas to handle in the config

- [ ] **`postMock.html` rule.** The current `webpack.config.js` has a file-loader rule for `react-native-web-webview`'s `postMock.html` (it ships an HTML file the WebView mounts). Rsbuild's default pipeline won't emit it. Either (a) add an Rspack module rule that copies `node_modules/react-native-web-webview/.../postMock.html` to the output, or (b) replace the `react-native-web-webview` dep itself (its only consumer is `ExternalEmbed/ExternalPlayer.tsx` via the `react-native-webview` alias; an inline iframe would work for the same content). Pick (b) if you don't want to keep WebView at all
- [ ] **`__DEV__` define.** The snippet uses `JSON.stringify(process.env.NODE_ENV !== 'production')` at config-load time, which is wrong if `NODE_ENV` is unset when `rsbuild.config.ts` is evaluated. Replace with the mode callback:
  ```ts
  export default defineConfig(({envMode}) => ({
    source: {
      define: {
        __DEV__: JSON.stringify(envMode !== 'production'),
        // ...
      },
    },
    // ...
  }))
  ```
  Rsbuild passes `envMode` from `--env-mode` flag or `NODE_ENV`, with sensible defaults
- [ ] **Subpath aliases.** If any shims survive into Phase 4.7 (per the Conventions reclassification: `expo-image` / `expo-file-system` / `expo-clipboard` / `expo-linking` / `expo-localization` are long-lived adapters, not retired here), each shim's `resolve.alias` entry must cover deep imports too: `expo-file-system` AND `expo-file-system/legacy`, etc. Single-root aliases don't catch deep imports
- [ ] **Unicode-segmenter alias.** The carried-over `'unicode-segmenter/grapheme': require.resolve(...).replace(/\.cjs$/, '.js')` kludge probably isn't needed under Rspack — the package exports include ESM. Drop the alias, run `yarn rsbuild build`, and only re-add if the build actually fails on it

### Done when

```sh
yarn install
yarn typecheck
yarn rsbuild dev    # boots cleanly
yarn rsbuild build  # produces web-build/
```
all pass, and `rg "webpack|@expo/webpack-config" .` returns no source/config hits.

**On-demand bundle inspection** (no permanent config): the runnable Rsdoctor CLI is `@rsdoctor/cli`. Use `npx @rsdoctor/cli analyze ...` against a production build, or temporarily wire `RsdoctorRspackPlugin` from `@rsdoctor/rspack-plugin` into `tools.rspack.plugins` and remove again.

## Phase 4.8 — `package.json` cleanup

**Suggested final `scripts` block:**

```json
{
  "postinstall": "patch-package && yarn intl:compile-if-needed",

  "web": "yarn dev",
  "dev": "rsbuild dev",
  "build-web": "yarn typecheck && rsbuild build",
  "build": "yarn build-web",
  "preview": "rsbuild preview",

  "lint": "eslint --cache --quiet src",
  "typecheck": "tsgo --project ./tsconfig.check.json",

  "intl:build": "yarn intl:extract && yarn intl:compile",
  "intl:extract": "lingui extract --clean --locale en",
  "intl:compile": "lingui compile",
  "intl:compile-if-needed": "is-ci || [ -f src/locale/locales/en/messages.ts ] || yarn intl:compile",

  "icons:optimize": "svgo -f ./assets/icons",
  "nuke": "rm -rf ./node_modules ./web-build"
}
```

Note: `rsbuild preview` requires a prior production build (`yarn build-web`).

**Also remove from `package.json`:**
- [ ] Top-level `expo` field
- [ ] Top-level `jest` block (if not done in Stream 1)
- [ ] Native/EAS scripts, embed scripts, E2E/perf scripts, Sentry upload scripts, native lint scripts
- [ ] **Native-only `react-native-*` packages now orphan after Phase 4.5.** Each importer at fork time lives either in a native-suffixed file (`.ios.tsx`, `.android.tsx`) or in a file shadowed by a `.web.*` sibling — Phase 4.5 deletes both kinds. After that, the dep tree has zero source importers and `yarn remove` is a single batch:
  ```sh
  yarn remove react-native-screens react-native-pager-view react-native-drawer-layout \
              react-native-compressor react-native-date-picker react-native-device-attest
  ```
  None of these have entries in `patches/` at fork time — re-verify with `ls patches/` before running. Excluded for cause: `react-native-webview` (still aliased to `react-native-web-webview` for `ExternalPlayer.tsx`), `react-native-uitextview` (web-reachable from Typography), `react-native-edge-to-edge` + `react-native-view-shot` + `react-native-progress` + `react-native-qrcode-styled` (real web callers that need replacement, not removal — out of scope here)
- [ ] **`react-native-uuid` closeout** (deferred in Phase 2.8). Its last fork-time importer was `src/lib/media/manip.ts` (native variant); Phase 4.5 collapses that file to the web variant, and the analytics-identifier callers died in Phase 2.7. Verify zero importers, then `yarn remove react-native-uuid`
- [ ] **`@react-native-async-storage/async-storage` — verify only.** This already ran in Phase 2.9 (residual cleanup). At this point the package should be absent from `package.json` / `yarn.lock`; `rg "@react-native-async-storage/async-storage" .` should be empty across the tree. If it's still there, Phase 2.9 was skipped — fix that and skip this bullet

**Keep:**
- React / React DOM
- React Native + React Native Web (for now — RNW removal is Appendix A)
- Lingui, TanStack Query, ATProto deps
- The in-housed `@bsky.app/*` surfaces under `#/alf`, `#/lib/sift`, `#/lib/tapper` (the npm deps themselves are **gone** by this point — `react-native-mmkv` removed in Phase 2.8, the rest in Phase 4.4)
- Runtime deps that still compile in the web build
- ESLint / TypeScript / Lingui tooling
- `patch-package` if patches still apply

**Footguns:**
- Don't remove `react-native` yet — `react-native-web` aliases it.
- Don't remove `@react-navigation/*` — that's deferred to Appendix A.
- `react-native-reanimated` and `react-native-gesture-handler` should have already been removed by Stream 3 — verify they're absent.
- Re-run `yarn install` after each significant dependency batch.

## Phase 4.9 — Final verification

**Build verification:**
```sh
yarn install
yarn typecheck
yarn lint
yarn build-web
yarn dev
```

**Final sweep:**
```sh
rg "expo|@expo|@sentry/react-native|bskyweb|bskyembed|bskylink|bskyogcard|maestro|flashlight|jest|husky" package.json src web rsbuild.config.ts
rg "modules/" src
```

**Bundle sanity** (on-demand only — no permanent analyzer plugin in `rsbuild.config.ts`):
```sh
# One-shot bundle inspection via Rsdoctor — runnable CLI
npx @rsdoctor/cli analyze
# Or wire RsdoctorRspackPlugin from @rsdoctor/rspack-plugin into tools.rspack.plugins temporarily
```

**Browser smoke checklist:**
- [ ] App loads at `/`
- [ ] Hard-refresh on nested routes works (`historyApiFallback`)
- [ ] Logged-out home renders
- [ ] Login works
- [ ] Timeline loads
- [ ] Profile page loads
- [ ] Post thread loads
- [ ] Search works
- [ ] Composer opens, text post submits
- [ ] **Media — distinct surfaces** (don't lump these — Streams 1-4 each touch a different piece):
  - [ ] Image upload (composer → post timeline thumbnail)
  - [ ] Hosted images render (feed thumbnails, lightbox open)
  - [ ] Video post inline playback (`<video>` element in `VideoEmbedInnerWeb`)
  - [ ] Video scrubber drags correctly (`web-controls/Scrubber`)
  - [ ] Video upload (composer → posted video — `src/lib/media/video/upload.web.ts`)
  - [ ] GIF post playback (`src/components/Post/Embed/ExternalEmbed/Gif.tsx` — `playAsync`/`pauseAsync` controlled `<video>`)
  - [ ] External GIF embed (separate code path in `ExternalEmbed/index.tsx`)
  - [ ] Link-card preview (text + thumbnail)
  - [ ] Audio / music external embeds (Spotify / Apple Music — `src/lib/strings/embed-player.ts`)
- [ ] Notifications page degrades gracefully without push registration
- [ ] DMs load
- [ ] Settings/About renders without OTA/Sentry/native app info
- [ ] Copy/share actions work with browser-clipboard / `navigator.share` fallback
- [ ] External links open correctly
- [ ] Mobile-viewport layout works in browser devtools

**"Nothing essential deleted" signals:**
- No missing-asset 404s in the browser console
- No unresolved-module errors from Rspack
- No runtime references to `NativeModules`
- No `expo` imports in the emitted dependency graph
- Core ATProto API calls still succeed

---

# Upstream PR cherry-pick queue

Curated list of unmerged upstream PRs to bring into this fork, with surgery notes per PR. Verdicts from a multi-agent review pass that pulled diffs, checked completeness, and cross-referenced the stream removals. Per-PR entries describe what to actually do at cherry-pick time — many of these aren't clean `git cherry-pick` operations because the diffs include feature-flag plumbing, native-only hunks, or AA gates that the streams remove.

**Convention:** all PR numbers refer to `bluesky-social/social-app`. Fetch a PR's diff with `gh pr diff <num> --repo bluesky-social/social-app`. Re-check each PR's state before applying — descriptions reflect upstream state at review time, which drifts.

## Clean takes — apply any time

These cherry-pick cleanly or with cosmetic adjustments only.

| PR | Title | Cherry-pick notes |
|---|---|---|
| **10047** | Fix Firefox web video/audio desync (mozzius) | Applies cleanly. Take before 10499 — same file (`VideoEmbedInnerWeb.tsx`), non-overlapping hunks, but 10047 first eases line alignment |
| **10499** | Detect missing H.264/AAC codec on web (mozzius) | Independent of 10047 functionally. Touches `index.web.tsx` error copy — next i18n extract picks up the new string |
| **10311** | Fix crash on `bsky.app` URLs with query params (aveao) | Adds opt-in `stripSearch` and threads through 4 callsites; clean apply |
| **9613** | Optimize `getLikelyType` (~23KB bundle, mozzius) | Switch-case rewrite with parity test. **The test file lands under `__tests__/` which Phase 1.2 deletes** — either run the parity check ad-hoc and drop the test, or relocate it as a co-located `link-meta.test.ts` next to the source |
| **9415** | QR code text alignment (mozzius) | Title says Android but the fix is unconditional — `<View>` parent instead of `<Text>` parent, semantically correct everywhere |
| **9628** | 'Clear All' button on search history (darnfish) | Re-author the new strings using `@lingui/react/macro` (`` l`Clear All` ``) to match the fork's existing pattern in `SearchHistory.tsx`. Switch the upstream `variant="ghost"` to `color="secondary"` per fork CLAUDE.md |
| **9545** | Fix noscript styles (mozzius) | Take only the `bskyweb/templates/base.html` hunk. Skip the `.github/` workflow change. Apply **before Phase 1.1**, or port the one-line CSS fix into `web/index.html` which is the long-term home |
| **10451** | Chat inviter display-name badges (ds-boyce) | One-file `<ProfileBadges>` insertion into `InviterHeader`. Lingui interpolation will trigger re-extract |
| **10513** | Persist splitview left-column scroll (mozzius) | **Not clean — re-classify as surgical.** The PR adds `react-native-reanimated` type imports and a worklet `'worklet'` scroll handler. Two options: (a) **apply before Stream 3** so the Reanimated migration in Phase 3.3 sweeps it like everything else, or (b) port to plain RNW `onScroll` at cherry-pick time — see Phase 3.3 matrix row for `useAnimatedScrollHandler`. Don't take it "any time" between Streams 3 and 4 — it reintroduces a Reanimated dep that's already been removed |
| **10303** | Hide vertical-video pillarboxing (abenzer) | Eyeball the change before committing: flips landscape-thumbnail rendering from `contain` to `cover` cropping |

## Surgical takes — pick hunks, drop conflicts

These require touching only specific hunks of the diff, dropping others that conflict with the stream removals.

### 10497 — Enable 300mb video uploads (mozzius)

The PR is structurally a `LargeVideoUploads` feature-flag rollout. **Do not cherry-pick** — Phase 2.1 deletes the GrowthBook features enum and Phase 2.2 deletes the whole `src/analytics/features/` directory.

Instead land as a small constant + copy change:
- `src/lib/constants.ts`: `VIDEO_MAX_SIZE = 1000 * 1000 * 300`
- `src/lib/media/video/errors.ts`: matching error copy update
- `src/view/com/composer/state/video.ts:390-437`: the composer state still hard-codes the 100MB number in the Lingui message and the server-error matching. Both need to be bumped to 300MB to match the new constant
- Drop everything else in the upstream diff (the `TEMP_enableLargeVideoUploads` param threading, the Composer.tsx churn, the features enum entry)

**Apply during or after Phase 2.1.** Server-side PDS limit may still cap regardless of client-side bump — verify against your PDS config.

### 10094 — Preserve PNG transparency on image upload (alvesykes)

Take only the web hunks:
- `src/lib/media/manip.web.ts` (canvas `toDataURL` outputMime plumbing)
- `src/state/gallery.ts` (`preserveTransparency` flag on `compressImage`)
- `src/view/com/util/UserAvatar.tsx`
- `src/view/com/util/UserBanner.tsx`

Drop the native `src/lib/media/manip.ts` hunk and the `jest/jestSetup.js` PNG-mock change.

**Apply any time.** Flag for Phase 4.3 expo-image-manipulator shim spec: must accept `SaveFormat.PNG` and pass through to `canvas.toDataURL('image/png')` with transparency preserved.

### 10454 — Preview invite links in composer (ds-boyce)

Mandatory `@atproto/api` bump: `0.19.15 → 0.19.17` (needs `ChatBskyGroupDefs.JoinLinkPreviewView` and `agent.chat.bsky.group.getJoinLinkPreview`). Coordinate with any other API-bump-blocked PRs.

Confirm the URL format change `/chat/<code>` → `/c/<code>` matches whatever invite-link format your PDS produces. The PR bundles unrelated Composer.tsx lint cleanup (`as any` removal, `BskyAgent` → `AtpAgent`) and border/rounding tweaks across `FeedEmbed` / `ListEmbed` / `StarterPackCard` / `ExternalEmbed` — split to a separate commit if you want a tight feature-scoped diff.

**Apply any time after the API bump is comfortable.**

### 10512 — Rebalance splitview columns (mozzius)

Bundles three orthogonal refactors: column-width constants, splitview rebalance, NavItem icon rewrite. The NavItem rewrite reintroduces `aa.flags.chatDisabled` at the LeftNav unread-count callsite.

**During cherry-pick, drop the AA gate** — remove `useAgeAssurance()` from `LeftNav.tsx` and pass `numUnreadMessages.numUnread` / `numUnreadMessages.hasNew` unconditionally.

**Apply after Phase 2.3** (AA removal) so the gate-removal lands in one place. If taking both 10512 and 10513, apply 10512 first — they overlap in `MessagesSplitViewLayout.tsx` but 10513's `ScrollProvider` wrapper re-applies cleanly over 10512's column-width rewrite.

### 10517 — Pending toast for AppView wait (mozzius)

Coupled refactor — apply as one commit:
- New `'pending'` ToastType and `Toast.promise()` helper in `src/components/Toast/`
- Delete `src/view/com/util/Toast.tsx` (legacy)
- Migrate the two legacy-Toast callers (`UserAddRemoveLists.tsx`, `PostFeedErrorMessage.tsx`)
- Composer.tsx rewrite to fire-and-forget the AppView wait

Before committing: `rg "from '#/view/com/util/Toast'" src` for any fork-local callers upstream doesn't have. `ax.metric(...)` calls survive — Phase 2.7a makes them no-ops.

**Apply any time.** Independent of 10508 despite both being composer-area work — 10508 was dropped from the queue anyway.

### 9619 — React Navigation `documentTitle` API (mozzius)

Manual merge into the fork's diverged `src/Navigation.tsx` (fork has `bskyTitle` at lines 45 / 166 / 230 / 812 vs upstream layout). Re-author the imports from `@lingui/macro` → `@lingui/react/macro` per fork CLAUDE.md.

The PR also includes a real bug fix for dynamic-translation re-render in PostThread title — worth taking even as a stand-alone change.

**Apply early in Stream 1 or 2** so subsequent `Navigation.tsx` changes don't compound merge difficulty.

### 9683 — Simplify `useRichText` (synchronous facet detection, mozzius)

Real behavior delta: handle/mention/link facets in rendered rich-text (profile descriptions, etc.) detected by text pattern only, no client-side handle→DID resolution. After applying, smoke-test that mentions in profile descriptions still navigate to the right profile.

Upstream is `CONFLICTING` — manual rebase against current `main` needed.

**Apply any time.** Net deletion (`+14 / -68`) and aligned with simplification goals.

## Reviewed and dropped

| PR | Reason |
|---|---|
| **10508** Composer reply-to facets render | User dropped |
| **10514** Expand muted words to more surfaces | User dropped |
| **9897** Profile scroll indicator insets | iOS-only by design; web build resolves to no-op stub. Pulls in Reanimated which Stream 3 removes |
| **9423** iOS sheets crash | Pure Swift in `modules/bottom-sheet/ios/`, deleted by Phase 4.6 |
| **10485** Report group chat | Author defers — needs `convoRef` backend, not deployed. Re-evaluate when upstream ships |
| **10498** Chat request banner | `onPress` is a `TODO` no-op until the requests inbox screen ships. Re-evaluate then |
| **9869** Persist navigation state | Fully `IS_NATIVE`-gated upstream — ships as no-op on web. Better rewritten as a fork-local feature after Phase 2.8 with the web guards inverted, going through the rewritten `device` storage layer |

## Reference only — not a cherry-pick

| PR | Use |
|---|---|
| **9679** Webpack → Rsbuild (DRAFT, mozzius) | Read as input for **Phase 4.7**. Mozzius keeps Expo running through rsbuild — opposite of our strip-then-swap approach — but the `rsbuild.config.ts` shape, env-define list, RNW aliases, and the `react-native-uitextview` patch he authored are useful inputs |

## Roadmap follow-ups surfaced during PR review

- **Phase 4.3 expo-image-manipulator shim must accept `SaveFormat.PNG` with transparency preservation.** The fork's `src/lib/media/manip.web.ts` canvas path currently outputs JPEG; the shim needs a format hint that maps to `canvas.toDataURL('image/png')`. Discovered while reviewing PR 10094 — applies whether or not the PR is cherry-picked

---

# Appendix A — Deferred: long-term migration (NOT NEAR-TERM WORK)

Captured here so the strategy isn't lost, but **not part of the current execution plan.** Moving off `react-native-web` and doing a full ALF redesign is a multi-month undertaking that should only be started after Streams 1–4 are stable and the post-Expo fork has shipped.

Note: **minimal ALF in-housing already happens in Phase 4.4** (`@bsky.app/alf` is inlined under `src/alf/`, public `#/alf` surface unchanged). What remains for Appendix A is the *redesign* — Tailwind v4, CSS variables, `cx()` helper, DOM primitives — which only makes sense as part of the RNW removal.

## Recommended order (when revisited)

1. Web-only baseline + guardrails (no-new-RNW lint rule, import inventory)
2. ALF redesign on the already-in-housed base — add Tailwind/CSS-var capabilities behind the existing `#/alf` surface
3. Tailwind v4 + CSS-var DOM primitive layer (`Box`, `Text`, `Button`, `Link`, `Image`, `ScrollArea`, `Portal`, `Dialog`, `VisuallyHidden`)
4. React Router 7 parallel shell (Data Mode initially; Framework Mode later if desired)
5. Route-level lazy loading
6. Virtuoso-based `AppVirtualList` substrate for feeds
7. Core screen conversion (home, profile, thread, search, notifications, settings)
8. **Accessibility / focus / keyboard milestone** — before or during step 9. Radix and other DOM-primitive layers change focus-trap semantics, escape-key handling, `inert` background behavior, scroll lock, and keyboard shortcut routing. Audit and reconcile expectations across the app before they get baked into every converted dialog. RN-Web's RN-shaped APIs hide some of these concerns; the DOM-primitive era exposes them
9. Dialogs / composer / media conversion (Radix Dialog/Popover/Menu; pointer events; CSS transitions)
10. React Navigation removal (delete `@react-navigation/*`)
11. RNW dependency removal (strip `react-native`, `react-native-web`, `Platform`, `StyleSheet`, `Dimensions`, `Linking`, `AppState`)
12. Vite migration (once route-level lazy loading exists, Vite becomes viable)

## Key decisions to revisit at the time

- **ALF in-housing is already done** in Phase 4.4 (minimal: inline what `@bsky.app/alf` exports, keep public `#/alf` surface stable). Appendix A picks up from there — full style-system redesign happens alongside RNW removal, not before.
- **Migration shape:** strangler-fig with parallel components — reject big-bang and naive file-by-file renames.
- **Styling target:** Tailwind v4 + CSS variables + small `cx()` helper. Reject CSS Modules (too verbose), vanilla-extract/Panda (too much tooling), runtime CSS-in-JS (perf cost on feeds), inline `style` arrays (preserves the RN shape too long).
- **Lists:** React Virtuoso for feed-class lists (auto-measured variable-size items) over `react-window` (too barebones) or `@tanstack/react-virtual` (more custom work).
- **Router:** React Router 7 over Next.js (don't need the framework) or TanStack Router (more migration surface).
- **Animations:** CSS transitions + View Transitions API; avoid Framer Motion unless an interaction can't be expressed otherwise.

## Risk defenses (when this is revived)

- "No new RNW imports in migrated directories" lint rule from day one
- Build one `AppVirtualList`; do not let each screen invent virtualization
- Convert styles only in files you're already touching for DOM migration; keep an `atoms-compat` shim temporary
- Treat this as a personal fork, not a tracking fork — keep protocol/API code close to upstream; let UI diverge intentionally
- Define explicit removal gates (RN imports = 0, FlatList = 0, Reanimated = 0) — otherwise the parallel layers become permanent
