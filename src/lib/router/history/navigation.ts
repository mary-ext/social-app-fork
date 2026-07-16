import type {
	History,
	HistoryAction,
	HistoryEntry,
	HistoryListener,
	HistoryLocation,
	HistoryNavigateOptions,
	HistoryScrollBehavior,
	HistoryUpdate,
} from './types.ts';

/** options for navigation-api history. */
export interface NavigationHistoryOptions {
	/**
	 * same-origin destinations the server owns, which the browser should load as a real page rather than the
	 * router rendering in-app — an OAuth entry point, a server-rendered admin area, a static file. without this
	 * every same-origin URL is handled in-app, since the browser offers to intercept a navigation whenever the
	 * origin matches, whatever the destination is.
	 *
	 * consulted for pushes and replaces only. a traversal is always handled: declining one loads nothing, it
	 * just moves the browser to an entry this document never rendered.
	 *
	 * @param url destination URL
	 * @returns true to leave the navigation to the browser
	 */
	readonly ignore?: (url: URL) => boolean;
	/** window instance to bind to; defaults to global window. */
	readonly window?: Window;
}

const ENVELOPE = Symbol('stacker.historyInfo');

interface Envelope {
	readonly [ENVELOPE]: true;
	readonly info: unknown;
	readonly scroll: HistoryScrollBehavior;
}

const isEnvelope = (value: unknown): value is Envelope =>
	typeof value === 'object' && value !== null && ENVELOPE in value;

const toAction = (type: NavigationType): HistoryAction | undefined => {
	switch (type) {
		case 'push':
		case 'replace':
		case 'traverse':
			return type;
		default:
			return undefined;
	}
};

const ignore = (result: NavigationResult): void => {
	result.committed?.catch(() => {});
	result.finished?.catch(() => {});
};

/**
 * history implementation backed by the web navigation API.
 *
 * intercepting same-document navigations converts standard page loads into in-app renders. per-revision
 * metadata and indices are managed natively by the browser.
 */
export class NavigationHistory implements History {
	readonly #win: Window;
	readonly #nav: Navigation;
	readonly #ignore: ((url: URL) => boolean) | undefined;
	readonly #listeners = new Set<HistoryListener>();
	#location: HistoryLocation;

	constructor(options: NavigationHistoryOptions = {}) {
		this.#win = options.window ?? window;
		this.#nav = this.#win.navigation;
		this.#ignore = options.ignore;
		this.#location = this.#read();
		this.#nav.addEventListener('navigate', this.#onNavigate);
	}

	get location(): HistoryLocation {
		return this.#location;
	}

	get canGoBack(): boolean {
		return this.#nav.canGoBack;
	}

	get canGoForward(): boolean {
		return this.#nav.canGoForward;
	}

	entries(): readonly HistoryEntry[] {
		return this.#nav.entries().map((entry) => ({
			id: entry.id,
			index: entry.index,
			key: entry.key,
			sameDocument: entry.sameDocument,
			state: entry.getState(),
			url: toRelative(entry.url),
		}));
	}

	push(to: string, options: HistoryNavigateOptions = {}): void {
		this.#navigate(to, 'push', options);
	}

	replace(to: string, options: HistoryNavigateOptions = {}): void {
		this.#navigate(to, 'replace', options);
	}

	traverseTo(key: string): void {
		ignore(this.#nav.traverseTo(key));
	}

	go(delta: number): void {
		const entries = this.#nav.entries();
		const target = entries[Math.max(0, Math.min(this.#location.index + delta, entries.length - 1))];
		if (target === undefined || target.key === this.#location.key) {
			return;
		}
		this.traverseTo(target.key);
	}

	back(): void {
		if (this.#nav.canGoBack) {
			ignore(this.#nav.back());
		}
	}

	forward(): void {
		if (this.#nav.canGoForward) {
			ignore(this.#nav.forward());
		}
	}

	listen(listener: HistoryListener): () => void {
		this.#listeners.add(listener);
		return () => {
			this.#listeners.delete(listener);
		};
	}

	dispose(): void {
		this.#nav.removeEventListener('navigate', this.#onNavigate);
		this.#listeners.clear();
	}

	#navigate(to: string, history: NavigationHistoryBehavior, options: HistoryNavigateOptions): void {
		// resolve against the live document URL so a cross-origin destination keeps its origin and reaches
		// the browser as a real navigation, rather than being flattened onto this origin's path.
		const url = new URL(to, this.#win.location.href).href;
		const envelope: Envelope = {
			[ENVELOPE]: true,
			info: options.info,
			scroll: options.scroll ?? 'auto',
		};
		ignore(this.#nav.navigate(url, { history, info: envelope, state: options.state ?? null }));
	}

	#read(): HistoryLocation {
		const entry = this.#nav.currentEntry;
		if (entry === null) {
			throw new Error('stacker: the navigation API has no current entry (an opaque origin?)');
		}
		const { hash, pathname, search } = new URL(entry.url ?? this.#win.location.href);
		return {
			hash,
			id: entry.id,
			index: entry.index,
			key: entry.key,
			pathname,
			search,
			state: entry.getState(),
		};
	}

	readonly #onNavigate = (event: NavigateEvent): void => {
		const action = toAction(event.navigationType);
		if (action === undefined || !event.canIntercept) {
			return;
		}
		if (event.downloadRequest !== null || event.formData !== null) {
			return;
		}
		// ignored writes load a new document, while an ignored traversal would only desynchronize this one.
		if (action !== 'traverse' && this.#ignore?.(new URL(event.destination.url))) {
			return;
		}

		const envelope: Envelope | undefined = isEnvelope(event.info) ? event.info : undefined;
		const info = envelope === undefined ? event.info : envelope.info;
		const scroll = envelope?.scroll ?? 'auto';

		// preserving an in-place update also prevents the platform from resetting the active element.
		const preserve = scroll === 'preserve';
		event.intercept({
			focusReset: preserve ? 'manual' : 'after-transition',
			scroll: preserve ? 'manual' : 'after-transition',
			handler: async () => {
				this.#location = this.#read();
				const update: HistoryUpdate = { action, info, location: this.#location };
				await Promise.all([...this.#listeners].map(async (listener) => listener(update)));
			},
		});
	};
}

const toRelative = (url: string | null): string | null => {
	if (url === null) {
		return null;
	}
	const { hash, pathname, search } = new URL(url);
	return `${pathname}${search}${hash}`;
};
