'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useCompositeItem } from '../composite';
import { type Orientation, useRootContext } from './shared';

export type LinkState = {
	orientation: Orientation;
};

export type LinkProps = useRender.ComponentProps<'a', LinkState>;

/**
 * a link in the toolbar's navigation; unaffected by the toolbar's disabled state.
 *
 * @param props element props
 * @returns the link element; an `<a>` by default
 * @throws if rendered outside `Root`
 */
export const Link = ({ render, ref, ...elementProps }: LinkProps) => {
	const { orientation } = useRootContext();
	const item = useCompositeItem({ active: false, disabled: false });

	return useRender({
		render,
		defaultTagName: 'a',
		ref,
		state: { orientation },
		props: mergeProps<'a'>(item, elementProps),
	});
};
