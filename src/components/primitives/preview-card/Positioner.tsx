'use no memo';

import type { Ref } from 'react';

import {
	type Align,
	type CollisionPadding,
	getAnchoredStyle,
	getPositionerAttributes,
	type Side,
} from '../anchored-popup';
import * as styles from '../anchored-popup.css';
import { mergeProps } from '../merge-props';
import { useInertWhileClosed, useTransitionsSettled } from '../presence';
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
	collisionPadding?: CollisionPadding;
};

/**
 * positions the preview card in the top layer at the trigger.
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
	side = 'bottom',
	align = 'center',
	sideOffset = 0,
	collisionPadding = 5,
	...elementProps
}: PositionerProps) => {
	const { open, anchorName, triggerRef, positionerRef, setOpen, onTransitionSettled } = useRootContext();

	useTransitionsSettled(positionerRef, open, onTransitionSettled);

	useInertWhileClosed(positionerRef, open);

	return useRender({
		tag: 'div',
		render,
		// oxlint-disable-next-line react/refs -- the trigger commits before the positioner mounts
		refs: [ref, positionerRef, showInTopLayer(open, triggerRef.current)],
		props: mergeProps<'div'>(
			getPositionerAttributes(open, side, align),
			{
				...getHintProps((event) => setOpen(false, 'light-dismiss', event)),
				className: styles.positioner,
				style: getAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding }),
			},
			elementProps,
		),
	});
};
