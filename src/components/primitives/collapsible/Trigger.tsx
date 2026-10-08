'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { INTERACTIVE_SELECTOR } from '#/lib/browser/interactive';

import * as styles from './collapsible.css';
import { useRootContext } from './shared';

export type TriggerState = {
	open: boolean;
	disabled: boolean;
};

export type TriggerProps = useRender.ComponentProps<'summary', TriggerState>;

const panelTriggerStateAttributes = {
	open: (open: boolean): Record<string, string> | null => (open ? { 'data-panel-open': '' } : null),
};

const PRESS_OWNER_SELECTOR = `${INTERACTIVE_SELECTOR}, input, label, summary`;

/**
 * toggles the panel unless a nested control handles the press or `onClick` calls `preventDefault()`.
 *
 * @param props element props
 * @returns the trigger element; must remain a `<summary>`
 */
export const Trigger = ({ render, ref, ...elementProps }: TriggerProps) => {
	const { open, disabled, setOpen } = useRootContext();

	const internalProps: HTMLAttributes<HTMLElement> = {
		className: styles.trigger,
		'aria-disabled': disabled || undefined,
		onClick(event) {
			if (event.defaultPrevented) {
				return;
			}

			const target = event.target instanceof Element ? event.target : null;
			if (target?.closest(PRESS_OWNER_SELECTOR) !== event.currentTarget) {
				return;
			}

			// native toggling would bypass controlled state and cancellation.
			event.preventDefault();
			setOpen(!open, event.nativeEvent);
		},
	};

	return useRender({
		render,
		defaultTagName: 'summary',
		ref,
		state: { open, disabled },
		stateAttributesMapping: panelTriggerStateAttributes,
		props: mergeProps<'summary'>(internalProps, elementProps),
	});
};
