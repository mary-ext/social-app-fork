import { createElement, forwardRef, Fragment, type ReactNode, useMemo } from 'react';
import {
	type KeyboardAvoidingViewProps,
	ScrollView,
	type ScrollViewProps,
	View,
	type ViewProps,
} from 'react-native';

/*
 * Long-lived web adapter for native keyboard controller APIs.
 *
 * Web does not have a native soft-keyboard controller. Keep this shim as a
 * dependency boundary while native keyboard behavior is removed from the web
 * bundle.
 */

type KeyboardOffset = {
	opened?: number;
	closed?: number;
};

type KeyboardSharedValue = {
	value: number;
	get: () => number;
	set: (value: number | ((previous: number) => number)) => void;
	addListener: () => number;
	removeListener: () => void;
	modify: (modifier?: (value: number) => number) => void;
};

type KeyboardHandlerEvent = {
	height: number;
	progress: number;
	duration: number;
	target: number;
};

type KeyboardHandler = (event: KeyboardHandlerEvent) => void;

type KeyboardHandlers = Partial<{
	onChangeText: KeyboardHandler;
	onStart: KeyboardHandler;
	onMove: KeyboardHandler;
	onInteractive: KeyboardHandler;
	onEnd: KeyboardHandler;
}>;

type KeyboardGestureAreaProps = ViewProps & {
	interpolator?: string;
	offset?: number;
	textInputNativeID?: string;
};

export type KeyboardStickyViewProps = ViewProps & {
	enabled?: boolean;
	offset?: KeyboardOffset;
};

type KeyboardScrollExtras = {
	bottomOffset?: number;
	disableScrollOnKeyboardHide?: boolean;
	enableOnAndroid?: boolean;
	enabled?: boolean;
	extraContentPadding?: unknown;
	extraKeyboardSpace?: number;
	extraScrollHeight?: number;
	keyboardLiftBehavior?: string;
	keyboardOpeningTime?: number;
	offset?: number;
	resetScrollToCoords?: { x: number; y: number };
	viewIsInsideTabBar?: boolean;
};

export type KeyboardChatScrollViewProps = ScrollView;
export type KeyboardAwareScrollViewProps = ScrollViewProps & KeyboardScrollExtras;

const keyboardScrollPropKeys: Array<keyof KeyboardScrollExtras> = [
	'bottomOffset',
	'disableScrollOnKeyboardHide',
	'enableOnAndroid',
	'enabled',
	'extraContentPadding',
	'extraKeyboardSpace',
	'extraScrollHeight',
	'keyboardLiftBehavior',
	'keyboardOpeningTime',
	'offset',
	'resetScrollToCoords',
	'viewIsInsideTabBar',
];

function omitKeyboardScrollProps(props: KeyboardAwareScrollViewProps): ScrollViewProps {
	const scrollViewProps = { ...props };
	for (const key of keyboardScrollPropKeys) {
		delete scrollViewProps[key];
	}
	return scrollViewProps;
}

function createZeroSharedValue(): KeyboardSharedValue {
	return {
		value: 0,
		get: () => 0,
		set: () => {},
		addListener: () => -1,
		removeListener: () => {},
		modify: () => {},
	};
}

export function KeyboardProvider({ children, preload }: { children?: ReactNode; preload?: boolean }) {
	void preload;
	return createElement(Fragment, null, children);
}

export const KeyboardAvoidingView = forwardRef<View, KeyboardAvoidingViewProps>(
	function KeyboardAvoidingView(props, ref) {
		return createElement(View, { ...props, ref });
	},
);

export const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
	function KeyboardAwareScrollView(props, ref) {
		return createElement(ScrollView, { ...omitKeyboardScrollProps(props), ref });
	},
);

export const KeyboardChatScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
	function KeyboardChatScrollView(props, ref) {
		return createElement(ScrollView, { ...omitKeyboardScrollProps(props), ref });
	},
);

export const KeyboardGestureArea = forwardRef<View, KeyboardGestureAreaProps>(function KeyboardGestureArea(
	{ interpolator, offset, textInputNativeID, ...props },
	ref,
) {
	void interpolator;
	void offset;
	void textInputNativeID;
	return createElement(View, { ...props, ref });
});

export const KeyboardStickyView = forwardRef<View, KeyboardStickyViewProps>(function KeyboardStickyView(
	{ enabled, offset, ...props },
	ref,
) {
	void enabled;
	void offset;
	return createElement(View, { ...props, ref });
});

export function useKeyboardHandler(handlers: KeyboardHandlers, dependencies: readonly unknown[] = []) {
	void handlers;
	void dependencies;
}

export function useFocusedInputHandler(handlers: KeyboardHandlers, dependencies: readonly unknown[] = []) {
	void handlers;
	void dependencies;
}

export function useReanimatedKeyboardAnimation() {
	return useMemo(
		() => ({
			height: createZeroSharedValue(),
			progress: createZeroSharedValue(),
		}),
		[],
	);
}

export function useKeyboardContext() {
	return useMemo(
		() => ({
			enabled: false,
			setEnabled: (_enabled: boolean) => {},
		}),
		[],
	);
}

export function useKeyboardState() {
	return useMemo(
		() => ({
			height: 0,
			isVisible: false,
			progress: 0,
		}),
		[],
	);
}

export const KeyboardEvents = {
	addListener(_event: string, _listener: KeyboardHandler) {
		return {
			remove: () => {},
		};
	},
	removeAllListeners(_event?: string) {},
};
