import { createContext, use, useCallback, useMemo } from 'react';
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
 * The viewer's relationship to the profile, as a single discriminant. Drives which action buttons a header
 * variant renders, replacing the nested `isMe ? … : blocking ? …` ternary.
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
 * Lifts every piece of derived profile-header state into one place: the shadowed profile, the moderation
 * decision, the follow/block mutation queues, live status, and the viewer relationship. Header subcomponents
 * consume it via {@link useProfileHeader} rather than recomputing it.
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
	const moderation = useMemo(() => moderateProfile(profile, moderationOpts), [profile, moderationOpts]);
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

	const follow = useCallback(() => {
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
	}, [moderation, onFollowChange, profile.displayName, profile.handle, queueFollow, requireAuth]);

	const unfollow = useCallback(() => {
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
	}, [moderation, onFollowChange, profile.displayName, profile.handle, queueUnfollow, requireAuth]);

	const unblock = useCallback(async () => {
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
	}, [queueUnblock]);

	const value = useMemo<ProfileHeaderContextValue>(
		() => ({
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
		}),
		[
			descriptionRT,
			follow,
			hasSession,
			hideBackButton,
			isMe,
			isPlaceholderProfile,
			live,
			moderation,
			moderationOpts,
			profile,
			relationship,
			unblock,
			unfollow,
		],
	);

	return <ProfileHeaderContext value={value}>{children}</ProfileHeaderContext>;
}
