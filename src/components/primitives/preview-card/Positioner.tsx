'use no memo';

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
import { getHintProps, showInTopLayer } from '../top-layer';
import * as styles from './preview-card.css';
import { useRootContext } from './shared';

export type PositionerProps = Omit<RenderProps<'div'>, 'ref'> &
	PlacementProps & {
		ref?: Ref<HTMLDivElement>;
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
	collisionPadding = COLLISION_PADDING,
	...elementProps
}: PositionerProps) => {
	const { open, anchorName, triggerRef, positionerRef, setOpen, onTransitionSettled } = useRootContext();

	useAnchoredPositioner(positionerRef, open, onTransitionSettled);

	return useRender({
		tag: 'div',
		render,
		// oxlint-disable-next-line react/refs -- the trigger commits before the positioner mounts
		refs: [ref, positionerRef, showInTopLayer(open, triggerRef.current)],
		props: mergeProps<'div'>(
			getPositionerAttributes(open, side, align),
			{
				...getHintProps((event) => setOpen(false, 'light-dismiss', event)),
				inert: !open,
				className: styles.positioner,
				style: getAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding }),
			},
			elementProps,
		),
	});
};
