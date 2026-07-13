import { useMemo } from 'react';

import { StackActions, useNavigation, useNavigationState } from '@react-navigation/native';

import { useDedupe } from '#/lib/hooks/useDedupe';
import { getCurrentRoute } from '#/lib/routes/helpers';
import type { AllNavigatorParams, NavigationProp, RouteParams } from '#/lib/routes/types';

import { router } from '#/routes';

/**
 * the app's navigation surface.
 *
 * it deliberately exposes what the app needs — go somewhere, know where you are — and not what the navigator
 * underneath happens to offer. nothing outside this module should reach for `dispatch`, `getState`, or a
 * navigation action object.
 */

// #region going somewhere

/** the name of a screen the app can navigate to. */
export type RouteName = keyof AllNavigatorParams;

/**
 * what a navigation does to the history stack.
 *
 * - `push` always stacks a new screen, so back returns to the current one
 * - `replace` swaps the current screen out, dropping it from history
 * - `navigate` reuses the target's existing screen when it is already in the stack, popping back to it
 */
export type NavigateAction = 'navigate' | 'push' | 'replace';

// screens that take no params must be navigated to without one, and screens that take params must not
// be navigated to without one.
type ParamsArg<Name extends RouteName> = AllNavigatorParams[Name] extends undefined
	? [params?: undefined]
	: [params: AllNavigatorParams[Name]];

/** navigation by route name. repeated calls in the same frame collapse into one. */
export type AppNavigate = {
	[Action in NavigateAction]: <Name extends RouteName>(name: Name, ...params: ParamsArg<Name>) => void;
};

/**
 * navigates by route name.
 *
 * @returns one function per {@link NavigateAction}
 */
export const useAppNavigate = (): AppNavigate => {
	const navigation = useNavigation<NavigationProp>();
	const dedupe = useDedupe();

	return useMemo(() => {
		// react-navigation types these as conditional tuples that don't survive being wrapped in a generic
		// of our own, and it doesn't type `navigate`'s options at all. this is the seam, so the mess stops
		// here: `AppNavigate` is what callers see.
		const nav = navigation as unknown as {
			navigate: (name: string, params: unknown, options: { pop: boolean }) => void;
			push: (name: string, params: unknown) => void;
			replace: (name: string, params: unknown) => void;
		};

		return {
			navigate: (name, ...params) => {
				// `navigate` stacks like `push` unless it is told to pop back to an entry it already has
				dedupe(() => nav.navigate(name, params[0], { pop: true }));
			},
			push: (name, ...params) => {
				dedupe(() => nav.push(name, params[0]));
			},
			replace: (name, ...params) => {
				dedupe(() => nav.replace(name, params[0]));
			},
		};
	}, [dedupe, navigation]);
};

/** navigates to an in-app path — what following a link does. */
export type NavigateToPath = (path: string, action: NavigateAction) => void;

/**
 * navigates to an in-app path, reading the target screen and its params off the path itself.
 *
 * @returns a navigate function; a path that matches no route lands on NotFound
 */
export const useNavigateToPath = (): NavigateToPath => {
	const navigation = useNavigation<NavigationProp>();
	const dedupe = useDedupe();

	return (path, action) => {
		// the route name only exists at runtime here, which is the one thing the typed surface above can't
		// express — so this is the only place that talks to the navigator in its own terms
		const [name, params] = router.matchPath(path);

		dedupe(() => {
			switch (action) {
				case 'navigate': {
					// @ts-expect-error route name is a string, not a member of the param list
					navigation.navigate(name, params, { pop: true });
					break;
				}
				case 'push': {
					navigation.dispatch(StackActions.push(name, params));
					break;
				}
				case 'replace': {
					navigation.dispatch(StackActions.replace(name, params));
					break;
				}
			}
		});
	};
};

// #endregion

// #region knowing where you are

/** the screen the app is currently showing. */
export type ActiveMatch = {
	name: string;
	params: RouteParams;
};

/**
 * reads the screen the app is currently showing.
 *
 * @returns the active route's name and params; re-renders the caller when either changes
 */
export const useActiveMatch = (): ActiveMatch => {
	return useNavigationState((state) => {
		const route = getCurrentRoute(state);
		return {
			name: route.name,
			params: ('params' in route ? (route.params ?? {}) : {}) as RouteParams,
		};
	});
};

// #endregion
