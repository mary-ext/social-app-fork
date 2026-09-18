import {
	createContext,
	type KeyboardEvent,
	type ReactNode,
	use,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

import * as Dialog from '#/components/Dialog';
import * as styles from '#/components/Navigator.css';

/** maps each route name to its params, or `undefined` for a route that takes none. */
export type RouteMap = { [name: string]: object | undefined };

/** an entry on a navigator's stack. */
export type Route<Routes extends RouteMap> = {
	[Name in keyof Routes & string]: Routes[Name] extends undefined
		? { name: Name }
		: { name: Name; params: Routes[Name] };
}[keyof Routes & string];

/** last navigation action; `none` before the first navigation. */
export type NavigationDirection = 'none' | 'pop' | 'push';

export type Navigator<Routes extends RouteMap> = {
	/** whether the stack has a previous route. */
	canGoBack: boolean;
	direction: NavigationDirection;
	/** changes on each push or pop; use as a view key to remount on navigation. */
	key: number;
	/** the current, topmost route. */
	route: Route<Routes>;
	/** returns to the previous route. no-op at the root. */
	pop: () => void;
	/** opens `route` on top of the current one. */
	push: (route: Route<Routes>) => void;
};

type NavigationState<Routes extends RouteMap> = {
	direction: NavigationDirection;
	/** routes below the current one, root first. */
	history: Route<Routes>[];
	key: number;
	route: Route<Routes>;
};

const BaseContext = createContext<Pick<Navigator<RouteMap>, 'canGoBack' | 'key' | 'pop'> | null>(null);
BaseContext.displayName = 'NavigatorBaseContext';

/**
 * creates an in-memory navigation stack for a dialog or popover.
 *
 * Escape inside the provider goes back when possible without dismissing the enclosing layer.
 *
 * @returns the `Provider` and a `useNavigator` hook typed against `Routes`
 */
export const createNavigator = <Routes extends RouteMap>() => {
	const Context = createContext<Navigator<Routes> | null>(null);
	Context.displayName = 'NavigatorContext';

	const Provider = ({ children, initialRoute }: { children: ReactNode; initialRoute: Route<Routes> }) => {
		const [state, setState] = useState<NavigationState<Routes>>(() => ({
			direction: 'none',
			history: [],
			key: 0,
			route: initialRoute,
		}));

		const canGoBack = state.history.length > 0;

		const navigator: Navigator<Routes> = {
			canGoBack,
			direction: state.direction,
			key: state.key,
			route: state.route,
			pop: () => {
				setState((prev) => {
					const route = prev.history.at(-1);
					if (!route) {
						return prev;
					}
					return { direction: 'pop', history: prev.history.slice(0, -1), key: prev.key + 1, route };
				});
			},
			push: (route) => {
				setState((prev) => ({
					direction: 'push',
					history: [...prev.history, prev.route],
					key: prev.key + 1,
					route,
				}));
			},
		};

		const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
			if (e.key !== 'Escape' || e.nativeEvent.isComposing || !canGoBack) {
				return;
			}
			// portalled menus and dialogs handle their own Escape events, which also bubble through React.
			if (!(e.target instanceof Node) || !e.currentTarget.contains(e.target)) {
				return;
			}
			// Base UI layers listen for Escape on the document, so stopping here keeps them open.
			e.stopPropagation();
			navigator.pop();
		};

		return (
			<BaseContext.Provider value={navigator}>
				<Context.Provider value={navigator}>
					<div className={styles.root} onKeyDown={onKeyDown}>
						{children}
					</div>
				</Context.Provider>
			</BaseContext.Provider>
		);
	};

	const useNavigator = (): Navigator<Routes> => {
		const navigator = use(Context);
		if (!navigator) {
			throw new Error(`useNavigator must be used within its Provider`);
		}
		return navigator;
	};

	return { Provider, useNavigator };
};

/**
 * goes back, or closes the dialog at the root. receives focus if navigation removes the focused control.
 *
 * @returns the back or close button
 * @throws if used outside a navigator provider
 */
export function BackOrCloseButton() {
	const navigator = use(BaseContext);
	if (!navigator) {
		throw new Error(`BackOrCloseButton must be used within a navigator Provider`);
	}

	const { canGoBack, key, pop } = navigator;
	const ref = useRef<HTMLButtonElement>(null);

	// restore focus before Base UI moves it to the popup, outside the navigator's Escape handler.
	useLayoutEffect(() => {
		if (key === 0) {
			return;
		}
		const active = document.activeElement;
		if (active === null || active === document.body) {
			ref.current?.focus();
		}
	}, [key]);

	if (canGoBack) {
		return <Dialog.Header.Back ref={ref} onClick={pop} />;
	}

	return <Dialog.Header.Close ref={ref} />;
}
