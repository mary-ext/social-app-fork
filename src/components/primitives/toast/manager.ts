import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

// #region types

export type ToastObject<Data extends object = object> = {
	id: string;
	title?: ReactNode;
	description?: ReactNode;
	/** styling hint; `'loading'` toasts don't auto-dismiss. */
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
	/** called once when the toast starts closing. */
	onClose?: () => void;
	/** called on removal; rendered toasts wait for exit transitions. */
	onRemove?: () => void;
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

export type ToastUpdateOptions<Data extends object = object> = Partial<Omit<ToastAddOptions<Data>, 'id'>>;

type PromiseStageOptions<Data extends object, Arg> =
	| string
	| ToastUpdateOptions<Data>
	| ((value: Arg) => string | ToastUpdateOptions<Data>);

export type ToastPromiseOptions<Value, Data extends object = object> = {
	loading: string | ToastUpdateOptions<Data>;
	success: PromiseStageOptions<Data, Value>;
	error: PromiseStageOptions<Data, unknown>;
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

const resolveStage = <Data extends object, Arg>(
	stage: PromiseStageOptions<Data, Arg>,
	value: Arg,
): ToastUpdateOptions<Data> => {
	const resolved = typeof stage === 'function' ? stage(value) : stage;
	return typeof resolved === 'string' ? { title: resolved } : resolved;
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
			this.#remove(id, false);
		} else if (existing) {
			this.#patch(id, options, true);
			return id;
		}

		const toast: ToastObject<Data> = { ...options, id, updateKey: 0, limited: false };
		this.#set(markLimited([toast, ...this.#toasts], this.#limit));
		this.#syncTimer(toast, true);
		return id;
	};

	/**
	 * updates an open toast; ignores missing or closing toasts. passing `type` or `timeout` restarts its timer.
	 *
	 * @param id toast id
	 * @param updates fields to change, or a function of the current toast returning them
	 */
	update = (
		id: string,
		updates: ToastUpdateOptions<Data> | ((prev: ToastObject<Data>) => ToastUpdateOptions<Data>),
	): void => {
		const prev = this.#find(id);
		if (prev && prev.transitionStatus !== 'ending') {
			this.#patch(id, typeof updates === 'function' ? updates(prev) : updates, false);
		}
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
		// unrendered toasts have no exit transition to wait for.
		const unrendered = closing.filter((toast) => !this.#elements.has(toast.id));
		const next = this.#toasts.flatMap((toast) => {
			if (!ids.has(toast.id)) {
				return [toast];
			}
			return unrendered.includes(toast) ? [] : [{ ...toast, transitionStatus: 'ending' as const, height: 0 }];
		});
		this.#set(markLimited(next, this.#limit));

		for (const toast of closing) {
			toast.onClose?.();
		}
		for (const toast of unrendered) {
			toast.onRemove?.();
		}

		if (focusedId !== undefined && ids.has(focusedId)) {
			this.#moveFocusFrom(focusedId);
		}
	};

	/**
	 * shows a loading toast, then updates it on fulfillment or rejection.
	 *
	 * @param promise promise to track
	 * @param options toast options for each stage; strings set the title
	 * @returns a promise preserving the result or rejection, after updating the toast
	 */
	promise = <Value>(promise: Promise<Value>, options: ToastPromiseOptions<Value, Data>): Promise<Value> => {
		const id = this.add({
			...(typeof options.loading === 'string' ? { title: options.loading } : options.loading),
			type: 'loading',
		});
		return promise.then(
			(value) => {
				this.update(id, { type: 'success', ...resolveStage(options.success, value) });
				return value;
			},
			(error: unknown) => {
				this.update(id, { type: 'error', ...resolveStage(options.error, error) });
				throw error;
			},
		);
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
	 * removes a closing toast and calls `onRemove`; ignores open or missing toasts.
	 *
	 * @param id toast id
	 */
	remove(id: string): void {
		if (this.#find(id)?.transitionStatus === 'ending') {
			this.#remove(id, true);
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

	#patch(id: string, updates: ToastUpdateOptions<Data>, restartTimer: boolean): void {
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
			this.#syncTimer(next, restartTimer || 'timeout' in updates || 'type' in updates);
		}
	}

	#remove(id: string, notify: boolean): void {
		const toast = this.#find(id);
		if (!toast) {
			return;
		}
		this.#clearTimer(id);
		this.#elements.delete(id);
		this.#set(this.#toasts.filter((item) => item !== toast));
		if (notify) {
			toast.onRemove?.();
		}
	}

	#syncTimer(toast: ToastObject<Data>, restart: boolean): void {
		const duration = toast.timeout ?? this.#timeout;
		if (toast.type === 'loading' || duration <= 0) {
			this.#clearTimer(toast.id);
			return;
		}
		if (!restart && this.#timers.has(toast.id)) {
			return;
		}
		this.#clearTimer(toast.id);
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
