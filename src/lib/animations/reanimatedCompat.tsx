import { createElement, type ElementType, forwardRef, type PropsWithoutRef, useRef } from 'react';
import {
	FlatList,
	type FlatListProps,
	Image,
	type LayoutRectangle,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Pressable,
	ScrollView,
	type ScrollViewProps,
	type StyleProp,
	Text,
	View,
	type ViewStyle,
} from 'react-native';

type AnimationConfig = {
	name: string;
	durationMs?: number;
	delayMs?: number;
	easingValue?: string;
};

type AnimatedProp = AnimationBuilder | AnimationConfig | Keyframe | undefined;

type AnimatedCompatProps = {
	entering?: AnimatedProp;
	exiting?: AnimatedProp;
	layout?: AnimatedProp;
	animatedProps?: object;
};

export type SharedValue<Value = unknown> = {
	value: Value;
	get: () => Value;
	set: (value: Value | ((previous: Value) => Value)) => void;
	addListener: (listener: (value: Value) => void) => number;
	removeListener: (id: number) => void;
	modify: (modifier?: (value: Value) => Value) => void;
};

export type AnimatedRef<Value = unknown> = React.MutableRefObject<Value | null>;
export type AnimatedStyle<Value> = Value;
export type AnimatedScrollView = React.ComponentRef<typeof ScrollView>;
export type AnimatedView = React.ComponentRef<typeof View>;
export type FlatListPropsWithLayout<ItemT> = FlatListProps<ItemT>;
export type ReanimatedScrollEvent = NativeScrollEvent & {
	eventName?: string;
	zoomScale?: number;
};
type ScrollHandlerEvent = ReanimatedScrollEvent | NativeSyntheticEvent<NativeScrollEvent>;
type ReanimatedEvent = Record<string, unknown> & { eventName: string };
export type ScrollEvent = ReanimatedScrollEvent;
export type AnimatableValue = number | string | number[];
export type MeasuredDimensions = LayoutRectangle & {
	pageX: number;
	pageY: number;
};
export type WithSpringConfig = Record<string, unknown>;
export type AnimatedScrollViewProps = ScrollViewProps;
export type ScrollHandlers<Context extends Record<string, unknown> = Record<string, unknown>> = {
	onScroll?: (event: ReanimatedScrollEvent, context: Context) => void;
	onBeginDrag?: (event: ReanimatedScrollEvent, context: Context) => void;
	onEndDrag?: (event: ReanimatedScrollEvent, context: Context) => void;
	onMomentumBegin?: (event: ReanimatedScrollEvent, context: Context) => void;
	onMomentumEnd?: (event: ReanimatedScrollEvent, context: Context) => void;
};
export type AnimateProps<Props extends object> = Props & AnimatedCompatProps;

type AnimatedComponent<Props extends object> = React.ForwardRefExoticComponent<
	PropsWithoutRef<Props & AnimatedCompatProps> & React.RefAttributes<unknown>
>;

export const Extrapolation = {
	CLAMP: 'clamp',
	EXTEND: 'extend',
	IDENTITY: 'identity',
} as const;

export const ReduceMotion = {
	System: 'system',
	Always: 'always',
	Never: 'never',
} as const;

export type AnimationBuilder = AnimationConfig & {
	delay: (...args: unknown[]) => AnimationBuilder;
	duration: (...args: unknown[]) => AnimationBuilder;
	easing: (...args: unknown[]) => AnimationBuilder;
	springify: (...args: unknown[]) => AnimationBuilder;
	damping: (...args: unknown[]) => AnimationBuilder;
	stiffness: (...args: unknown[]) => AnimationBuilder;
	mass: (...args: unknown[]) => AnimationBuilder;
	overshootClamping: (...args: unknown[]) => AnimationBuilder;
	reduceMotion: (...args: unknown[]) => AnimationBuilder;
};

function createAnimation(config: AnimationConfig): AnimationBuilder {
	return {
		...config,
		delay: (ms) =>
			createAnimation({
				...config,
				delayMs: typeof ms === 'number' ? ms : config.delayMs,
			}),
		duration: (ms) =>
			createAnimation({
				...config,
				durationMs: typeof ms === 'number' ? ms : config.durationMs,
			}),
		easing: (value) =>
			createAnimation({
				...config,
				easingValue: typeof value === 'string' ? value : config.easingValue,
			}),
		springify: () => createAnimation({ ...config, easingValue: 'ease-out' }),
		damping: () => createAnimation(config),
		stiffness: () => createAnimation(config),
		mass: () => createAnimation(config),
		overshootClamping: () => createAnimation(config),
		reduceMotion: () => createAnimation(config),
	};
}

function stripAnimationProps<P extends object>(props: P & AnimatedCompatProps): P {
	const { animatedProps, entering, exiting, layout, ...rest } = props;
	void animatedProps;
	void entering;
	void exiting;
	void layout;
	return rest as P;
}

