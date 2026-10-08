'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useLayoutEffect, useRef, useState } from 'react';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { type RenderProps, useRender } from '../render';
import { type ImageLoadingStatus, RootContext, type RootContextValue } from './shared';

export type RootProps = RenderProps<'span'>;

/**
 * holds an avatar's image and fallback.
 *
 * @param props parts and element props
 * @returns the root element; a `<span>` by default
 */
export const Root = ({ render, ref, ...elementProps }: RootProps) => {
	const [status, setStatus] = useState<ImageLoadingStatus>('idle');

	// parent cleanup runs first; ignore status resets from an unmounting image.
	const mountedRef = useRef(true);
	useLayoutEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const setImageLoadingStatus = useNonReactiveCallback((next: ImageLoadingStatus) => {
		if (mountedRef.current) {
			setStatus(next);
		}
	});

	const contextValue: RootContextValue = { imageLoadingStatus: status, setImageLoadingStatus };

	const element = useRender({ tag: 'span', render, refs: [ref], props: elementProps });

	return <RootContext.Provider value={contextValue}>{element}</RootContext.Provider>;
};
