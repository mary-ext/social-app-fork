'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type Ref, type RefObject, useId, useLayoutEffect, useRef } from 'react';

import {
	addAnchorName,
	COLLISION_PADDING,
	getPositionerProps,
	type PlacementProps,
	useAnchoredPositioner,
	useAvailableSize,
} from '../anchored-popup';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { showInTopLayer } from '../top-layer';
import * as styles from './combobox.css';
import { useRootContext } from './shared';

export type PositionerProps = Omit<RenderProps<'div'>, 'ref'> &
	Omit<PlacementProps, 'side'> & {
		ref?: Ref<HTMLDivElement>;
		/** element to position against; defaults to the input. */
		anchor?: Element | RefObject<Element | null> | null;
		/** preferred side; flips or shrinks when space is insufficient. */
		side?: 'bottom' | 'top';
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
	collisionPadding = COLLISION_PADDING,
	...elementProps
}: PositionerProps) => {
	const ctx = useRootContext();
	const { expanded: open, positionerRef, inputRef } = ctx;

	const id = useId();
	const anchorName = `--combobox-${CSS.escape(id)}`;

	// anchors may be refs, so resolve them after every commit.
	const anchoredRef = useRef<{ el: Element; remove: () => void } | null>(null);
	const anchorElRef = useRef<Element | null>(null);
	useLayoutEffect(() => {
		const el = resolveAnchor(anchor, inputRef.current);
		anchorElRef.current = el;
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

	useAnchoredPositioner(positionerRef, open, ctx.onTransitionSettled);
	useAvailableSize(positionerRef, anchorElRef, open, {
		side,
		sideOffset,
		collisionPadding,
	});

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		popover: 'manual',
		inert: !open,
		className: styles.positioner,
	};

	return useRender({
		tag: 'div',
		render,
		refs: [ref, positionerRef, showInTopLayer(open)],
		props: mergeProps<'div'>(
			getPositionerProps(open, { anchorName, side, align, sideOffset, collisionPadding }),
			internalProps,
			elementProps,
		),
	});
};
