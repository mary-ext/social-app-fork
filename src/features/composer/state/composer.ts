import type { AppBskyActorDefs, AppBskyDraftDefs, AppBskyFeedPostgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import type { Gif } from '#/lib/gif';
import { resolveUrlToLink } from '#/lib/links/app-url';
import { detectLinks, type LinkFacetMatch, suggestLinkCardUri } from '#/lib/links/detect';
import type { ComposerImage } from '#/lib/media/composer-image';
import type { VideoAsset } from '#/lib/media/video/types';
import { insertMentionAt } from '#/lib/mentions';
import type { SelfLabel } from '#/lib/moderation/self-labels';
import { getShortenedLength } from '#/lib/rich-text';
import { recordUriToShareUrl } from '#/lib/routes/app-links';

import { createPostgateRecord } from '#/state/queries/postgate/util';
import { threadgateRecordToAllowUISetting, type ThreadgateAllowUISetting } from '#/state/queries/threadgate';

import { createVideoState, type VideoAction, videoReducer, type VideoState } from './video';

/** the gated post doesn't exist until publish; `src/lib/api` swaps in the real at-uri then. */
const PLACEHOLDER_POST_URI: ResourceUri = 'at://placeholder.invalid';

type ImagesMedia = {
	type: 'images';
	images: ComposerImage[];
};

type GalleryMedia = {
	type: 'gallery';
	images: ComposerImage[];
};

type VideoMedia = {
	type: 'video';
	video: VideoState;
};

type GifMedia = {
	type: 'gif';
	gif: Gif;
	alt: string;
};

type Link = {
	type: 'link';
	uri: string;
};

// This structure doesn't exactly correspond to the data model.
// Instead, it maps to how the UI is organized, and how we present a post.
export type EmbedDraft = {
	// We'll always submit quote and actual media (images, video, gifs) chosen by the user.
	quote: Link | undefined;
	media: ImagesMedia | GalleryMedia | VideoMedia | GifMedia | undefined;
	// This field may end up ignored if we have more important things to display than a link card:
	link: Link | undefined;
};

export type PostDraft = {
	id: string;
	text: string;
	labels: SelfLabel[];
	embed: EmbedDraft;
	shortenedGraphemeLength: number;
};

export type PostAction =
	| { type: 'updateText'; text: string }
	| { type: 'updateLabels'; labels: SelfLabel[] }
	| { type: 'embedAddImages'; images: ComposerImage[] }
	| { type: 'embedUpdateImage'; image: ComposerImage }
	| { type: 'embedRemoveImage'; image: ComposerImage }
	| {
			type: 'embedAddVideo';
			asset: VideoAsset;
			abortController: AbortController;
	  }
	| { type: 'embedRemoveVideo' }
	| { type: 'embedUpdateVideo'; videoAction: VideoAction }
	| { type: 'embedAddUri'; uri: string }
	| { type: 'embedRemoveQuote' }
	| { type: 'embedRemoveLink' }
	| { type: 'embedAddGif'; gif: Gif }
	| { type: 'embedUpdateGif'; alt: string }
	| { type: 'embedRemoveGif' };

export type ThreadDraft = {
	posts: PostDraft[];
	postgate: AppBskyFeedPostgate.Main;
	threadgate: ThreadgateAllowUISetting[];
};

export type ComposerState = {
	thread: ThreadDraft;
	activePostIndex: number;
	/** monotonic counter bumped each time an action requests the text input be focused. */
	activePostFocusRequestId: number;
	/** ID of the draft being edited, if any. Used to update existing draft on save. */
	draftId?: string;
	/** Whether the composer has been modified since loading a draft. */
	isDirty: boolean;
	/**
	 * Map of localId -> loaded media path/URL for the current draft. Used for re-saving without re-copying
	 * media.
	 */
	loadedMediaMap?: Map<string, Blob>;
	/** Set of original localRef paths from the draft being edited. Used to identify orphaned media on save. */
	originalLocalRefs?: Set<string>;
};

export type ComposerAction =
	| { type: 'updatePostgate'; postgate: AppBskyFeedPostgate.Main }
	| { type: 'updateThreadgate'; threadgate: ThreadgateAllowUISetting[] }
	| {
			type: 'updatePost';
			postId: string;
			postAction: PostAction;
	  }
	| {
			type: 'addPost';
	  }
	| {
			type: 'removePost';
			postId: string;
	  }
	| {
			type: 'focusPost';
			postId: string;
	  }
	| {
			type: 'restoreFromDraft';
			draftId: string;
			posts: PostDraft[];
			threadgateAllow: AppBskyDraftDefs.Draft['threadgateAllow'];
			postgateEmbeddingRules: AppBskyDraftDefs.Draft['postgateEmbeddingRules'];

			/** Map of localRefPath -> loaded media blob */
			loadedMedia: Map<string, Blob>;
			/** Set of original localRef paths from the draft. Used to identify orphaned media on save. */
			originalLocalRefs: Set<string>;
	  }
	| {
			type: 'clear';
			initInteractionSettings: AppBskyActorDefs.PostInteractionSettingsPref | undefined;
	  }
	| {
			type: 'markSaved';
			draftId: string;
	  };

/**
 * threshold for picking between embed variants. <= this count uses the legacy `app.bsky.embed.images` shape,
 * while > this count promotes to `app.bsky.embed.gallery`.
 */
export const LEGACY_IMAGES_EMBED_MAX = 4;
export const MAX_GALLERY_IMAGES = 10;

/**
 * picks the embed variant for a set of images. <=4 lands in the legacy `app.bsky.embed.images` shape; >4
 * promotes to `app.bsky.embed.gallery`.
 */
function imagesToMediaVariant(images: ComposerImage[]): ImagesMedia | GalleryMedia {
	return images.length <= LEGACY_IMAGES_EMBED_MAX
		? { type: 'images', images: images.slice(0, LEGACY_IMAGES_EMBED_MAX) }
		: { type: 'gallery', images: images.slice(0, MAX_GALLERY_IMAGES) };
}

export function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
	switch (action.type) {
		case 'updatePostgate': {
			return {
				...state,
				isDirty: true,
				thread: {
					...state.thread,
					postgate: action.postgate,
				},
			};
		}
		case 'updateThreadgate': {
			return {
				...state,
				isDirty: true,
				thread: {
					...state.thread,
					threadgate: action.threadgate,
				},
			};
		}
		case 'updatePost': {
			let nextPosts = state.thread.posts;
			const postIndex = state.thread.posts.findIndex((p) => p.id === action.postId);
			if (postIndex !== -1) {
				nextPosts = state.thread.posts.slice();
				nextPosts[postIndex] = postReducer(state.thread.posts[postIndex]!, action.postAction);
			}
			return {
				...state,
				isDirty: true,
				thread: {
					...state.thread,
					posts: nextPosts,
				},
			};
		}
		case 'addPost': {
			const activePostIndex = state.activePostIndex;
			const nextPosts = [...state.thread.posts];
			nextPosts.splice(activePostIndex + 1, 0, {
				id: crypto.randomUUID(),
				text: '',
				shortenedGraphemeLength: 0,
				labels: [],
				embed: {
					quote: undefined,
					media: undefined,
					link: undefined,
				},
			});
			return {
				...state,
				isDirty: true,
				thread: {
					...state.thread,
					posts: nextPosts,
				},
			};
		}
		case 'removePost': {
			if (state.thread.posts.length < 2) {
				return state;
			}
			let nextActivePostIndex = state.activePostIndex;
			const indexToRemove = state.thread.posts.findIndex((p) => p.id === action.postId);
			const nextPosts = [...state.thread.posts];
			if (indexToRemove !== -1) {
				const postToRemove = state.thread.posts[indexToRemove]!;
				if (postToRemove.embed.media?.type === 'video') {
					postToRemove.embed.media.video.abortController.abort();
				}
				nextPosts.splice(indexToRemove, 1);
				nextActivePostIndex = Math.max(0, indexToRemove - 1);
			}
			return {
				...state,
				isDirty: true,
				activePostIndex: nextActivePostIndex,
				activePostFocusRequestId: state.activePostFocusRequestId + 1,
				thread: {
					...state.thread,
					posts: nextPosts,
				},
			};
		}
		case 'focusPost': {
			const nextActivePostIndex = state.thread.posts.findIndex((p) => p.id === action.postId);
			if (nextActivePostIndex === -1) {
				return state;
			}
			return {
				...state,
				activePostIndex: nextActivePostIndex,
			};
		}
		case 'restoreFromDraft': {
			const { draftId, posts, threadgateAllow, postgateEmbeddingRules, loadedMedia, originalLocalRefs } =
				action;

			return {
				activePostIndex: 0,
				activePostFocusRequestId: state.activePostFocusRequestId + 1,
				draftId,
				isDirty: false,
				loadedMediaMap: loadedMedia,
				originalLocalRefs,
				thread: {
					posts,
					postgate: createPostgateRecord({
						post: PLACEHOLDER_POST_URI,
						embeddingRules: postgateEmbeddingRules,
					}),
					threadgate: threadgateRecordToAllowUISetting({ allow: threadgateAllow }),
				},
			};
		}
		case 'clear': {
			// preserve the focus-request counter so it stays monotonic across a clear; resetting it to 0
			// would desync it from Composer's handled-ref and could drop or replay a focus request.
			return {
				...createComposerState({
					initText: undefined,
					initMention: undefined,
					initQuoteUri: undefined,
					initInteractionSettings: action.initInteractionSettings,
				}),
				activePostFocusRequestId: state.activePostFocusRequestId,
			};
		}
		case 'markSaved': {
			return {
				...state,
				isDirty: false,
				draftId: action.draftId,
			};
		}
	}
}

