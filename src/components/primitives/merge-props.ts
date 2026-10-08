import type { ComponentPropsWithRef, CSSProperties, JSX, SyntheticEvent } from 'react';

import { clsx } from 'clsx';

import type { DataAttributes } from './data-attributes';

/** synthetic event with primitive-handler cancellation. */
export type PrimitiveEvent<E extends SyntheticEvent = SyntheticEvent> = E & {
	/** skips the handlers merged before the current one. */
	preventPrimitiveHandler(): void;
	primitiveHandlerPrevented?: boolean;
};

type WithPrimitiveEvent<T> = T extends (event: infer E) => infer R
	? E extends SyntheticEvent
		? (event: PrimitiveEvent<E>) => R
		: T
	: T;

/** element props whose handlers receive {@link PrimitiveEvent}s. */
export type MergeableProps<T extends keyof JSX.IntrinsicElements> = {
	[K in keyof ComponentPropsWithRef<T>]: WithPrimitiveEvent<ComponentPropsWithRef<T>[K]>;
};

type AnyHandler = (...args: unknown[]) => unknown;

/**
 * merges element props. later sets take precedence, with these exceptions:
 *
 * - handlers run last-set first; `event.preventPrimitiveHandler()` skips earlier handlers.
 * - `className`s are joined last-set first.
 * - `style` objects are shallow-merged.
 *
 * refs use normal precedence; use `useMergedRefs` to combine them.
 *
 * @param sets prop sets, from internal to external
 * @returns the merged props
 */
export const mergeProps = <T extends keyof JSX.IntrinsicElements>(
	...sets: Array<MergeableProps<T> | DataAttributes | undefined>
): ComponentPropsWithRef<T> => {
	const merged: Record<string, unknown> = {};

	for (const set of sets) {
		if (set === undefined) {
			continue;
		}

		for (const [name, value] of Object.entries(set)) {
			switch (name) {
				case 'className': {
					merged.className = clsx(asString(value), asString(merged.className)) || undefined;
					break;
				}
				case 'style': {
					merged.style = mergeStyles(asStyle(merged.style), asStyle(value));
					break;
				}
				default: {
					if (isEventHandler(name, value)) {
						merged[name] = chainHandlers(asHandler(merged[name]), value);
					} else {
						merged[name] = value;
					}
				}
			}
		}
	}

	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- built from `T`'s props, minus event wrappers
	return merged as ComponentPropsWithRef<T>;
};

const asString = (value: unknown): string | undefined => {
	return typeof value === 'string' ? value : undefined;
};

const asStyle = (value: unknown): CSSProperties | undefined => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only `style` props reach here
	return typeof value === 'object' && value !== null ? (value as CSSProperties) : undefined;
};

const asHandler = (value: unknown): AnyHandler | undefined => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only event handler props reach here
	return typeof value === 'function' ? (value as AnyHandler) : undefined;
};

const isEventHandler = (name: string, value: unknown): value is AnyHandler | undefined => {
	return EVENT_HANDLER_NAME.test(name) && (typeof value === 'function' || value === undefined);
};

const EVENT_HANDLER_NAME = /^on[A-Z]/;

const isSyntheticEvent = (event: unknown): event is SyntheticEvent => {
	return typeof event === 'object' && event !== null && 'nativeEvent' in event;
};

const makePreventable = (event: SyntheticEvent): PrimitiveEvent => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the fields are assigned right below
	const preventable = event as PrimitiveEvent;
	// reset cancellation so it doesn't leak to ancestors during bubbling.
	preventable.primitiveHandlerPrevented = false;
	preventable.preventPrimitiveHandler = () => {
		preventable.primitiveHandlerPrevented = true;
	};
	return preventable;
};

const chainHandlers = (
	earlier: AnyHandler | undefined,
	later: AnyHandler | undefined,
): AnyHandler | undefined => {
	if (later === undefined) {
		return earlier;
	}

	return (...args) => {
		const event = args[0];
		const preventable = isSyntheticEvent(event) ? makePreventable(event) : undefined;
		const result = later(...args);
		if (!preventable?.primitiveHandlerPrevented) {
			earlier?.(...args);
		}
		return result;
	};
};

const mergeStyles = (
	base: CSSProperties | undefined,
	patch: CSSProperties | undefined,
): CSSProperties | undefined => {
	if (base === undefined) {
		return patch;
	}
	if (patch === undefined) {
		return base;
	}
	return { ...base, ...patch };
};
