'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { isMouseLike } from '#/lib/browser/input-modality';

import { HOVERABLE_GRACE } from '../anchored-popup';
import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type PopupProps = RenderProps<'div'>;

/**
 * renders tooltip content.
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
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(getOpenAttributes(open), internalProps, elementProps),
	});
};
