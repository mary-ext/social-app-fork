'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type DialogHTMLAttributes, type Ref, type RefObject, useLayoutEffect, useRef } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { openStateAttributes, useInertWhileClosed, useTransitionsSettled } from '../presence';
import { getDialogProps, pushModalSurface, showModalInTopLayer } from '../top-layer';
import * as styles from './drawer.css';
import { useRootContext } from './shared';
import { useSwipeDismiss } from './use-swipe-dismiss';

export type ViewportState = {
	open: boolean;
};

export type ViewportProps = Omit<useRender.ComponentProps<'dialog', ViewportState>, 'ref'> & {
	ref?: Ref<HTMLDialogElement>;
};

/**
 * renders a full-screen modal containing `Backdrop` and `Popup`. pressing the backdrop or empty viewport
 * closes the drawer. keep this element untransformed so hosted toasts stay viewport-relative.
 *
 * @param props element props
 * @returns the viewport element; a `<dialog>` by default, or `null` while unmounted
 */
export const Viewport = (props: ViewportProps) => {
	const { mounted } = useRootContext();
	return mounted ? <MountedViewport {...props} /> : null;
};

const MountedViewport = ({ render, ref, ...elementProps }: ViewportProps) => {
	const ctx = useRootContext();
	const { open, viewportRef, backdropRef, setOpen, onTransitionSettled } = ctx;
	const pressedOutsideRef = useRef(false);

	useTransitionsSettled(viewportRef, open, onTransitionSettled);
	useInertWhileClosed(viewportRef, open);
	useSwipeDismiss(ctx);
	useModalSurface(viewportRef, open);

	// toasts are outside the popup too, but must not dismiss the drawer.
	const isOutside = (target: EventTarget | null): boolean => {
		return (
			target === viewportRef.current || (target instanceof Node && !!backdropRef.current?.contains(target))
		);
	};

	const internalProps: DialogHTMLAttributes<HTMLDialogElement> = {
		...getDialogProps(open, (event) => setOpen(false, { reason: 'escape-key', event })),
		className: styles.viewport,
		// wait for a complete outside press so drags that leave the popup don't dismiss.
		onPointerDown(event) {
			pressedOutsideRef.current = isOutside(event.target);
		},
		onClick(event) {
			if (pressedOutsideRef.current && isOutside(event.target)) {
				setOpen(false, { reason: 'outside-press', event: event.nativeEvent });
			}
			pressedOutsideRef.current = false;
		},
	};

	return useRender({
		render,
		defaultTagName: 'dialog',
		ref: [ref ?? null, viewportRef, showModalInTopLayer(open)],
		state: { open },
		stateAttributesMapping: openStateAttributes,
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'dialog'>(internalProps, elementProps),
	});
};

const useModalSurface = (ref: RefObject<HTMLDialogElement | null>, open: boolean): void => {
	const releaseRef = useRef<(() => void) | null>(null);

	// release after the popup ends modality; cleanup would move toasts out while the viewport is still modal.
	useLayoutEffect(() => {
		if (open && ref.current) {
			releaseRef.current ??= pushModalSurface(ref.current);
		} else {
			releaseRef.current?.();
			releaseRef.current = null;
		}
	}, [open, ref]);

	useLayoutEffect(() => {
		return () => {
			releaseRef.current?.();
			releaseRef.current = null;
		};
	}, []);
};