function postReducer(state: PostDraft, action: PostAction): PostDraft {
	switch (action.type) {
		case 'updateText': {
			return {
				...state,
				text: action.text,
				shortenedGraphemeLength: getShortenedLength(action.text),
			};
		}
		case 'updateLabels': {
			return {
				...state,
				labels: action.labels,
			};
		}
		case 'embedAddImages': {
			if (action.images.length === 0) {
				return state;
			}
			const prevMedia = state.embed.media;
			let nextMedia = prevMedia;
			// callers (applyGalleryCap in Composer) trim to the cap and surface a toast; the hard slice in
			// imagesToMediaVariant still drops any excess, so the cap holds either way.
			if (!prevMedia) {
				nextMedia = imagesToMediaVariant(action.images);
			} else if (prevMedia.type === 'images' || prevMedia.type === 'gallery') {
				nextMedia = imagesToMediaVariant([...prevMedia.images, ...action.images]);
			}
			return {
				...state,
				embed: {
					...state.embed,
					media: nextMedia,
				},
			};
		}
		case 'embedUpdateImage': {
			const prevMedia = state.embed.media;
			if (prevMedia?.type === 'images' || prevMedia?.type === 'gallery') {
				const updatedImage = action.image;
				const nextMedia = {
					...prevMedia,
					images: prevMedia.images.map((img) => {
						if (img.source.id === updatedImage.source.id) {
							return updatedImage;
						}
						return img;
					}),
				};
				return {
					...state,
					embed: {
						...state.embed,
						media: nextMedia,
					},
				};
			}
			return state;
		}
		case 'embedRemoveImage': {
			const prevMedia = state.embed.media;
			let nextLabels = state.labels;
			if (prevMedia?.type === 'images' || prevMedia?.type === 'gallery') {
				const removedImage = action.image;
				const remainingImages = prevMedia.images.filter((img) => {
					return img.source.id !== removedImage.source.id;
				});
				let nextMedia: ImagesMedia | GalleryMedia | undefined;
				if (remainingImages.length === 0) {
					nextMedia = undefined;
					if (!state.embed.link) {
						nextLabels = [];
					}
				} else {
					// Re-pick the variant so a gallery that shrinks to <=4 demotes back to the legacy
					// `app.bsky.embed.images` shape - keeps old clients rendering it when possible.
					nextMedia = imagesToMediaVariant(remainingImages);
				}
				return {
					...state,
					labels: nextLabels,
					embed: {
						...state.embed,
						media: nextMedia,
					},
				};
			}
			return state;
		}
		case 'embedAddVideo': {
			const prevMedia = state.embed.media;
			let nextMedia = prevMedia;
			if (!prevMedia) {
				nextMedia = {
					type: 'video',
					video: createVideoState(action.asset, action.abortController),
				};
			}
			return {
				...state,
				embed: {
					...state.embed,
					media: nextMedia,
				},
			};
		}
		case 'embedUpdateVideo': {
			const videoAction = action.videoAction;
			const prevMedia = state.embed.media;
			let nextMedia = prevMedia;
			if (prevMedia?.type === 'video') {
				nextMedia = {
					...prevMedia,
					video: videoReducer(prevMedia.video, videoAction),
				};
			}
			return {
				...state,
				embed: {
					...state.embed,
					media: nextMedia,
				},
			};
		}
		case 'embedRemoveVideo': {
			const prevMedia = state.embed.media;
			let nextMedia = prevMedia;
			if (prevMedia?.type === 'video') {
				prevMedia.video.abortController.abort();
				nextMedia = undefined;
			}
			let nextLabels = state.labels;
			if (!state.embed.link) {
				nextLabels = [];
			}
			return {
				...state,
				labels: nextLabels,
				embed: {
					...state.embed,
					media: nextMedia,
				},
			};
		}
		case 'embedAddUri': {
			const prevQuote = state.embed.quote;
			const prevLink = state.embed.link;
			let nextQuote = prevQuote;
			let nextLink = prevLink;
			if (resolveUrlToLink(action.uri)?.kind === 'post') {
				if (!prevQuote) {
					nextQuote = {
						type: 'link',
						uri: action.uri,
					};
				}
			} else {
				if (!prevLink) {
					nextLink = {
						type: 'link',
						uri: action.uri,
					};
				}
			}
			return {
				...state,
				embed: {
					...state.embed,
					quote: nextQuote,
					link: nextLink,
				},
			};
		}
		case 'embedRemoveLink': {
			let nextLabels = state.labels;
			if (!state.embed.media) {
				nextLabels = [];
			}
			return {
				...state,
				labels: nextLabels,
				embed: {
					...state.embed,
					link: undefined,
				},
			};
		}
		case 'embedRemoveQuote': {
			return {
				...state,
				embed: {
					...state.embed,
					quote: undefined,
				},
			};
		}
		case 'embedAddGif': {
			const prevMedia = state.embed.media;
			let nextMedia = prevMedia;
			if (!prevMedia) {
				nextMedia = {
					type: 'gif',
					gif: action.gif,
					alt: '',
				};
			}
			return {
				...state,
				embed: {
					...state.embed,
					media: nextMedia,
				},
			};
		}
		case 'embedUpdateGif': {
			const prevMedia = state.embed.media;
			let nextMedia = prevMedia;
			if (prevMedia?.type === 'gif') {
				nextMedia = {
					...prevMedia,
					alt: action.alt,
				};
			}
			return {
				...state,
				embed: {
					...state.embed,
					media: nextMedia,
				},
			};
		}
		case 'embedRemoveGif': {
			const prevMedia = state.embed.media;
			let nextMedia = prevMedia;
			if (prevMedia?.type === 'gif') {
				nextMedia = undefined;
			}
			return {
				...state,
				embed: {
					...state.embed,
					media: nextMedia,
				},
			};
		}
	}
}

