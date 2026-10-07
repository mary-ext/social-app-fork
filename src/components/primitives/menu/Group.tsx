'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useId, useMemo, useState } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { GroupContext, type GroupContextValue } from './shared';

export type GroupProps = useRender.ComponentProps<'div'>;

/**
 * groups related items, named by an optional `GroupLabel`.
 *
 * @param props element props
 * @returns the group element; a `<div>` by default
 */
export const Group = ({ render, ref, ...elementProps }: GroupProps) => {
	const labelId = useId();
	const [labelled, setLabelled] = useState(false);

	const ctx = useMemo(
		(): GroupContextValue => ({
			labelId,
			registerLabel() {
				setLabelled(true);
				return () => {
					setLabelled(false);
				};
			},
		}),
		[labelId],
	);

	const element = useRender({
		render,
		ref,
		props: mergeProps<'div'>(
			{ role: 'group', 'aria-labelledby': labelled ? labelId : undefined },
			elementProps,
		),
	});

	return <GroupContext value={ctx}>{element}</GroupContext>;
};
