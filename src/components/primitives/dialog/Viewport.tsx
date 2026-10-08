'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type DialogHTMLAttributes, type Ref, useRef } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { getReturnFocusChain } from '../focus';
import { openStateAttributes, useInertWhileClosed, useTransitionsSettled } from '../presence';
import { getDialogProps, showModalInTopLayer, useModalSurface } from '../top-layer';
import * as styles from './dialog.css';
import { useRootContext } from './shared';

export type ViewportState = {
	open: boolean;
};

export type ViewportProps = Omit<useRender.ComponentProps<'dialog', ViewportState>, 'ref'> & {
	ref?: Ref<HTMLDialogElement>;
};

/**
 * renders `Backdrop` and `Popup` in a full-screen top-layer modal, without a portal. backdrop and empty
 * viewport presses close it unless pointer dismissal is disabled. keep it untransformed for hosted toasts;
 * enable scrolling for content taller than the screen.
 *
 * @param props element props
 * @returns the viewport element; a `<dialog>` by default, or `null` while unmounted
 */
export const Viewport = (props: ViewportProps) => {
	const { mounted } = useRootContext();
	return mounted ? <MountedViewport {...props} /> : null;
};

const MountedViewport = ({ render, ref, ...elementProps }: ViewportProps) => {
	const {
		open,
		activeTrigger,
		viewportRef,
		backdropRef,
		returnFocusRef,
		disablePointerDismissal,
		setOpen,
		onTransitionSettled,
	} = useRootContext();
	const pressedOutsideRef = useRef(false);

	// capture the opener before `showModal()` moves focus.
	const captureReturnFocus = (el: HTMLDialogElement | null): void => {
		if (!open || !el || el.open) {
			return;
		}
		const opener = activeTrigger ?? document.activeElement;
		returnFocusRef.current =
			opener instanceof HTMLElement && opener !== document.body ? getReturnFocusChain(opener) : [];
	};

	useTransitionsSettled(viewportRef, open, onTransitionSettled);
	useInertWhileClosed(viewportRef, open);
	useModalSurface(viewportRef, open);

	// toasts are outside the popup too, but must not dismiss the dialog.
	const isOutside = (target: EventTarget | null): boolean => {
		return (
			target === viewportRef.current || (target instanceof Node && !!backdropRef.current?.contains(target))
		);
	};

	const internalProps: DialogHTMLAttributes<HTMLDialogElement> = {
		...getDialogProps(open, (event) => setOpen(false, { reason: 'escape-key', event })),
		className: styles.viewport,
	};
	if (!disablePointerDismissal) {
		// wait for a complete outside press so drags that leave the popup don't dismiss.
		internalProps.onPointerDown = (event) => {
			pressedOutsideRef.current = event.button === 0 && isOutside(event.target);
		};
		internalProps.onClick = (event) => {
			if (pressedOutsideRef.current && isOutside(event.target)) {
				setOpen(false, { reason: 'outside-press', event: event.nativeEvent });
			}
			pressedOutsideRef.current = false;
		};
	}

	return useRender({
		render,
		defaultTagName: 'dialog',
		ref: [ref ?? null, viewportRef, captureReturnFocus, showModalInTopLayer(open)],
		state: { open },
		stateAttributesMapping: openStateAttributes,
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'dialog'>(internalProps, elementProps),
	});
};
