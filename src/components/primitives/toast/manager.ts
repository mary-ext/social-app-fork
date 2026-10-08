import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

// #region types

export type ToastObject<Data extends object = object> = {
	id: string;
	title?: ReactNode;
	description?: ReactNode;
	/** exposed as `data-type` for styling. */
	type?: string;
	/** auto-dismiss time in ms; `0` disables it. defaults to the manager's timeout. */
	timeout?: number;
	/** `'ending'` while the toast transitions out after closing. */
	transitionStatus?: 'ending';
	/** increments on updates to an open toast. */
	updateKey: number;
	/** exceeds the visible limit; remains mounted. */
	limited: boolean;
	/** natural height in px, measured once rendered. */
	height?: number;
	/** props for `Toast.Action`. */
	actionProps?: ComponentPropsWithoutRef<'button'>;
	data?: Data;
};

export type ToastAddOptions<Data extends object = object> = Omit<
	ToastObject<Data>,
	'height' | 'id' | 'limited' | 'transitionStatus' | 'updateKey'
> & {
	/** updates an open toast or reopens a closing one with this id, restarting its timer. */
	id?: string;
};

export type ToastManagerOptions = {
	/** default auto-dismiss time in ms; `0` disables it. defaults to 5000. */
	timeout?: number;
	/** maximum number of visible toasts; older ones are marked `limited`. defaults to 3. */
	limit?: number;
};

// #endregion

type Timer = {
	handle: ReturnType<typeof setTimeout> | undefined;
	/** time left, excluding paused time. */
	remaining: number;
	start: number;
};

const markLimited = <Data extends object>(
	toasts: ToastObject<Data>[],
	limit: number,
): ToastObject<Data>[] => {
	let active = 0;
	return toasts.map((toast) => {
		if (toast.transitionStatus === 'ending') {
			return toast;
		}
		const limited = active++ >= limit;
		return toast.limited === limited ? toast : { ...toast, limited };
	});
};

let nextId = 0;

/** manages a toast queue, including before a renderer mounts. usable outside React. */
export class ToastManager<Data extends object = object> {
	#toasts: ToastObject<Data>[] = [];
	#emitter = new SimpleEventEmitter<[]>();
	#timers = new Map<string, Timer>();
	#elements = new Map<string, HTMLElement>();
	#paused = false;
	// avoid retaining a focus target after its page unmounts.
	#returnFocusTarget: WeakRef<HTMLElement> | undefined;
	#timeout: number;
	#limit: number;

	/** @param options default timeout and visible limit */
	constructor({ timeout = 5000, limit = 3 }: ToastManagerOptions = {}) {
		this.#timeout = timeout;
		this.#limit = limit;
	}

	// #region public API

	/** current toasts, newest first. */
	get toasts(): readonly ToastObject<Data>[] {
		return this.#toasts;
	}

	/**
	 * @param listener called after queue changes
	 * @returns a function that unsubscribes
	 */
	subscribe = (listener: () => void): (() => void) => {
		return this.#emitter.subscribe(listener);
	};

	/**
	 * shows a toast.
	 *
	 * @param options toast content and behavior
	 * @returns the toast's id
	 */
	add = (options: ToastAddOptions<Data>): string => {
		const id = options.id ?? `toast-${++nextId}`;
		const existing = this.#find(id);
		if (existing?.transitionStatus === 'ending') {
			this.#remove(id);
		} else if (existing) {
			this.#patch(id, options);
			return id;
		}

		const toast: ToastObject<Data> = { ...options, id, updateKey: 0, limited: false };
		this.#set(markLimited([toast, ...this.#toasts], this.#limit));
		this.#startTimer(toast);
		return id;
	};

	/**
	 * starts closing a toast, or every toast when `id` is omitted.
	 *
	 * @param id toast id
	 */
	close = (id?: string): void => {
		const closing = this.#toasts.filter(
			(toast) => (id === undefined || toast.id === id) && toast.transitionStatus !== 'ending',
		);
		if (closing.length === 0) {
			return;
		}

		const focusedId = this.#focusedToastId();
		for (const toast of closing) {
			this.#clearTimer(toast.id);
		}

