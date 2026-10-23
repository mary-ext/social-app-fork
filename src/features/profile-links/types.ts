import type { ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type { GenericUri } from '@atcute/lexicons';

export type LinkIcon =
	/** fetched for this edit; uploaded when the profile is saved. */
	| { kind: 'fetched'; image: Blob }
	/** on the saved record; only its CDN URL is known. */
	| { kind: 'stored'; url: string };

/** a saved or draft profile link. */
export type ProfileLink = {
	url: GenericUri;
	title?: string;
	icon?: LinkIcon;
	/** source record; retain through edits. */
	record?: ComAtprotoRepoStrongRef.Main;
};

/** a profile link as read from a profile view. */
export type SavedProfileLink = ProfileLink & {
	icon?: Extract<LinkIcon, { kind: 'stored' }>;
	record: ComAtprotoRepoStrongRef.Main;
};

export const MAX_PROFILE_LINKS = 10;

/** title limit in graphemes. */
export const MAX_TITLE_LENGTH = 30;
