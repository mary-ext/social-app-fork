import type { ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateExternalView,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { normalizeProfileLinkUrl } from './providers';
import {
	type LinkIcon,
	MAX_PROFILE_LINKS,
	MAX_TITLE_LENGTH,
	type ProfileLink,
	type SavedProfileLink,
} from './types';

const isShowable = (url: string, seen: Set<string>): boolean => {
	const normalized = normalizeProfileLinkUrl(url);
	if (!normalized || seen.has(normalized)) {
		return false;
	}
	seen.add(normalized);
	return true;
};

let segmenter: Intl.Segmenter | undefined;

/**
 * truncates a title to {@link MAX_TITLE_LENGTH} graphemes.
 *
 * @param title the title to cut
 * @returns the title, trimmed to length
 */
export const truncateTitle = (title: string): string => {
	segmenter ??= new Intl.Segmenter();
	const graphemes = Array.from(segmenter.segment(title), (part) => part.segment);
	if (graphemes.length <= MAX_TITLE_LENGTH) {
		return title;
	}
	return graphemes.slice(0, MAX_TITLE_LENGTH).join('').trim();
};

/**
 * @param title a title as typed or stored
 * @returns the title trimmed and cut to length, or undefined if nothing is left
 */
export const cleanTitle = (title: string | undefined): string | undefined => {
	const cleaned = title ? truncateTitle(title.trim()) : '';
	return cleaned || undefined;
};

/**
 * filters links hidden or blurred by the viewer's moderation settings.
 *
 * @param views link views from a profile
 * @param moderationOpts the viewer's moderation options
 * @returns the links that may be shown
 */
export const filterModeratedLinkViews = (
	views: AppBskyActorDefs.ProfileLinkView[] | undefined,
	moderationOpts: ModerationOptions,
): AppBskyActorDefs.ProfileLinkView[] => {
	return (views ?? []).filter((view) => {
		// link labels use external-embed moderation, with the record URI identifying the author.
		const decision = moderateExternalView(
			{
				$type: 'app.bsky.embed.external#viewExternal',
				associatedRefs: [{ uri: view.uri, cid: view.cid }],
				description: '',
				labels: view.labels,
				title: view.title ?? '',
				uri: view.url,
			},
			moderationOpts,
		);
		const ui = getDisplayRestrictions(decision, DisplayContext.ContentList);
		// pills have no blur-warning UI, so blurred links are hidden.
		return ui.filters.length === 0 && ui.blurs.length === 0;
	});
};

/**
 * reads up to {@link MAX_PROFILE_LINKS} unique web links in display order.
 *
 * @param views link views from a profile
 * @returns the links to show
 */
export const linksFromProfileView = (
	views: AppBskyActorDefs.ProfileLinkView[] | undefined,
): SavedProfileLink[] => {
	const links: SavedProfileLink[] = [];
	const seen = new Set<string>();
	for (const view of views ?? []) {
		if (links.length >= MAX_PROFILE_LINKS) {
			break;
		}
		if (!isShowable(view.url, seen)) {
			continue;
		}
		links.push({
			url: view.url,
			title: cleanTitle(view.title),
			icon: view.icon ? { kind: 'stored', url: view.icon } : undefined,
			record: { uri: view.uri, cid: view.cid },
		});
	}
	return links;
};

const sameIcon = (a: LinkIcon | undefined, b: LinkIcon | undefined): boolean => {
	if (!a || !b) {
		return a === b;
	}

	switch (a.kind) {
		case 'fetched': {
			return b.kind === 'fetched' && a.image === b.image;
		}
		case 'stored': {
			return b.kind === 'stored' && a.url === b.url;
		}
	}
};

/**
 * @param a a link
 * @param b another link
 * @returns whether URL, title, and icon match; fetched icons compare by blob identity, not bytes
 */
export const sameLinkContent = (a: ProfileLink, b: ProfileLink): boolean => {
	return a.url === b.url && a.title === b.title && sameIcon(a.icon, b.icon);
};

/**
 * @param a the links to save
 * @param b the links as they were loaded
 * @returns whether record URIs, content, and order match
 */
export const sameProfileLinks = (a: ProfileLink[], b: ProfileLink[]): boolean => {
	return (
		a.length === b.length &&
		a.every((link, i) => {
			const other = b[i]!;
			return link.record?.uri === other.record?.uri && sameLinkContent(link, other);
		})
	);
};

/**
 * @param views the links in a fresh profile view
 * @param refs the link refs just saved to the profile record
 * @returns whether link CIDs match in order
 */
export const sameLinkCids = (
	views: AppBskyActorDefs.ProfileLinkView[] | undefined,
	refs: ComAtprotoRepoStrongRef.Main[],
): boolean => {
	return (views ?? []).map((view) => view.cid).join() === refs.map((ref) => ref.cid).join();
};
