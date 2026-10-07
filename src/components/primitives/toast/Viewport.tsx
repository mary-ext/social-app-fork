'use no memo';

import { type HTMLAttributes, useEffect, useRef } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { isMouseLike } from '#/lib/browser/input-modality';

import { expandedStateAttributes, useProviderContext } from './shared';

export type ViewportState = {
	expanded: boolean;
};

export type ViewportProps = useRender.ComponentProps<'div', ViewportState> & {
	/** localized name of the region. */
	'aria-label': string;
};

/**
 * renders a polite live region in the top layer. F6 focuses the newest open toast.
 *
 * @param props element props
 * @returns the viewport element; a `<div>` by default
 */
export const Viewport = ({ render, ref, ...elementProps }: ViewportProps) => {
	const { manager, toasts, expanded, setFocused, setHovering } = useProviderContext();
	const viewportRef = useRef<HTMLDivElement>(null);

	const frontmostHeight = toasts[0]?.height;

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		// keep the empty live region visible so additions are announced.
		viewport.showPopover();

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'F6' && !viewport.contains(document.activeElement) && manager.focusFrontmost()) {
				event.preventDefault();
			}
		};

		// touch has no pointer leave; an outside touch collapses the stack.
		const onPointerDown = (event: PointerEvent) => {
			if (
				event.pointerType === 'touch' &&
				!(event.target instanceof Node && viewport.contains(event.target))
			) {
				setHovering(false);
			}
		};

		window.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown, true);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown, true);
		};
	}, [manager, setHovering]);

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		popover: 'manual',
		role: 'region',
		tabIndex: -1,
		'aria-live': 'polite',
		'aria-atomic': false,
		'aria-relevant': 'additions text',
		onPointerEnter(event) {
			if (isMouseLike(event)) {
				setHovering(true);
			}
		},
		onPointerMove(event) {
			// pointer enter does not fire if the stack emptied under a resting pointer.
			if (isMouseLike(event) && !expanded) {
				setHovering(true);
			}
		},
		onPointerLeave(event) {
			if (isMouseLike(event)) {
				setHovering(false);
			}
		},
		onPointerDown(event) {
			if (event.pointerType === 'touch') {
				setHovering(true);
			}
		},
		onFocus(event) {
			if (event.target.matches(':focus-visible')) {
				setFocused(true);
			}
		},
		onBlur(event) {
			if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
				setFocused(false);
			}
		},
		style: {
			'--toast-frontmost-height': frontmostHeight ? `${frontmostHeight}px` : undefined,
		},
	};

	return useRender({
		render,
		ref: [ref ?? null, viewportRef],
		state: { expanded },
		stateAttributesMapping: expandedStateAttributes,
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'div'>(internalProps, elementProps),
	});
};
