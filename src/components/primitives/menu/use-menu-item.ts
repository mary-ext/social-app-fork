import type { HTMLAttributes, MouseEvent } from 'react';

import { listItemProps, useItemHighlight } from '../list-navigation';
import type { PrimitiveEvent } from '../merge-props';
import { useRootContext } from './shared';

export type MenuItemOptions = {
	label: string | undefined;
	disabled: boolean;
	closeOnClick: boolean;
};

const disabledGuard = {
	onClick(event: PrimitiveEvent<MouseEvent<HTMLElement>>) {
		event.preventDefault();
		event.preventPrimitiveHandler();
	},
};

/**
 * handles menu item activation and highlighting. Enter and Space dispatch clicks, including for links.
 *
 * @param options item behavior
 * @returns highlight state, `props` to merge before consumer props, and `guardProps` to merge after them to
 *   suppress disabled clicks
 */
export const useMenuItem = ({
	label,
	disabled,
	closeOnClick,
}: MenuItemOptions): {
	highlighted: boolean;
	props: HTMLAttributes<HTMLElement>;
	guardProps: typeof disabledGuard | undefined;
} => {
	const { setOpen } = useRootContext();
	const { highlighted, highlightProps } = useItemHighlight();

	const props: HTMLAttributes<HTMLElement> = {
		...listItemProps(label),
		...highlightProps,
		'aria-disabled': disabled || undefined,
		onClick(event) {
			if (closeOnClick) {
				setOpen(false, { reason: 'item-press', event: event.nativeEvent });
			}
		},
		onKeyDown(event) {
			if (event.defaultPrevented || event.repeat || event.target !== event.currentTarget) {
				return;
			}
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				event.currentTarget.click();
			}
		},
	};

	return { highlighted, props, guardProps: disabled ? disabledGuard : undefined };
};
