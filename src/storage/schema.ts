import { type Gif } from '#/features/gifPicker/types';

/** Data that's specific to the device and does not vary based account */
export type Device = {
	activitySubscriptionsNudged?: boolean;
	demoMode: boolean;
	devMode: boolean;
	disableAutoplay: boolean;
	/**
	 * Formerly managed by StatSig, this is the migrated stable ID for the device, used with our logging and
	 * metrics tracking.
	 */
	deviceId?: string;
	fontFamily: 'system' | 'theme';
	fontScale: '-2' | '-1' | '0' | '1' | '2';
	largeAltBadgeEnabled: boolean;
	requireAltTextEnabled: boolean;
	subtitlesEnabled: boolean;
	threadgateNudged?: boolean;
	trendingBetaEnabled: boolean;
};

export type Account = {
	searchTermHistory?: string[];
	searchAccountHistory?: string[];

	lastSelectedHomeFeed?: string;

	/** Recently selected GIFs in the GIF picker. Most recent first, capped at 20. */
	recentGifs?: Gif[];
};

export type Auth = {
	session?: AuthSession;
};

export type AuthSession = {
	accounts: AuthAccount[];
	currentAccountDid?: string;
};

export type AuthAccount = {
	did: string;
	handle: string;
};
