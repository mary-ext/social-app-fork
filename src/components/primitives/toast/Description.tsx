'use no memo';

import { useRender } from '@base-ui/react/use-render';

import { useLabel } from './use-label';

export type DescriptionProps = useRender.ComponentProps<'p'>;

/**
 * sets the toast's accessible description, using children or the toast's `description`.
 *
 * @param props element props
 * @returns a `<p>` by default, or `null` for nullish, false, or empty-string content
 */
export const Description = ({ render, ref, children, ...elementProps }: DescriptionProps) => {
	const label = useLabel('description', children);

	const element = useRender({
		render,
		ref,
		defaultTagName: 'p',
		props: { ...elementProps, id: label.id, children: label.children },
	});

	return label.present ? element : null;
};
