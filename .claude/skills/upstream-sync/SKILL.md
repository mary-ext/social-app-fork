---
name: upstream-sync
description: Sync new changes from upstream.
disable-model-invocation: true
---

### 1. Fetch upstream

```
git fetch bluesky
```

This remote should be set it to `github:bluesky-social/social-app` if it's not present.

Ensure that it is not a shallow clone.

### 2. Establish the range

Read the marker in `README.md` under "upstream tracking":

> last reviewed upstream tip: `<hash>` (date)

The review range is `<hash>..upstream/main` (`upstream/main` is bluesky's default branch). Confirm
the size:

```
git rev-list --count <hash>..upstream/main
git log --oneline <hash>..upstream/main
```

### 3. Review every commit

Read each commit's diff, oldest to newest:

```
git show <commit>
```

Take the following cases in mind:

1. **Review benign-looking commits.** A commit whose message reads as a pure iOS/Android fix or a
   tooling dependency bump can still touch web-related paths.

2. **No commit will ever be a match.** It will always conflict, we are pretty much close to removing
   React Native entirely here. This will not be a direct port from upstream.

3. **Absent code is not missing code.** We may deliberately omit code that might just not be ready
   yet, e.g. considered beta or placed under A/B testing. If a commit touches on a feature whose
   code is absent, determine whether it had been intentionally dropped or not.

   This does not mean we won't port beta features at all though, we may even unflag it ahead of time
   if it's a good change.

For each relevant change, find where the corresponding code lives in this fork (Grep/Glob/Read) and
evaluate what a port would actually require given the divergence. When no counterpart exists, record
why: stripped feature, beta or A/B-gated, or a genuine gap worth filling.

**Large ranges:** Split the list of commits into chunks and hand each chunk to a subagent. Give the
subagent the exact hashes and this instruction: `git show` each commit and report per commit — files
touched, whether any web/shared code changed, a one-line summary, and a preliminary tier (step 5).
Then re-run `git show` yourself on the port-worthy candidates before trusting them; a subagent
returns a paraphrase, not the source.

### 4. Report, grouped by interest

Prepare a table of commits and rationale over why we should/shouldn't port, grouped into the
following tiers:

- **Good to port** — clear web value, fits the fork cleanly.
- **Meh to port** — minor or marginal; fine to skip.
- **Bad but we can port anyway** — awkward fit or extra work, but defensible.
- **Ignore entirely** — native-only, a/b-gated, or targets a stripped feature.

Then propose an order for the items worth porting (by dependency, risk, and size). Each item ports
as its own separate commit — decompose the list into commit-sized units of one logical change, never
a single batched "sync upstream" commit. Stop here.

### 5. Get explicit agreement

Present the plan and wait for the user to explicitly agree before any porting begins. Expect
back-and-forth over what belongs in or out — revise until they sign off. Only then move on to
implementation.

## Advancing the marker

Once the reviewed range has been handled — ported or consciously skipped — per the agreed plan,
update the marker in `README.md`. Pin the resolved hash, not the moving branch:

```
git rev-parse upstream/main
```

Write that hash and today's date into "last reviewed upstream tip". The marker means "reviewed", not
"ported": advance it when review of the range is complete, including for changes deliberately
skipped.
