'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useRender } from '@base-ui/react/use-render';

import { openStateAttributes, useTransitionsSettled } from '../presence';
import { useRootContext } from './shared';

export type PanelState = {
	open: boolean;
};

export type PanelProps = useRender.ComponentProps<'div', PanelState>;

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
		render,
		ref,
		state: { open },
		stateAttributesMapping: openStateAttributes,
		props: elementProps,
	});
};
