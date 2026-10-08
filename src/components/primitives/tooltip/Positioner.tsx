'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { Ref } from 'react';

import {
	type Align,
	getAnchoredStyle,
	getPositionerAttributes,
	type Side,
	useDevicePixelSnap,
} from '../anchored-popup';
import * as styles from '../anchored-popup.css';
import { mergeProps } from '../merge-props';
import { useTransitionsSettled } from '../presence';
import { type RenderProps, useRender } from '../render';
import { getHintProps, showInTopLayer } from '../top-layer';
import { useRootContext } from './shared';

export type PositionerProps = Omit<RenderProps<'div'>, 'ref'> & {
	ref?: Ref<HTMLDivElement>;
	/** preferred side; flips when space is insufficient. */
	side?: Side;
	/** alignment along the trigger's edge. */
	align?: Align;
	/** gap between trigger and popup, in pixels. */
	sideOffset?: number;
};

/**
 * positions the tooltip in the top layer at the trigger.
 *
 * @param props placement and element props
 * @returns the positioning element; a `<div>` by default, or `null` while unmounted
 */
export const Positioner = (props: PositionerProps) => {
	const { mounted } = useRootContext();
	return mounted ? <MountedPositioner {...props} /> : null;
};

const MountedPositioner = ({
	render,
	ref,
	side = 'top',
	align = 'center',
	sideOffset = 0,
	...elementProps
}: PositionerProps) => {
	const { open, disableHoverablePopup, anchorName, positionerRef, setOpen, onTransitionSettled } =
		useRootContext();

	useTransitionsSettled(positionerRef, open, onTransitionSettled);

	useDevicePixelSnap(positionerRef, open);

	return useRender({
		tag: 'div',
		render,
		refs: [ref, positionerRef, showInTopLayer(open)],
		props: mergeProps<'div'>(
			getPositionerAttributes(open, side, align),
			{
				...getHintProps((event) => setOpen(false, 'light-dismiss', event)),
				// prevent the popup from intercepting the pointer when hover is disabled.
				inert: !open || disableHoverablePopup,
				className: styles.positioner,
				style: getAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding: 0 }),
			},
			elementProps,
		),
	});
};
