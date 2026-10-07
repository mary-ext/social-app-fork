'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useMenuItem } from './use-menu-item';

export type ItemState = {
	/** whether the item has focus. */
	highlighted: boolean;
	disabled: boolean;
};

export type ItemProps = useRender.ComponentProps<'div', ItemState> & {
	/** text matched by typeahead; defaults to the item's text content. */
	label?: string;
	disabled?: boolean;
	/** closes the menu after a press; defaults to `true`. */
	closeOnClick?: boolean;
};

/**
 * an action that runs `onClick` on press, Enter or Space.
 *
 * @param props behavior and element props
 * @returns the item element; a `<div>` by default
 */
export const Item = ({
	render,
	ref,
	label,
	disabled = false,
	closeOnClick = true,
	...elementProps
}: ItemProps) => {
	const item = useMenuItem({ label, disabled, closeOnClick });

	return useRender({
		render,
		ref,
		state: { highlighted: item.highlighted, disabled },
		props: mergeProps<'div'>({ role: 'menuitem' }, item.props, elementProps, item.guardProps),
	});
};
