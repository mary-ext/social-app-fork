'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { Ref } from 'react';

import {
	COLLISION_PADDING,
	getAnchoredStyle,
	getPositionerAttributes,
	type PlacementProps,
	useAnchoredPositioner,
} from '../anchored-popup';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { getDialogProps, showInTopLayer, showModalInTopLayer } from '../top-layer';
import * as styles from './popover.css';
import { useRootContext } from './shared';

export type PositionerProps = Omit<RenderProps<'dialog'>, 'ref'> &
	PlacementProps & {
		ref?: Ref<HTMLDialogElement>;
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
	collisionPadding = COLLISION_PADDING,
	...elementProps
}: PositionerProps) => {
	const { open, modal, anchorName, activeTrigger, positionerRef, setOpen, onTransitionSettled } =
		useRootContext();

	useAnchoredPositioner(positionerRef, open, onTransitionSettled);

	return useRender({
		tag: 'dialog',
		render,
		refs: [ref, positionerRef, modal ? showModalInTopLayer(open) : showInTopLayer(open, activeTrigger)],
		props: mergeProps<'dialog'>(
			getPositionerAttributes(open, side, align),
			{
				...getDialogProps(open, (event) => setOpen(false, { reason: 'escape-key', event })),
				inert: !open,
				className: modal ? styles.modalPositioner : styles.positioner,
				style: getAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding }),
			},
			elementProps,
		),
	});
};
