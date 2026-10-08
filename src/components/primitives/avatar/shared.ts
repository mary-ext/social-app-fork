import { createContext, useContext } from 'react';

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

// expose status to render callbacks; only `Image` gets loading-state attributes.
export const avatarStateAttributes = {
	imageLoadingStatus: () => null,
};

export const imageStateAttributes = {
	imageLoadingStatus: (status: ImageLoadingStatus): Record<string, string> | null => {
		switch (status) {
			case 'idle':
			case 'loading': {
				return { 'data-loading': '' };
			}
			case 'error': {
				return { 'data-error': '' };
			}
			case 'loaded': {
				return null;
			}
		}
	},
};
