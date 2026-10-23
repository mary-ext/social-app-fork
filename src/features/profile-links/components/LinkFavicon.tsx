import { type ReactNode, useState } from 'react';

import type { Did } from '@atcute/lexicons';

import type { ProfileLink } from '../types';
import * as css from './LinkFavicon.css';

/**
 * resolves a favicon URL, preferring the local preview, then the AppView URL, then the stored blob.
 *
 * @param link the link
 * @param did the owner, whose repo holds the stored icon
 * @returns the icon's URL, if the link has one
 */
export const linkFaviconUrl = (link: ProfileLink, did: Did | undefined): string | undefined => {
	if (link.iconUrl) {
		return link.iconUrl;
	}
	if (!link.icon || !did) {
		return undefined;
	}
	// PNG preserves favicon transparency.
	return `https://cdn.bsky.app/img/avatar_thumbnail/plain/${did}/${link.icon.ref.$link}@png`;
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
