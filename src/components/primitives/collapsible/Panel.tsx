'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { getOpenAttributes, useTransitionsSettled } from '../presence';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type PanelProps = RenderProps<'div'>;

/**
 * unmounts content after `Root`'s close transitions. `[data-closed]` marks the closing phase.
 *
 * @param props content and element props
 * @returns the panel element; a `<div>` by default, or `null` while unmounted
 */
export const Panel = (props: PanelProps) => {
	const { mounted } = useRootContext();
	return mounted ? <MountedPanel {...props} /> : null;
};

const MountedPanel = ({ render, ref, ...elementProps }: PanelProps) => {
	const { open, rootRef, onTransitionSettled } = useRootContext();

	useTransitionsSettled(rootRef, open, onTransitionSettled, '::details-content');

	return useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(getOpenAttributes(open), elementProps),
	});
};
