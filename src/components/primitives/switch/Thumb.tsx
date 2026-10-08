'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useRender } from '@base-ui/react/use-render';

import { checkedStateAttributes } from '../native-input';
import { type SwitchState, useSwitchContext } from './shared';

export type ThumbState = SwitchState;

export type ThumbProps = useRender.ComponentProps<'span', ThumbState>;

/**
 * the switch's movable part.
 *
 * @param props element props
 * @returns the thumb element; a `<span>` by default
 * @throws if rendered outside `Root`
 */
export const Thumb = ({ render, ref, ...elementProps }: ThumbProps) => {
	const state = useSwitchContext();

	return useRender({
		render,
		defaultTagName: 'span',
		ref,
		state,
		stateAttributesMapping: checkedStateAttributes,
		props: elementProps,
	});
};
