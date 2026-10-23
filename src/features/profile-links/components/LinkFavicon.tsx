import { type ReactNode, useState } from 'react';

import { getBlobUrl } from '#/lib/utils/blob-url';

import type { ProfileLink } from '../types';
import * as css from './LinkFavicon.css';

/**
 * @param link the link
 * @returns the local preview URL, falling back to the AppView URL, or undefined if neither exists
 */
export const linkFaviconUrl = (link: ProfileLink): string | undefined => {
	if (link.iconPreview) {
		return getBlobUrl(link.iconPreview);
	}
	return link.iconUrl;
};

/**
 * displays a favicon or the fallback if loading fails.
 *
 * @param props the icon's URL, its rendered size, and what to show instead
 */
export function LinkFavicon({ fallback, size, url }: { fallback: ReactNode; size: number; url: string }) {
	const [failed, setFailed] = useState(false);
	if (failed) {
		return fallback;
	}
	return (
		<img
			alt=""
			className={css.favicon}
			height={size}
			onError={() => setFailed(true)}
			src={url}
			style={{ borderRadius: size / 6 }}
			width={size}
		/>
	);
}
