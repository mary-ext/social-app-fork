'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { CONTENT_ATTRIBUTE } from './shared';

export type ContentProps = RenderProps<'div'>;

/**
 * preserves mouse text selection inside the drawer; touch can still swipe.
 *
 * @param props element props
 * @returns the content element; a `<div>` by default
 */
export const Content = ({ render, ref, ...elementProps }: ContentProps) => {
	return useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>({ [CONTENT_ATTRIBUTE]: '' }, elementProps),
	});
};
