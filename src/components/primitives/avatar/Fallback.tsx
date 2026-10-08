'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useEffect, useState } from 'react';

import { useRender } from '@base-ui/react/use-render';
import { useTimeout } from '@base-ui/utils/useTimeout';

import { avatarStateAttributes, type ImageLoadingStatus, useRootContext } from './shared';

export type FallbackState = {
	imageLoadingStatus: ImageLoadingStatus;
};

export type FallbackProps = useRender.ComponentProps<'span', FallbackState> & {
	/** milliseconds before showing the fallback. */
	delay?: number;
};

/**
 * shown while the image is missing, loading, or broken.
 *
 * @param props element props
 * @returns the fallback element; a `<span>` by default, or `null` once the image loads or during `delay`
 * @throws if rendered outside `Root`
 */
export const Fallback = ({ render, ref, delay = 0, ...elementProps }: FallbackProps) => {
	const { imageLoadingStatus } = useRootContext();
	const [delayPassed, setDelayPassed] = useState(delay === 0);
	const timeout = useTimeout();

	const waiting = !delayPassed && imageLoadingStatus !== 'loaded';
	useEffect(() => {
		if (waiting) {
			timeout.start(delay, () => setDelayPassed(true));
			return timeout.clear;
		}
	}, [waiting, delay, timeout]);

	const element = useRender({
		render,
		defaultTagName: 'span',
		ref,
		state: { imageLoadingStatus },
		stateAttributesMapping: avatarStateAttributes,
		props: elementProps,
	});

	return imageLoadingStatus !== 'loaded' && delayPassed ? element : null;
};
