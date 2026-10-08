'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type Ref, type RefObject, useId, useLayoutEffect, useRef } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import {
	addAnchorName,
	type Align,
	type CollisionPadding,
	getShrinkingAnchoredStyle,
} from '../anchored-popup';
import * as styles from '../anchored-popup.css';
import { openStateAttributes, useInertWhileClosed, useTransitionsSettled } from '../presence';
import { showInTopLayer } from '../top-layer';
import { useRootContext } from './shared';

export type PositionerState = {
	open: boolean;
	/** preferred side, not the resolved placement. */
	side: 'bottom' | 'top';
	align: Align;
};

export type PositionerProps = Omit<useRender.ComponentProps<'div', PositionerState>, 'ref'> & {
	ref?: Ref<HTMLDivElement>;
	/** element to position against; defaults to the input. */
	anchor?: Element | RefObject<Element | null> | null;
	/** preferred side; flips or shrinks when space is insufficient. */
	side?: 'bottom' | 'top';
	/** alignment along the anchor's edge. */
	align?: Align;
	/** gap between anchor and popup, in pixels. */
	sideOffset?: number;
	/** minimum distance from the viewport edges, in pixels. */
	collisionPadding?: CollisionPadding;
};

/**
 * positions the popup in the top layer at the anchor, without moving focus from the input. popup content must
 * be scrollable.
 *
 * @param props anchor, placement, and element props
 * @returns the positioning element; a `<div>` by default, or `null` while unmounted
 */
export const Positioner = (props: PositionerProps) => {
	const { mounted, inline } = useRootContext();
	return mounted && !inline ? <MountedPositioner {...props} /> : null;
};

const resolveAnchor = (anchor: PositionerProps['anchor'], input: HTMLElement | null): Element | null => {
	if (anchor === undefined) {
		return input;
	}
	if (anchor === null || anchor instanceof Element) {
		return anchor;
	}
	return anchor.current;
};

const MountedPositioner = ({
	render,
	ref,
	anchor,
	side = 'bottom',
	align = 'center',
	sideOffset = 0,
	collisionPadding = 5,
	...elementProps
}: PositionerProps) => {
	const ctx = useRootContext();
	const { expanded: open, positionerRef, inputRef } = ctx;

	const id = useId();
	const anchorName = `--combobox-${CSS.escape(id)}`;

	// anchors may be refs, so resolve them after every commit.
	const anchoredRef = useRef<{ el: Element; remove: () => void } | null>(null);
	useLayoutEffect(() => {
		const el = resolveAnchor(anchor, inputRef.current);
		const current = anchoredRef.current;
		if (current?.el === el) {
			return;
		}
		current?.remove();
		anchoredRef.current = el instanceof HTMLElement ? { el, remove: addAnchorName(el, anchorName) } : null;
	});
	useLayoutEffect(() => {
		return () => {
			anchoredRef.current?.remove();
			anchoredRef.current = null;
		};
	}, []);

	useTransitionsSettled(positionerRef, open, ctx.onTransitionSettled);

	useInertWhileClosed(positionerRef, open);

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		popover: 'manual',
		className: `${styles.positioner} ${styles.shrinkingPositioner}`,
		style: getShrinkingAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding }),
	};

	return useRender({
		render,
		ref: [ref ?? null, positionerRef, showInTopLayer(open)],
		state: { open, side, align },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>(internalProps, elementProps),
	});
};
