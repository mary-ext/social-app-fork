'use no memo'; // composition props usually invalidate the generated wrapper caches

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useMenuItem } from './use-menu-item';

export type ItemProps = RenderProps<'div'> & {
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
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(
			dataAttributes({ highlighted: item.highlighted, disabled }),
			{ role: 'menuitem' },
			item.props,
			elementProps,
			item.guardProps,
		),
	});
};
