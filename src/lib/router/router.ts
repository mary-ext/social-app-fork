import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';
import type { ComponentType, ReactNode } from 'react';

import { Builder } from './build.ts';
import type { BuildArgs } from './build.ts';
import type { CacheEntryRef } from './cache.ts';
import { computeCachedKeys } from './cache.ts';
import type { History, HistoryLocation } from './history/types.ts';
import { Matcher } from './match.ts';
import type { RouteMatch } from './match.ts';
import type { ResolvedLeaf, ResolvedNode, RouteLeaf, RouteName, RouteRegistry } from './routes.ts';
import { createPath, parsePath } from './url.ts';
import { computeView } from './view-model.ts';
import type { PoolEntry, View } from './view-model.ts';

/** options for the router constructor. */
export interface RouterOptions<R extends RouteRegistry<unknown>> {
	/** default fallback component shown during lazy chunk loading. */
	readonly defaultFallback?: ReactNode;
	/** backing history instance. */
	readonly history: History;
	/** maximum number of backward entries to keep warm. */
	readonly max?: number;
	/** component rendered when no route matches. */
	readonly notFound?: ComponentType;
	/** route names of pathless singleton routes to keep warm for the router's lifetime once first visited. */
	readonly pins?: readonly string[];
	/** compiled route registry. */
	readonly routes: R;
}

interface Entry {
	readonly index: number;
	readonly key: string;
	readonly match: RouteMatch;
}

const DefaultNotFound: ComponentType = () => null;

/**
 * manages navigation state, history subscriptions, and active views.
 *
 * this class acts as the store for the React router view, maintaining and caching active matched nodes and
 * coordinates scrolling and focus.
 */
export class Router<R extends RouteRegistry<unknown>> {
	readonly #history: History;
	readonly #matcher: Matcher;
	readonly #builder: Builder<R>;
	readonly #routes: R;
	readonly #max: number;
	readonly #defaultFallback: ReactNode;
	readonly #notFound: { leaf: ResolvedLeaf; node: ResolvedNode };
	readonly #pins: ReadonlyMap<string, PoolEntry>;
	readonly #updates = new SimpleEventEmitter<[]>();
	readonly #unlisten: () => void;

	#activePins = new Set<PoolEntry>();
	#entries = new Map<string, Entry>();
	#activeKey: string;
	#recency: string[] = [];
	#view: View;
	#commitWaiters: (() => void)[] = [];
	#viewAttached = false;

