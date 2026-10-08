'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { Ref } from 'react';

import { getPositionerProps, type PlacementProps, useAnchoredPositioner } from '../anchored-popup';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { getHintProps, showInTopLayer } from '../top-layer';
import { useRootContext } from './shared';
import * as styles from './tooltip.css';

export type PositionerProps = Omit<RenderProps<'div'>, 'ref'> &
	Omit<PlacementProps, 'collisionPadding'> & {
		ref?: Ref<HTMLDivElement>;
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

	useAnchoredPositioner(positionerRef, open, onTransitionSettled);

	return useRender({
		tag: 'div',
		render,
		refs: [ref, positionerRef, showInTopLayer(open)],
		props: mergeProps<'div'>(
			getPositionerProps(open, { anchorName, side, align, sideOffset, collisionPadding: 0 }),
			{
				...getHintProps((event) => setOpen(false, 'light-dismiss', event)),
				// a popup that can't be hovered must not intercept the pointer either.
				inert: !open || disableHoverablePopup,
				className: styles.positioner,
			},
			elementProps,
		),
	});
};
