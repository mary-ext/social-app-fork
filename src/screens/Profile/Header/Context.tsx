import { createContext, use } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationDecision,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { sanitizeDisplayName } from '#/lib/strings/display-names';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import type { Shadow } from '#/state/cache/types';
import { useProfileBlockMutationQueue, useProfileFollowMutationQueue } from '#/state/queries/profile';
import { useRequireAuth, useSession } from '#/state/session';

import { logger } from '#/logger';

import * as Toast from '#/components/Toast';

import { useActorStatus } from '#/features/liveNow';
import { m } from '#/paraglide/messages';

/**
 * viewer's relationship to the profile, as a single discriminant. drives which action buttons a header
 * variant renders.
 */
export type ProfileRelationship = 'blocked-by' | 'blocking' | 'blocking-by-list' | 'default' | 'self';

interface ProfileHeaderState {
	descriptionRT: Richtext | null;
	moderation: ModerationDecision;
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
}

interface ProfileHeaderActions {
	/** Follow the profile (auth-gated), then surface a toast and notify `onFollowChange`. */
	follow: () => void;
	/** Unblock the profile and surface a toast. */
	unblock: () => Promise<void>;
	/** Unfollow the profile (auth-gated), then surface a toast and notify `onFollowChange`. */
	unfollow: () => void;
}

interface ProfileHeaderMeta {
	hasSession: boolean;
	hideBackButton: boolean;
	isMe: boolean;
	isPlaceholderProfile: boolean;
	live: ReturnType<typeof useActorStatus>;
	moderationOpts: ModerationOptions;
	relationship: ProfileRelationship;
}

interface ProfileHeaderContextValue {
	actions: ProfileHeaderActions;
	meta: ProfileHeaderMeta;
	state: ProfileHeaderState;
}

const ProfileHeaderContext = createContext<ProfileHeaderContextValue | null>(null);
ProfileHeaderContext.displayName = 'ProfileHeaderContext';

/**
 * Reads the lifted profile-header state/actions/meta. Throws when used outside a
 * {@link ProfileHeaderProvider}.
 */
export const useProfileHeader = (): ProfileHeaderContextValue => {
	const ctx = use(ProfileHeaderContext);
	if (!ctx) {
		throw new Error('useProfileHeader must be used within a ProfileHeaderProvider');
	}
	return ctx;
};

/**
 * lifts profile-header state, including the shadowed profile, moderation decisions, mutation queues, live
 * status, and viewer relationships, for consumption by header subcomponents via {@link useProfileHeader}.
 */
export function ProfileHeaderProvider({
	children,
	descriptionRT,
	hideBackButton = false,
	isPlaceholderProfile = false,
	moderationOpts,
	onFollowChange,
	profile: profileUnshadowed,
}: {
	children: React.ReactNode;
	descriptionRT: Richtext | null;
	hideBackButton?: boolean;
	isPlaceholderProfile?: boolean;
	moderationOpts: ModerationOptions;
	/** Called after a successful follow/unfollow with the new following state. */
	onFollowChange?: (following: boolean) => void;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const { currentAccount, hasSession } = useSession();
	const requireAuth = useRequireAuth();
	const profile = useProfileShadow<AppBskyActorDefs.ProfileViewDetailed>(profileUnshadowed);
	const moderation = moderateProfile(profile, moderationOpts);
	const live = useActorStatus(profile);
	const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile);
	const [, queueUnblock] = useProfileBlockMutationQueue(profile);

	const isMe = currentAccount?.did === profile.did;

	const relationship: ProfileRelationship = isMe
		? 'self'
		: profile.viewer?.blocking
			? profile.viewer?.blockingByList
				? 'blocking-by-list'
				: 'blocking'
			: profile.viewer?.blockedBy
				? 'blocked-by'
				: 'default';

	const follow = () => {
		requireAuth(async () => {
			try {
				await queueFollow();
				onFollowChange?.(true);
				Toast.show(
					m['common.follow.a11y.following']({
						name: sanitizeDisplayName(
							profile.displayName || profile.handle,
							getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
						),
					}),
				);
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to follow', { message: String(e) });
					Toast.show(m['common.error.issueWithDetail']({ error: e.toString() }), { type: 'error' });
				}
			}
		});
	};

	const unfollow = () => {
		requireAuth(async () => {
			try {
				await queueUnfollow();
				onFollowChange?.(false);
				Toast.show(
					m['common.follow.noLongerFollowing']({
						name: sanitizeDisplayName(
							profile.displayName || profile.handle,
							getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
						),
					}),
					{ type: 'default' },
				);
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to unfollow', { message: String(e) });
					Toast.show(m['common.error.issueWithDetail']({ error: e.toString() }), { type: 'error' });
				}
			}
		});
	};

	const unblock = async () => {
		try {
			await queueUnblock();
			Toast.show(m['common.block.unblockedToast']());
		} catch (err) {
			const e = err as Error;
			if (e?.name !== 'AbortError') {
				logger.error('Failed to unblock account', { message: e });
				Toast.show(m['common.error.issueWithDetail']({ error: e.toString() }), { type: 'error' });
			}
		}
	};

	const value: ProfileHeaderContextValue = {
		actions: { follow, unblock, unfollow },
		meta: {
			hasSession,
			hideBackButton,
			isMe,
			isPlaceholderProfile,
			live,
			moderationOpts,
			relationship,
		},
		state: { descriptionRT, moderation, profile },
	};

	return <ProfileHeaderContext value={value}>{children}</ProfileHeaderContext>;
}
