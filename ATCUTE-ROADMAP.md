# @atcute/client Migration Roadmap

This is the execution plan for migrating the fork's AT Protocol network layer from `@atproto/api`
(the atproto TypeScript SDK) to [`@atcute/client`](https://github.com/mary-ext/atcute) and its
companion packages. It is a sibling to `ROADMAP.md` — that document removes native/mobile concerns;
this one swaps the SDK. The two are independent and can interleave; nothing here depends on a
`ROADMAP.md` stream and vice versa.

## Why migrate

`@atproto/api` is a large, class-heavy SDK: an XRPC client, a session manager, a stateful
preferences cache, a RichText engine, a moderation engine, and ~megabytes of generated lexicon
types, all in one package. `@atcute/client` is the opposite — a thin, tree-shakeable XRPC `Client`
(`get` / `post`, nothing else) backed by ambient lexicon types from small per-namespace definition
packages. The fork already depends on `@atcute/oauth-browser-client` for OAuth (see
`src/state/session/oauth.ts`, `agent.ts`), so the session layer is half-migrated already; the public
surface — XRPC calls, lexicon types, RichText, moderation — is what remains.

Two structural wins motivate doing this now:

1. **Proper discriminated `$type` unions.** `@atproto/api` models union members loosely, which is
   why the fork carries a hand-rolled validation layer (`src/types/bsky/`) just to narrow `$type`.
   `@atcute`'s lexicon types are real discriminated unions — branch directly on `.$type` and the
   member narrows. The validation layer can largely go away.
2. **Explicit service routing.** `@atproto/api`'s `BskyAgent` hides whether a call lands on the
   AppView or the user's PDS behind a single mutable proxy header. `@atcute/client`'s `Client` takes
   `proxy` per instance, so we can expose two clearly-named clients (`appview`, `pds`) and make
   every call site declare its intent.

## Why not all at once

`@atcute`'s lexicon types are **not** structurally identical to `@atproto/api`'s, and ~350 source
files import `@atproto/api` today. A big-bang swap would mean a single un-reviewable commit with
hundreds of type errors resolved blind. Instead, migrate **one type hub at a time**: each phase
takes a cohesive view type (e.g. `ProfileView`, `PostView`), the queries that produce it, and the
shared components / caches / prop types that consume it, converts that slice end to end, and lands
as its own commit with a green typecheck. `@atproto/api` and `@atcute/client` coexist in the tree
throughout — that is expected and fine.

A deliberate simplification runs through every phase: **drop response validation.** The fork is a
client talking to a public, well-behaved AppView/PDS; we can trust the server to return what its
lexicons promise. So migrated call sites use `Client.get` / `Client.post` (no validation), never
`Client.call` (validates against the schema). The one place `@atproto/api` validation actually
bought us something — narrowing loose `$type` unions — is exactly what `@atcute`'s proper unions
give us for free.

**Two parts of `@atproto/api` are deliberately _not_ migrated by this roadmap's main streams:** the
moderation engine (`moderatePost` / `moderateProfile` / label interpretation) and — to a lesser
extent — RichText. Per the project owner's call, moderation is **deferred indefinitely** to Appendix
A. As a result `@atproto/api` cannot be fully removed by Stream 6; Stream 6 removes everything
_except_ a bounded `src/lib/moderation/**` island — the moderation engine, its configuration, and
the compat module that fronts it (see "Type migration strategy"). RichText _is_ migrated, but only
in Stream 3 — it is a prerequisite for the composer, not an independent task.

## What "migrated" means — and what does not count

Every phase below ends with a grep like `rg "@atproto/api" … is clean`. Read that as the _last_
symptom of a finished migration, never as the goal. The goal is the call running on an `@atcute`
client with `@atcute` lexicon types. Two facts must hold for a phase to be done:

- The call site reaches its client through `useClients()` (`appview` / `pds`) or a named ad-hoc
  client — never `useAgent()` / `BskyAgent` — and imports its lexicon types from `@atcute/bluesky` /
  `@atcute/atproto` / `@atcute/ozone`.
- No new local type describes a wire shape. The definition packages registered in Phase 1.1 already
  export every view, record, and union type, and `@atcute`'s discriminated `$type` unions already
  narrow without a guard.

**The disallowed shortcut.** Deleting an `@atproto/api` import and replacing it with a hand-rolled
local `interface`, `type` alias, `is*` guard, or structural parameter type that re-describes the
same wire shape — while the call still runs through `BskyAgent` — turns the verification grep green
and the typecheck pass and migrates _nothing_. It is strictly worse than the import it removed: it
rebuilds, by hand, the loose-`$type` validation layer this migration exists to **delete**
(`src/types/bsky/`, Phase 5.2). A commit whose subject says a type was made "local", kept
"structural", "derived locally", or "isolated" — when the destination this document names is an
`@atcute` package — _is_ this shortcut. It is not a migration; it is the failure mode this section
exists to stop.

The only local types this migration introduces are the two it names explicitly: the
`src/lib/api/records.ts` record helpers (Phase 1.3) and the `src/lib/moderation/**` island (Phases
1.3, 5.3). Everything else describing a wire shape comes from `@atcute`.

When the `@atcute` migration of a type is genuinely hard — the `@atcute` type looks missing, or its
shape fights an existing call site — that is a finding to **surface, not route around**. Stop, add
the blocker as a note under that phase, and ask. A hand-rolled local type is never the fallback.

## Streams and ordering

Six streams plus a deferred appendix, executed in this canonical order:

- **Stream 1 — Client foundation.** Register the `@atcute` definition packages; build the dual
  `appview` / `pds` client layer; stand up the compatibility bridges and ad-hoc client helpers every
  later stream leans on. `@atproto/api`'s `BskyAgent` stays fully operational alongside it. No call
  sites move yet.
- **Stream 2 — Read-path migration.** Convert read queries (`src/state/queries/*`) to the new
  clients, one type hub per phase, in order of increasing type-surface sharing: identity → social
  graph → lists/starter packs → feeds → posts/threads → notifications/search.
- **Stream 3 — Write-path migration.** Migrate RichText (composer prerequisite), then convert
  mutations and record writes. Includes re-homing the `BskyAgent` convenience methods the fork
  relies on (`upsertProfile`, saved-feeds helpers, `upsertMutedWords`, the preferences cache) —
  `@atcute/client` has no such sugar.
- **Stream 4 — Ancillary clients.** Chat (`#bsky_chat`), video upload, and moderation reporting get
  their own locally-scoped clients — none are exposed globally.
- **Stream 5 — Off-SDK utilities.** Replace the remaining non-network pieces of `@atproto/api`
  (`AtUri` and syntax helpers, the `src/types/bsky` validation layer), then consolidate the
  deferred-moderation code into one bounded `src/lib/moderation/**` island decoupled from
  `BskyAppAgent`.
- **Stream 6 — Partial `@atproto/api` removal.** Delete the `BskyAgent` compatibility layer and
  shrink `@atproto/api` usage to only the bounded `src/lib/moderation/**` island.
- **Appendix A — Moderation engine migration (deferred).** Move moderation to
  `@atcute/bluesky-moderation` and drop `@atproto/api` entirely. Explicitly deferred — not on the
  immediate execution path.

### Why this ordering

- **Stream 1 first, and it is pure addition.** Construction of the new clients and bridges touches
  only the session module and two new files; nothing else imports them yet. Landing it separately
  means every later phase starts from a green build with both SDKs available.
- **Reads (Stream 2) before writes (Stream 3).** A misrouted read fails loudly and harmlessly — a
  screen fails to load. A misrouted or malformed write can mutate the user's repo incorrectly. Reads
  also vastly outnumber writes and exercise the `appview` / `pds` routing rules far more thoroughly,
  so the routing layer is battle-tested before any write depends on it.
- **Within Stream 2, least-shared type hubs first.** Identity calls return plain strings (a DID, a
  handle) — zero shared view types, a safe warm-up. Social-graph and list types are moderately
  shared. `PostView` / `FeedViewPost` / thread types are referenced almost everywhere, so they come
  last, when the routing layer and the migration rhythm are both proven.
- **RichText opens Stream 3, before the composer.** Compose-time facet detection currently runs
  through `@atproto/api`'s `RichText.detectFacets(agent)` — it needs a network handle resolver. The
  composer write phase (3.1) therefore _cannot_ drop `BskyAgent` until RichText is migrated, so
  RichText is Phase 3.0, the explicit prerequisite. (Atcute's facet parser does not detect
  protocol-less URLs like `bsky.app` written without `https://` — an accepted, documented behavior
  regression.)
- **Stream 3 carries the preferences subsystem.** `@atproto/api`'s `BskyAgent` keeps a stateful,
  in-memory preferences cache and exposes ~20 mutators over it. `@atcute/client` has none of this.
  Re-homing it is the single largest piece of net-new code in the migration, so it gets a dedicated
  phase rather than being smeared across feature areas.
- **Stream 4 is independent and can float.** Chat, video, and reporting clients depend only on
  Stream 1. They are placed after Stream 3 only because they are small; an executor may pull any of
  them forward if a feature area needs them.
- **Moderation is deferred (Appendix A), so Stream 6 removal is partial.** Migrated phases route
  moderation through the compat module; Phase 5.3 consolidates the engine, its configuration, and
  that module into the bounded `src/lib/moderation/**` island that Stream 6 leaves behind.

## Progress

Tracked loosely — `git log` is the source of truth, since each commit subject names its phase.

- **Stream 1 — done.** Phases 1.1, 1.2, 1.3 landed.
- **Phase 2.1 — done.** Identity/resolution reads.
- **Phase 2.2 — done.** Profiles and social graph (plus the suggested-users trending queries that
  produce profile views, pulled forward as part of the same hub).
- **Phase 2.3 — done.** Lists and starter packs (incl. `post-reposted-by`, pulled forward as a
  profile-producing read).
- **Phase 2.4 — done.** Generator-view slice plus the `PostView`/`FeedViewPost` flip (one large
  commit). Because `PostView` is shared through the post-shadow cache and the shared render
  components, the flip can't stay inside 2.4's file set; it uses a seam-cast approach — 2.5/2.6/3.1
  consumer files (thread, notifications, search, quotes, bookmarks, composer) keep their
  `@atproto` data path and are bridged with `as unknown as` casts marked
  `TODO(atcute Phase 2.5/2.6/3.1)`, removed when each phase migrates. The nine `src/lib/api/feed/**`
  classes moved off `BskyAppAgent` onto the `appview` client. Dropped the custom-feed
  `loggedOutFetch` lang cache-bust (accepted regression) and the dead `asPostRecord` helper.
  Deferred (still on `@atproto/api`): `resolveLink`, the composer publish path (`lib/api/index`),
  bookmarks reads, and the `src/types/bsky` validation layer.
- **Phase 2.5 — done.** Posts and threads. The thread hub
  (`app.bsky.unspecced.getPostThreadV2` / `getPostThreadOtherV2` + its node union) and the post
  reads (`post.ts` `getPosts`, `post-quotes`) moved to the `appview` client. Thread node narrowing
  is now `$type`-based (`AppBskyUnspeccedDefs.is*ThreadItem*` → `value.$type === '...'`); `$Typed` →
  `$type.enforce`; record reads inline-cast to `.Main` (no `dangerousIsType`/`validate`). Removed the
  `TODO(atcute Phase 2.5)` seam casts in the thread query cache, thread components, post-shadow,
  quotes, and postgate. Markers whose true data source migrates later were relabeled: search-posts
  consumers (`Hashtag` / `Topic` / `SearchResults`) and bookmarks → 2.6; `resolveLink` /
  `LazyQuoteEmbed` → 3.1. **Deferred:** `resolveLink` (`src/lib/api/resolve.ts`) stays on
  `@atproto/api` — its `fetchResolveLinkQuery` consumer is the composer publish path
  (`lib/api/index.ts`, 3.1), so the appview-client signature change rides with 3.1, not 2.5.
  `post-interaction-settings.ts` (a `setPostInteractionSettings` write) and the threadgate/postgate
  record-write helpers stay on `@atproto/api` until Stream 3.
- **Phase 2.6 — done.** Notifications (feed + unread/count via `fetchPage`, now threading the
  `appview` client; `getPreferences` / `putPreferencesV2`), search (`search-posts`), bookmarks reads
  (`getBookmarks`), and trending (`getTrends` / `getTrendingTopics`) all moved to `appview`; labeler
  + notification-settings reads were already done. `moderateNotification` and `hasMutedWord` were
  added to `src/lib/moderation/compat.ts` (the engine stays on `@atproto/api`). Notification/search/
  bookmark record discrimination is now `$type`-based; removed every `TODO(atcute Phase 2.6)` seam
  cast in the thread placeholder fan-out, post-shadow, and the search/notification/bookmark view
  consumers. **Deferred (still `@atproto/api`):** `useBookmarkMutation` create/delete and the
  notification `declaration.get/put` record CRUD (Stream 3); `feed.ts` / `list.ts` / `profile.ts` /
  `starter-packs.ts` retain `@atproto` only for write paths (Stream 3) and the `RichText` class
  (Phase 3.0); `preferences/**` is Phase 3.2. `DebugMod.tsx` casts the `@atproto/api` `mock` factory
  output at its dev-screen boundary.
- **Stream 4 — done.** Phases 4.1 (chat client), 4.2 (video upload), 4.3 (moderation reporting) all
  landed. Chat exposes a third `chat` field on `useClients()` (built as `pds.clone({ proxy:
  CHAT_PROXY_AUDIENCE })`-equivalent over the OAuth handler), departing from the roadmap's "non-
  global accessor" wording to avoid per-render `clone` allocations.
- **Phase 5.1 — done.** `AtUri` swapped for `@atcute/lexicons/syntax` (`parseResourceUri` /
  `parseCanonicalResourceUri`); pulled forward as a PostView-independent slice. Server-derived
  URIs route through `parseCanonicalResourceUri` so the `rkey`/`collection` come back non-null;
  call sites that legitimately accept handle-form URIs (resolveLink, getThreadgateRecord, etc.)
  stay on `parseResourceUri`.
- **Phase 3.3 — done.** Profile writes are off `@atproto/api`'s `BskyAgent` and onto the `pds` client.
  `profile.ts` gains a fork-owned `upsertProfile(pds, did, updateFn)` mirroring `BskyAgent.upsertProfile`:
  `getRecord` the own `app.bsky.actor.profile` record (rkey `self`) → merge → `putRecord` with
  `swapRecord: existing?.cid ?? null`, retrying up to 5× on a `ClientResponseError` with
  `error === 'InvalidSwap'`. The `getRecord` not-found catch is narrowed (only a `Could not locate
  record:` error → "new profile"; everything else rethrows — safer than upstream's catch-all, and
  consistent with the fork's other record reads). Avatar/banner upload via `uploadBlob(pds, …)` (the 3.1
  helper, returning an `@atcute` Blob assigned straight onto the record); `whenAppViewReady` polls
  `appview.get('app.bsky.actor.getProfile')`. The write type is a new `ProfileRecordWrite` (a writable,
  `$type`-less view of `AppBskyActorProfile.Main`); `$type` is reattached at write. Consumers migrated:
  `pinned-post.ts` (pinned-post strongRef, getProfile → `appview`), `EditProfileDialog` (display name /
  description), and the two self-label screens (`AutomationLabelSettings` `bot`, `PwiOptOut`
  `!no-unauthenticated`) — the latter rewritten from `bsky.validate()` to a `$type` discriminant narrow
  with an immutable values rebuild, and (per an oracle review) made **idempotent**: the intended final
  state is captured up front so an `InvalidSwap` re-read can't invert the user's action. `profile.ts` is
  now `@atproto/api`-free. `agent.updateHandle` / account-settings writes had **no call sites** (the
  change-handle flow was already stripped), so the profile record was the whole surface. **Verified
  live** against a real account: a bio edit→reload→revert round-trip persisted then restored
  byte-for-byte, and a description-only edit **preserved** display name + avatar (no partial clobber);
  display name and handle were never touched (Bluesky verification hardcodes them). lint + typecheck
  pass.
- **Phase 3.2 — done.** The preferences subsystem is re-homed onto a fork-owned module,
  `src/state/queries/preferences/agent.ts`, built directly on `app.bsky.actor.getPreferences` /
  `putPreferences` over the **`pds`** client (the AppView-namespaced, PDS-implemented exception).
  `getPreferences` ports the full `@atproto/api` derivation — narrowing the raw `@atcute` preference
  union by `$type` (a `prefGuard` `Extract` factory) instead of `predicate.isValid*`, with the
  legacy-label remap kept verbatim. The saved-feed V1→V2 migration and V1 double-write are dropped
  (this fork assumes a `savedFeedsPrefV2` already exists), which also removed the read-path write
  behind the oracle's stale-read finding. `updatePreferences` is a
  read-modify-write serialized by a promise-chain mutex (`withPrefsLock`, replacing `@atproto`'s
  `AwaitLock`); mutators rebuild the pref array immutably (`upsertPref` spreads rather than
  `Array.concat`, which mis-resolves on the union element type) and route every entry through `pds`.
  Ported mutators: content-label (+ legacy `graphic-media`/`porn`/`sexual` double-write),
  adult-content, saved-feeds (overwrite/add/remove/update, V2-only), muted words
  (`upsertMutedWords` batched into one write; update/remove splice the **first** match per target),
  feed/thread-view, interests, personal details, `setPostInteractionSettings` (deferred from 3.1),
  verification, and clear. Consumers migrated to `useClients().pds`: `preferences/index.ts` hooks,
  `state/birthdate.ts`, `post-interaction-settings.ts`, `InterestsSettings.tsx`, and
  `MutedWords.tsx`'s `sanitizeMutedWordValue` import. The compat `BskyPreferences` shape is kept
  `@atproto`-typed (the moderation island consumes it; → 5.3), with branded-type casts at the
  read/write boundaries. The labeler-config side effect `agent.getPreferences()` did internally
  (`configureLabelers`) is preserved explicitly in the query hook. **Pruned:** the two nudge mutators
  / `useQueueNudgesMutation` / `useDismissNudgesMutation` — dead in this fork (zero callers,
  `bskyAppState` read nowhere). **Reviewed:** an oracle adversarial pass flagged batched muted-word
  removal dropping all value-duplicates (fixed to splice-first-per-target, matching upstream) and a
  saved-feed migration "stale read" race (mooted — the migration was subsequently dropped).
  **Verified live** against a real account: saved feeds, content filters, adult-content/age-gating,
  verification prefs, and the empty muted-words list all render correctly; a muted-word add→reload→
  remove→reload round-trip persisted and reverted cleanly (the only write path exercised — fully
  reversible). lint + typecheck pass.
- **Phase 3.1 — done.** Record writes + the composer publish path, across nine commits (mutes had
  already landed). Toggle helpers (`like`/`repost`/`follow`/`block`/`deletePost`), threadgate/postgate
  CRUD, bookmarks, the Germ declaration, list/list-item writes, starter-pack + bulk-follow writes,
  composer drafts CRUD, and verification/notification-declaration/live-status writes all route
  through `src/lib/api/records.ts` (`createRecord`/`deleteRecord`/`getRecord`/`putRecord`/
  `listRecords`) on the `pds` client, or `appview.post(...)` for `app.bsky.*` procedures (bookmarks,
  drafts). `whenAppViewReady`-style readiness checks and handle resolution moved to `appview`. The
  composer publish (`lib/api/index.ts`) builds `@atcute` records and `applyWrites` on `pds`; record
  CIDs for self-thread reply chaining come from a new `src/lib/api/cid.ts` (`serializeRecordCid` over
  `@atcute/cbor` + `@atcute/cid`), replacing the `BlobRef`/`@ipld/dag-cbor`/`multiformats`/`js-sha256`
  machinery. `uploadBlob` (`lib/api/upload-blob.ts`) re-homed onto `pds` returning an `@atcute` Blob;
  `resolve.ts`/`resolve-link.ts`/`link-meta.ts`/`video.ts` `BlobRef` flipped; the 3.0 facet-cast and
  the gate/record seam casts dropped. Added `@atcute/cbor` + `@atcute/cid`; bumped `@atcute/bluesky`
  to 4.0.3 (adds the external-embed `associatedRefs` field) and `@atcute/atproto`. `is*`/`validate*`
  narrowing swapped to `$type` checks; fixed `ListRecordsOutput` in the 1.3 helper to `Omit` the
  `$output` records field (first real `listRecords` consumer). **Verified:** `serializeRecordCid`
  reproduces the stored CID for 30/30 live posts across every embed type; an intercepted publish
  produced correct records (UTF-8 facet offsets, mention resolution, link shortening, external
  embed); like/unlike and bookmark add/remove round-trips confirmed live against a real account.
  **Deferred by design:** `post-interaction-settings.ts` `setPostInteractionSettings` (built on the
  preferences cache → 3.2); `profile.ts` `upsertProfile` + avatar/banner uploads (→ 3.3). **Composer
  residual `@atproto/api`:** the Phase 2.5 `getPostThreadV2` thread-context read and the video-service
  routing (`agent.serviceUrl`/`dispatchUrl`) keep `useAgent` in `Composer.tsx`/`video.ts` — separate
  concerns, not record writes. The `ExternalEmbed`/composer-quote/`StandardSiteEmbed` preview
  consumers keep relabeled `TODO(5.x)` seam casts where they remain `@atproto`-typed (validation
  layer / composer-internal state).
- **Phase 3.0 — done.** `@atproto/api`'s `RichText` class + `UnicodeString` are fully removed.
  Rendering goes through `@atcute`'s `segmentize`; a new `src/lib/strings/rich-text-facets.ts`
  (`detectFacets` / `detectFacetsWithoutResolution` / `cleanNewlines` / `getShortenedLength`) wraps
  the parser + builder. Segment decoration takes the **first supported feature in array order** (no
  mention>link>tag precedence). The composer no longer keeps a parsed RichText in state — it stores
  the plain text string and builds `{text, facets}` (UTF-8 offsets via the builder) **once at
  publish**; link-card detection runs in JS-string space via the tokenizer (the brittle
  `UnicodeString` byte-stitching in `shortenLinks` / `suggestLinkCardUri` is gone). The publish
  record building (`lib/api/index.ts`) and the starter-pack/DM write paths keep an `as unknown as`
  facet cast at the `@atproto`-typed record boundary (3.1). **Accepted regression:** protocol-less
  URLs (`bsky.app` without a scheme) no longer auto-facet — the parser's autolink requires `https?://`.
- **Tapper editor — done (bonus, alongside 3.0).** The in-house composer editor (`src/lib/tapper/`)
  now reuses the same `tokenize` parser instead of its own regex bank, so its highlighting exactly
  matches the published facets (protocol-less URLs stop lighting up). The cursor trigger-splice +
  `detectActiveFacet` backward-scan are kept verbatim (they synthesize the in-progress facet the
  completed-token parser can't, preserving autocomplete); emotes are boundary-gated in the builder.
  `tapper/facets.ts` deleted; positions the editor for future markdown rendering.
- Next: **Stream 4** ancillary clients — `4.2` video-upload client and `4.3` labeler/moderation-service
  proxy (`4.1` chat already landed); these are locally-scoped clients, harder to exercise safely. Then
  **Stream 5** (off-SDK utilities: `5.1` AtUri/syntax, `5.2` retire the validation layer, `5.3`
  consolidate the moderation island) and **Stream 6** (`6.1` partial `@atproto/api` removal). The
  moderation engine (Appendix A) stays deferred.

Two dead-code removals happened alongside the migration rather than migrating the code: the
`handle-availability` query and the change-handle flow (`ChangeHandleDialog` — handle changes are
not possible through an OAuth client). Both are already reflected in the phase text above.

The `*_PROXY_AUDIENCE` envs must be **quoted** in `.env` (`"did:web:…#service"`): dotenv strips an
unquoted inline `#…` as a comment, which silently dropped the service id from the `atproto-proxy`
header until `fix: quote proxy-audience env values…`. Any future `#service` audience env needs the
same quoting.

## Conventions

- Each phase starts with motivation and ends with a verifiable "done when".
- **Treat file lists and call-site inventories as live, not authoritative.** "The importers are A,
  B, C" reflects the state when the phase was written. Re-run the grep at execution time and work
  from that result.
- `rg` is preferred over `grep`. Add `--glob '!ATCUTE-ROADMAP.md' --glob '!ROADMAP.md'` to
  verification greps so the planning docs don't show up as stale references. `--glob '!locale/**'`
  skips Lingui catalogs.
- **Verification gate per phase — match depth to risk.** Phases that add/remove dependencies or edit
  `tsconfig*.json` / `rsbuild.config.ts` must end with `pnpm build`. Source-only phases gate on
  `pnpm lint && pnpm typecheck`. `pnpm typecheck` runs `tsgo -b`.
- **Typecheck is necessary but not sufficient.** A migrated call site can typecheck green and still
  be wrong at runtime: `proxy` is just a string, so a call routed to the wrong client compiles fine
  and fails only against the live server. Every Stream 2–4 phase must end with a manual smoke test
  of the affected screens via `pnpm dev` (the `/run` and `/verify` skills help). State in the commit
  message what was exercised.
- **A clean `@atproto/api` grep is necessary but not sufficient** — the same caveat as the typecheck
  above. The import vanishing proves only that the import vanished. Pair every `rg "@atproto/api"`
  "done when" check with its positive twin — `rg "@atcute" <the same files>` — confirming the call
  site actually landed on an `@atcute` client and `@atcute` types. Import gone with no `@atcute`
  import added means the phase was faked; redo it. See "What 'migrated' means".
- Work directly on `main`, one commit per phase (per the fork's commit workflow). Large phases may
  split into several atomic commits — keep the build green at each.
- **Every commit maps to a numbered phase in this document.** The phases _are_ the unit of work — do
  not invent a private decomposition ("video blob types", "draft server types", "composer guards").
  Commit subjects name the `@atcute` package the call site moved onto (e.g.
  `refactor: move feed reads to @atcute/bluesky`), so a faked or off-script phase is visible in
  `git log` at a glance.
- **Conventional commit type:** these are `refactor:` commits (behavior-preserving SDK swap). The
  Stream 1 dependency additions and Stream 6 removal are `chore:`. Intentional behavior changes
  (dropping validation, the RichText URL regression) — call them out in the commit body.
- **Scratch inventory files** (`.inventory-*`): add `.inventory-*` to `.git/info/exclude` before
  generating; they are not committed.
- **Stay in scope.** Each phase swaps an SDK boundary — apply only that. Resist redesigning the
  query, renaming props, or "improving" a component you happen to be editing. Note the observation
  in the commit message or here as a follow-up bullet; don't act on it.

---

## Routing reference

This is the canonical artifact for Streams 2–4. Every migrated call site picks its client from here.
When in doubt, re-read this rather than guessing.

### The two global clients

`@atcute/client`'s `Client` takes a `handler` (where bytes go) and an optional `proxy` (the
`atproto-proxy` header — which service behind that endpoint should answer). The fork exposes two
through session context:

| Client    | `proxy`                             | Use for                                                              |
| --------- | ----------------------------------- | -------------------------------------------------------------------- |
| `appview` | `PUBLIC_APPVIEW_PROXY_AUDIENCE` env | AppView reads/writes — see routing rules below                       |
| `pds`     | _none_                              | The user's PDS — repo writes, account, prefs. `null` when logged out |

Each proxied service gets its own **full-audience** env (`did:web:…#service-id`), not a bare DID:
`PUBLIC_APPVIEW_PROXY_AUDIENCE`, `PUBLIC_CHAT_PROXY_AUDIENCE` (Phase 4.1), and
`PUBLIC_BSKY_LABELER_PROXY_AUDIENCE` (Phase 4.3). The fork currently derives every proxy header from
`PUBLIC_BLUESKY_PROXY_DID` by appending a hardcoded `#service-id` — which couples the DID to a fixed
service and cannot express a different service per target. The audience-form envs make each proxy
independently configurable; the bare-DID envs and the `*_HEADER`/`*_HEADERS` constants in
`src/lib/constants.ts` are removed as their last consumer migrates.

Both share one `handler`:

- **Logged in:** the handler wraps `OAuthUserAgent.handle` (from `@atcute/oauth-browser-client`),
  which already targets the user's PDS and refreshes tokens. The `pds` client hits the PDS directly;
  the `appview` client hits the PDS too, but the `#bsky_appview` proxy header tells the PDS to
  forward to the AppView. This mirrors exactly how `BskyAppAgent` works today (`CredentialSession`
  at the PDS `aud` + `configureProxy`).
- **Logged out:** there is no session and therefore no PDS, so **`pds` is `null`**. Only `appview`
  exists — its handler is `simpleFetchHandler({ service: PUBLIC_BSKY_SERVICE })` pointed at
  `public.api.bsky.app`, which **is** the AppView (no `proxy` needed). `public.api.bsky.app` also
  serves the unauthenticated `com.atproto.identity.*` / `com.atproto.repo.getRecord` reads the
  logged-out app needs — those route to `appview`. com.atproto reads against other hosts (entryway,
  an arbitrary service) use ad-hoc clients, which work regardless of session state.

`useClients()` therefore returns `pds: Client | null`. Any call site reachable while logged out must
route through `appview` or an ad-hoc client. `pds` is non-`null` only inside an authenticated
session — write paths, preferences, and own-repo reads run there and may treat it as present, but a
logged-out-reachable read must never assume it.

### Routing rules — global clients

| NSID                                                | Client                 |
| --------------------------------------------------- | ---------------------- |
| `app.bsky.*`                                        | `appview`              |
| `app.bsky.actor.getPreferences`                     | `pds`                  |
| `app.bsky.actor.putPreferences`                     | `pds`                  |
| `com.atproto.*`                                     | `pds`                  |
| `com.atproto.repo.getRecord` for **another** user   | `appview`              |
| `com.atproto.identity.resolveHandle` for **others** | `appview`              |
| `chat.bsky.*`                                       | `chat` (4.1)           |
| `tools.ozone.*`                                     | reporting client (4.3) |

`com.atproto.* → pds` only ever fires inside an authenticated session — that is the only time the
fork issues PDS-bound com.atproto traffic. Logged out, the com.atproto reads the app actually needs
are the `getRecord` / `resolveHandle` exceptions (→ `appview`) or ad-hoc-client calls; nothing
logged-out-reachable should dereference a `null` `pds`.

The two `app.bsky.actor.*Preferences` endpoints are AppView-namespaced but **implemented by the
PDS**, not the AppView — proxying them to the AppView fails. The `getRecord` / `resolveHandle`
exceptions exist because a PDS is only authoritative for its own repo: fetching another user's
record or resolving an arbitrary handle must go through the AppView, which indexes the whole
network. For the current user's own record or own handle, `pds` is correct.

### Ad-hoc (non-global) clients

Some existing calls target neither the user's PDS nor the Bluesky AppView — they hit an arbitrary or
fixed third-party host. These get a `Client` constructed **at the call site** with
`simpleFetchHandler` against the specific URL. Forcing them through the global `pds` / `appview`
clients silently sends them to the wrong host.

| Use case             | Client                                                              |
| -------------------- | ------------------------------------------------------------------- |
| chat (`chat.bsky.*`) | `chat` client, scoped to Messages (Phase 4.1)                       |
| video upload         | local token-authed `Client`, no proxy (Phase 4.2)                   |
| moderation reporting | per-report `Client`, proxy `${labeler}#atproto_labeler` (Phase 4.3) |

Each is constructed at the call site by its own Phase 4 phase; Phase 1.3 adds no shared helper.

### Why chat / video / reporting are not global

- **Chat** (`chat.bsky.*`, `#bsky_chat` proxy) is reachable only from the Messages feature tree
  (`src/state/messages/`, `src/state/queries/messages/`, the unread-count badge). A global context
  entry would be dead weight on every non-messaging screen.
- **Video upload** touches one path: the composer's upload pipeline (`src/lib/media/video/`). It
  needs a short-lived service-auth token (`com.atproto.server.getServiceAuth`) and talks to the
  video service, not the AppView.
- **Moderation reporting** has no fixed target — the proxy DID depends on which labeler the report
  is funnelled to (`${labeler.did}#atproto_labeler`). A per-report client is the only correct shape;
  a global one cannot encode a target that varies per invocation.

### API shape changes (apply at every call site)

- `Client.get` / `Client.post` return `{ ok, status, headers, data }` — they do **not** throw. Wrap
  in `ok()` (`import { ok } from '@atcute/client'`) so React Query sees a thrown error on failure,
  matching `@atproto/api`'s behavior:
  `return ok(appview.get('app.bsky.actor.getProfile', { params: { actor } }))`.
- On failure `ok()` throws `ClientResponseError` (`.error`, `.description`, `.status`), not
  `XRPCError`. Call sites that branch on a specific error name (`err.error === 'AccountTakedown'`,
  etc.) or use `@atproto/api`'s `isXRPCError` need their guard swapped to
  `instanceof ClientResponseError`. Re-grep for these per phase.
- Use `.get` / `.post`, never `.call` — `.call` validates against the lexicon schema, and we are
  intentionally dropping validation.
- Records on view objects (`PostView['record']`, etc.) are typed `unknown` in `@atcute`. We always
  know the concrete type from context, so assert it: `post.record as AppBskyFeedPost.Main`. This and
  the `repo.*` input/output casts inside `src/lib/api/records.ts` (Phase 1.3) are the only
  sanctioned `as`es in the migration — add a tiny typed helper if a cast recurs (e.g.
  `asPostRecord(view)`), don't scatter raw casts.
- **XRPC params and id fields are branded.** `@atcute`'s param/input types use branded strings
  (`ActorIdentifier`, `Handle`, `Did`, `ResourceUri`, `Cid`) where the fork carries plain `string`.
  Cast at the call boundary — `actor: handleOrDid as ActorIdentifier`, `proxy: \`${did}#…\` as
  AtprotoAudience`. This is a sanctioned boundary cast like the `record` assertion above: the value
  genuinely is that shape at runtime, the fork just types its identifiers loosely. (Surfaced while
  executing Phases 2.1 and 4.3 — it recurs in every Stream 2–4 phase.)

---

## Type migration strategy

`@atcute` and `@atproto/api` lexicon types describe the same wire shapes but are **nominally
distinct** — a function annotated `(p: AtprotoProfileView) => …` will not accept an `@atcute`
profile even though every field matches. This is what makes "one query at a time" insufficient on
its own. Three rules contain the blast radius.

1. **Migrate by type hub, not by file.** The unit of work is a _view type_ and everything typed
   around it: the queries that produce it, the React Query / shadow caches that store it, and the
   shared components whose props are annotated with it. A phase is done when no public surface mixes
   the two SDKs' versions of that type. The per-phase "done when" greps consumers (`src/components`,
   `src/view`, `src/screens`), not only `src/state/queries`.
2. **Moderation is reached through a bounded island.** Moderation stays on `@atproto/api` (Appendix
   A). Create `src/lib/moderation/compat.ts` in Phase 1.3 exporting `moderateProfile` /
   `moderatePost` / `moderateUserList` wrappers that accept **`@atcute`-typed** input, cast it to
   `@atproto/api` types _inside the module_, call the real engine, and return the decision. Every
   app call site imports moderation from this module. Moderation is not just these functions, though
   — it also has _configuration_ (app-labeler setup, the `ModerationOpts` derivation,
   `BSKY_LABELER_DID`, regional authorities). Phase 5.3 consolidates all of it, the compat module
   included, into one bounded `src/lib/moderation/**` island decoupled from `BskyAppAgent`. The
   island is a **long-lived adapter**, not a temporary scaffold — the intended state until
   moderation migrates; when Appendix A runs, only files inside it change.
3. **RichText facets get a thin boundary cast until Phase 3.0.** Read-path post rendering (Streams
   2.4–2.5) constructs `@atproto/api` `RichText` from `post.record.facets`, which become
   `@atcute`-typed once `PostView` flips. Facets are a small, stable shape — cast at the `RichText`
   construction site (`new RichText({ text, facets: facets as Facet[] })`) with a
   `// TODO(atcute Phase 3.0)` marker. Phase 3.0 removes these.

Most field _reads_ (`profile.displayName`, `post.indexedAt`) need no change — the structures match.
The friction is concentrated at (a) explicit type annotations on shared functions/components, (b)
`$type` union narrowing (replace `is*` / `dangerousIsType` with `switch (x.$type)`), and (c)
`record: unknown`. Budget effort there.

---

## Codemod tactics

Three of the migration's mechanical sub-steps are regular enough to automate with a `jscodeshift`
codemod (`npx jscodeshift -t <transform>.ts --parser=tsx --extensions=ts,tsx <files>`). A codemod
here is a labour-saver _inside_ a phase, never a phase of its own: it does the boring ~90% of a
repetitive edit and leaves the judgement to a human. This section records what is automatable so the
option is deliberate, not improvised — none of it is required, and a phase done entirely by hand is
equally valid.

**Scope every codemod to a single phase's file inventory.** `jscodeshift` has no type information
and no notion of routing, so a transform run across the whole tree produces hundreds of simultaneous
type errors in one un-reviewable diff — precisely the big-bang "Why not all at once" exists to
prevent. Run the transform against the files a phase already lists, hand-finish the result,
`pnpm format`, then gate as that phase requires. The codemod accelerates a phase; it does not
collapse the one-commit-per-hub discipline. Transform scripts are throwaway tooling — keep them out
of the tree alongside the scratch inventories (`.research/` or `.git/info/exclude`).

The three candidates:

1. **Lexicon type-import swap (Stream 2–3 phases).** `@atcute` and `@atproto/api` share the
   `AppBskyActorDefs` / `ComAtprotoRepoGetRecord` namespace-naming convention, and the `*Defs`
   namespaces keep their member names (`ProfileView`, `FeedViewPost`, …) — so flipping a hub's
   `import { type AppBskyXDefs } from '@atproto/api'` to `@atcute/bluesky` (or `@atcute/atproto` for
   `ComAtproto*`) is largely a module-specifier rewrite. Three things keep it from being a pure
   swap, and a transform must handle each: **record namespaces rename members** (`@atproto/api`'s
   `AppBskyFeedPost.Record` is `@atcute`'s `AppBskyFeedPost.Main`); **mixed imports must split**
   (`{ type AppBskyFeedDefs, moderatePost, AtUri }` sends the namespace to `@atcute`, `moderatePost`
   to the compat module, `AtUri` stays on `@atproto/api`); **`is*` / `validate*` namespace members
   have no `@atcute` equivalent** — leave them for Phase 5.2. The residual structural mismatches
   (`record: unknown`, stricter `$type` unions) then surface as `tsgo` errors, which is the intended
   per-phase workflow.

2. **`AtUri` → syntax helpers (Phase 5.1).** The ~60 `new AtUri(...)` sites are dominated by inline
   `.rkey` / `.host` / `.collection` field reads — mechanical, with `.host` renaming to `.repo`. A
   transform should _flag, not rewrite,_ three cases: a `.toString()` or other re-stringify on the
   parsed value (`@atcute`'s `parseCanonicalResourceUri` returns a plain frozen object with no
   methods — rebuild the URI as a template string); `AtUri.make(...)` (likewise — template string);
   and the parser choice — `parseCanonicalResourceUri` throws on a handle-form URI where
   `parseResourceUri` does not, and the old `new AtUri` threw on neither.

3. **`agent.*` call-shape scaffold (Stream 2 phases).** Rewriting `agent.app.bsky.X.Y(params)` into
   `ok(client.get('app.bsky.X.Y', { params }))` is a regular AST transform, but the client
   (`appview` / `pds` / ad-hoc) and `get`-vs-`post` are routing decisions a transform cannot make.
   Use it as a _scaffold_: rewrite the call shape, add the `ok` import, and emit a placeholder
   client identifier for a human to resolve against the routing table.

RichText (Phase 3.0) and the validation layer (Phase 5.2) are **not** codemod targets — both are API
redesigns whose call sites restructure control flow rather than rename symbols. Migrate them by
hand.

---

# Stream 1 — Client foundation

Three phases. Pure addition — `@atproto/api`'s `BskyAgent` is untouched and fully operational; the
new clients and bridges are constructed beside it and consumed by nothing yet.

## Phase 1.1 — Register `@atcute` definition packages

**Motivation:** `@atcute/client`'s `Client` is generically typed over ambient XRPC schema maps. With
no definition package registered, `get`/`post` accept any NSID but infer `unknown` data. Registering
the definition packages populates the ambient `XRPCQueries` / `XRPCProcedures` maps so every call is
fully typed. This must land before any call site moves.

**Checklist:**

- [ ] `pnpm view @atcute/bluesky @atcute/atproto @atcute/ozone @atcute/germ` to confirm current
      versions, then `pnpm add` them. `@atcute/bluesky` provides `app.bsky.*` **and** `chat.bsky.*`;
      `@atcute/atproto` provides `com.atproto.*`; `@atcute/ozone` provides `tools.ozone.*` (used by
      the moderation reporting / labels UI — confirm with `rg "tools\.ozone|ToolsOzone" src`);
      `@atcute/germ` provides `com.germnetwork.*` (the Germ DM declaration record — see Phase 3.1).
- [ ] `@atcute/client`, `@atcute/identity-resolver`, `@atcute/microcosm`, and
      `@atcute/oauth-browser-client` are already in `package.json`. `@atcute/microcosm` is a
      `blue.microcosm.*` definition package, currently registered through a side-effect
      `import type {} from '@atcute/microcosm'` in `src/state/session/oauth.ts` — move that
      registration into the `types` array (next bullet) and drop the import.
- [ ] Register every `@atcute` definition package in `tsconfig.app.json`'s `compilerOptions.types`
      array (currently `[]`):
      `"types": ["@atcute/atproto", "@atcute/bluesky", "@atcute/germ", "@atcute/microcosm", "@atcute/ozone"]`.
      Prefer a `types` entry over a side-effect `import type {}` in a source file: it keeps every
      definition package registered in one canonical place, whereas a stray side-effect import is
      easy to miss and an unused-import autofix can silently strip it. Confirm the `tsgo -b`
      typecheck path resolves them.
- [ ] Sanity-check the ambient types resolve: in a scratch file,
      `new Client({...}).get('app.bsky.actor.getProfile', { params: { actor: 'bsky.app' } })` should
      infer `data` as the profile type, not `unknown`. Delete the scratch file.

**Footgun:** `tsconfig.app.json` has `skipLibCheck: true` — a version skew between `@atcute/client`
and a definition package will not surface as a lib error, only as wrong inference at call sites.
Keep `@atcute/*` versions aligned; if inference looks off mid-migration, check for a mismatch first.

**Done when:** `pnpm build` succeeds and a typed `Client.get` call infers its `data` correctly.

## Phase 1.2 — Build and expose the `appview` / `pds` clients

**Motivation:** stand up the dual-client layer so Stream 2 has something to migrate onto. The
clients must reuse the existing OAuth handler and the network-event / session-dropped
instrumentation in `src/state/session/agent.ts`, so the migration changes _which_ client a call uses
without changing auth, retry, or connectivity behavior.

**Checklist:**

- [ ] Create `src/state/session/clients.ts` exporting a factory and the `Clients` type
      `{ appview: Client; pds: Client | null }` — `pds` is `null` when logged out (no session, no
      PDS). Sketch:

  ```ts
  import { Client, type FetchHandler, simpleFetchHandler } from '@atcute/client';

  import { APPVIEW_PROXY_AUDIENCE } from '#/env/common';
  import { PUBLIC_BSKY_SERVICE } from '#/lib/constants';

  type Clients = { appview: Client; pds: Client | null };

  // logged out: public.api.bsky.app is itself the AppView; there is no PDS, so pds is null
  export function createPublicClients(): Clients {
  	const handler = simpleFetchHandler({ service: PUBLIC_BSKY_SERVICE });
  	return { appview: new Client({ handler }), pds: null };
  }

  // logged in: handler targets the user's PDS; appview reaches the AppView via the proxy header
  export function createOAuthClients(handler: FetchHandler): Clients {
  	return {
  		appview: new Client({ handler, proxy: APPVIEW_PROXY_AUDIENCE }),
  		pds: new Client({ handler }),
  	};
  }
  ```

- [ ] Introduce the `PUBLIC_APPVIEW_PROXY_AUDIENCE` env (full audience, e.g.
      `did:web:api.bsky.app#bsky_appview`): add it to `src/global.d.ts`'s `ImportMetaEnv`,
      `.env.example`, and surface an `APPVIEW_PROXY_AUDIENCE` constant from `src/env/common.ts`.
      This is **additive** — the old `PUBLIC_BLUESKY_PROXY_DID` env and `BLUESKY_PROXY_DID` /
      `BLUESKY_PROXY_HEADER` constants stay until the old `BskyAppAgent` is deleted in Stream 6.
      `proxy` is typed `AtprotoAudience` — the env value is the whole `did#service` string, do not
      append `#bsky_appview` in code.
- [ ] The logged-in `handler` is a `FetchHandler` `(pathname, init) => Promise<Response>` that
      delegates to the session's `OAuthUserAgent.handle` (already a `FetchHandlerObject` —
      `pathname` is `/xrpc/...`, which `handle` resolves against `session.info.aud`). Wrap it with
      the **same** instrumentation `createOAuthFetch` applies today in `agent.ts`:
      `withNetworkEvents` and the post-refresh `invalid_token` → `emitSessionDropped()` detection.
      Factor that wrapper out of `agent.ts` so the old `BskyAppAgent` and the new clients share one
      implementation.
- [ ] Construct the clients in the session provider (`src/state/session/index.tsx`) alongside the
      existing agent, keyed to the same auth-state transitions. Expose `useClients(): Clients` and,
      for non-React callers, a module-level getter (mirroring how `agent` is reached today).
- [ ] **Labelers request header.** The atproto agent sends a labelers header (today set by
      `agent.configureLabelersHeader`, sourced via `readLabelers(did)` in
      `src/state/session/moderation.ts`) on AppView reads so responses include labels from the
      user's subscribed labelers. The `appview` client must reproduce this — have the handler inject
      that header, reading the current labeler-subscription list from a mutable source so it stays
      correct when subscriptions change. **Getting this wrong silently drops labels from every
      Stream 2 read**, so it belongs here in the foundation, not later.
- [ ] Note for later: `configureModerationForGuest` / `configureModerationForAccount` in
      `src/state/session/moderation.ts` decomposes across the migration — its `resolveHandle` call
      moves to a client in Phase 2.1, its labelers-header logic to the bullet above, and its
      `Agent.configure({ appLabelers })` moderation-engine setup into the moderation island (Phase
      5.3). It is not a single-phase migration.
- [ ] Do **not** touch `useAgent()` or `BskyAppAgent`. Both SDKs run in parallel until Stream 6.

**Footgun:** token refresh, DPoP, and the `invalid_token` retry all live inside
`OAuthUserAgent.handle` already — do not reimplement them in the handler wrapper. The wrapper only
adds event emission and the _terminal_ session-dropped signal.

**Done when:** `pnpm build` succeeds, the app runs unchanged, and `useClients()` returns working
`appview` / `pds` clients (verify with a throwaway logged-in and logged-out `getProfile`, then
remove it).

## Phase 1.3 — Compatibility bridges and record helpers

**Motivation:** Streams 2 and 3 need three shared seams in place before they start: the moderation
compat module (so flipping a view type does not break every `moderateProfile` caller), the
`record: unknown` accessor for view objects, and the typed `com.atproto.repo.*` record helpers
(Stream 2 reads — `starter-packs.ts`, `list.ts`, `postgate`/`threadgate` — and every Stream 3 record
write call repo CRUD). Building them here keeps every later phase a clean, isolated diff.

**Checklist:**

- [ ] Create `src/lib/moderation/compat.ts` per "Type migration strategy" rule 2: wrappers
      `moderateProfile` / `moderatePost` / `moderateUserList` accepting `@atcute`-typed input,
      casting to `@atproto/api` types internally, calling the real engine, returning the decision.
      Also re-export `ModerationOpts` / `ModerationDecision` types. **Do not** convert existing
      callers yet — that happens per-phase as each view type flips. Header comment: classify as a
      long-lived adapter, name Appendix A as the removal point.
- [ ] Add the `asPostRecord` / record-accessor helpers (a small module) for the `record: unknown`
      assertion pattern on view objects.
- [ ] Create `src/lib/api/records.ts` — typed `com.atproto.repo.*` CRUD helpers generic over the
      ambient `Records` map, so each call infers its record value from the `collection` NSID.
      `@atcute/client`'s generic `get`/`post` type `getRecord`'s `value` and `putRecord`'s `record`
      as `unknown`; these helpers re-type them via `Records[K]` and centralize the one `as` the
      `repo.*` shape needs. Stream 2 reads and every Stream 3 record write call these instead of
      hand-rolling the XRPC call. Sketch:

  ```ts
  import type { ComAtprotoRepoGetRecord, ComAtprotoRepoListRecords } from '@atcute/atproto';
  import { type Client, ok } from '@atcute/client';
  import type { Cid, Did, InferInput, ResourceUri } from '@atcute/lexicons';
  import type { Records } from '@atcute/lexicons/ambient';

  type RecordType = keyof Records;

  export interface CreateRecordOptions<K extends RecordType> {
  	repo: Did;
  	collection: K;
  	rkey?: string;
  	record: InferInput<Records[K]>;
  	swapCommit?: string;
  	validate?: boolean;
  }

  export const createRecord = async <K extends RecordType>(
  	client: Client,
  	options: CreateRecordOptions<K>,
  ) => {
  	return await ok(client.post('com.atproto.repo.createRecord', { input: options as any }));
  };

  export interface PutRecordOptions<K extends RecordType> {
  	repo: Did;
  	collection: K;
  	rkey: string;
  	record: InferInput<Records[K]>;
  	swapCommit?: string;
  	swapRecord?: Cid | null;
  	validate?: boolean;
  }

  export const putRecord = async <K extends RecordType>(
  	client: Client,
  	options: PutRecordOptions<K>,
  ) => {
  	return await ok(client.post('com.atproto.repo.putRecord', { input: options as any }));
  };

  export interface DeleteRecordOptions<K extends RecordType> {
  	repo: Did;
  	collection: K;
  	rkey: string;
  	swapCommit?: string;
  	swapRecord?: string;
  }

  export const deleteRecord = async <K extends RecordType>(
  	client: Client,
  	options: DeleteRecordOptions<K>,
  ) => {
  	await ok(client.post('com.atproto.repo.deleteRecord', { input: options }));
  };

  export interface GetRecordOptions<K extends RecordType> {
  	signal?: AbortSignal;
  	repo: Did;
  	collection: K;
  	rkey: string;
  	cid?: string;
  }

  export type GetRecordOutput<T> = ComAtprotoRepoGetRecord.$output & { value: T };

  export const getRecord = async <K extends RecordType>(
  	client: Client,
  	options: GetRecordOptions<K>,
  ): Promise<GetRecordOutput<InferInput<Records[K]>>> => {
  	const data = await ok(
  		client.get('com.atproto.repo.getRecord', {
  			signal: options.signal,
  			params: {
  				repo: options.repo,
  				collection: options.collection,
  				rkey: options.rkey,
  				cid: options.cid,
  			},
  		}),
  	);

  	return data as any;
  };

  export interface ListRecordsOptions<K extends RecordType> {
  	signal?: AbortSignal;
  	repo: Did;
  	collection: K;
  	cursor?: string;
  	limit?: number;
  }

  export type ListRecordsOutput<T> = ComAtprotoRepoListRecords.$output & {
  	cursor?: string;
  	records: { cid: Cid; uri: ResourceUri; value: T }[];
  };

  export const listRecords = async <K extends RecordType>(
  	client: Client,
  	options: ListRecordsOptions<K>,
  ): Promise<ListRecordsOutput<InferInput<Records[K]>>> => {
  	const data = await ok(
  		client.get('com.atproto.repo.listRecords', {
  			signal: options.signal,
  			params: {
  				repo: options.repo,
  				collection: options.collection,
  				limit: options.limit,
  				cursor: options.cursor,
  			},
  		}),
  	);

  	return data as any;
  };
  ```

**Done when:** the three seams compile and are exported; nothing imports them yet;
`pnpm lint && pnpm typecheck` pass.

---

# Stream 2 — Read-path migration

Six phases, each one type hub. Convert that hub's read queries from `useAgent()` + `BskyAgent` to
`useClients()` + `appview`/`pds`, flip the view types to `@atcute`'s, and update every consumer per
"Type migration strategy".

**Per-phase shape (applies to 2.1–2.6):**

1. Re-grep the hub's query files **and** their type consumers — build a live inventory.
2. In each query: replace `agent.app.bsky.X.Y(params)` with
   `ok(appview.get('app.bsky.X.Y', { params }))` (consult the routing table for `pds` and ad-hoc
   exceptions).
3. Flip the hub's lexicon **type** imports from `@atproto/api` to `@atcute/bluesky` /
   `@atcute/atproto`. Fix annotated functions/components, replace `is*`/`dangerousIsType` with
   `switch (x.$type)`, assert `record: unknown`.
4. Route any moderation call on the flipped type through `src/lib/moderation/compat.ts`.
5. Swap error guards: `isXRPCError` / `err.error` checks → `instanceof ClientResponseError`.
6. `pnpm lint && pnpm typecheck`, then smoke-test the hub's screens in `pnpm dev`.

## Phase 2.1 — Identity and resolution

**Motivation:** the safest warm-up. These queries return plain scalars (a DID, a handle, a URL) or
tiny objects — no shared view types. It exercises the `appview` routing before anything structural
is at stake.

**In scope (re-grep):** `handle.ts` (`useFetchHandle` only — `useFetchDid` and
`useUpdateHandleMutation` were deleted with the ChangeHandleDialog removal), `resolve-uri.ts`,
`service-config.ts`. `resolve-short-link.ts` and `shorten-link.ts` carry no `@atproto/api` and need
no change.

`resolve-link.ts` / `src/lib/api/resolve.ts` are **deferred**: `resolveLink` resolves links into
`PostView` / `GeneratorView` / `ListView` / `StarterPackView`, so it can only migrate alongside
those hubs (Phases 2.3–2.5). Pick it up there.

**Footguns:**

- `resolveHandle` for arbitrary handles → `appview`; the current user's own handle → `pds`.
- `resolve-uri.ts` uses `AtUri` from `@atproto/api`; that import stays until Phase 5.1 migrates the
  syntax helpers. Migrate only the XRPC call here.
- `actor-autocomplete.ts` is **not** here — it returns `ProfileViewBasic` and belongs to the profile
  hub (Phase 2.2).

**Done when:** the migrated identity queries (`handle.ts`, `resolve-uri.ts`, `service-config.ts`)
run on `appview` and import `@atcute` types, the only remaining `@atproto/api` import across them is
`AtUri` in `resolve-uri.ts` (deferred to Phase 5.1), lint+typecheck pass, and handle resolution
works in `pnpm dev`.

## Phase 2.2 — Profiles and social graph

**Motivation:** `ProfileView` / `ProfileViewBasic` / `ProfileViewDetailed` are the first widely
shared view types. This phase migrates every producer, the profile shadow cache, and every component
annotated with these types — including the autocomplete surface — as one consistent hub.

**In scope (re-grep):** `profile.ts` (read paths only — `upsertProfile` is Stream 3),
`profile-followers.ts`, `profile-follows.ts`, `known-followers.ts`, `suggested-follows.ts`,
`my-blocked-accounts.ts`, `my-muted-accounts.ts`, `useCurrentAccountProfile.tsx`,
`unstable-profile-cache.ts`, `actor-autocomplete.ts`; the shadow cache
`src/state/cache/ profile-shadow.ts`; shared components `ProfileCard` and the `Autocomplete` item
types.

**Footguns:**

- `src/state/cache/profile-shadow.ts` and its `Shadow<T>` type are the hub — read by dozens of
  components. Flip its type parameter in this phase; leaving it on the old type forces casts
  everywhere.
- `ProfileCard` (and similar) call `moderateProfile` directly from `@atproto/api`. Switch those
  imports to `src/lib/moderation/compat.ts` — that is what makes the `ProfileView` flip typecheck.
  Done-when greps for stragglers.
- `actor-autocomplete.ts` returns `ProfileViewBasic`; the `Autocomplete` item types currently store
  the fork's atproto-backed profile type — flip both together or the phase leaks types.

**Done when:** profile/graph/autocomplete queries use `appview`, the shadow cache is
`@atcute`-typed, every `moderateProfile` caller imports from the compat module
(`rg "moderateProfile" src/components src/screens src/view` shows no direct `@atproto/api` import),
lint+typecheck pass, and profiles / followers / follows / autocomplete / block+mute lists render in
`pnpm dev`.

## Phase 2.3 — Lists and starter packs

**Motivation:** `ListView` / `ListItemView` / `StarterPackView` form a self-contained cluster that
depends on profile types (done in 2.2) but little else.

**In scope (re-grep):** `list.ts`, `list-members.ts`, `list-memberships.ts`, `my-lists.ts`,
`profile-lists.ts`, `starter-packs.ts`, `actor-starter-packs.ts`,
`useSuggestedStarterPacksQuery.ts`, plus the shared list/starter-pack card components.

**Footguns:** these queries are paginated — preserve cursor handling exactly; `ok()` unwraps to
`data`, so `data.cursor` / `data.items` stay where they were. `moderateUserList` callers route
through the compat module.

**Done when:** list/starter-pack queries use `appview`, their consumers are `@atcute`-typed,
lint+typecheck pass, and lists + starter-pack screens work in `pnpm dev`.

## Phase 2.4 — Feeds

**Motivation:** feed generators and feed responses (`GeneratorView`, `FeedViewPost`). `FeedViewPost`
embeds `PostView` — the single most shared view type. Expect the largest consumer diff of Stream 2:
`PostView` is referenced by post controls, embeds, the post shadow cache, rich-text rendering, and
moderation.

**In scope (re-grep):** `feed.ts`, `post-feed.ts`, `profile-feedgens.ts`,
`explore-feed-previews. tsx`, `trending/`; the feed API classes `src/lib/api/feed/**` and the tuner
`src/lib/api/feed-manip` that `post-feed.ts` delegates to; the post shadow cache
`src/state/cache/post-shadow.ts`; `PostControls`, embed components, feed tuners
(`src/state/preferences/feed-tuners.tsx`).

**Footguns:**

- `post-feed.ts` is the fork's busiest query — home/discover/author feeds, feed tuners, and
  moderation. Route `moderatePost` through `src/lib/moderation/compat.ts`.
- `PostView['record']` is `unknown` — use the `asPostRecord` helper; many components read
  `post.record.text` / `.createdAt` / `.facets`.
- Post rendering builds `@atproto/api` `RichText` from `post.record.facets`. Those facets are now
  `@atcute`-typed — apply the thin facet boundary cast at the `RichText` construction site with a
  `// TODO(atcute Phase 3.0)` marker (Type migration strategy rule 3).
- The post shadow cache and feed tuners both consume `PostView`/`FeedViewPost` — flip them here.
- `PostControls` passes `PostView` into `usePostLikeMutationQueue` / `usePostRepostMutationQueue` /
  `useThreadMuteMutationQueue`, declared in `src/state/queries/post.ts` — a Stream 3 write file.
  Flipping `PostView` here breaks those hook signatures, so flip the hooks' **parameter type
  annotations** to `@atcute`'s `PostView` in this phase. Their write _bodies_ still call `BskyAgent`
  until Phase 3.1 — signature and body may diverge, and the old write call typechecks fine behind an
  `@atcute`-typed parameter.

**Suggested commit split:** `GeneratorView` (feed-generator metadata — `profile-feedgens.ts` and the
generator-typed views) does not embed `PostView`; land it as its own commit first. The `PostView` /
`FeedViewPost` flip — queries, post shadow cache, feed tuners, and every post-typed consumer — is
then one unavoidably large atomic commit: flipping a shared type forces all its consumers into the
same commit. Budget time accordingly; this is the largest commit in Stream 2.

**Done when:** feed queries use `appview`, `PostView`/`FeedViewPost` consumers compile against
`@atcute` types, moderation calls route through the compat module, lint+typecheck pass, and home /
discover / a custom feed / an author feed all load and paginate in `pnpm dev`.

## Phase 2.5 — Posts and threads

**Motivation:** with `PostView` flipped in 2.4, the remaining post-centric queries and the thread
view (`app.bsky.unspecced.getPostThreadV2` and its node union) are mostly mechanical.

**In scope (re-grep):** `post.ts`, `usePostThread/`, `post-liked-by.ts`, `post-quotes.ts`,
`post-reposted-by.ts`, `pinned-post.ts`, `post-interaction-settings.ts` (read), `postgate/` and
`threadgate/` (read paths — record writes are Stream 3).

**Footguns:**

- The thread response is a discriminated union of node types — exactly where `@atcute`'s proper
  `$type` unions pay off. Replace `is*ThreadView*` with `switch (node.$type)`; delete the
  corresponding `dangerousIsType` usage.
- `getPostThreadV2` is `app.bsky.unspecced.*` — still `appview`.

**Done when:** post/thread queries use `appview`, thread node narrowing is `$type`-based,
lint+typecheck pass, and a post thread with replies / quotes / likes renders in `pnpm dev`.

## Phase 2.6 — Notifications, activity subscriptions, and search

**Motivation:** the last read hubs. Notifications have their own view union; search reuses profile
and post types already migrated.

**In scope (re-grep):** `notifications/`, `activity-subscriptions.ts`, `actor-search.ts`,
`search-posts.ts`, `labeler.ts`, `bookmarks/` (read paths).

**Footguns:**

- `notifications/` has a polling/count path and a feed path — migrate both; the unread badge reads
  the count query.
- `labeler.ts` (`app.bsky.labeler.getServices`) feeds the moderation engine — its consumers route
  through `src/lib/moderation/compat.ts`.
- `bookmarks/` uses `app.bsky.bookmark.*` (`getBookmarks` here; `create`/`delete` are Stream 3) —
  covered by `@atcute/bluesky`.

**Done when:** all read queries are migrated, `rg "from '@atproto/api'" src/state/queries` shows
only Stream 3 write paths and the Stream 4 messages/chat queries (`src/state/queries/messages/**`,
migrated in Phase 4.1), lint+typecheck pass, and notifications / search / bookmarks work in
`pnpm dev`.

---

# Stream 3 — Write-path migration

Four phases. RichText opens the stream because the composer (3.1) depends on it. Writes need the
routing table's `pds` rules and, for the `BskyAgent` convenience methods, net-new in-housed code.

## Phase 3.0 — RichText

**Motivation:** `@atproto/api`'s `RichText` class (~46 files) does facet detection on compose and
segmentation on render. Compose-time `detectFacets` resolves mention handles over the network — so
the composer write path (3.1) cannot drop `BskyAgent` until RichText is migrated. `@atcute` splits
RichText into focused packages: `@atcute/bluesky-richtext-parser` (tokenizes compose input),
`@atcute/bluesky-richtext-segmenter` (walks facets for rendering),
`@atcute/bluesky-richtext-builder` (builds facets). **This is an API redesign, not a drop-in.**

**Checklist:**

- [ ] `pnpm add` the three richtext packages.
- [ ] Render-time `richText.segments()` → `@atcute/bluesky-richtext-segmenter`. Migrate the central
      rich-text renderer first, then leaf callers. This also removes the facet boundary casts left
      by Phases 2.4–2.5 (`rg "TODO(atcute Phase 3.0)" src`).
- [ ] Compose-time facet detection → `@atcute/bluesky-richtext-parser` + `-builder`. Mention tokens
      carry a handle; resolve each handle to a DID via the `appview` client (`resolveHandle`) and
      build the mention facet. This replaces `RichText.detectFacets(agent)` and is what unblocks
      Phase 3.1.
- [ ] Re-grep `rg "new RichText|detectFacets|UnicodeString" src` plus `@atproto/api` `RichText`
      imports, and convert each. The fork's own `src/components/RichText.tsx` / `RichTextTag.tsx`
      are unrelated to the SDK class — a bare `rg "RichText"` will be dominated by them.

**Footguns:**

- Facet **byte** offsets (UTF-8) vs string indices — `@atproto/api` wraps this in `UnicodeString`.
  Verify the `@atcute` parser/segmenter offset semantics match before trusting rendered facet
  positions; mishandled offsets corrupt mention/link highlighting silently.
- **Accepted regression:** `@atcute`'s facet parser does not detect protocol-less URLs (`bsky.app`
  typed without `https://`). Links written that way will no longer auto-facet. This is a deliberate,
  owner-approved trade-off — note it in the commit body.

**Done when:** `rg "new RichText|detectFacets|UnicodeString" src --glob '!locale/**'` is clean and
no `@atproto/api` `RichText` import survives (a bare `rg "RichText"` keeps matching the fork's own
`src/components/RichText.tsx` / `RichTextTag.tsx` — scope the check), no Phase 3.0 TODO markers
remain, lint+typecheck pass, and composing a post with mentions/links/tags and rendering posts with
facets both work in `pnpm dev`.

## Phase 3.1 — Record writes and the composer

**Motivation:** likes, reposts, follows, blocks, posts, drafts, and the Germ declaration are
`com.atproto.repo.*` **record** writes (`createRecord` / `deleteRecord` / `putRecord` /
`applyWrites`) → the `pds` client. **Mutes are not records** — `app.bsky.graph.muteActor` /
`muteActorList` / `muteThread` and their `unmute*` counterparts are server-side **procedures** → the
`appview` client. `BskyAgent` wraps all of it in helpers (`agent.like`, `agent.mute`,
`agent.muteModList`, `agent.post`, …); `@atcute/client` has no such sugar, so the helpers move into
the fork. With RichText migrated (3.0), the composer can now drop `BskyAgent` entirely.

**Checklist:**

- [ ] Re-home the toggle helpers. `agent.like(uri, cid)` becomes
      `createRecord(pds, { repo,     collection: 'app.bsky.feed.like', record: {...} })` via the
      `src/lib/api/records.ts` helpers (Phase 1.3). Thin wrappers in `src/lib/api/` or next to their
      callers — keep them small; do not rebuild `BskyAgent`.
- [ ] Migrate the composer publish path (`src/lib/api/index.ts`, `feed/`) — `createRecord` /
      `applyWrites` for posts, threadgates, postgates. Facet detection now uses the Phase 3.0 atcute
      path. This is the highest-stakes write path; smoke-test posting, replying, quote-posting, and
      a thread.
- [ ] **Mutes (procedures, → `appview`, not `pds`).** `agent.mute(did)` / `agent.unmute(did)` →
      `appview.post('app.bsky.graph.muteActor' | 'unmuteActor', { input: { actor: did }, as: null })`;
      `agent.muteModList(uri)` / `unmuteModList` → `muteActorList` / `unmuteActorList`;
      `agent.api.app.bsky.graph.muteThread` / `unmuteThread` → `muteThread` / `unmuteThread`. These
      procedures return no body — pass `as: null`. Call sites at fork time: `profile.ts`
      (mute/unmute actor), `list.ts` (mute/unmute mod list), `post.ts` (mute/unmute thread).
- [ ] **Germ declaration (record write, → `pds`).** `GermButton.tsx` / `ProfileHeaderStandard.tsx`
      use `agent.com.germnetwork.declaration.get/put/delete` — `@atproto/api`'s per-collection
      record-helper sugar. `@atcute/client` has only generic `get` / `post` / `call` (no
      per-collection helpers), so model it as plain repo record CRUD via the `pds` client and the
      `src/lib/api/records.ts` helpers (Phase 1.3) with `collection: 'com.germnetwork.declaration'`.
      Note: `@atcute/germ` augments the ambient `Records` map, **not** the
      `com.atproto.repo.getRecord` / `putRecord` XRPC signatures — a raw
      `Client.get('com.atproto.repo.getRecord')` returns `value: unknown`. The record helpers are
      generic over `Records[K]`, so they recover the `@atcute/germ` declaration type; that is what
      makes "no hand-rolled local type" true.
- [ ] Write-path query files (re-grep): `src/state/queries/like.ts`, `post.ts` (write + thread
      mute), `profile.ts` (mute/unmute), `list.ts` (mute/unmute mod list), `postgate/`,
      `threadgate/`, `post-interaction-settings.ts` (write), `pinned-post.ts` (write),
      `list-memberships.ts` (write), `bookmarks/` (write), `thread-mutes.tsx`.
- [ ] Optimistic-update mutations must preserve their `react-query` rollback exactly — the SDK swap
      changes the call, not the cache choreography.

**Footguns:**

- `applyWrites` is used for batch toggles — confirm the `writes` array shape matches `@atcute`'s
  `com.atproto.repo.applyWrites` input type.
- `repo` is the current user's DID — sourced from session, not hardcoded.

**Suggested commit split:** unlike a shared-type flip, these are independent call sites — land them
as separate green commits: (1) toggle helpers (like/repost/follow/block), (2) the composer publish
path, (3) mutes, (4) the Germ declaration. The composer commit is the highest-stakes; isolating it
keeps its diff reviewable.

**Done when:** record writes use `pds`, the composer no longer imports `BskyAgent`, lint+typecheck
pass, and like/repost/follow/block/mute, posting, and bookmarking all work and roll back correctly
on simulated failure in `pnpm dev`.

## Phase 3.2 — Preferences subsystem

**Motivation:** `@atproto/api`'s `BskyAgent` keeps a stateful preferences object and exposes ~20
mutators (`addSavedFeeds`, `overwriteSavedFeeds`, `setContentLabelPref`, `setAdultContentEnabled`,
`upsertMutedWords`, `setFeedViewPrefs`, `setThreadViewPrefs`, `setInterestsPref`,
`setVerificationPrefs`, …) plus `getPreferences`. `@atcute/client` has none of this. The fork must
own a small preferences module built directly on `app.bsky.actor.getPreferences` / `putPreferences`
— both routed to **`pds`** (the AppView-namespaced exception).

**Checklist:**

- [ ] Create a preferences module (fold into `src/state/queries/preferences/`): `getPreferences()` →
      `ok(pds.get('app.bsky.actor.getPreferences'))`; `putPreferences(prefs)` doing a
      read-modify-write against `pds.post`.
- [ ] Reimplement only the mutators the fork actually calls — re-grep
      `agent.set* agent.add*     agent.remove* agent.overwrite* agent.upsert*Muted* agent.updateSavedFeeds`
      for the live list. Each is "fetch prefs, edit the relevant entry by `$type`, write back" —
      `@atcute`'s proper `$type` unions make finding the right entry a clean `switch`.
- [ ] Migrate `src/state/queries/preferences/`, `src/state/queries/notifications/settings.ts`, muted
      words, saved feeds, and the moderation-prefs derivation
      (`src/state/preferences/moderation-opts.tsx`).
- [ ] `moderation-opts.tsx` produces `ModerationOpts` consumed by the compat module — keep producing
      whatever shape `src/lib/moderation/compat.ts` expects (it casts internally).

**Footguns:**

- `getPreferences` / `putPreferences` to `appview` will fail — they are PDS-implemented. This is the
  most likely silent misroute in the migration; double-check it.
- `putPreferences` is read-modify-write — a partial write drops other preference entries. Always
  send the full preferences array.

**Done when:** preferences read/write through `pds`, the in-housed mutators cover every former
`BskyAgent` preference call, lint+typecheck pass, and content filters / saved feeds / muted words /
feed-view settings all persist across reload in `pnpm dev`.

## Phase 3.3 — Profile and account writes

**Motivation:** the remaining writes — `upsertProfile`, handle changes, personal details, and
account-level `com.atproto.*` procedures.

**In scope (re-grep):** `profile.ts` `upsertProfile` (in-house it with the `src/lib/api/records.ts`
helpers: `getRecord` the existing `app.bsky.actor.profile` record, merge, `putRecord` — `pds`),
`agent.updateHandle`, `agent.setPersonalDetails`, account settings writes.

**Footgun:** `upsertProfile` reads then writes the profile record — `getRecord` for the user's
**own** record is `pds`, not `appview`.

**Done when:** profile/account writes use `pds`, `rg "from '@atproto/api'" src/state/queries`
returns nothing, lint+typecheck pass, and editing the profile / changing the handle work in
`pnpm dev`.

---

# Stream 4 — Ancillary clients

Three independent phases. Each constructs a locally-scoped client — none are added to session
context. Any of these may be pulled earlier if a Stream 2/3 phase needs it.

## Phase 4.1 — Chat client

**Motivation:** chat uses the `#bsky_chat` proxy. Its core lives in the Messages feature tree, but
`chat.bsky.*` calls also reach out from notifications and settings — so this phase is
**inventory-driven**, not scoped to a fixed directory list.

**Checklist:**

- [ ] Build the live inventory first:
      `rg "DM_SERVICE_HEADERS|CHAT_PROXY_DID|chat\.bsky\." src     --glob '!locale/**'`. At fork
      time `DM_SERVICE_HEADERS` reaches well beyond `src/state/queries/messages/`:
      `src/state/messages/convo/agent.ts`, `src/state/messages/events/agent.ts`,
      `src/view/com/notifications/NotificationFeedItem.tsx`, and
      `src/screens/Settings/components/ExportCarDialog.tsx` all consume it. Migrate **every** hit.
- [ ] Introduce the `PUBLIC_CHAT_PROXY_AUDIENCE` env (full audience, e.g.
      `did:web:api.bsky.chat#bsky_chat`) — `global.d.ts`, `.env.example`, a `CHAT_PROXY_AUDIENCE`
      constant in `src/env/common.ts`.
- [ ] Construct a `chat` client where the messages subsystem builds its state —
      `new Client({     handler, proxy: CHAT_PROXY_AUDIENCE })`, reusing the session handler. Expose
      a small non-global accessor (a getter, not session context) so the out-of-tree consumers
      (`NotificationFeedItem`, `ExportCarDialog`) can reach it without each rebuilding a client.
- [ ] Migrate every inventory hit from `agent.chat.bsky.*` / `DM_SERVICE_HEADERS` to the `chat`
      client.
- [ ] **Only once the inventory grep is clean**, remove `DM_SERVICE_HEADERS` and `CHAT_PROXY_DID`
      from `src/lib/constants.ts` and the `PUBLIC_CHAT_PROXY_DID` env — in the same commit, so no
      consumer is left referencing a deleted constant.

(The Germ declaration — `com.germnetwork.declaration` — is **not** part of this phase. Despite the
DM association it is a repo record, migrated as record CRUD in Phase 3.1.) **Done when:** chat
queries use the `chat` client, lint+typecheck pass, and DMs send/receive and the unread badge
updates in `pnpm dev`.

## Phase 4.2 — Video upload client

**Motivation:** the composer's video pipeline talks to the video service directly with a short-lived
service-auth token — **not** through the proxy mechanism. The video service has no published DID
document (`https://video.bsky.app/.well-known/did.json` does not exist), so the PDS cannot resolve
it as an `atproto-proxy` target. This is the one ancillary client that authenticates by **token**,
not by proxy; it stays on `getServiceAuth` deliberately.

**Checklist:**

- [ ] Introduce `PUBLIC_VIDEO_PROXY_DID` — a **bare DID** (e.g. `did:web:video.bsky.app`), not a
      full audience. It is the **only** service env in this form: it feeds the `aud` argument of
      `com.atproto.server.getServiceAuth` (which is scoped to a DID), never an `atproto-proxy`
      header. The bare-DID objection that drove the `*_PROXY_AUDIENCE` envs does not apply — nothing
      appends a `#service-id`. Wire it through `global.d.ts`, `.env.example`, `src/env/common.ts`.
- [ ] In `src/lib/media/video/`, replace the upload agent with a `Client`: mint the token via
      `ok(pds.get('com.atproto.server.getServiceAuth', { params: { aud: VIDEO_PROXY_DID, lxm: ... } }))`,
      then construct a `Client` whose handler points at the video service and carries that token as
      a bearer credential. No `proxy` is set on this client.
- [ ] Migrate `upload.ts`, `upload.shared.ts`, and the composer's video state.

**Done when:** video upload uses a local token-authed `Client` (no proxy), lint+typecheck pass, and
uploading a video in the composer works in `pnpm dev`.

## Phase 4.3 — Labeler / moderation-service proxy

**Motivation:** reports and appeals are funnelled to a labeler service via the `#atproto_labeler`
proxy. The target is sometimes a per-report labeler DID and sometimes the fixed default Bluesky
labeler — and the fixed-labeler proxy header has consumers beyond the report dialog, so this phase
is **inventory-driven**.

**Checklist:**

- [ ] Build the live inventory:
      `rg "BLUESKY_MOD_SERVICE_HEADERS|#atproto_labeler|createReport"     src --glob '!locale/**'`.
      At fork time `BLUESKY_MOD_SERVICE_HEADERS` is consumed not only by `ReportDialog/` and
      `LabelsOnMeDialog.tsx` but also by appeal flows —
      `src/features/liveNow/components/GoLiveDisabledDialog.tsx` and
      `src/screens/Messages/components/ChatDisabled.tsx`. Migrate **every** hit.
- [ ] Per-report path: in `src/components/moderation/ReportDialog/`, build a `Client` per submission
      with
      `proxy: \`${labeler.did}#atproto_labeler\``and call    `com.atproto.moderation.createReport`.
      The labeler DID varies per report — this audience is built at runtime and gets no env.
- [ ] Fixed default-Bluesky-labeler path: introduce `PUBLIC_BSKY_LABELER_PROXY_AUDIENCE` (full
      audience) with a `BSKY_LABELER_PROXY_AUDIENCE` constant; route the appeal flows and any other
      `BLUESKY_MOD_SERVICE_HEADERS` consumer through a client carrying that proxy.
- [ ] **Only once the inventory grep is clean**, remove `BLUESKY_MOD_SERVICE_HEADERS` from
      `src/lib/constants.ts`. **Keep `BSKY_LABELER_DID`** — it is a moderation _identity_ constant
      (used by `useModerationCauseDescription.ts`, `Pills.tsx`, `ReportDialog/index.tsx`), not a
      proxy header; it moves into the moderation island in Phase 5.3, it is not deleted here.
- [ ] `createReport` is `com.atproto.moderation.createReport`, typed by `@atcute/atproto` — there is
      no `tools.ozone.*` _endpoint_ in this path. `@atcute/ozone` only supplies report **reason**
      types from `tools.ozone.report.defs`, and atcute names them lowercase (`reasonAppealSchema`,
      value `'tools.ozone.report.defs#reasonAppeal'`) — not `@atproto/api`'s
      `ToolsOzoneReportDefs.REASONAPPEAL` constant. Map the fork's `REASONAPPEAL` usages
      (`ReportDialog/const.ts`, `LabelsOnMeDialog.tsx`, the appeal dialogs) onto the atcute value
      literal or a small local constant typed from `@atcute/ozone`.

**Done when:** `rg "BLUESKY_MOD_SERVICE_HEADERS" src` is clean, reporting and appeal flows use
proxied clients, lint+typecheck pass, and submitting a report (post + profile) and opening the
chat-disabled / go-live-disabled appeal dialogs all work in `pnpm dev`.

---

# Stream 5 — Off-SDK utilities

Three phases. 5.1–5.2 migrate non-network pieces of `@atproto/api` (independent of the client work —
they could run in parallel with Streams 2–4). 5.3 consolidates the deferred-moderation island and
**must precede Stream 6** — it is what makes deleting `BskyAppAgent` safe.

## Phase 5.1 — `AtUri` and syntax helpers

**Motivation:** `AtUri` is imported in ~60 files purely to parse/format `at://` URIs.
`@atcute/lexicons/syntax` provides `parseCanonicalResourceUri` / `parseResourceUri` /
`isCanonicalResourceUri` and DID/handle/NSID/record-key/TID parsers.

**Checklist:**

- [ ] Replace `new AtUri(s)` field access with the corresponding `parseCanonicalResourceUri(s)`
      result fields. Note the rename: `@atproto/api`'s `AtUri.host` becomes `.repo` on the parsed
      result (`{ repo, collection, rkey, fragment }`); `.collection` and `.rkey` keep their names.
      Where the app _builds_ URIs by string-concat, keep that.
- [ ] If a single fork-local `parseAtUri` / `makeAtUri` helper reduces churn across ~60 files, add
      one thin wrapper in `src/lib/`; otherwise use `@atcute/lexicons/syntax` directly.
- [ ] Migrate `TID` usage to `@atcute/tid` if any exists.

**Done when:** `rg "AtUri" src` is clean, lint+typecheck pass.

## Phase 5.2 — Retire the validation layer

**Motivation:** `src/types/bsky/` (`dangerousIsType`, `validate`, the per-type modules) exists to
narrow `@atproto/api`'s loose `$type` unions. With `@atcute`'s proper discriminated unions a
`switch (x.$type)` narrows natively — the layer is dead weight.

**Checklist:**

- [ ] Re-grep `rg "from '#/types/bsky'|dangerousIsType|bsky\.validate" src`. Replace each call with
      direct `$type` branching, or `@atcute/lexicons`'s `is(schema, value)` where a genuine runtime
      check is still wanted.
- [ ] `rm -rf src/types/bsky` once no importer remains. This removes the last `@atproto/lexicon`
      (`ValidationResult`) import.

**Done when:** `src/types/bsky/` is deleted, `rg "dangerousIsType|@atproto/lexicon" src` is clean,
lint+typecheck pass.

## Phase 5.3 — Consolidate the moderation island

**Motivation:** moderation is more than `moderatePost` / `moderateProfile`. The fork also keeps
moderation _configuration_ — `src/state/session/moderation.ts` (`Agent.configure({ appLabelers })`,
test-labeler switching), `src/state/preferences/moderation-opts.tsx` (builds `ModerationOpts`),
`src/state/session/additional-moderation-authorities.ts`, and `BSKY_LABELER_DID` — and several of
these import `@atproto/api`'s `Agent` / `BskyAgent` directly. While moderation is deferred (Appendix
A), all of that must survive; but it must also stop depending on the fork's `BskyAppAgent`, or
Stream 6 cannot delete the agent. This phase gathers the survivors into one bounded directory,
decoupled from `BskyAppAgent`.

**Checklist:**

- [ ] Re-grep the live moderation surface:
      `rg "moderat|appLabelers|BSKY_LABELER_DID|ModerationOpts|     from '@atproto/api'" src/state/session/moderation.ts src/state/session/additional-moderation-     authorities.ts src/state/preferences/moderation-opts.tsx src/state/session/agent-config.ts`.
- [ ] Move the moderation survivors under `src/lib/moderation/**` alongside `compat.ts`: the
      `ModerationOpts` derivation, `additional-moderation-authorities` logic, `BSKY_LABELER_DID`,
      and the `Agent.configure({ appLabelers })` setup. The island keeps importing `@atproto/api`
      (`moderatePost`, `moderateProfile`, `Agent`, moderation types) — that is the intended, bounded
      survival until Appendix A.
- [ ] Decouple from `BskyAppAgent`. `configureModerationForAccount(agent, account)` no longer takes
      the fork agent: its `resolveHandle` call already moved to a client in Phase 2.1, its
      labelers-header logic to the `appview` client in Phase 1.2. What remains —
      `Agent.configure({ appLabelers: [...] })` — is a static call on `@atproto/api`'s `Agent`
      class, which exists for as long as the package is installed; the island calls it directly.
- [ ] Every consumer imports moderation (engine _and_ config/opts) only from
      `src/lib/moderation/     **` — no `@atproto/api` moderation import survives elsewhere.

**Done when:**
`rg "from '@atproto/api'" src --glob '!src/lib/moderation/**' --glob '!src/state/session/agent.ts'`
is clean (the agent file is Stream 6's job), `rg "moderat" src` resolves moderation through the
island, lint+typecheck pass, and content filtering / labeler badges / appeal flows work in
`pnpm dev`.

---

# Stream 6 — Partial `@atproto/api` removal

## Phase 6.1 — Delete the compatibility layer; shrink `@atproto/api` to the moderation island

**Motivation:** with every call site, view type, RichText, and syntax helper migrated (and
moderation consolidated by Phase 5.3), the only remaining `@atproto/api` importers are the
`src/lib/moderation/**` island and `src/state/session/agent.ts`. Deleting the `BskyAppAgent` wrapper
from the latter collapses the dependency to the bounded moderation island.

**Checklist:**

- [ ] Confirm the remaining `@atproto/api` importers: `rg "from '@atproto/api'" src` should return
      only files under `src/lib/moderation/**` plus `src/state/session/agent.ts` (deleted below).
      `rg "from '@atproto/(xrpc|lexicon|syntax)'" src` should be empty.
- [ ] Confirm the old agent is otherwise unreferenced — typecheck-clean is not enough, since a stale
      `useAgent()` call would only surface once `AgentContext` is deleted. `rg "useAgent\b"     src`
      must be empty, and
      `rg "\bagent\.(app|com|chat)\.|\bagent\.(get|post|like|repost|mute|     upsert)" src` must
      turn up nothing — any hit is a call site Streams 2–4 missed.
- [ ] Delete the `BskyAppAgent` / `BskyAgent` / `Agent` machinery from `src/state/session/agent.ts`
      — OAuth session prep is rewritten to produce `@atcute` clients directly (the
      `createOAuthClients` path from Phase 1.2 becomes the only path). `useAgent()` and
      `AgentContext` are deleted; `useClients()` is the sole accessor.
- [ ] Re-home anything still living only because `agent.ts` provided it: `refreshSessionData` /
      `InactiveAccountError` logic now runs on the `pds` client (`com.atproto.server.getSession`).
- [ ] With `BskyAppAgent` gone, its proxy plumbing is dead — remove `BLUESKY_PROXY_HEADER` and the
      `BLUESKY_PROXY_DID` constant from `src/lib/constants.ts` / `src/env/common.ts`, and the
      `PUBLIC_BLUESKY_PROXY_DID` env from `global.d.ts` and `.env.example`. This is the last of the
      bare-DID proxy envs; only the `*_PROXY_AUDIENCE` envs remain.
- [ ] `pnpm remove @atproto/xrpc @atproto/lexicon @atproto/syntax` (each verified unused first;
      `@atproto/syntax` is separately pinned at `0.5.2` — re-grep before removing). **`@atproto/api`
      stays** — the `src/lib/moderation/**` island still imports it. Delete any matching `patches/`
      entries in the same commit.
- [ ] `pnpm install`, then `pnpm build`.

**Footgun:** per the fork's dependency-removal invariant — `package.json`, `pnpm-lock.yaml`, and any
`patches/<pkg>` entry must all change in one commit, or `pnpm install` breaks on the next run.

**Done when:** `@atproto/{xrpc,lexicon,syntax}` are gone, `@atproto/api` is imported only by the
`src/lib/moderation/**` island, `pnpm build` succeeds, and a full manual pass (login, feed, thread,
compose, profile, messages, moderation) works in `pnpm dev`.

---

# Appendix A — Moderation engine migration (deferred)

**This work is explicitly deferred** — it is not on the immediate execution path. The project owner
has chosen to keep the moderation engine on `@atproto/api` for now; this appendix records the plan
so the deferral is intentional, not forgotten.

`@atproto/api`'s `moderatePost` / `moderateProfile` / `moderateUserList` and label interpretation
move to `@atcute/bluesky-moderation` (note `moderateUserList` is named `moderateList` there). This
is an API redesign: `@atcute` uses `interpretLabelerDefinitions` +
`moderatePost(post, { viewerDid, prefs, labelDefs })` and a
`getDisplayRestrictions(decision, DisplayContext.X)` accessor, where `@atproto/api` returns a
decision with a `.ui('contentList')` method.

When this is undertaken:

- `pnpm add @atcute/bluesky-moderation`.
- Migrate `src/state/preferences/moderation-opts.tsx` to produce `@atcute`'s `ModerationPreferences`
  shape; use `interpretLabelerDefinitions` for labeler defs.
- Rewrite the `src/lib/moderation/**` island to call `@atcute/bluesky-moderation` directly and drop
  the casts — **because every app caller already imports moderation from the island, no call site
  outside it needs to change.** Then collapse the compat indirection if it is no longer useful.
- Convert `.ui(context)` consumers to `getDisplayRestrictions(decision, DisplayContext.X)`, mapping
  the fork's UI contexts onto `DisplayContext`.
- `pnpm remove @atproto/api`, delete matching patches, `pnpm install && pnpm build`.

**Footgun:** moderation drives what users see — a wrong context mapping silently shows content that
should be filtered, or hides content that should not. Smoke-test against an account with
adult-content prefs and an active labeler subscription.

**Done when:** `@atproto/*` is absent from `package.json`, `rg "@atproto" src` is clean, and content
filtering / blur / labeler badges behave correctly in `pnpm dev`.

---

# Definition of done

Streams 1–6 deliver the client swap: `@atproto/{xrpc,lexicon,syntax}` removed, `BskyAgent` gone,
every network call routed through an explicitly-named client (`appview`, `pds`, `chat`, the video
client, a per-report reporting client, or an ad-hoc service/entryway/resolver client) per the
routing reference. At that point `@atproto/api` survives only inside the bounded
`src/lib/moderation/**` island. Appendix A, when the owner chooses to run it, sheds that last
dependency. The fork is fully on `@atcute` once Appendix A completes.
