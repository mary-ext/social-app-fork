'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { CompositeProvider, useCompositeRoot } from '../composite';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { type Orientation, RootContext, type RootContextValue } from './shared';

export type RootProps = RenderProps<'div'> & {
	/** disables every item; buttons stay focusable unless they opt out. */
	disabled?: boolean;
	/** @default 'horizontal' */
	orientation?: Orientation;
	/**
	 * wraps focus at either end.
	 *
	 * @default true
	 */
	loopFocus?: boolean;
	/**
	 * includes the toolbar in the tab order; `false` still allows programmatic focus and arrow navigation.
	 *
	 * @default true
	 */
	tabbable?: boolean;
};

/**
 * groups controls under a single tab stop; arrow keys along `orientation` move between items.
 *
 * @param props parts, behavior, and element props
 * @returns the toolbar element; a `<div>` by default
 */
export const Root = ({
	render,
	ref,
	disabled = false,
	orientation = 'horizontal',
	loopFocus = true,
	tabbable = true,
	...elementProps
}: RootProps) => {
	const composite = useCompositeRoot({ orientation, loopFocus, homeEnd: false, tabbable });

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		role: 'toolbar',
		'aria-orientation': orientation,
		...composite.props,
	};

	const value: RootContextValue = { orientation, disabled };

	const element = useRender({
		tag: 'div',
		render,
		refs: [ref, composite.setRoot],
		props: mergeProps<'div'>(dataAttributes({ disabled, orientation }), internalProps, elementProps),
	});

	return (
		<RootContext.Provider value={value}>
			<CompositeProvider value={composite.context}>{element}</CompositeProvider>
		</RootContext.Provider>
	);
};
