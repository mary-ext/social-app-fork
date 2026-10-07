'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { openStateAttributes } from '../anchored-popup';
import { useRootContext } from './shared';

export type PopupState = {
	open: boolean;
};

export type PopupProps = useRender.ComponentProps<'div', PopupState>;

/**
 * the popup's visible container. presses inside it keep focus on the input.
 *
 * @param props element props
 * @returns the popup element; a `<div>` by default
 */
export const Popup = ({ render, ref, ...elementProps }: PopupProps) => {
	const { expanded } = useRootContext();

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		onMouseDown(event) {
			event.preventDefault();
		},
	};

	return useRender({
		render,
		ref,
		state: { open: expanded },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>(internalProps, elementProps),
	});
};
