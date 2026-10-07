'use no memo'; // composition props usually invalidate the generated wrapper caches

import { Root as ComboboxRoot, type RootProps as ComboboxRootProps } from '../combobox/Root';
import type { InputValueChangeDetails } from '../combobox/shared';

export type RootProps<Item> = Omit<
	ComboboxRootProps<Item>,
	'inputValue' | 'isItemEqualToValue' | 'multiple' | 'onInputValueChange' | 'onValueChange' | 'value'
> & {
	value: string;
	/** alias of {@link ComboboxRootProps.onInputValueChange}. */
	onValueChange: (value: string, details: InputValueChangeDetails) => void;
};

/**
 * combobox without selection; handle item activation through `onItemPress` or each item's `onClick`.
 *
 * @param props autocomplete parts, items, and input text
 * @returns the autocomplete parts without a wrapper element
 */
export const Root = <Item,>({ value, onValueChange, ...props }: RootProps<Item>) => {
	return <ComboboxRoot {...props} inputValue={value} onInputValueChange={onValueChange} />;
};
