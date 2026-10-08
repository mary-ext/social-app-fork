'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { GroupContext, type Orientation, useRootContext, useToolbarDisabled } from './shared';

export type GroupState = {
	disabled: boolean;
	orientation: Orientation;
};

export type GroupProps = useRender.ComponentProps<'div', GroupState> & {
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
		render,
		ref,
		state: { disabled, orientation },
		props: mergeProps<'div'>({ role: 'group' }, elementProps),
	});

	return <GroupContext.Provider value={disabled}>{element}</GroupContext.Provider>;
};
