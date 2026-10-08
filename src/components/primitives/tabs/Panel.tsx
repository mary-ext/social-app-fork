'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useEffect, useLayoutEffect, useRef } from 'react';

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { type TabValue, useRootContext } from './shared';

export type PanelProps = Omit<RenderProps<'div'>, 'hidden' | 'id'> & {
	/** pairs the panel with the tab of the same value. */
	value: TabValue;
	/** keeps the panel mounted while hidden, so find-in-page can reveal it. */
	keepMounted?: boolean;
};

/**
 * shows content while its tab is selected.
 *
 * @param props value and element props
 * @returns the panel element; a `<div>` by default, or `null` while hidden and unmounted
 * @throws if rendered outside `Root`
 */
export const Panel = ({ render, ref, value, keepMounted = false, ...elementProps }: PanelProps) => {
	const { value: selected, orientation, getTabId, getPanelId, setValue } = useRootContext();
	const open = value === selected;
	const panelRef = useRef<HTMLDivElement | null>(null);

	// JSX types `hidden` as a boolean.
	useLayoutEffect(() => {
		const panel = panelRef.current;
		if (!panel) {
			return;
		}
		if (open) {
			panel.removeAttribute('hidden');
		} else {
			panel.setAttribute('hidden', 'until-found');
		}
	}, [open]);

	useEffect(() => {
		const panel = panelRef.current;
		if (!panel || open) {
			return;
		}
		const onBeforeMatch = (event: Event) => {
			setValue(value, event);
		};
		panel.addEventListener('beforematch', onBeforeMatch);
		return () => {
			panel.removeEventListener('beforematch', onBeforeMatch);
		};
	}, [open, setValue, value]);

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		role: 'tabpanel',
		id: getPanelId(value),
		tabIndex: open ? 0 : -1,
		'aria-labelledby': getTabId(value),
	};

	const element = useRender({
		tag: 'div',
		render,
		refs: [ref, panelRef],
		props: mergeProps<'div'>(dataAttributes({ hidden: !open, orientation }), internalProps, elementProps),
	});

	return open || keepMounted ? element : null;
};
