'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useLayoutEffect } from 'react';

import { useRender } from '@base-ui/react/use-render';

import { useRootContext } from './shared';

export type DescriptionProps = useRender.ComponentProps<'p'>;

/**
 * describes the dialog.
 *
 * @param props element props
 * @returns the description element; a `<p>` by default
 */
export const Description = ({ render, ref, ...elementProps }: DescriptionProps) => {
	const { descriptionId, registerLabel } = useRootContext();

	useLayoutEffect(() => registerLabel('description'), [registerLabel]);

	return useRender({
		render,
		ref,
		defaultTagName: 'p',
		props: { ...elementProps, id: descriptionId },
	});
};
