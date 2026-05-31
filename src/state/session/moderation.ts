import { configureAppLabelers } from '#/lib/moderation/app-labelers';
import { BSKY_LABELER_DID } from '#/lib/moderation/const';

import { configureAdditionalModerationAuthorities } from './additional-moderation-authorities';
import { readLabelers } from './agent-config';
import { setAppLabelers, setSubscribedLabelers } from './labelers';
import { type SessionAccount } from './types';

export function configureModerationForGuest() {
	switchToBskyAppLabeler();
	configureAdditionalModerationAuthorities();
}

export async function configureModerationForAccount(account: SessionAccount) {
	switchToBskyAppLabeler();

	const labelerDids = await readLabelers(account.did).catch((_) => {});
	if (labelerDids) {
		const subscribed = labelerDids.filter((did) => did !== BSKY_LABELER_DID);
		// the @atcute appview client injects this header on every request, reading it fresh from here
		setSubscribedLabelers(subscribed);
	} else {
		// If there are no headers in the storage, we'll not send them on the initial requests.
		// If we wanted to fix this, we could block on the preferences query here.
	}

	configureAdditionalModerationAuthorities();
}

function switchToBskyAppLabeler() {
	configureAppLabelers([BSKY_LABELER_DID]);
	setAppLabelers([BSKY_LABELER_DID]);
}
