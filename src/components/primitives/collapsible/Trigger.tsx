'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { INTERACTIVE_SELECTOR } from '#/lib/browser/interactive';

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import * as styles from './collapsible.css';
import { useRootContext } from './shared';

export type TriggerProps = RenderProps<'summary'>;

const PRESS_OWNER_SELECTOR = `${INTERACTIVE_SELECTOR}, input, label`;

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
		tag: 'summary',
		render,
		refs: [ref],
		props: mergeProps<'summary'>(
			dataAttributes({ 'panel-open': open, disabled }),
			internalProps,
			elementProps,
		),
	});
};
