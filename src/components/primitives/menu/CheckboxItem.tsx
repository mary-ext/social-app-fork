'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { CheckedContext } from './shared';
import { useMenuItem } from './use-menu-item';

export type CheckboxItemState = {
	checked: boolean;
	/** whether the item has focus. */
	highlighted: boolean;
	disabled: boolean;
};

export type CheckboxItemProps = useRender.ComponentProps<'div', CheckboxItemState> & {
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
		render,
		ref,
		state: { checked, highlighted: item.highlighted, disabled },
		props: mergeProps<'div'>(
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
