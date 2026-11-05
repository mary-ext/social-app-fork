import { ClientResponseError } from '@atcute/client';

import { m } from '#/paraglide/messages';

/**
 * explains a failed `chat.bsky.group.addMembers` call. cached profiles can still let a blocked account be
 * picked, so the server's block errors get their own message.
 *
 * @param error the mutation's error
 * @returns a toast message
 */
export const addGroupMembersErrorMessage = (error: unknown): string => {
	if (error instanceof ClientResponseError) {
		switch (error.error) {
			case 'BlockedSubject': {
				return m['screens.messages.members.add.errorBlocking']();
			}
			case 'BlockedActor': {
				return m['screens.messages.members.add.errorBlockedBy']();
			}
		}
	}
	return m['screens.messages.members.add.error']();
};
