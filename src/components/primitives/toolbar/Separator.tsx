'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { type Orientation, useRootContext } from './shared';

export type SeparatorProps = RenderProps<'div'> & {
	/** defaults to the opposite of the toolbar's orientation. */
	orientation?: Orientation;
};

/**
 * divides toolbar items.
 *
 * @param props element props
 * @returns the separator element; a `<div>` by default
 * @throws if rendered outside `Root`
 */
export const Separator = ({ render, ref, orientation: orientationProp, ...elementProps }: SeparatorProps) => {
	const root = useRootContext();
	const orientation = orientationProp ?? (root.orientation === 'horizontal' ? 'vertical' : 'horizontal');

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		role: 'separator',
		'aria-orientation': orientation,
	};

	return useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(dataAttributes({ orientation }), internalProps, elementProps),
	});
};
