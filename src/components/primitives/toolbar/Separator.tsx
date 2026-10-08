'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { type Orientation, useRootContext } from './shared';

export type SeparatorState = {
	orientation: Orientation;
};

export type SeparatorProps = useRender.ComponentProps<'div', SeparatorState> & {
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
		render,
		ref,
		state: { orientation },
		props: mergeProps<'div'>(internalProps, elementProps),
	});
};
