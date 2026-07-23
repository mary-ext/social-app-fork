import type { Did, Handle } from '@atcute/lexicons';

import type { EmbedPlayerSource } from '#/lib/strings/embed-player';

import type { FeedDescriptor } from '#/state/queries/post-feed';

import type { Gif } from '#/features/gifPicker/types';
import type { Locale } from '#/paraglide/runtime';

/** emoji skin tone: 1 = default/yellow, 2–6 = the five Fitzpatrick tones. */
export type SkinTone = 1 | 2 | 3 | 4 | 5 | 6;

/** Data that's specific to the device and does not vary based account */
export type Device = {
	/** The paraglide locale for UI translations. Resolved once into `LOCALE`; changing it reloads. */
	appLanguage?: Locale;
	colorMode?: 'dark' | 'light' | 'system';
	darkTheme?: 'dark' | 'dim';
	debugFeedContextEnabled?: boolean;
	devMode: boolean;
	disableAutoplay?: boolean;
	/**
	 * Formerly managed by StatSig, this is the migrated stable ID for the device, used with our logging and
	 * metrics tracking.
	 */
	deviceId?: string;
	/** selected emoji skin tone. */
	emojiSkinTone?: SkinTone;
	externalEmbeds?: Partial<Record<EmbedPlayerSource, 'hide' | 'show'>>;
	fontFamily: 'system' | 'theme';
	fontScale: '-2' | '-1' | '0' | '1' | '2';
	languagePrefs?: LanguagePrefs;
	largeAltBadgeEnabled?: boolean;
	pdsAddressHistory?: string[];
	/** recently picked emoji ids, most recent first. */
	recentEmojis?: string[];
	requireAltTextEnabled?: boolean;
	subtitlesEnabled?: boolean;
	trendingBetaEnabled: boolean;
	trendingDisabled?: boolean;
};

export type LanguagePrefs = {
	/** BCP-47 2-letter language codes the user can read, passed to feeds. */
	contentLanguages: string[];
	/** Comma-separated BCP-47 2-letter language code(s) the user is currently posting in. */
	postLanguage: string;
	/** Previously used {@link LanguagePrefs.postLanguage} values, used to pre-populate the composer selector. */
	postLanguageHistory: string[];
	/** BCP-47 2-letter language code to translate posts into. */
	primaryLanguage: string;
};

/**
 * One entry in the unified, recency-ordered search history. New entry kinds (feeds, starter packs, …) extend
 * this union without splitting the stored list.
 */
export type SearchHistoryEntry = { did: Did; kind: 'profile' } | { kind: 'query'; query: string };

export type Account = {
	labelers?: Did[];
	lastSelectedHomeFeed?: FeedDescriptor;

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
};
