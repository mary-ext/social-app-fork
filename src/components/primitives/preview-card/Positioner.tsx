'use no memo';

import type { Ref } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { type Align, type CollisionPadding, getAnchoredStyle, type Side } from '../anchored-popup';
import * as styles from '../anchored-popup.css';
import { openStateAttributes, useInertWhileClosed, useTransitionsSettled } from '../presence';
import { getHintProps, showInTopLayer } from '../top-layer';
import { useRootContext } from './shared';

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
		render,
		// oxlint-disable-next-line react/refs -- the trigger commits before the positioner mounts
		ref: [ref ?? null, positionerRef, showInTopLayer(open, triggerRef.current)],
		state: { open, side, align },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>(
			{
				...getHintProps((event) => setOpen(false, 'light-dismiss', event)),
				className: styles.positioner,
				style: getAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding }),
			},
			elementProps,
		),
	});
};
