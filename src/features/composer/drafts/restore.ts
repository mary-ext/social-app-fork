import type { AppBskyDraftDefs } from '@atcute/bluesky';
import { isDid, isResourceUri, parseResourceUri, type ResourceUri } from '@atcute/lexicons/syntax';

import { quotesFromEmbeddingRules, repliesFromThreadgateAllow } from '#/lib/interaction-settings';
import { type AppLink, resolveUrlToLink } from '#/lib/links/app-url';
import { isSelfLabel, normalizeSelfLabels, type SelfLabel } from '#/lib/moderation/self-labels';
import { parseRichtext } from '#/lib/rich-text';
import { recordUriToShareUrl } from '#/lib/routes/app-links';

import { joinPostLanguages } from '#/state/preferences/languages';

import type { ComposerSeed, SeedPost } from '../create-composer';
import { getLinkEmbedKind } from '../embeds/link-embeds';
import { createGifMedia, createMedia } from '../media/attachments';
import type { CaptionTrack } from '../media/videos/captions';
import type { PostMedia } from '../model/schema';
import {
	getDraftMediaName,
	getDraftPostImages,
	getDraftVideoType,
	isDraftFromThisDevice,
	parseDraftGif,
} from './draft-format';
import { loadDraftMedia } from './storage';

/** a draft converted for the composer. */
export type RestoredDraft = {
	seed: ComposerSeed;
	/** number of missing or unusable attachments. */
	missingMedia: number;
};

const RECORD_LINK_KINDS: Record<string, AppLink['kind']> = {
	'app.bsky.feed.generator': 'feed',
	'app.bsky.feed.post': 'post',
	'app.bsky.graph.list': 'list',
	'app.bsky.graph.starterpack': 'starterPack',
};

const isLinkToRecord = (url: string, uri: ResourceUri): boolean => {
	const link = resolveUrlToLink(url);
	if (link === undefined || !('rkey' in link)) {
		return false;
	}

	const { repo, collection, rkey } = parseResourceUri(uri);
	if (collection === undefined || link.kind !== RECORD_LINK_KINDS[collection]) {
		return false;
	}

	// without resolving handles, matching collection and rkey is only a best-effort check.
	return link.rkey === rkey && (link.actor === repo || !isDid(link.actor));
};

const getTextLinks = (text: string): string[] => {
	return parseRichtext(text).flatMap((segment) => (segment.type === 'link' ? [segment.text] : []));
};

/**
 * converts a saved draft into a composer seed, loading its attachments from this device.
 *
 * appends missing embed URLs to the text. a post quoted by the first post becomes the thread's quote. infers
 * link dismissals from absent embeds, except where media or a quote occupies the slot.
 *
 * @param view the saved draft
 * @returns the seed and how many attachments were left out
 */