	constructor(options: RouterOptions<R>) {
		this.#history = options.history;
		this.#routes = options.routes;
		this.#matcher = new Matcher(options.routes);
		this.#builder = new Builder(options.routes);
		this.#max = options.max ?? 5;
		this.#defaultFallback = options.defaultFallback;
		this.#notFound = makeNotFound(options.notFound ?? DefaultNotFound);
		this.#pins = new Map((options.pins ?? []).map((name) => [name, this.#makePin(name)]));

		const location = this.#history.location;
		this.#activeKey = location.key;
		this.#record(location);
		this.#view = this.#recompute();

		this.#unlisten = this.#history.listen(async ({ location: next }) => {
			this.#prune();
			this.#record(next);
			this.#activeKey = next.key;
			this.#view = this.#recompute();
			// register before notifying because subscribers may render synchronously.
			const committed = this.#awaitCommit();
			this.#updates.emit();
			await committed;
		});
	}

	/** current view structure. */
	get view(): View {
		return this.#view;
	}

	/** active history location. */
	get location(): HistoryLocation {
		return this.#history.location;
	}

	/** active route match details. */
	get route(): RouteMatch {
		return this.#active().match;
	}

	/** whether backward history is available. */
	get canGoBack(): boolean {
		return this.#history.canGoBack;
	}

	/** whether forward history is available. */
	get canGoForward(): boolean {
		return this.#history.canGoForward;
	}

	/** default suspense fallback component. */
	get defaultFallback(): ReactNode {
		return this.#defaultFallback;
	}

	/** the compiled registry this router was constructed with. */
	get routes(): R {
		return this.#routes;
	}

	/**
	 * subscribes to view updates.
	 *
	 * bound to the instance, so it keeps one identity for the router's lifetime and can be handed straight to
	 * `useSyncExternalStore` — which re-subscribes whenever the function it is given changes.
	 *
	 * @param listener change callback
	 * @returns unsubscribe function
	 */
	readonly subscribe = (listener: () => void): (() => void) => {
		return this.#updates.subscribe(listener);
	};

	/** pushes a new location onto the history stack. */
	push(to: string): void {
		this.#history.push(to);
	}

	/** replaces the current location on the history stack. */
	replace(to: string): void {
		this.#history.replace(to);
	}

	/**
	 * generates a URL for a route.
	 *
	 * @param name route name
	 * @param args route parameters
	 * @returns relative URL
	 */
	build<K extends RouteName<R>>(name: K, ...args: BuildArgs<R, K>): string {
		return this.#builder.build(name, ...args);
	}

	/**
	 * navigates to a route.
	 *
	 * @param name route name
	 * @param args route parameters
	 */
	navigate<K extends RouteName<R>>(name: K, ...args: BuildArgs<R, K>): void {
		this.push(this.#builder.build(name, ...args));
	}

	/**
	 * returns to the nearest existing history entry for a route, or pushes if none exists.
	 *
	 * @param name route name
	 * @param args route parameters
	 */
	popTo<K extends RouteName<R>>(name: K, ...args: BuildArgs<R, K>): void {
		const url = this.#builder.build(name, ...args);
		const { hash, pathname, search } = parsePath(url);
		const target = this.#matcher.match(pathname, search, hash);
		if (target !== undefined) {
			const wanted = this.#canonical(target);
			const entries = this.#history.entries();
			for (let i = this.#history.location.index; i >= 0; i--) {
				const entry = entries[i];
				if (entry === undefined || !entry.sameDocument || entry.url === null) {
					break;
				}
				const parts = parsePath(entry.url);
				const match = this.#matcher.match(parts.pathname, parts.search, parts.hash);
				if (match !== undefined && match.name === target.name && this.#canonical(match) === wanted) {
					this.#history.traverseTo(entry.key);
					return;
				}
			}
		}
		this.push(url);
	}

	/**
	 * updates query parameters in-place without pushing a new entry.
	 *
	 * @param patch query parameter changes
	 */
	setParams(patch: Readonly<Record<string, unknown>>): void {
		const active = this.#entries.get(this.#activeKey);
		const leaf = active === undefined ? undefined : this.#routes.leaves.get(active.match.name);
		if (leaf === undefined) {
			return;
		}
		const location = this.#history.location;
		const search = new URLSearchParams(location.search);
		for (const [name, value] of Object.entries(patch)) {
			const codec = leaf.query[name];
			if (codec === undefined) {
				continue;
			}
			if (value === undefined) {
				search.delete(name);
			} else {
				search.set(name, codec.encode(value));
			}
		}
		const query = search.toString();
		const to = createPath({
			hash: location.hash,
			pathname: location.pathname,
			search: query ? `?${query}` : '',
		});
		this.#history.replace(to, { scroll: 'preserve', state: location.state });
	}

	/** navigates back one entry. */
	back(): void {
		this.#history.back();
	}

	/** navigates forward one entry. */
	forward(): void {
		this.#history.forward();
	}

	/** navigates by a delta offset on the stack. */
	go(delta: number): void {
		this.#history.go(delta);
	}

	/**
	 * attaches a router view to coordinate transition commits.
	 *
	 * @returns detach function
	 */
	attachView(): () => void {
		this.#viewAttached = true;
		return () => {
			this.#viewAttached = false;
			this.notifyCommit();
		};
	}

	/** resolves pending navigation transitions after a view commits. */
	notifyCommit(): void {
		for (const resolve of this.#commitWaiters.splice(0)) {
			resolve();
		}
	}

	/** detaches history listeners and disposes resources. */
	dispose(): void {
		this.#unlisten();
		this.#history.dispose();
		// release transitions waiting on a view that has been disposed.
		this.notifyCommit();
	}

	#active(): Entry {
		const active = this.#entries.get(this.#activeKey);
		if (active === undefined) {
			throw new Error(`stacker: no warm entry for the active key '${this.#activeKey}'`);
		}
		return active;
	}

	#match(location: HistoryLocation): RouteMatch {
		return this.#matcher.match(location.pathname, location.search, location.hash) ?? this.#notFoundMatch();
	}

	// rebuilding normalizes values that codecs decode into fresh object identities.
	#canonical(match: RouteMatch): string {
		return this.#builder.buildPath(match.name, match.params);
	}

	#awaitCommit(): Promise<void> {
		if (!this.#viewAttached) {
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			this.#commitWaiters.push(resolve);
		});
	}

	#prune(): void {
		const live = new Set(this.#history.entries().map((entry) => entry.key));
		for (const key of this.#entries.keys()) {
			if (!live.has(key)) {
				this.#entries.delete(key);
			}
		}
	}

	#record(location: HistoryLocation): void {
		const entry: Entry = { index: location.index, key: location.key, match: this.#match(location) };
		this.#entries.set(location.key, entry);
		this.#recency = [entry.key, ...this.#recency.filter((key) => key !== entry.key)];
		const pin = this.#pins.get(entry.match.name);
		if (pin !== undefined) {
			this.#activePins.add(pin);
		}
	}

	#recompute(): View {
		const active = this.#active();
		const refs: CacheEntryRef[] = [...this.#entries.values()].map((entry) => ({
			index: entry.index,
			key: entry.key,
		}));
		const cachedKeys = computeCachedKeys(refs, active.index, this.#recency, { max: this.#max });

		const cached: PoolEntry[] = [];
		for (const entry of this.#entries.values()) {
			if (cachedKeys.has(entry.key)) {
				cached.push({ key: entry.key, match: entry.match });
			}
		}
		const view = computeView(cached, [...this.#activePins], active.key);

		for (const [key, entry] of this.#entries) {
			if (!cachedKeys.has(entry.key)) {
				this.#entries.delete(key);
			}
		}
		this.#recency = this.#recency.filter((key) => this.#entries.has(key));

		return view;
	}

	#makePin(name: string): PoolEntry {
		const leaf = this.#routes.leaves.get(name);
		if (leaf === undefined) {
			throw new Error(`stacker: pinned route '${name}' is not in the registry`);
		}
		// pins must resolve to one instance shared with active visits.
		if ((leaf.leaf.type ?? 'page') !== 'singleton') {
			throw new Error(`stacker: pinned route '${name}' must be a singleton`);
		}
		if (Object.keys(leaf.params).length > 0) {
			throw new Error(`stacker: pinned route '${name}' must have no path params`);
		}
		const { hash, pathname, search } = parsePath(leaf.path);
		const match = this.#matcher.match(pathname, search, hash);
		if (match === undefined) {
			throw new Error(`stacker: pinned route '${name}' (path '${leaf.path}') did not match`);
		}
		return { key: `pin:${name}`, match };
	}

	#notFoundMatch(): RouteMatch {
		return {
			chain: [{ node: this.#notFound.node, params: {} }],
			leaf: this.#notFound.leaf,
			name: this.#notFound.leaf.name,
			params: {},
		};
	}
}

const makeNotFound = (component: ComponentType): { leaf: ResolvedLeaf; node: ResolvedNode } => {
	const leafNode: RouteLeaf = { component, kind: 'route', params: {}, path: '*', query: {}, type: 'page' };
	const node: ResolvedNode = {
		id: ' notFound',
		key: ' notFound',
		kind: 'route',
		node: leafNode,
		params: {},
		path: '*',
	};
	const leaf: ResolvedLeaf = {
		chain: [node],
		leaf: leafNode,
		name: ' notFound',
		params: {},
		path: '*',
		query: {},
	};
	return { leaf, node };
};
