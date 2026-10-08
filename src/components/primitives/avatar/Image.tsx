'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ImgHTMLAttributes, useLayoutEffect, useRef } from 'react';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import * as styles from './avatar.css';
import { getImageAttributes, type ImageLoadingStatus, useRootContext } from './shared';

export type ImageProps = RenderProps<'img'> & {
	/** receives each loading status change. */
	onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
};

/**
 * an avatar image, hidden until loaded.
 *
 * @param props element props
 * @returns the image element; an `<img>` by default
 * @throws if rendered outside `Root`
 */
export const Image = ({ render, ref, src, onLoadingStatusChange, ...elementProps }: ImageProps) => {
	const { imageLoadingStatus, setImageLoadingStatus } = useRootContext();
	const imageRef = useRef<HTMLImageElement | null>(null);
	const reportedRef = useRef<ImageLoadingStatus>('idle');

	const report = useNonReactiveCallback((status: ImageLoadingStatus) => {
		// idle and loading share styles; avoid a redundant update on mount.
		if (status !== 'loading' || imageLoadingStatus !== 'idle') {
			setImageLoadingStatus(status);
		}
		// deduplicate cached-image reports from the effect and `onLoad`.
		if (reportedRef.current !== status) {
			reportedRef.current = status;
			onLoadingStatusChange?.(status);
		}
	});

	// check cached images before paint to avoid flashing the fallback.
	useLayoutEffect(() => {
		const image = imageRef.current;
		if (!src) {
			report('error');
		} else if (image?.complete) {
			report(image.naturalWidth > 0 ? 'loaded' : 'error');
		} else {
			report('loading');
		}
	}, [src, report]);

	useLayoutEffect(() => {
		return () => setImageLoadingStatus('idle');
	}, [setImageLoadingStatus]);

	const internalProps: ImgHTMLAttributes<HTMLImageElement> = {
		className: styles.image,
		src,
		alt: '',
		'aria-hidden': imageLoadingStatus !== 'loaded' || undefined,
		onLoad() {
			report('loaded');
		},
		onError() {
			report('error');
		},
	};

	return useRender({
		tag: 'img',
		render,
		refs: [ref, imageRef],
		props: mergeProps<'img'>(getImageAttributes(imageLoadingStatus), internalProps, elementProps),
	});
};
