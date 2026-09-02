import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { Did, GenericUri, Handle } from '@atcute/lexicons';

import type { JsonValue } from 'type-fest';

import type { AiModelSelection, AiProviderConfigs } from '#/lib/ai/config';
import type { Gif } from '#/lib/gif';

import type { Locale } from '#/paraglide/runtime';

/** emoji skin tone: 1 = default/yellow, 2–6 = the five Fitzpatrick tones. */
export type SkinTone = 1 | 2 | 3 | 4 | 5 | 6;

/** Data that's specific to the device and does not vary based account */
export type Device = {
	aiImageDescriptionModel?: AiModelSelection;
	aiProviders?: AiProviderConfigs;
	aiTranslationModel?: AiModelSelection;
	/** The paraglide locale for UI translations. Resolved once into `LOCALE`; changing it reloads. */
	appLanguage?: Locale;
	colorMode?: 'dark' | 'light' | 'system';
	/** BCP-47 2-letter language codes the user can read, passed to feeds. */
	contentLanguages?: string[];
	darkTheme?: 'dark' | 'dim';
	debugFeedContextEnabled?: boolean;
	/**
	 * Formerly managed by StatSig, this is the migrated stable ID for the device, used with our logging and
	 * metrics tracking.
	 */
	deviceId?: string;
	devMode: boolean;
	disableAutoplay?: boolean;
	/** selected emoji skin tone. */
	emojiSkinTone?: SkinTone;
	fontFamily: 'system' | 'theme';
	fontScale: '-2' | '-1' | '0' | '1' | '2';
	largeAltBadgeEnabled?: boolean;
	/** @deprecated migrated to {@link Device.aiProviders}. */
	openrouterApiKey?: string;
	/** @deprecated migrated to {@link Device.aiImageDescriptionModel}. */
	openrouterImageDescriptionModel?: string;
	/** @deprecated migrated to {@link Device.aiTranslationModel}. */
	openrouterTranslationModel?: string;
	pdsAddressHistory?: string[];
	/** Comma-separated BCP-47 2-letter language code(s) the user is currently posting in. */
	postLanguage?: string;
	/** Previously used {@link Device.postLanguage} values, used to pre-populate the composer selector. */
	postLanguageHistory?: string[];
	/** BCP-47 2-letter language code to translate posts into. */
	primaryLanguage?: string;
	queryCacheBuster?: string;
	/** recently picked emoji ids, most recent first. */
	recentEmojis?: string[];
	requireAltTextEnabled?: boolean;
	subtitlesEnabled?: boolean;
	trendingEnabled?: boolean;
};

/**
 * One entry in the unified, recency-ordered search history. New entry kinds (feeds, starter packs, …) extend
 * this union without splitting the stored list.
 */
export type SearchHistoryEntry = { kind: 'profile'; did: Did } | { kind: 'query'; query: string };

export type Account = {
	labelers?: Did[];
	/** selected feed URI, or `'following'`. */
	lastSelectedHomeFeed?: string;

	/** Recently selected GIFs in the GIF picker. Most recent first, capped at 20. */
	recentGifs?: Gif[];

	/** Unified search history (queries and visited profiles), most recent first. */
	searchHistory?: SearchHistoryEntry[];
};

export type Auth = {
	session?: AuthSession;
};

export type AuthSession = {
	accounts: AuthAccount[];
	currentAccountDid?: Did;
};

export type AuthAccount = {
	did: Did;
	handle: Handle;
	/** cached display data. */
	profile?: AuthAccountProfile;
};

/** profile fields cached for account UI. */
export type AuthAccountProfile = {
	/** labeler flag used for avatar shape. */
	associated?: Pick<AppBskyActorDefs.ProfileAssociated, 'labeler'>;
	/** avatar URI. */
	avatar?: GenericUri;
	/** display name. */
	displayName?: string;
	/** statuses used by verification badges. */
	verification?: Pick<AppBskyActorDefs.VerificationState, 'trustedVerifierStatus' | 'verifiedStatus'>;
};

export type QueryCacheScope = Did | 'logged-out';

export type QueryCache = {
	[queryHash: string]: PersistedQueryEntry;
};

export type PersistedQueryEntry = {
	data: JsonValue;
	dataUpdatedAt: number;
	expiresAt: number;
	version: number;
};
