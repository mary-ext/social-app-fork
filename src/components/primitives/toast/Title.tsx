'use no memo';

import { type RenderProps, useRender } from '../render';
import { useLabel } from './use-label';

export type TitleProps = RenderProps<'h2'>;

/**
 * sets the toast's accessible name, using children or the toast's `title`.
 *
 * @param props element props
 * @returns an `<h2>` by default, or `null` for nullish, false, or empty-string content
 */
export const Title = ({ render, ref, children, ...elementProps }: TitleProps) => {
	const label = useLabel('title', children);

	const element = useRender({
		tag: 'h2',
		render,
		refs: [ref],
		props: { ...elementProps, id: label.id, children: label.children },
	});

	return label.present ? element : null;
};
