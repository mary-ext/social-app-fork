---
name: upstream-sync
description: Sync new changes from upstream.
disable-model-invocation: true
---

## 1. Establish the range

`git fetch upstream` — the remote is `https://github.com/bluesky-social/social-app`, and the clone
must be full, not shallow.

`README.md` under "upstream tracking" carries the marker:

> last reviewed upstream tip: `<hash>` (date)

The range is `<hash>..upstream/main`. Size it with `git rev-list --count` and `git log --oneline`.

## 2. Review every commit, oldest to newest

`git show <commit>`, then find the fork's counterpart with grepping the codebase and judge what a
port would actually cost.

- Read the diff, not the subject line. A commit that reads as an iOS/Android fix or a dependency
  bump still touches shared and web code often enough to be worth checking.
- Nothing applies cleanly — React Native is nearly gone here, so every port is a rewrite rather than
  a cherry-pick.
- Absent code is usually deliberate: a stripped feature, or something still beta or A/B gated.
  Determine which before calling it a gap. A good beta feature is still portable, and we may unflag
  it ahead of upstream.

**Chase the prerequisites.** A commit's diff is only half the story; keep digging until you can
state what porting it needs, and say what you checked.

- New or changed lexicons → do our `@atcute/*` packages cover them yet? Compare the installed
  version against `pnpm view @atcute/<pkg>`.
- New upstream dependency → does the same package work on web, is there an equivalent, or is it
  replaceable with what we already have?
- Builds on an earlier upstream commit outside the range, or on one you tiered as skip → surface
  that link.

**Large ranges:** hand chunks of hashes to subagents, asking each for per-commit files touched,
whether web or shared code changed, a one-line summary, and a preliminary tier. Re-run `git show`
yourself on the candidates they flag — a subagent returns a paraphrase, not the source.

## 3. Report, grouped by interest

A table of commit and rationale, in tiers:

- **Good to port** — clear web value, fits the fork cleanly.
- **Meh to port** — minor or marginal; fine to skip.
- **Bad but we can port anyway** — awkward fit or extra work, but defensible.
- **Ignore entirely** — native-only, A/B gated, or targets a stripped feature.

Attach the prerequisites from step 2 to each portable item. Then propose an order by dependency,
risk, and size, decomposed into commit-sized units of one logical change each. Stop here.

## 4. Get explicit agreement

Present the plan and wait for explicit sign-off before porting. Expect back-and-forth over what
belongs in or out; revise until the user agrees, then implement.

## Advancing the marker

The marker means "reviewed", not "ported" — advance it once the range is handled, deliberate skips
included. Write the resolved hash from `git rev-parse upstream/main` and today's date into
`README.md`.
