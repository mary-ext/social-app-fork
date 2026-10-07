'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import {
	HOVERABLE_GRACE,
	isMouseLike,
	openStateAttributes,
	useRootContext,
} from '#/components/primitives/tooltip/shared';

export type PopupState = {
	open: boolean;
};

export type PopupProps = useRender.ComponentProps<'div', PopupState>;

/**
 * style entry with `@starting-style` and exit with `[data-closed]`; unmounting waits for transitions.
 * `--transform-origin` points toward the trigger.
 *
 * @param props content and element props
 * @returns the popup element; a `<div>` by default
 */
export const Popup = ({ render, ref, ...elementProps }: PopupProps) => {
	const { open, disableHoverablePopup, setOpen, timeout } = useRootContext();

	let internalProps: HTMLAttributes<HTMLDivElement> = {};
	if (!disableHoverablePopup) {
		internalProps = {
			onPointerEnter() {
				timeout.clear();
			},
			onPointerLeave(event) {
				if (isMouseLike(event)) {
					timeout.start(HOVERABLE_GRACE, () => setOpen(false, 'trigger-hover', event.nativeEvent));
				}
			},
		};
	}

	return useRender({
		render,
		ref,
		state: { open },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>(internalProps, elementProps),
	});
};
