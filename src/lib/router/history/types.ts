/**
 * the type of navigation that produced a history update.
 *
 * - `push` — a new entry was added.
 * - `replace` — the active entry was replaced.
 * - `traverse` — navigation occurred to an existing entry.
 */
export type HistoryAction = 'push' | 'replace' | 'traverse';

/** an entry in the browser session history ledger. */
export interface HistoryEntry {
	/** unique per-revision identifier. */
	readonly id: string;
	/** entry position in the ledger. */
	readonly index: number;
	/** slot identity preserved across replacements. */
	readonly key: string;
	/** whether traversal to this entry stays within the current document. */
	readonly sameDocument: boolean;
	/** state associated with the entry. */
	readonly state: unknown;
	/** entry URL or null if hidden. */
	readonly url: string | null;
}

/** active history entry with parsed URL components. */
export interface HistoryLocation {
	/** URL fragment including the leading hash symbol. */
	readonly hash: string;
	/** per-revision identifier. */
	readonly id: string;
	/** entry position in the ledger. */
	readonly index: number;
	/** slot identity. */
	readonly key: string;
	/** URL pathname starting with a slash. */
	readonly pathname: string;
	/** URL query string including the leading question mark. */
	readonly search: string;
	/** state associated with the entry. */
	readonly state: unknown;
}

/**
 * how a history write treats the user's place on the page — scroll position and focus, which the browser
 * resets together and which a write therefore cannot sensibly split apart.
 *
 * - `auto` — a new screen. the browser restores scroll on a traversal or resets it on a push, and moves focus
 *   to the new content.
 * - `preserve` — the same screen with different state, like an in-place parameter patch. scroll and focus are
 *   both left exactly where the user put them.
 */
export type HistoryScrollBehavior = 'auto' | 'preserve';

/** options for history write operations. */
export interface HistoryNavigateOptions {
	/** arbitrary metadata passed to history listeners. */
	readonly info?: unknown;
	/** scroll and focus behavior. */
	readonly scroll?: HistoryScrollBehavior;
	/** state data associated with the entry. */
	readonly state?: unknown;
}

/** history update details dispatched to listeners. */
export interface HistoryUpdate {
	readonly action: HistoryAction;
	/** metadata passed to the write operation. */
	readonly info: unknown;
	readonly location: HistoryLocation;
}

/**
 * history update callback subscriber.
 *
 * listeners can return a promise to defer scroll restoration and focus resets.
 */
export type HistoryListener = (update: HistoryUpdate) => void | Promise<void>;

/** history manager interface modeled on the web navigation API. */
export interface History {
	/** whether a backward entry exists. */
	readonly canGoBack: boolean;
	/** whether a forward entry exists. */
	readonly canGoForward: boolean;
	/** active history location. */
	readonly location: HistoryLocation;
	/** navigates back one entry. */
	back(): void;
	/** detaches listeners and cleans up resources. */
	dispose(): void;
	/**
	 * lists all entries in the ledger.
	 *
	 * @returns array of history entries
	 */
	entries(): readonly HistoryEntry[];
	/** navigates forward one entry. */
	forward(): void;
	/**
	 * navigates by a delta offset.
	 *
	 * @param delta number of entries to move
	 */
	go(delta: number): void;
	/**
	 * subscribes to history updates.
	 *
	 * @param listener update callback
	 * @returns unsubscribe function
	 */
	listen(listener: HistoryListener): () => void;
	/**
	 * pushes a new history entry.
	 *
	 * @param to destination relative URL
	 * @param options navigation options
	 */
	push(to: string, options?: HistoryNavigateOptions): void;
	/**
	 * replaces the active history entry.
	 *
	 * @param to destination relative URL
	 * @param options navigation options
	 */
	replace(to: string, options?: HistoryNavigateOptions): void;
	/**
	 * navigates to an existing entry by key.
	 *
	 * @param key target entry key
	 */
	traverseTo(key: string): void;
}