function createAnimatedComponent<Props extends object>(
	Component: ElementType<Props>,
): AnimatedComponent<Props> {
	return forwardRef<unknown, Props & AnimatedCompatProps>(function AnimatedCompatComponent(props, ref) {
		return createElement(Component, {
			...stripAnimationProps(props),
			ref,
		} as Props & { ref: React.Ref<unknown> });
	}) as AnimatedComponent<Props>;
}

function createSharedValue<Value>(initial: Value): SharedValue<Value> {
	let listenerId = 0;
	const listeners = new Map<number, (value: Value) => void>();
	const sharedValue: SharedValue<Value> = {
		value: initial,
		get: () => sharedValue.value,
		set: (value) => {
			sharedValue.value =
				typeof value === 'function' ? (value as (previous: Value) => Value)(sharedValue.value) : value;
			listeners.forEach((listener) => listener(sharedValue.value));
		},
		addListener: (listener) => {
			listenerId += 1;
			listeners.set(listenerId, listener);
			return listenerId;
		},
		removeListener: (id) => {
			listeners.delete(id);
		},
		modify: (modifier) => {
			if (modifier) {
				sharedValue.set(modifier(sharedValue.value));
			}
		},
	};
	return sharedValue;
}

export const Easing = {
	linear: 'linear',
	ease: 'ease',
	exp: 'ease-out',
	cubic: 'ease-out',
	quad: 'ease-out',
	back: (..._args: unknown[]) => 'ease-out',
	out: (value: string) => value,
	in: (value: string) => value,
	inOut: (value: string) => value,
	bezier: (x1: number, y1: number, x2: number, y2: number) => `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,
};

export const FadeIn = createAnimation({ name: 'fade-in' });
export const FadeOut = createAnimation({ name: 'fade-out' });
export const FadeInDown = createAnimation({ name: 'fade-in-down' });
export const FadeOutDown = createAnimation({ name: 'fade-out-down' });
export const FadeInLeft = createAnimation({ name: 'fade-in-left' });
export const FadeOutLeft = createAnimation({ name: 'fade-out-left' });
export const FadeInRight = createAnimation({ name: 'fade-in-right' });
export const FadeOutRight = createAnimation({ name: 'fade-out-right' });
export const FadeInUp = createAnimation({ name: 'fade-in-up' });
export const FadeOutUp = createAnimation({ name: 'fade-out-up' });
export const SlideInLeft = createAnimation({ name: 'slide-in-left' });
export const SlideInRight = createAnimation({ name: 'slide-in-right' });
export const SlideInUp = createAnimation({ name: 'slide-in-up' });
export const SlideInDown = createAnimation({ name: 'slide-in-down' });
export const SlideOutLeft = createAnimation({ name: 'slide-out-left' });
export const SlideOutRight = createAnimation({ name: 'slide-out-right' });
export const SlideOutUp = createAnimation({ name: 'slide-out-up' });
export const SlideOutDown = createAnimation({ name: 'slide-out-down' });
export const ZoomIn = createAnimation({ name: 'zoom-in' });
export const ZoomOut = createAnimation({ name: 'zoom-out' });
export const ZoomInDown = createAnimation({ name: 'zoom-in-down' });
export const ZoomOutDown = createAnimation({ name: 'zoom-out-down' });
export const ZoomInLeft = createAnimation({ name: 'zoom-in-left' });
export const ZoomOutLeft = createAnimation({ name: 'zoom-out-left' });
export const ZoomInRight = createAnimation({ name: 'zoom-in-right' });
export const ZoomOutRight = createAnimation({ name: 'zoom-out-right' });
export const ZoomInUp = createAnimation({ name: 'zoom-in-up' });
export const ZoomOutUp = createAnimation({ name: 'zoom-out-up' });
export const LinearTransition = createAnimation({ name: 'linear-transition' });

export function LayoutAnimationConfig({
	children,
	skipEntering,
	skipExiting,
}: {
	children: React.ReactNode;
	skipEntering?: boolean;
	skipExiting?: boolean;
}) {
	void skipEntering;
	void skipExiting;
	return children;
}

export function useReducedMotion() {
	return false;
}

export function useSharedValue<Value>(initial: Value): SharedValue<Value> {
	return useRef(createSharedValue(initial)).current;
}

export function makeMutable<Value>(initial: Value): SharedValue<Value> {
	return createSharedValue(initial);
}

export function useDerivedValue<Value>(derive: () => Value, _dependencies?: unknown[]): SharedValue<Value> {
	const value = useSharedValue(derive());
	value.set(derive());
	return value;
}

export function useAnimatedStyle<Style extends StyleProp<ViewStyle>>(
	updater: () => Style,
	_dependencies?: unknown[],
): Style {
	return updater();
}

export function useAnimatedProps<Props extends object>(
	updater: () => Props,
	_dependencies?: unknown[],
): Props {
	return updater();
}

export function useAnimatedReaction<Prepared>(
	prepare: () => Prepared,
	react: (current: Prepared, previous: Prepared | null) => void,
	_dependencies?: unknown[],
) {
	const previous = useRef<Prepared | null>(null);
	const current = prepare();
	react(current, previous.current);
	previous.current = current;
}

export function useAnimatedRef<Value = AnimatedView>(_initial?: Value): AnimatedRef<Value> {
	return useRef<Value | null>(null);
}

export function useScrollViewOffset(_ref?: unknown) {
	return useSharedValue(0);
}

export function useAnimatedScrollHandler<Context extends Record<string, unknown>>(
	handlers: ((event: ReanimatedScrollEvent) => void) | ScrollHandlers<Context>,
	_dependencies?: unknown[],
): (event: ScrollHandlerEvent) => void {
	return (event: ScrollHandlerEvent) => {
		const scrollEvent = 'nativeEvent' in event ? (event.nativeEvent as ReanimatedScrollEvent) : event;
		if (typeof handlers === 'function') {
			handlers(scrollEvent);
		} else {
			handlers.onScroll?.(scrollEvent, {} as Context);
		}
	};
}

export function useFrameCallback(_callback?: unknown, _autoRefresh?: boolean) {
	return {
		setActive: (_active: boolean) => {},
	};
}

export function useEvent(
	handler: (event: ReanimatedEvent) => void,
	_eventNames?: string[],
	_rebuild?: boolean,
) {
	return handler as (event: unknown) => void;
}

export function useHandler<
	Handlers extends object,
	Context extends Record<string, unknown> = Record<string, unknown>,
>(handlers: Handlers, _dependencies?: unknown[]) {
	return {
		context: {} as Context,
		doDependenciesDiffer: false,
		useWeb: true,
		handlers,
	};
}

export function withTiming<Value>(
	value: Value,
	_config?: object,
	callback?: (finished?: boolean) => void,
): Value {
	callback?.(true);
	return value;
}

export function withSpring<Value>(
	value: Value,
	_config?: object,
	callback?: (finished?: boolean) => void,
): Value {
	callback?.(true);
	return value;
}

export function withDecay<Value>(_config: object, callback?: (finished?: boolean) => void): Value {
	callback?.(true);
	return 0 as Value;
}

export function withDelay<Value>(_delayMs: number, value: Value): Value {
	return value;
}

export function withSequence<Value>(...values: Value[]): Value {
	return values[values.length - 1]!;
}

export function withRepeat<Value>(value: Value, ..._args: unknown[]): Value {
	return value;
}

export function cancelAnimation(_value?: unknown) {}

export function runOnJS<Args extends unknown[], Return>(fn: (...args: Args) => Return) {
	return (...args: Args) => fn(...args);
}

export function runOnUI<Args extends unknown[], Return>(fn: (...args: Args) => Return) {
	return (...args: Args) => fn(...args);
}

export function scrollTo(ref: AnimatedRef<unknown>, x: number, y: number, animated?: boolean) {
	const scrollable = ref.current as {
		scrollTo?: (options: unknown) => void;
	} | null;
	scrollable?.scrollTo?.({ x, y, animated });
}

export function measure(_ref?: unknown): MeasuredDimensions | null {
	return null;
}

export function interpolate(
	value: number,
	inputRange: readonly number[],
	outputRange: readonly number[],
	_extrapolate?: unknown,
) {
	if (inputRange.length === 0 || outputRange.length === 0) {
		return value;
	}
	const firstInput = inputRange[0]!;
	const lastInput = inputRange[inputRange.length - 1]!;
	const firstOutput = outputRange[0]!;
	const lastOutput = outputRange[outputRange.length - 1]!;
	if (lastInput === firstInput) {
		return firstOutput;
	}
	const ratio = (value - firstInput) / (lastInput - firstInput);
	return firstOutput + ratio * (lastOutput - firstOutput);
}

export function interpolateColor(
	value: number,
	inputRange: readonly number[],
	outputRange: readonly string[],
) {
	return value <= inputRange[0]! ? outputRange[0]! : outputRange.at(-1)!;
}

export function clamp(value: number, lowerBound: number, upperBound: number) {
	return Math.min(Math.max(value, lowerBound), upperBound);
}

export class Keyframe {
	constructor(public definitions: object) {}
	duration(_durationMs?: number) {
		return this;
	}
	delay(_delayMs?: number) {
		return this;
	}
	easing(_easing?: unknown) {
		return this;
	}
	build() {
		return this;
	}
}

type AnimatedModule = {
	View: AnimatedComponent<React.ComponentProps<typeof View>>;
	Text: AnimatedComponent<React.ComponentProps<typeof Text>>;
	Image: AnimatedComponent<React.ComponentProps<typeof Image>>;
	ScrollView: AnimatedComponent<ScrollViewProps>;
	FlatList: typeof FlatList;
	Pressable: AnimatedComponent<React.ComponentProps<typeof Pressable>>;
	createAnimatedComponent: typeof createAnimatedComponent;
};

const Animated: AnimatedModule = {
	View: createAnimatedComponent(View),
	Text: createAnimatedComponent(Text),
	Image: createAnimatedComponent(Image),
	ScrollView: createAnimatedComponent(ScrollView),
	FlatList: createAnimatedComponent(FlatList) as unknown as typeof FlatList,
	Pressable: createAnimatedComponent(Pressable),
	createAnimatedComponent,
};

export default Animated;
