import { type RefObject, useEffect, useId, useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { onFullscreenChange } from '#/lib/browser/fullscreen';
import { IS_FIREFOX } from '#/lib/browser/platform';

// place the active video above center to keep its post visible.
const IDEAL_POSITION = 1 / 2.5;

// prevent nearby videos from swapping the active slot on each frame.
const SWITCH_DEADBAND = 32;

// avoid loading videos that a fast scroll passes.
const LOAD_DWELL_MS = 200;

const MOUNT_MARGIN = '30% 0px';

/** video selection and loading state. */
export type ViewState = {
	/** whether the view holds the active slot. */
	readonly isActive: boolean;
	/** whether the view can start its media pipeline. */
	readonly mayLoad: boolean;
	/** whether the view is within the mount margin. */
	readonly nearScreen: boolean;
	/** whether the view overlaps the viewport. */
	readonly onScreen: boolean;
};

const UNPLACED: ViewState = { isActive: false, mayLoad: false, nearScreen: false, onScreen: false };

type Entry = {
	readonly id: string;
	readonly element: Element;
	near: boolean;
	visible: boolean;
	loaded: boolean;
	dwellTimer: ReturnType<typeof setTimeout> | undefined;
	// replace only when a field changes to keep the snapshot identity stable.
	state: ViewState;
};

const emitter = new SimpleEventEmitter<[]>();

const byId = new Map<string, Entry>();
const byElement = new WeakMap<Element, Entry>();

let activeId: string | null = null;
let manuallySet = false;

let nearCount = 0;
let listening = false;
let frameHandle = 0;
let frozen = false;

// #region measurement

const schedule = () => {
	if (frameHandle === 0) {
		frameHandle = requestAnimationFrame(arbitrate);
	}
};

const arbitrate = () => {
	frameHandle = 0;
	if (frozen) {
		return;
	}

	const viewportHeight = window.innerHeight;
	const idealY = viewportHeight * IDEAL_POSITION;
	const incumbent = activeId !== null ? byId.get(activeId) : undefined;

	let challenger: Entry | undefined;
	let challengerScore = Infinity;
	let incumbentScore = Infinity;

	for (const entry of byId.values()) {
		let visible = false;
		let score = Infinity;

		if (entry.near) {
			const rect = entry.element.getBoundingClientRect();
			visible = rect.bottom > 0 && rect.top < viewportHeight;
			if (visible) {
				score = Math.abs(rect.top + rect.height / 2 - idealY);
			}
		}

		entry.visible = visible;
		if (entry === incumbent) {
			incumbentScore = score;
		}
		if (score < challengerScore) {
			challenger = entry;
			challengerScore = score;
		}
	}

	// keep the incumbent until it leaves or a challenger clears the deadband.
	const holds =
		incumbent !== undefined &&
		incumbent.visible &&
		(manuallySet || challenger === undefined || challengerScore > incumbentScore - SWITCH_DEADBAND);

	if (!holds && challenger !== incumbent) {
		activeId = challenger?.id ?? null;
		manuallySet = false;
	}

	for (const entry of byId.values()) {
		syncDwell(entry);
	}

	publish();
};

const syncDwell = (entry: Entry) => {
	const wanted = entry.id === activeId;
	// a direct selection skips the loading delay.
	const immediate = wanted && manuallySet;

	if (!wanted || immediate) {
		clearTimeout(entry.dwellTimer);
		entry.dwellTimer = undefined;
		entry.loaded = immediate;
		return;
	}

	if (entry.loaded || entry.dwellTimer !== undefined) {
		return;
	}
	entry.dwellTimer = setTimeout(() => {
		entry.dwellTimer = undefined;
		entry.loaded = true;
		publish();
	}, LOAD_DWELL_MS);
};

const publish = () => {
	let changed = false;
	for (const entry of byId.values()) {
		const previous = entry.state;
		const isActive = entry.id === activeId;
		if (
			previous.isActive === isActive &&
			previous.mayLoad === entry.loaded &&
			previous.nearScreen === entry.near &&
			previous.onScreen === entry.visible
		) {
			continue;
		}
		entry.state = {
			isActive,
			mayLoad: entry.loaded,
			nearScreen: entry.near,
			onScreen: entry.visible,
		};
		changed = true;
	}
	if (changed) {
		emitter.emit();
	}
};

const observer = new IntersectionObserver(
	(records) => {
		for (const record of records) {
			const entry = byElement.get(record.target);
			if (!entry || entry.near === record.isIntersecting) {
				continue;
			}
			entry.near = record.isIntersecting;
			nearCount += record.isIntersecting ? 1 : -1;
		}
		syncScrollListener();
		schedule();
	},
	{ rootMargin: MOUNT_MARGIN },
);

const syncScrollListener = () => {
	const wanted = nearCount > 0;
	if (wanted === listening) {
		return;
	}
	listening = wanted;
	if (wanted) {
		// capture scroll events from nested feed containers.
		window.addEventListener('scroll', schedule, { capture: true, passive: true });
		window.addEventListener('resize', schedule, { passive: true });
	} else {
		window.removeEventListener('scroll', schedule, { capture: true });
		window.removeEventListener('resize', schedule);
	}
};

onFullscreenChange((fullscreen) => {
	// Firefox keeps usable page layout measurements in fullscreen.
	frozen = !IS_FIREFOX && fullscreen;
	if (!frozen) {
		schedule();
	}
});

// #endregion

// #region contest

const register = (id: string, element: Element) => {
	const entry: Entry = {
		id,
		element,
		near: false,
		visible: false,
		loaded: false,
		dwellTimer: undefined,
		state: UNPLACED,
	};
	byId.set(id, entry);
	byElement.set(element, entry);
	observer.observe(element);

	return () => {
		observer.unobserve(element);
		byId.delete(id);
		byElement.delete(element);
		clearTimeout(entry.dwellTimer);

		if (entry.near) {
			nearCount--;
			syncScrollListener();
		}
		if (activeId === id) {
			activeId = null;
			manuallySet = false;
		}
		schedule();
	};
};

const setActiveView = (id: string) => {
	if (activeId === id && manuallySet) {
		return;
	}
	const previous = activeId !== null ? byId.get(activeId) : undefined;
	activeId = id;
	manuallySet = true;

	if (previous) {
		syncDwell(previous);
	}
	const entry = byId.get(id);
	if (entry) {
		syncDwell(entry);
	}
	publish();
};

const subscribe = (onStoreChange: () => void) => emitter.subscribe(onStoreChange);

/**
 * registers a view for active video selection and deferred loading.
 *
 * @param ref a stable ref to the view element
 * @returns the view state and a function that activates it immediately
 */
export function useActiveVideo(ref: RefObject<Element | null>) {
	const id = useId();

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return;
		}
		return register(id, element);
	}, [id, ref]);

	const state = useSyncExternalStore(subscribe, () => byId.get(id)?.state ?? UNPLACED);

	return { ...state, setActive: () => setActiveView(id) };
}

// #endregion
