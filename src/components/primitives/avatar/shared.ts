import { createContext, useContext } from 'react';

import { type DataAttributes, dataAttributes } from '../data-attributes';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type RootContextValue = {
	imageLoadingStatus: ImageLoadingStatus;
	setImageLoadingStatus: (status: ImageLoadingStatus) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'AvatarRootContext';

/**
 * @returns the enclosing avatar's state
 * @throws if called outside `Avatar.Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`avatar parts require <Avatar.Root>`);
	}
	return ctx;
};

/**
 * @param status image loading status
 * @returns `data-loading` for idle/loading, `data-error` for error, or no attributes for loaded
 */
export const getImageAttributes = (status: ImageLoadingStatus): DataAttributes => {
	return dataAttributes({ loading: status === 'idle' || status === 'loading', error: status === 'error' });
};
