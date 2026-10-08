import {
	cloneElement,
	type ComponentPropsWithRef,
	createElement,
	type JSX,
	type ReactElement,
	type Ref,
} from 'react';

import { useMergedRefs } from '#/lib/hooks/use-merged-refs';

import { type MergeableProps, mergeProps } from './merge-props';

type Tag = keyof JSX.IntrinsicElements;

/** primitive element props with an optional replacement element. */
export type RenderProps<T extends Tag> = ComponentPropsWithRef<T> & {
	/**
	 * replaces the default element. props follow {@link mergeProps} precedence, with this element's props last;
	 * refs are combined. custom components must forward props and refs to one DOM node.
	 */
	render?: ReactElement;
};

/**
 * renders a primitive part. replacement elements follow the {@link RenderProps.render} contract.
 *
 * @param options element, props, and refs
 * @param options.tag default element; a default `<button>` also gets `type="button"`
 * @param options.render replacement element, if any
 * @param options.refs refs to attach to the rendered DOM node
 * @param options.props part props
 * @returns the rendered element
 */
export const useRender = <T extends Tag>({
	tag,
	render,
	refs,
	props,
}: {
	tag: T;
	render: ReactElement | undefined;
	refs: Array<Ref<Element> | undefined>;
	props: ComponentPropsWithRef<T>;
}): ReactElement => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- replacement elements may have a different prop type
	const renderProps = render?.props as MergeableProps<T> | undefined;
	const ref = useMergedRefs<Element>([...refs, renderProps?.ref]);

	if (render === undefined) {
		return createElement(tag, tag === 'button' ? { type: 'button', ...props, ref } : { ...props, ref });
	}
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- TypeScript can't relate generic element props to the mapped handler types
	const merged = mergeProps<T>(props as MergeableProps<T>, renderProps);
	merged.ref = ref;
	return cloneElement(render, merged);
};
