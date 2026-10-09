'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { Ref } from 'react';

import {
	COLLISION_PADDING,
	getPositionerProps,
	type PlacementProps,
	useAnchoredPositioner,
	useAvailableSize,
} from '../anchored-popup';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { getDialogProps, showInTopLayer, showModalInTopLayer, useShownForContent } from '../top-layer';
import * as styles from './popover.css';
import { useRootContext } from './shared';

export type PositionerProps = Omit<RenderProps<'dialog'>, 'ref'> &
	PlacementProps & {
		ref?: Ref<HTMLDialogElement>;
		/** caps popup size to the available space. requires scrollable content. */
		shrink?: boolean;
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
	shrink = false,
	children,
	...elementProps
}: PositionerProps) => {
	const { open, modal, anchorName, activeTrigger, positionerRef, setOpen, onTransitionSettled } =
		useRootContext();
	const shown = useShownForContent();

	useAnchoredPositioner(positionerRef, open, onTransitionSettled);
	useAvailableSize(positionerRef, shrink ? activeTrigger : null, open, {
		side,
		sideOffset,
		collisionPadding,
	});

	let className = modal ? styles.modalPositioner : styles.positioner;
	if (shrink) {
		className = styles.shrinkingPositioner;
	}

	return useRender({
		tag: 'dialog',
		render,
		refs: [ref, positionerRef, modal ? showModalInTopLayer(open) : showInTopLayer(open, activeTrigger)],
		props: mergeProps<'dialog'>(
			getPositionerProps(open, { anchorName, side, align, sideOffset, collisionPadding }),
			{
				...getDialogProps(open, (event) => setOpen(false, { reason: 'escape-key', event })),
				inert: !open,
				className,
				children: shown ? children : null,
			},
			elementProps,
		),
	});
};
