'use no memo';

import { type RenderProps, useRender } from '../render';
import { useLabel } from './use-label';

export type DescriptionProps = RenderProps<'p'>;

/**
 * sets the toast's accessible description, using children or the toast's `description`.
 *
 * @param props element props
 * @returns a `<p>` by default, or `null` for nullish, false, or empty-string content
 */
export const Description = ({ render, ref, children, ...elementProps }: DescriptionProps) => {
	const label = useLabel('description', children);

	const element = useRender({
		tag: 'p',
		render,
		refs: [ref],
		props: { ...elementProps, id: label.id, children: label.children },
	});

	return label.present ? element : null;
};
