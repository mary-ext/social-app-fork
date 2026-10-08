'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type RenderProps, useRender } from '../render';

export type ItemTextProps = RenderProps<'span'>;

/**
 * @param props element props
 * @returns a wrapper for the item's label; a `<span>` by default
 */
export const ItemText = ({ render, ref, ...elementProps }: ItemTextProps) => {
	return useRender({ tag: 'span', render, refs: [ref], props: elementProps });
};
