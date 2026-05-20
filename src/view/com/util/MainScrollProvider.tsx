import { createContext, useCallback, useContext, useEffect } from 'react';
import { type NativeScrollEvent } from 'react-native';
import { EventEmitter } from 'eventemitter3';

import {
	interpolate,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from '#/lib/animations/reanimatedCompat';
import { ScrollProvider } from '#/lib/ScrollContext';

import { useShellLayout } from '#/state/shell/shell-layout';

const WEB_HIDE_SHELL_THRESHOLD = 200;

const HomeHeaderModeContext = createContext<SharedValue<number> | null>(null);
HomeHeaderModeContext.displayName = 'HomeHeaderModeContext';

export function HomeHeaderModeProvider({ children }: { children: React.ReactNode }) {
	const headerMode = useSharedValue(0);
	return <HomeHeaderModeContext.Provider value={headerMode}>{children}</HomeHeaderModeContext.Provider>;
}

export function useHomeHeaderMode() {
	const headerMode = useContext(HomeHeaderModeContext);
	if (!headerMode) {
		throw new Error('useHomeHeaderMode must be used within a HomeHeaderModeProvider');
	}
	return headerMode;
}

export function useHomeHeaderTransform() {
	const headerMode = useHomeHeaderMode();
	const { headerHeight } = useShellLayout();

	return useAnimatedStyle(() => {
		const headerModeValue = headerMode.get();
		const hHeight = headerHeight.get();

		return {
			pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
			opacity: Math.pow(1 - headerModeValue, 2),
			transform: [
				{
					translateY: interpolate(headerModeValue, [0, 1], [0, -hHeight]),
				},
			],
		};
	});
}

export function MainScrollProvider({ children }: { children: React.ReactNode }) {
	const headerMode = useHomeHeaderMode();
	const startDragOffset = useSharedValue<number | null>(null);
	const didJustRestoreScroll = useSharedValue<boolean>(false);

	const setMode = useCallback(
		(v: boolean) => {
			'worklet';
			headerMode.set(() =>
				withSpring(v ? 1 : 0, {
					overshootClamping: true,
				}),
			);
		},
		[headerMode],
	);

	useEffect(() => {
		return listenToForcedWindowScroll(() => {
			startDragOffset.set(null);
			didJustRestoreScroll.set(true);
		});
	});

	const onScroll = useCallback(
		(e: NativeScrollEvent) => {
			'worklet';
			const offsetY = Math.max(0, e.contentOffset.y);
			if (didJustRestoreScroll.get()) {
				didJustRestoreScroll.set(false);
				// Don't hide/show navbar based on scroll restoratoin.
				return;
			}
			// On the web, we don't try to follow the drag because we don't know when it ends.
			// Instead, show/hide immediately based on whether we're scrolling up or down.
			const dy = offsetY - (startDragOffset.get() ?? 0);
			startDragOffset.set(offsetY);

			if (dy < 0 || offsetY < WEB_HIDE_SHELL_THRESHOLD) {
				setMode(false);
			} else if (dy > 0) {
				setMode(true);
			}
		},
		[setMode, startDragOffset, didJustRestoreScroll],
	);

	return <ScrollProvider onScroll={onScroll}>{children}</ScrollProvider>;
}

const emitter = new EventEmitter();

const originalScroll = window.scroll.bind(window) as (...args: unknown[]) => void;
window.scroll = function (...args: unknown[]) {
	emitter.emit('forced-scroll');
	return originalScroll(...args);
};

const originalScrollTo = window.scrollTo.bind(window) as (...args: unknown[]) => void;
window.scrollTo = function (...args: unknown[]) {
	emitter.emit('forced-scroll');
	return originalScrollTo(...args);
};

function listenToForcedWindowScroll(listener: () => void) {
	emitter.addListener('forced-scroll', listener);
	return () => {
		emitter.removeListener('forced-scroll', listener);
	};
}