export const restoreDraft = async ({ id, draft }: AppBskyDraftDefs.DraftView): Promise<RestoredDraft> => {
	const canLoadMedia = isDraftFromThisDevice(draft);

	const alt = new Map<string, string>();
	const captions = new Map<string, readonly CaptionTrack[]>();
	const labels = new Map<string, readonly SelfLabel[]>();
	const languages = new Map<string, string>();
	const mediaPaths = new Map<string, string>();
	// dismissals are thread-wide; a URL embedded in any post must stay enabled.
	const embeddedLinks = new Set<string>();
	const unembeddedLinks = new Set<string>();
	let missingMedia = 0;
	let quoteUri: ResourceUri | undefined;

	const restoreFile = async (
		{ localRef, alt: altText }: AppBskyDraftDefs.DraftEmbedImage | AppBskyDraftDefs.DraftEmbedVideo,
		type: string | undefined,
	): Promise<PostMedia | undefined> => {
		const { path } = localRef;

		let item: PostMedia | undefined;
		const blob = canLoadMedia ? await loadDraftMedia(path) : undefined;
		if (blob) {
			// legacy drafts may have stored videos without a MIME type.
			const file = new File([blob], getDraftMediaName(path), { type: type ?? blob.type });
			try {
				[item] = (await createMedia([file])).media;
			} catch {}
		}

		if (!item) {
			missingMedia++;
			return undefined;
		}

		mediaPaths.set(item.id, path);
		if (altText) {
			alt.set(item.id, altText);
		}
		return item;
	};

	const posts = await Promise.all(
		draft.posts.map(async (post, index): Promise<SeedPost> => {
			const postId = crypto.randomUUID();

			const images = await Promise.all(
				getDraftPostImages(post).map((image) => restoreFile(image, undefined)),
			);

			const videos = await Promise.all(
				(post.embedVideos ?? []).map(async (video) => {
					const item = await restoreFile(video, getDraftVideoType(video.localRef.path));
					if (item && video.captions?.length) {
						captions.set(
							item.id,
							video.captions.map(({ lang, content }) => ({
								id: crypto.randomUUID(),
								file: new File([content], `${lang}.vtt`, { type: 'text/vtt' }),
								lang,
							})),
						);
					}
					return item;
				}),
			);

			const media = [...images, ...videos].filter((item) => item !== undefined);

			let external: string | undefined;
			for (const { uri } of post.embedExternals ?? []) {
				const gif = parseDraftGif(uri);
				if (gif) {
					const item = createGifMedia(gif);
					media.push(item);
					if (gif.content_description) {
						alt.set(item.id, gif.content_description);
					}
				} else {
					external = uri;
				}
			}

			const links = getTextLinks(post.text);
			const appended: string[] = [];

			if (external !== undefined && !links.includes(external)) {
				appended.push(external);
			}

			let isQuoting = false;
			const record = post.embedRecords?.[0]?.record.uri;
			const savedRecord = record !== undefined && isResourceUri(record) ? record : undefined;
			if (savedRecord !== undefined && !links.some((url) => isLinkToRecord(url, savedRecord))) {
				if (index === 0 && parseResourceUri(savedRecord).collection === 'app.bsky.feed.post') {
					quoteUri = savedRecord;
					isQuoting = true;
				} else {
					const url = recordUriToShareUrl(savedRecord);
					if (url) {
						appended.push(url);
					}
				}
			}

			for (const url of appended) {
				embeddedLinks.add(url);
			}
			for (const url of links) {
				switch (getLinkEmbedKind(url)) {
					case 'external': {
						// media can hide a card without dismissing its URL.
						if (url === external) {
							embeddedLinks.add(url);
						} else if (media.length === 0) {
							unembeddedLinks.add(url);
						}
						break;
					}
					case 'record': {
						// a quote can hide a record embed without dismissing its URL.
						if (savedRecord !== undefined && isLinkToRecord(url, savedRecord)) {
							embeddedLinks.add(url);
						} else if (!isQuoting) {
							unembeddedLinks.add(url);
						}
						break;
					}
				}
			}

			const values = post.labels?.values.map(({ val }) => val).filter(isSelfLabel) ?? [];
			if (values.length > 0) {
				labels.set(postId, normalizeSelfLabels(values));
			}

			if (draft.langs?.length) {
				languages.set(postId, joinPostLanguages(draft.langs));
			}

			const text =
				appended.length > 0 ? [post.text.trimEnd(), ...appended].filter(Boolean).join('\n') : post.text;
			return { id: postId, text, media };
		}),
	);

	return {
		seed: {
			posts,
			quoteUri,
			alt,
			captions,
			dismissedLinks: unembeddedLinks.difference(embeddedLinks),
			labels,
			languages,
			interaction: {
				// absent rules mean unrestricted, not account defaults.
				replies: repliesFromThreadgateAllow(draft.threadgateAllow),
				allowQuotes: quotesFromEmbeddingRules(draft.postgateEmbeddingRules),
			},
			draft: { id, mediaPaths },
		},
		missingMedia,
	};
};
