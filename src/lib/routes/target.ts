import type { BuildParamsOf, RouteName } from '@oomfware/stacker';

import type { routes } from '#/routes';

type Routes = typeof routes;

/** a route name accepted by the typed navigation surface. */
export type AppRouteName = RouteName<Routes>;

// three shapes, in order: a route with no parameters at all rejects `params` outright; a route whose
// parameters are all optional takes it optionally; anything else requires it. mirrors stacker's own
// `BuildArgs` optionality rule, plus the `never` case so a stray bag on a paramless route is still an error
// (`{}` as a target type accepts any object literal, so excess-property checking alone would not catch it).
type TargetFor<K extends AppRouteName> = [keyof BuildParamsOf<Routes, K>] extends [never]
	? { readonly name: K; readonly params?: never }
	: Record<never, never> extends BuildParamsOf<Routes, K>
		? { readonly name: K; readonly params?: BuildParamsOf<Routes, K> }
		: { readonly name: K; readonly params: BuildParamsOf<Routes, K> };

/**
 * an in-app navigation destination: a route name plus the parameters that route needs. this is the typed
 * replacement for passing a hand-built path string around.
 */
export type RouteTarget = { [K in AppRouteName]: TargetFor<K> }[AppRouteName];
