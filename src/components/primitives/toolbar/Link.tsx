'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useCompositeItem } from '../composite';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type LinkProps = RenderProps<'a'>;

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
		tag: 'a',
		render,
		refs: [ref],
		props: mergeProps<'a'>(dataAttributes({ orientation }), item, elementProps),
	});
};