export function createComposerState({
	initText,
	initMention,
	initQuoteUri,
	initInteractionSettings,
}: {
	initText: string | undefined;
	initMention: string | undefined;
	initQuoteUri: string | undefined;
	initInteractionSettings: AppBskyActorDefs.PostInteractionSettingsPref | undefined;
}): ComposerState {
	let quote: Link | undefined;
	if (initQuoteUri) {
		// TODO: Consider passing the app url directly.
		const uri = recordUriToShareUrl(initQuoteUri);
		if (uri) {
			quote = {
				type: 'link',
				uri,
			};
		}
	}
	const initialText = initText
		? initText
		: initMention
			? insertMentionAt(`@${initMention}`, initMention.length + 1, initMention)
			: '';

	let link: Link | undefined;

	/**
	 * extracts links and posts from the initial text to suggest as embeds.
	 *
	 * @param initText the initial text to extract links from.
	 */
	if (initText) {
		const detectedExtUris = new Map<string, LinkFacetMatch>();
		const detectedPostUris = new Map<string, LinkFacetMatch>();
		for (const [uri, match] of detectLinks(initialText)) {
			if (resolveUrlToLink(uri)?.kind === 'post') {
				detectedPostUris.set(uri, match);
			} else {
				detectedExtUris.set(uri, match);
			}
		}
		const pastSuggestedUris = new Set<string>();
		const suggestedExtUri = suggestLinkCardUri(true, detectedExtUris, new Map(), pastSuggestedUris);
		if (suggestedExtUri) {
			link = {
				type: 'link',
				uri: suggestedExtUri,
			};
		}
		const suggestedPostUri = suggestLinkCardUri(true, detectedPostUris, new Map(), pastSuggestedUris);
		if (suggestedPostUri) {
			/*
			 * `initQuote` is only populated via in-app user action, but we're being
			 * future-defensive here.
			 */
			if (!quote) {
				quote = {
					type: 'link',
					uri: suggestedPostUri,
				};
			}
		}
	}

	return {
		activePostIndex: 0,
		activePostFocusRequestId: 0,
		isDirty: false,
		thread: {
			posts: [
				{
					id: crypto.randomUUID(),
					text: initialText,
					shortenedGraphemeLength: getShortenedLength(initialText),
					labels: [],
					embed: {
						quote,
						media: undefined,
						link,
					},
				},
			],
			postgate: createPostgateRecord({
				post: PLACEHOLDER_POST_URI,
				embeddingRules: initInteractionSettings?.postgateEmbeddingRules || [],
			}),
			threadgate: threadgateRecordToAllowUISetting({
				allow: initInteractionSettings?.threadgateAllowRules,
			}),
		},
	};
}
