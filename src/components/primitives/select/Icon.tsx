'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { openStateAttributes } from '../presence';
import { useRootContext } from './shared';

export type IconProps = useRender.ComponentProps<'span', { open: boolean }>;

/**
 * renders a decorative trigger icon, hidden from assistive technology.
 *
 * @param props element props
 * @returns the icon element; a `<span>` by default
 */
export const Icon = ({ render, ref, ...elementProps }: IconProps) => {
	const { open } = useRootContext();
	return useRender({
		render,
		ref,
		defaultTagName: 'span',
		state: { open },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'span'>({ 'aria-hidden': true }, elementProps),
	});
};
