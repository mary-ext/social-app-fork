# `@vanilla-extract/css` patch notes

rationale for each hunk in `@vanilla-extract__css.patch`. keep this in sync when the patch changes,
and re-evaluate every hunk on a `@vanilla-extract/css` upgrade — line offsets and the surrounding
code may have shifted, and upstream may have fixed the issue.

the patch touches only `dist/vanilla-extract-css.cjs.prod.js`. that is the one build file on the
class-name path: the integration externalizes `@vanilla-extract` and evaluates each `.css.ts` in
node, so `@vanilla-extract/css` resolves through `main` → `cjs.js`, which dispatches to
`cjs.prod.js` under the production build's `NODE_ENV`. the esm/dev/browser builds never run there,
so patching them would be dead diff.

## `generateIdentifier` — base64 class names

upstream renders each production identifier as `fileScopeHash + refCount`, with the murmur
file-scope hash and the per-file ref counter both in base36 (`0-9a-z`, 36 symbols). the hunk keeps
that exact structure and its uniqueness guarantees but renders both parts through `toBase64`, a
64-symbol css-safe alphabet (`A-Za-z0-9-_` — base64url, since `-` and `_` are valid identifier
characters where standard base64's `+/` are not). more symbols per character means shorter names.
the file-scope hash is recovered from murmur's base36 string with `parseInt(…, 36)` back to its
uint32 and re-encoded; no second hash is computed.

## `normalizeIdentifier` — guard the leading character

base64url introduces two leading characters base36 never produced: `-` and `_`. the file-scope hash
leads the identifier, and a class selector may not begin with a digit or with `-` followed by a
digit. upstream only prefixed `_` for a leading digit (`/^[0-9]/`); the hunk widens the guard to
require a leading letter or underscore (`/^[A-Za-z_]/`), prefixing `_` otherwise. this is
load-bearing, not defensive: a real hash in a recent build encoded to a leading `-`, which the
original guard would have emitted as the invalid selector `.-…`.
