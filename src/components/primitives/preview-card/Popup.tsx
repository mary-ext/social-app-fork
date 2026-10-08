'use no memo';

import { type HTMLAttributes, useLayoutEffect } from 'react';

import { isMouseLike } from '#/lib/browser/input-modality';

import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type PopupProps = RenderProps<'div'>;

/**
 * renders preview card content, reachable by Tab from the trigger.
 *
 * @param props content and element props
 * @returns the popup element; a `<div>` by default
 */
export const Popup = ({ render, ref, ...elementProps }: PopupProps) => {
	const { open, blockedRef, triggerRef, positionerRef, startHoverClose, timeout } = useRootContext();

	// restore focus from the closing card; suppress the resulting focus-open request.
	useLayoutEffect(() => {
		if (open || !positionerRef.current?.contains(document.activeElement)) {
			return;
		}
		blockedRef.current = true;
		triggerRef.current?.focus({ preventScroll: true });
	}, [open, blockedRef, triggerRef, positionerRef]);

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		onPointerEnter() {
			timeout.clear();
		},
		onPointerLeave(event) {
			if (isMouseLike(event)) {
				startHoverClose(event.nativeEvent);
			}
		},
	};

	return useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(getOpenAttributes(open), internalProps, elementProps),
	});
};
