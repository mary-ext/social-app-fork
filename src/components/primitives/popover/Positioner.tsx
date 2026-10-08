'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { Ref } from 'react';

import {
	type Align,
	type CollisionPadding,
	getAnchoredStyle,
	getPositionerAttributes,
	type Side,
} from '../anchored-popup';
import { mergeProps } from '../merge-props';
import { useInertWhileClosed, useTransitionsSettled } from '../presence';
import { type RenderProps, useRender } from '../render';
import { getDialogProps, showInTopLayer, showModalInTopLayer } from '../top-layer';
import * as styles from './popover.css';
import { useRootContext } from './shared';

export type PositionerProps = Omit<RenderProps<'dialog'>, 'ref'> & {
	ref?: Ref<HTMLDialogElement>;
	/** preferred side; flips when space is insufficient. */
	side?: Side;
	/** alignment along the trigger's edge. */
	align?: Align;
	/** gap between trigger and popup, in pixels. */
	sideOffset?: number;
	collisionPadding?: CollisionPadding;
};

/**
 * positions the popup in the top layer at the active trigger.
 *
 * @param props placement and element props
 * @returns the positioning element; a `<dialog>` by default, or `null` while unmounted
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
	const { open, modal, anchorName, activeTrigger, positionerRef, setOpen, onTransitionSettled } =
		useRootContext();

	useTransitionsSettled(positionerRef, open, onTransitionSettled);

	useInertWhileClosed(positionerRef, open);

	return useRender({
		tag: 'dialog',
		render,
		refs: [ref, positionerRef, modal ? showModalInTopLayer(open) : showInTopLayer(open, activeTrigger)],
		props: mergeProps<'dialog'>(
			getPositionerAttributes(open, side, align),
			{
				...getDialogProps(open, (event) => setOpen(false, { reason: 'escape-key', event })),
				className: modal ? styles.modalPositioner : styles.positioner,
				style: getAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding }),
			},
			elementProps,
		),
	});
};