		const ids = new Set(closing.map((toast) => toast.id));
		const next = this.#toasts.flatMap((toast) => {
			if (!ids.has(toast.id)) {
				return [toast];
			}
			// unrendered toasts have no exit transition to wait for.
			if (!this.#elements.has(toast.id)) {
				return [];
			}
			return [{ ...toast, transitionStatus: 'ending' as const, height: 0 }];
		});
		this.#set(markLimited(next, this.#limit));

		if (focusedId !== undefined && ids.has(focusedId)) {
			this.#moveFocusFrom(focusedId);
		}
	};

	// #endregion

	// #region renderer API

	/**
	 * pauses or resumes auto-dismiss timers, preserving remaining time.
	 *
	 * @param paused whether timers should be paused
	 */
	setPaused(paused: boolean): void {
		if (this.#paused === paused) {
			return;
		}
		this.#paused = paused;
		for (const [id, timer] of this.#timers) {
			if (paused) {
				clearTimeout(timer.handle);
				timer.handle = undefined;
				timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.start));
			} else {
				this.#runTimer(id, timer);
			}
		}
	}

	/**
	 * registers a toast element for focus management and deferred removal.
	 *
	 * @param id toast id
	 * @param el the toast's element, or `null` on unmount
	 */
	setElement(id: string, el: HTMLElement | null): void {
		if (el) {
			this.#elements.set(id, el);
		} else {
			this.#elements.delete(id);
		}
	}

	/**
	 * records a toast's natural height; ignores missing or closing toasts.
	 *
	 * @param id toast id
	 * @param height height in px
	 */
	setHeight(id: string, height: number): void {
		const toast = this.#find(id);
		if (toast && toast.transitionStatus !== 'ending' && toast.height !== height) {
			this.#set(this.#toasts.map((item) => (item === toast ? { ...toast, height } : item)));
		}
	}

	/**
	 * removes a closing toast; ignores open or missing toasts.
	 *
	 * @param id toast id
	 */
	remove(id: string): void {
		if (this.#find(id)?.transitionStatus === 'ending') {
			this.#remove(id);
		}
	}

	/**
	 * focuses the newest open, visible toast and remembers prior focus for restoration when the stack closes.
	 *
	 * @returns whether a toast took focus
	 */
	focusFrontmost(): boolean {
		const frontmost = this.#toasts.find((toast) => toast.transitionStatus !== 'ending' && !toast.limited);
		const el = frontmost && this.#elements.get(frontmost.id);
		if (!el) {
			return false;
		}
		const active = document.activeElement;
		this.#returnFocusTarget = active instanceof HTMLElement ? new WeakRef(active) : undefined;
		el.focus({ preventScroll: true });
		return true;
	}

	// #endregion

	#find(id: string): ToastObject<Data> | undefined {
		return this.#toasts.find((toast) => toast.id === id);
	}

	#set(toasts: ToastObject<Data>[]): void {
		this.#toasts = toasts;
		this.#emitter.emit();
	}

	#patch(id: string, updates: ToastAddOptions<Data>): void {
		let next: ToastObject<Data> | undefined;
		this.#set(
			this.#toasts.map((toast) => {
				if (toast.id !== id) {
					return toast;
				}
				next = { ...toast, ...updates, updateKey: toast.updateKey + 1 };
				return next;
			}),
		);
		if (next) {
			this.#startTimer(next);
		}
	}

	#remove(id: string): void {
		const toast = this.#find(id);
		if (!toast) {
			return;
		}
		this.#clearTimer(id);
		this.#elements.delete(id);
		this.#set(this.#toasts.filter((item) => item !== toast));
	}

	#startTimer(toast: ToastObject<Data>): void {
		this.#clearTimer(toast.id);
		const duration = toast.timeout ?? this.#timeout;
		if (duration <= 0) {
			return;
		}
		const timer: Timer = { handle: undefined, remaining: duration, start: 0 };
		this.#timers.set(toast.id, timer);
		if (!this.#paused) {
			this.#runTimer(toast.id, timer);
		}
	}

	#runTimer(id: string, timer: Timer): void {
		timer.start = Date.now();
		timer.handle = setTimeout(() => {
			this.#timers.delete(id);
			this.close(id);
		}, timer.remaining);
	}

	#clearTimer(id: string): void {
		clearTimeout(this.#timers.get(id)?.handle);
		this.#timers.delete(id);
	}

	#focusedToastId(): string | undefined {
		const active = document.activeElement;
		for (const [id, el] of this.#elements) {
			if (el.contains(active)) {
				return id;
			}
		}
		return undefined;
	}

	// keep keyboard focus in the stack while any toast remains open.
	#moveFocusFrom(id: string): void {
		const index = this.#toasts.findIndex((toast) => toast.id === id);
		// oxlint-disable-next-line unicorn/no-array-reverse -- reversing our own slice
		const candidates = [...this.#toasts.slice(0, index).reverse(), ...this.#toasts.slice(index + 1)];
		const next = candidates.find((toast) => toast.transitionStatus !== 'ending' && !toast.limited);
		const el = next && this.#elements.get(next.id);
		if (el) {
			// a toast promoted from the limited set is still inert until the next render.
			el.inert = false;
			el.focus();
		} else {
			const target = this.#returnFocusTarget?.deref();
			this.#returnFocusTarget = undefined;
			target?.focus({ preventScroll: true });
		}
	}
}

/**
 * creates a manager to pass to `Toast.Provider`.
 *
 * @param options default timeout and visible limit
 * @returns a new manager
 */
export const createToastManager = <Data extends object = object>(
	options?: ToastManagerOptions,
): ToastManager<Data> => {
	return new ToastManager<Data>(options);
};
