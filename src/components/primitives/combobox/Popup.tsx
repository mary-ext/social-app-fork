'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type PopupProps = RenderProps<'div'>;

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
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(getOpenAttributes(expanded), internalProps, elementProps),
	});
};
