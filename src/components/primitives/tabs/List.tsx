'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { CompositeProvider, useCompositeRoot } from '../composite';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { ListContext, useRootContext } from './shared';

export type ListProps = RenderProps<'div'> & {
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
		tag: 'div',
		render,
		refs: [ref, composite.setRoot],
		props: mergeProps<'div'>(dataAttributes({ orientation }), internalProps, elementProps),
	});

	return (
		<ListContext.Provider value={{ activateOnFocus }}>
			<CompositeProvider value={composite.context}>{element}</CompositeProvider>
		</ListContext.Provider>
	);
};
