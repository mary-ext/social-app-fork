'use no memo'; // composition props usually invalidate the generated wrapper caches

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { GroupContext, useRootContext, useToolbarDisabled } from './shared';

export type GroupProps = RenderProps<'div'> & {
	/** disables every item in the group. */
	disabled?: boolean;
};

/**
 * groups related toolbar items without adding a tab stop.
 *
 * @param props behavior and element props
 * @returns the group element; a `<div>` by default
 * @throws if rendered outside `Root`
 */
export const Group = ({ render, ref, disabled: disabledProp = false, ...elementProps }: GroupProps) => {
	const { orientation } = useRootContext();
	const disabled = useToolbarDisabled() || disabledProp;

	const element = useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(dataAttributes({ disabled, orientation }), { role: 'group' }, elementProps),
	});

	return <GroupContext.Provider value={disabled}>{element}</GroupContext.Provider>;
};
