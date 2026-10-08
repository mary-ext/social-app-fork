'use no memo';

import { type HTMLAttributes, useLayoutEffect } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { isMouseLike } from '#/lib/browser/input-modality';

import { openStateAttributes } from '../presence';
import { useRootContext } from './shared';

export type PopupState = {
	open: boolean;
};

export type PopupProps = useRender.ComponentProps<'div', PopupState>;

/**
 * renders preview card content, reachable by Tab from the trigger.
 *
 * @param props content and element props
 * @returns the popup element; a `<div>` by default
 */
export const Popup = ({ render, ref, ...elementProps }: PopupProps) => {
	const { open, blockedRef, triggerRef, positionerRef, startHoverClose, timeout } = useRootContext();

	// restore focus before the positioner becomes inert; suppress the resulting focus-open request.
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
		render,
		ref,
		state: { open },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>(internalProps, elementProps),
	});
};
