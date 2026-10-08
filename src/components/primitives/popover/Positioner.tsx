'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { Ref } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { type Align, type CollisionPadding, getAnchoredStyle, type Side } from '../anchored-popup';
import * as styles from '../anchored-popup.css';
import { openStateAttributes, useInertWhileClosed, useTransitionsSettled } from '../presence';
import { getDialogProps, showInTopLayer, showModalInTopLayer } from '../top-layer';
import { useRootContext } from './shared';

export type PositionerState = {
	open: boolean;
	/** preferred side, not the resolved placement. */
	side: Side;
	align: Align;
};

export type PositionerProps = Omit<useRender.ComponentProps<'dialog', PositionerState>, 'ref'> & {
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
		render,
		defaultTagName: 'dialog',
		ref: [
			ref ?? null,
			positionerRef,
			modal ? showModalInTopLayer(open) : showInTopLayer(open, activeTrigger),
		],
		state: { open, side, align },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'dialog'>(
			{
				...getDialogProps(open, (event) => setOpen(false, { reason: 'escape-key', event })),
				className: styles.positioner,
				style: getAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding }),
			},
			elementProps,
		),
	});
};
