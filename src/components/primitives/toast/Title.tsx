'use no memo';

import { useRender } from '@base-ui/react/use-render';

import { useLabel } from './use-label';

export type TitleProps = useRender.ComponentProps<'h2'>;

/**
 * sets the toast's accessible name, using children or the toast's `title`.
 *
 * @param props element props
 * @returns an `<h2>` by default, or `null` for nullish, false, or empty-string content
 */
export const Title = ({ render, ref, children, ...elementProps }: TitleProps) => {
	const label = useLabel('title', children);

	const element = useRender({
		render,
		ref,
		defaultTagName: 'h2',
		props: { ...elementProps, id: label.id, children: label.children },
	});

	return label.present ? element : null;
};
