import type { Blob as AtpBlob, Cid, GenericUri, ResourceUri } from '@atcute/lexicons';

/** a saved or draft profile link. */
export type ProfileLink = {
	url: GenericUri;
	title?: string;
	/** favicon blob in the owner's repo. */
	icon?: AtpBlob;
	/** favicon URL from the AppView. */
	iconUrl?: string;
	/** saved `app.bsky.actor.link` record URI. */
	uri?: ResourceUri;
	cid?: Cid;
};

/** a profile link with a record reference. */
export type SavedProfileLink = ProfileLink & { uri: ResourceUri; cid: Cid };

export const MAX_PROFILE_LINKS = 10;

/** title limit in graphemes. */
export const MAX_TITLE_LENGTH = 30;
