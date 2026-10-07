'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type Ref, useLayoutEffect } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import * as styles from '#/components/primitives/tooltip/Positioner.css';
import { openStateAttributes, useRootContext } from '#/components/primitives/tooltip/shared';

export type Side = 'bottom' | 'left' | 'right' | 'top';
export type Align = 'center' | 'end' | 'start';

export type PositionerState = {
	open: boolean;
	/** preferred side, not the resolved placement. */
	side: Side;
	align: Align;
};

export type PositionerProps = Omit<useRender.ComponentProps<'div', PositionerState>, 'ref'> & {
	ref?: Ref<HTMLDivElement>;
	/** preferred side; flips when space is insufficient. */
	side?: Side;
	/** alignment along the trigger's edge. */
	align?: Align;
	/** gap between trigger and popup, in pixels. */
	sideOffset?: number;
};

const isVertical = (side: Side): boolean => {
	return side === 'top' || side === 'bottom';
};

const getPositionArea = (side: Side, align: Align): string => {
	// a single side keyword permits shifting near viewport edges; spans align to the anchor's edges.
	switch (align) {
		case 'center': {
			return side;
		}
		case 'start': {
			return isVertical(side) ? `${side} span-x-end` : `${side} span-y-end`;
		}
		case 'end': {
			return isVertical(side) ? `${side} span-x-start` : `${side} span-y-start`;
		}
	}
};

const OFFSET_MARGIN = {
	bottom: 'marginTop',
	left: 'marginRight',
	right: 'marginLeft',
	top: 'marginBottom',
} as const;

/**
 * anchors a top-layer popup to the trigger with CSS anchor positioning.
 *
 * @param props placement and element props
 * @returns the positioning element; a `<div>` by default
 */
export const Positioner = ({
	render,
	ref,
	side = 'top',
	align = 'center',
	sideOffset = 0,
	...elementProps
}: PositionerProps) => {
	const { open, disableHoverablePopup, anchorName, positionerRef, onTransitionSettled } = useRootContext();

	useLayoutEffect(() => {
		const el = positionerRef.current;
		if (!el) {
			return;
		}

		if (!el.matches(':popover-open')) {
			el.showPopover();
		}

		// canceled animations reject `finished`; the next effect handles the replacement transitions.
		let stale = false;
		const frame = requestAnimationFrame(() => {
			const animations = el.getAnimations({ subtree: true });
			Promise.all(animations.map((animation) => animation.finished)).then(
				() => {
					if (!stale) {
						onTransitionSettled(open);
					}
				},
				() => {},
			);
		});

		return () => {
			stale = true;
			cancelAnimationFrame(frame);
		};
	}, [open, positionerRef, onTransitionSettled]);

	return useRender({
		render,
		ref: [ref ?? null, positionerRef],
		state: { open, side, align },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>(
			{
				popover: 'manual',
				// prevent the popup from intercepting the pointer when hover is disabled.
				inert: !open || disableHoverablePopup,
				className: styles.positioner,
				style: {
					positionAnchor: anchorName,
					positionArea: getPositionArea(side, align),
					positionTryFallbacks: isVertical(side) ? 'flip-block' : 'flip-inline',
					[OFFSET_MARGIN[side]]: sideOffset,
				},
			},
			elementProps,
		),
	});
};
