# `@lingui/cli` patch notes

rationale for the hunk in `@lingui__cli.patch`. re-evaluate on every `@lingui/cli` upgrade —
upstream may ship the fix, at which point the mode-only patch stops applying (loudly) and should be
dropped.

## `dist/lingui.js` — restore the executable bit

lingui 6 publishes its CLI entrypoint (`dist/lingui.js`, the `lingui` bin) with mode `100644`, so
the `.bin/lingui` shim is not executable and `pnpm intl:extract` / `intl:compile` fail with
`Permission denied`. the patch sets mode `100755`. the file already carries a `#!/usr/bin/env node`
shebang, so the bit is all that is missing.
