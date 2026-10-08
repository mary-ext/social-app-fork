'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useRef } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { openStateAttributes, useInertWhileClosed, usePresence, useTransitionsSettled } from '../presence';
import * as styles from './collapsible.css';

export type StandaloneState = {
	open: boolean;
};

export type StandaloneProps = useRender.ComponentProps<'div', StandaloneState> & {
	/** whether the panel is expanded. */
	open: boolean;
};

/**
 * a triggerless panel, inert while closing and unmounted after exit transitions. to animate `block-size`, set
 * transition duration and easing on the panel. `[data-closed]` marks the closing phase.
 *
 * @param props open state, content, and element props
 * @returns the panel element; a `<div>` by default, or `null` while collapsed
 */
export const Standalone = ({ open, ...props }: StandaloneProps) => {
	const { mounted, onTransitionSettled } = usePresence(open, undefined);
	return mounted ? (
		<MountedStandalone {...props} open={open} onTransitionSettled={onTransitionSettled} />
	) : null;
};

const MountedStandalone = ({
	render,
	ref,
	open,
	onTransitionSettled,
	...elementProps
}: StandaloneProps & { onTransitionSettled: (open: boolean) => void }) => {
	const panelRef = useRef<HTMLDivElement | null>(null);

	useTransitionsSettled(panelRef, open, onTransitionSettled);
	useInertWhileClosed(panelRef, open);

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		className: styles.standalone,
	};

	return useRender({
		render,
		ref: [ref ?? null, panelRef],
		state: { open },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>(internalProps, elementProps),
	});
};
