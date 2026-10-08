'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useLayoutEffect } from 'react';

import { useRender } from '@base-ui/react/use-render';

import { useRootContext } from './shared';

export type TitleProps = useRender.ComponentProps<'h2'>;

/**
 * names the dialog.
 *
 * @param props element props
 * @returns the title element; an `<h2>` by default
 */
export const Title = ({ render, ref, ...elementProps }: TitleProps) => {
	const { titleId, registerLabel } = useRootContext();

	useLayoutEffect(() => registerLabel('title'), [registerLabel]);

	return useRender({
		render,
		ref,
		defaultTagName: 'h2',
		props: { ...elementProps, id: titleId },
	});
};
