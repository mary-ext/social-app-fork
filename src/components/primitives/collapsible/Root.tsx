'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type DetailsHTMLAttributes, useRef } from 'react';

import { useControlled } from '@base-ui/utils/useControlled';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { createChangeDetails } from '../change-details';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { getOpenAttributes, usePresence } from '../presence';
import { type RenderProps, useRender } from '../render';
import * as styles from './collapsible.css';
import { type OpenChangeDetails, RootContext, type RootContextValue } from './shared';

// native `name` groups would close siblings without updating React state.
export type RootProps = Omit<RenderProps<'details'>, 'name' | 'open'> & {
	/** controlled open state. */
	open?: boolean;
	/** initial uncontrolled open state. */
	defaultOpen?: boolean;
	/** receives cancellable open/close requests. */
	onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
	/** ignores presses on the trigger. */
	disabled?: boolean;
};

/**
 * groups the disclosure parts; `Trigger` must be first. to animate `block-size`, set transition duration and
 * easing on `::details-content`.
 *
 * @param props parts, open state, and element props
 * @returns the root element; must remain a `<details>`
 */
export const Root = ({
	render,
	ref,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	disabled = false,
	...elementProps
}: RootProps) => {
	const [open, setOpenState] = useControlled({
		controlled: openProp,
		default: defaultOpen,
		name: 'Collapsible',
		state: 'open',
	});

	const rootRef = useRef<HTMLDetailsElement | null>(null);
	const { mounted, onTransitionSettled } = usePresence(open, undefined);

	const setOpen = useNonReactiveCallback((next: boolean, event: Event) => {
		if (next === open || disabled) {
			return false;
		}

		const details = createChangeDetails('none', event);
		onOpenChange?.(next, details);
		if (details.isCanceled) {
			return false;
		}

		setOpenState(next);
		return true;
	});

	const internalProps: DetailsHTMLAttributes<HTMLDetailsElement> = {
		className: styles.root,
		open,
	};

	const value: RootContextValue = { open, disabled, mounted, rootRef, setOpen, onTransitionSettled };

	const element = useRender({
		tag: 'details',
		render,
		refs: [ref, rootRef],
		props: mergeProps<'details'>(
			getOpenAttributes(open),
			dataAttributes({ disabled }),
			internalProps,
			elementProps,
		),
	});

	return <RootContext.Provider value={value}>{element}</RootContext.Provider>;
};
