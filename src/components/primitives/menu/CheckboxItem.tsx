'use no memo'; // composition props usually invalidate the generated wrapper caches

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { CheckedContext } from './shared';
import { useMenuItem } from './use-menu-item';

export type CheckboxItemProps = RenderProps<'div'> & {
	checked: boolean;
	/** called with the toggled state on press, Enter or Space. */
	onCheckedChange: (checked: boolean) => void;
	/** text matched by typeahead; defaults to the item's text content. */
	label?: string;
	disabled?: boolean;
	/** closes the menu after a press; defaults to `false`. */
	closeOnClick?: boolean;
};

/**
 * a controlled item that toggles a setting.
 *
 * @param props checked state, behavior, and element props
 * @returns the item element; a `<div>` by default
 */
export const CheckboxItem = ({
	render,
	ref,
	checked,
	onCheckedChange,
	label,
	disabled = false,
	closeOnClick = false,
	...elementProps
}: CheckboxItemProps) => {
	const item = useMenuItem({ label, disabled, closeOnClick });

	const element = useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(
			dataAttributes({ checked, highlighted: item.highlighted, disabled }),
			{
				role: 'menuitemcheckbox',
				'aria-checked': checked,
				onClick() {
					onCheckedChange(!checked);
				},
			},
			item.props,
			elementProps,
			item.guardProps,
		),
	});

	return <CheckedContext value={checked}>{element}</CheckedContext>;
};
