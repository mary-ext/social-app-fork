import {
	createRouterHooks,
	type ParamsOf,
	type Router,
	type RouterHooks,
	type RouteName,
	type RouteTarget as StackerRouteTarget,
} from '@oomfware/stacker';

import type { AppRoutes } from '#/routes';

// #region types

export type AppRouter = Router<AppRoutes>;

export type RouteTarget = StackerRouteTarget<AppRoutes>;

export type RouteParams<K extends RouteName<AppRoutes>> = ParamsOf<AppRoutes, K>;

// #endregion

// #region installation

let instance: AppRouter | undefined;
let hooks: RouterHooks<AppRoutes> | undefined;

export const installRouter = (router: AppRouter) => {
	instance = router;
	hooks = createRouterHooks(router.routes);
};

/** returns the installed router. */
export const getRouter = (): AppRouter => {
	if (!instance) {
		throw new Error('router: no router installed, import `#/routes` first');
	}

	return instance;
};

const installedHooks = (): RouterHooks<AppRoutes> => {
	if (!hooks) {
		throw new Error('router: no router installed, import `#/routes` first');
	}

	return hooks;
};

// #endregion

// #region hooks

export const useRouter: RouterHooks<AppRoutes>['useRouter'] = () => installedHooks().useRouter();

export const useParams: RouterHooks<AppRoutes>['useParams'] = (name) => installedHooks().useParams(name);

export const useTarget: RouterHooks<AppRoutes>['useTarget'] = () => installedHooks().useTarget();

export { useFocusEffect, useIsFocused, useLocation } from '@oomfware/stacker';

// #endregion
