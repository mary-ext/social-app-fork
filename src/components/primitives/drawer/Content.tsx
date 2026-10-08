'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useRender } from '@base-ui/react/use-render';

import { CONTENT_ATTRIBUTE } from './shared';

export type ContentProps = useRender.ComponentProps<'div'>;

/**
 * preserves mouse text selection inside the drawer; touch can still swipe.
 *
 * @param props element props
 * @returns the content element; a `<div>` by default
 */
export const Content = ({ render, ref, ...elementProps }: ContentProps) => {
	return useRender({
		render,
		ref,
		props: { [CONTENT_ATTRIBUTE]: '', ...elementProps },
	});
};
