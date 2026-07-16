import { useCallback, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useFocusEffect } from '@oomfware/stacker';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileFollowMutationQueue, useProfileQuery } from '#/state/queries/profile';
import { useRequireAuth } from '#/state/session';

import { logger } from '#/logger';

import { useBreakpoints } from '#/alf';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

export function ThreadItemAnchorFollowButton({ did, enabled = true }: { did: string; enabled?: boolean }) {
	return <ThreadItemAnchorFollowButtonInner did={did} enabled={enabled} />;
}

export function ThreadItemAnchorFollowButtonInner({
	did,
	enabled = true,
}: {
	did: string;
	enabled?: boolean;
}) {
	const { data: profile, isLoading } = useProfileQuery({ did });

	// We will never hit this - the profile will always be cached or loaded above
	// but it keeps the typechecker happy
	if (!enabled || isLoading || !profile) return null;

	return <PostThreadFollowBtnLoaded profile={profile} />;
}

function PostThreadFollowBtnLoaded({
	profile: profileUnshadowed,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const { gtMobile } = useBreakpoints();
	const profile = useProfileShadow(profileUnshadowed);
	const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile);
	const requireAuth = useRequireAuth();

	const isFollowing = !!profile.viewer?.following;
	const isFollowedBy = !!profile.viewer?.followedBy;
	const [wasFollowing, setWasFollowing] = useState<boolean>(isFollowing);

	// This prevents the button from disappearing as soon as we follow.
	const showFollowBtn = !isFollowing || !wasFollowing;

	const updateWasFollowing = useCallback(() => {
		if (wasFollowing !== isFollowing) {
			setWasFollowing(isFollowing);
		}
	}, [isFollowing, wasFollowing]);

	/** updates the following state on focus and blur to control button visibility. */
	useFocusEffect(
		useCallback(() => {
			updateWasFollowing();
			return updateWasFollowing;
		}, [updateWasFollowing]),
	);

	const onPress = () => {
		if (!isFollowing) {
			requireAuth(async () => {
				try {
					await queueFollow();
				} catch (e) {
					if (!(e instanceof Error && e.name === 'AbortError')) {
						logger.error('Failed to follow', { message: String(e) });
						Toast.show(m['common.error.issueWithDetail']({ error: String(e) }), {
							type: 'error',
						});
					}
				}
			});
		} else {
			requireAuth(async () => {
				try {
					await queueUnfollow();
				} catch (e) {
					if (!(e instanceof Error && e.name === 'AbortError')) {
						logger.error('Failed to unfollow', { message: String(e) });
						Toast.show(m['common.error.issueWithDetail']({ error: String(e) }), {
							type: 'error',
						});
					}
				}
			});
		}
	};

	if (!showFollowBtn) return null;

	return (
		<Button
			data-testid="followBtn"
			label={m['common.follow.a11y.follow']({ handle: profile.handle })}
			onClick={onPress}
			size="small"
			color={isFollowing ? 'secondary' : 'primary_subtle'}
		>
			{gtMobile && <ButtonIcon icon={isFollowing ? CheckIcon : PlusIcon} size="sm" />}
			<ButtonText>
				{!isFollowing
					? isFollowedBy
						? m['common.follow.action.followBack']()
						: m['common.follow.action.follow']()
					: m['common.follow.action.following']()}
			</ButtonText>
		</Button>
	);
}
