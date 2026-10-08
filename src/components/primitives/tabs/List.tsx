'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { CompositeProvider, useCompositeRoot } from '../composite';
import { ListContext, type Orientation, useRootContext } from './shared';

export type ListState = {
	orientation: Orientation;
};

export type ListProps = useRender.ComponentProps<'div', ListState> & {
	/** selects tabs as arrow keys focus them, rather than on Enter or Space. */
	activateOnFocus?: boolean;
	/**
	 * wraps focus at either end.
	 *
	 * @default true
	 */
	loopFocus?: boolean;
};

/**
 * provides arrow-key navigation and a single tab stop for tabs.
 *
 * @param props behavior and element props
 * @returns the list element; a `<div>` by default
 * @throws if rendered outside `Root`
 */
export const List = ({
	render,
	ref,
	activateOnFocus = false,
	loopFocus = true,
	...elementProps
}: ListProps) => {
	const { orientation } = useRootContext();
	const composite = useCompositeRoot({ orientation, loopFocus, homeEnd: true, tabbable: true });

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		role: 'tablist',
		'aria-orientation': orientation === 'vertical' ? orientation : undefined,
		...composite.props,
	};

	const element = useRender({
		render,
		ref,
		state: { orientation },
		props: mergeProps<'div'>(internalProps, elementProps),
	});

	return (
		<ListContext.Provider value={{ activateOnFocus }}>
			<CompositeProvider value={composite.context}>{element}</CompositeProvider>
		</ListContext.Provider>
	);
};
