'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useRender } from '@base-ui/react/use-render';

export type ItemTextProps = useRender.ComponentProps<'span'>;

/**
 * @param props element props
 * @returns a wrapper for the item's label; a `<span>` by default
 */
export const ItemText = ({ render, ref, ...elementProps }: ItemTextProps) => {
	return useRender({ render, ref, defaultTagName: 'span', props: elementProps });
};
