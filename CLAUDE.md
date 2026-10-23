a fork of Bluesky app, with several features removed, and most importantly refactored to no longer
use React Native.

## development notes

this project uses React Compiler and Paraglide. UI primitives live in `src/components/primitives`.

### project management

- Node.js and pnpm are managed by mise
- start the dev server with `pnpm dev` (vite)
  - always at http://127.0.0.1:19006
  - if it's already running, use it as-is
  - if port is used by another program: stop and report
  - if you need to stop a server you did not spawn for any reason, like stale HMR issues, confirm
    with the user.
- build with `pnpm build` (vite)
  - do not run `vite build` while a Vite development server is running, this will cause spurious HMR
    updates.
- format with `pnpm format` (oxfmt)
- lint and typecheck with `pnpm lint` (oxlint)
  - oxlint is configured to run the type checker, AVOID running `tsc`
- check `pnpm view <package>` before adding a new dependency

### browser automation

/agent-browser skill has been preconfigured with AGENT_BROWSER_NAMESPACE and AGENT_BROWSER_SESSION.
check `agent-browser session list` to see the assigned name and whether the browser is already
running for that particular session.

work that needs authentication should pass `--restore` when opening a session for the first time,
later commands may omit this flag. if you're still signed out, try going through the sign in flow
anyway but if it asks for a credential, stop and report to the user.

the agent-browser daemon and subsequently the browsers may close itself after some inactivity.

the first load of a page often comes up blank; reload once before you treat it as a bug. using curl
tests nothing of value.

do not run `agent-browser close --all`.

### code writing

#### formatting

- name new files in kebab-case
- indent with tabs (spaces allowed for diagrams in comments)
- use single quotes for strings; reserve template literals for localization (user-facing strings,
  error messages)
- add trailing commas
- order type/object fields in the way you'd introduce a thing to someone, typically this would be:
  discriminant → identifiers → names → description → classification/status → data/values →
  metadata/references → methods
  - CSS properties go in outside-in concentric order.

#### control flow and structure

- use braces for control statements, even single-line bodies
- group related code and limit variable scope with bare blocks `{ }`
- use `switch` over `if`/`else if` chains when branching on a single discriminant value
- use `if` over ternaries for complex statements
- delimit sections of larger files with `// #region <name>` and `// #endregion`
- prefer direct imports over barrel modules unless their tree-shaking behavior is understood and
  their impact on bundle size is negligible or absent

#### functions and methods

- prefer arrow functions; use method shorthand for object/class methods
- make parameters optional only when callers both pass and omit them. remove unused defaults;
  require always-passed parameters. use separate functions when presence/absence selects distinct
  behavior
- prefer an options object for boolean flags, confusable same-typed parameters, or 2+
  optional/defaulted parameters. split boolean-selected behaviors into separate functions.
  otherwise, positional parameters are fine when their types and order are clear

#### types

- use `as Type` or `as const` only to resolve TypeScript errors when no cleaner solution exists

#### mutation

- do not mutate arguments or values reachable through them; copy first. mutation is fine for owned
  values (locals, clones, new objects), or when the function's name and JSDoc explicitly promise it

### commit workflow

- one logical change per commit; choose the type for the whole change, not each file category
- accepted types:
  - `feat`: additions to the public API
  - `fix`: bug fixes
  - `refactor`: restructuring without behavior changes
  - `docs`: Markdown documentation
  - `chore`: build, tooling, dependencies, mass-autofixes, or standalone tests/comments/JSDoc
- ship related tests and comments with their feature or fix
- no scopes: `feat: ...`
- mark breaking changes with `!`: `feat!: ...`

### documentation

- use lowercase in READMEs, comments, JSDoc, and commit messages, except for proper nouns, acronyms,
  and 'I'. public-facing interfaces (web UI) are exempt
- omit boilerplate and obvious restatements in documentation and user-facing messages. keep shared
  explanations in one place; link instead of repeating
- comment only non-trivial code; explain why
- add JSDoc to new publicly exported functions, methods, classes, fields, and enums:
  - `@param` for parameters (no dashes after param names)
  - `@returns` for return values
  - `@throws` for exceptions when applicable
  - describe the caller-facing contract, including preconditions. put implementation details and
    rationale in regular comments unless they constrain callers

### agentic coding

- use root `.research/` for experiments, analysis, plans, and reference materials like cloned Git
  repositories; create it if absent. it is local and disposable: committed code, documentation, and
  commit messages must not reference paths inside it or depend on its contents
