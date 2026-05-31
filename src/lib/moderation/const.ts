import { type LabelPreference } from '@atcute/bluesky-moderation';

/** DID of the Bluesky-operated moderation labeler, applied as an app labeler. */
export const BSKY_LABELER_DID = 'did:plc:ar7c4by46qjdydhdevvrndac';

/** Default visibility for the self-applied adult/graphic labels when the user has no stored preference. */
export const DEFAULT_LABEL_SETTINGS: Record<string, LabelPreference> = {
	'graphic-media': 'warn',
	nudity: 'ignore',
	porn: 'hide',
	sexual: 'warn',
};
