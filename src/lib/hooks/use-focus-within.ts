import { type FocusEvent, useState } from 'react';

/**
 * tracks focus within an element, including its descendants.
 *
 * @returns `focusWithin` state and `focusProps` to spread onto the element
 */
export function useFocusWithin() {
	const [focusWithin, setFocusWithin] = useState(false);

	const onFocus = () => {
		setFocusWithin(true);
	};

	const onBlur = (ev: FocusEvent<HTMLElement>) => {
		if (!(ev.relatedTarget instanceof Node && ev.currentTarget.contains(ev.relatedTarget))) {
			setFocusWithin(false);
		}
	};

	return { focusWithin, focusProps: { onBlur, onFocus } };
}
