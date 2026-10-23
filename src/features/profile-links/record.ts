import type { AppBskyActorDefs, AppBskyActorLink } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateExternalView,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import type { Cid, ResourceUri } from '@atcute/lexicons';
import { isBlob } from '@atcute/lexicons/interfaces';

import { normalizeProfileLinkUrl } from './providers';
import { MAX_PROFILE_LINKS, MAX_TITLE_LENGTH, type ProfileLink, type SavedProfileLink } from './types';

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
export const linksFromProfileView = (views: AppBskyActorDefs.ProfileLinkView[]): SavedProfileLink[] => {
	const links: SavedProfileLink[] = [];
	const seen = new Set<string>();
	for (const view of views) {
		if (links.length >= MAX_PROFILE_LINKS) {
			break;
		}
		if (!isShowable(view.url, seen)) {
			continue;
		}
		links.push({
			url: view.url,
			title: cleanTitle(view.title),
			iconUrl: view.icon,
			uri: view.uri,
			cid: view.cid,
		});
	}
	return links;
};

/**
 * reads up to {@link MAX_PROFILE_LINKS} unique web links in profile-reference order.
 *
 * @param refs the profile record's `links` refs
 * @param records the link records those refs point at
 * @returns the links, with their stored icons
 */
export const linksFromRecords = (
	refs: { uri: ResourceUri }[] | undefined,
	records: { cid: Cid; uri: ResourceUri; value: AppBskyActorLink.Main }[],
): SavedProfileLink[] => {
	const byUri = new Map(records.map((record) => [record.uri, record]));
	const links: SavedProfileLink[] = [];
	const seen = new Set<string>();
	for (const ref of refs ?? []) {
		if (links.length >= MAX_PROFILE_LINKS) {
			break;
		}
		const record = byUri.get(ref.uri);
		if (!record || !isShowable(record.value.url, seen)) {
			continue;
		}
		links.push({
			url: record.value.url,
			title: cleanTitle(record.value.title),
			icon: isBlob(record.value.icon) ? record.value.icon : undefined,
			uri: record.uri,
			cid: record.cid,
		});
	}
	return links;
};

/**
 * @param a a link
 * @param b another link
 * @returns whether both would be stored as the same record content
 */
export const sameLinkContent = (a: ProfileLink, b: ProfileLink): boolean => {
	return a.url === b.url && a.title === b.title && a.icon?.ref.$link === b.icon?.ref.$link;
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
			return link.uri === other.uri && sameLinkContent(link, other);
		})
	);
};
