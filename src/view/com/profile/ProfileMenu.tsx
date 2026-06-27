import { useCallback, useMemo } from 'react';
import type { AppBskyActorDefs, AppBskyEmbedExternal } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { makeProfileLink } from '#/lib/routes/links';
import type { NavigationProp } from '#/lib/routes/types';
import { shareText, shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';

import type { Shadow } from '#/state/cache/types';
import {
	RQKEY as profileQueryKey,
	useProfileBlockMutationQueue,
	useProfileFollowMutationQueue,
	useProfileMuteMutationQueue,
} from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { useDialogControl } from '#/components/Dialog';
import { UserAddRemoveListsDialog } from '#/components/dialogs/lists/UserAddRemoveListsDialog';
import { StarterPackDialog } from '#/components/dialogs/StarterPackDialog';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { DotGrid3x1_Stroke2_Corner0_Rounded as Ellipsis } from '#/components/icons/DotGrid';
import { Flag_Stroke2_Corner0_Rounded as Flag } from '#/components/icons/Flag';
import { ListSparkle_Stroke2_Corner0_Rounded as List } from '#/components/icons/ListSparkle';
import { Live_Stroke2_Corner0_Rounded as LiveIcon } from '#/components/icons/Live';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon } from '#/components/icons/MagnifyingGlass';
import { Mute_Stroke2_Corner0_Rounded as Mute } from '#/components/icons/Mute';
import { PeopleRemove2_Stroke2_Corner0_Rounded as UserMinus } from '#/components/icons/PeopleRemove2';
import {
	PersonCheck_Stroke2_Corner0_Rounded as PersonCheck,
	PersonX_Stroke2_Corner0_Rounded as PersonX,
} from '#/components/icons/Person';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute } from '#/components/icons/Speaker';
import { StarterPack } from '#/components/icons/StarterPack';
import { BlockAccountPrompt } from '#/components/moderation/block-account-prompt';
import { MuteAccountPrompt } from '#/components/moderation/mute-account-prompt';
import { ReportDialog, useReportDialogControl } from '#/components/moderation/ReportDialog';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';
import { useDialogHandle } from '#/components/web/Dialog';
import * as Menu from '#/components/web/Menu';
import * as WebPrompt from '#/components/web/Prompt';

import { useActorStatus, useLiveNowConfig } from '#/features/liveNow';
import { EditLiveDialog } from '#/features/liveNow/components/EditLiveDialog';
import { GoLiveDialog } from '#/features/liveNow/components/GoLiveDialog';
import { GoLiveDisabledDialog } from '#/features/liveNow/components/GoLiveDisabledDialog';
import { useDevMode } from '#/storage/hooks/dev-mode';

const isAbortError = (error: unknown) => {
	return error instanceof Error && error.name === 'AbortError';
};

function ProfileMenu({
	profile,
}: {
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
}): React.ReactNode {
	const { t: l } = useLingui();
	const { currentAccount, hasSession } = useSession();
	const reportDialogControl = useReportDialogControl();
	const addToListsDialogControl = useDialogControl();
	const queryClient = useQueryClient();
	const navigation = useNavigation<NavigationProp>();
	const isSelf = currentAccount?.did === profile.did;
	const isFollowing = profile.viewer?.following;
	const isBlocked = profile.viewer?.blocking || profile.viewer?.blockedBy;
	const isFollowingBlockedAccount = isFollowing && isBlocked;
	const isLabelerAndNotBlocked = !!profile.associated?.labeler && !isBlocked;
	const [devModeEnabled] = useDevMode();
	const { canGoLive } = useLiveNowConfig();
	const status = useActorStatus(profile);

	const [queueMute, queueUnmute] = useProfileMuteMutationQueue(profile);
	const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile);
	const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile);

	const blockPromptHandle = WebPrompt.usePromptHandle();
	const mutePromptHandle = WebPrompt.usePromptHandle();
	const loggedOutWarningPromptHandle = WebPrompt.usePromptHandle();
	const goLiveDialogHandle = useDialogHandle();
	const goLiveDisabledDialogHandle = useDialogHandle();
	const addToStarterPacksDialogControl = useDialogControl();

	const showLoggedOutWarning = useMemo(() => {
		return (
			profile.did !== currentAccount?.did &&
			!!profile.labels?.find((label) => label.val === '!no-unauthenticated')
		);
	}, [currentAccount, profile]);

	const invalidateProfileQuery = useCallback(() => {
		void queryClient.invalidateQueries({
			queryKey: profileQueryKey(profile.did),
		});
	}, [queryClient, profile.did]);

	const onPressAddToStarterPacks = useCallback(() => {
		addToStarterPacksDialogControl.open();
	}, [addToStarterPacksDialogControl]);

	const onPressShare = useCallback(() => {
		void shareUrl(toShareUrl(makeProfileLink(profile)));
	}, [profile]);

	const onPressMuteAccount = useCallback(async () => {
		if (profile.viewer?.muted) {
			try {
				await queueUnmute();
				Toast.show(l({ message: 'Account unmuted', context: 'toast' }));
			} catch (e) {
				if (!isAbortError(e)) {
					logger.error('Failed to unmute account', { message: e });
					Toast.show(l`There was an issue! ${String(e)}`, {
						type: 'error',
					});
				}
			}
		} else {
			try {
				await queueMute();
				Toast.show(l({ message: 'Account muted', context: 'toast' }));
			} catch (e) {
				if (!isAbortError(e)) {
					logger.error('Failed to mute account', { message: e });
					Toast.show(l`There was an issue! ${String(e)}`, {
						type: 'error',
					});
				}
			}
		}
	}, [profile.viewer?.muted, queueUnmute, l, queueMute]);

	const blockAccount = useCallback(async () => {
		if (profile.viewer?.blocking) {
			try {
				await queueUnblock();
				Toast.show(l({ message: 'Account unblocked', context: 'toast' }));
			} catch (e) {
				if (!isAbortError(e)) {
					logger.error('Failed to unblock account', { message: e });
					Toast.show(l`There was an issue! ${String(e)}`, {
						type: 'error',
					});
				}
			}
		} else {
			try {
				await queueBlock();
				Toast.show(l({ message: 'Account blocked', context: 'toast' }));
			} catch (e) {
				if (!isAbortError(e)) {
					logger.error('Failed to block account', { message: e });
					Toast.show(l`There was an issue! ${String(e)}`, {
						type: 'error',
					});
				}
			}
		}
	}, [profile.viewer?.blocking, l, queueUnblock, queueBlock]);

	const onPressFollowAccount = useCallback(async () => {
		try {
			await queueFollow();
			Toast.show(l({ message: 'Account followed', context: 'toast' }));
		} catch (e) {
			if (!isAbortError(e)) {
				logger.error('Failed to follow account', { message: e });
				Toast.show(l`There was an issue! ${String(e)}`, {
					type: 'error',
				});
			}
		}
	}, [l, queueFollow]);

	const onPressUnfollowAccount = useCallback(async () => {
		try {
			await queueUnfollow();
			Toast.show(l({ message: 'Account unfollowed', context: 'toast' }));
		} catch (e) {
			if (!isAbortError(e)) {
				logger.error('Failed to unfollow account', { message: e });
				Toast.show(l`There was an issue! ${String(e)}`, {
					type: 'error',
				});
			}
		}
	}, [l, queueUnfollow]);

	const onPressReportAccount = useCallback(() => {
		reportDialogControl.open(null);
	}, [reportDialogControl]);

	const onPressShareATUri = useCallback(() => {
		void shareText(`at://${profile.did}`);
	}, [profile.did]);

	const onPressShareDID = useCallback(() => {
		void shareText(profile.did);
	}, [profile.did]);

	const onPressSearch = useCallback(() => {
		navigation.navigate('ProfileSearch', { name: profile.did });
	}, [navigation, profile.did]);

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button label={l`More options`} variant="solid" color="secondary" size="small" shape="round">
							<ButtonIcon icon={Ellipsis} size="sm" />
						</Button>
					}
				/>

				<Menu.Popup label={l`More options`} align="end" minWidth={170}>
					<Menu.Group>
						<Menu.Item
							label={l`Copy link to profile`}
							onClick={() => {
								if (showLoggedOutWarning) {
									loggedOutWarningPromptHandle.open(null);
								} else {
									onPressShare();
								}
							}}
						>
							<Menu.ItemText>
								<Trans>Copy link to profile</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={ChainLinkIcon} />
						</Menu.Item>
						<Menu.Item label={l`Search posts`} onClick={onPressSearch}>
							<Menu.ItemText>
								<Trans>Search posts</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={SearchIcon} />
						</Menu.Item>
					</Menu.Group>

					{hasSession && (
						<>
							<Menu.Separator />
							<Menu.Group>
								{!isSelf && (
									<>
										{(isLabelerAndNotBlocked || isFollowingBlockedAccount) && (
											<Menu.Item
												label={isFollowing ? l`Unfollow account` : l`Follow account`}
												onClick={() => void (isFollowing ? onPressUnfollowAccount() : onPressFollowAccount())}
											>
												<Menu.ItemText>
													{isFollowing ? <Trans>Unfollow account</Trans> : <Trans>Follow account</Trans>}
												</Menu.ItemText>
												<Menu.ItemIcon icon={isFollowing ? UserMinus : Plus} />
											</Menu.Item>
										)}
									</>
								)}
								<Menu.Item label={l`Add to starter packs`} onClick={onPressAddToStarterPacks}>
									<Menu.ItemText>
										<Trans>Add to starter packs</Trans>
									</Menu.ItemText>
									<Menu.ItemIcon icon={StarterPack} />
								</Menu.Item>
								<Menu.Item label={l`Add to lists`} onClick={addToListsDialogControl.open}>
									<Menu.ItemText>
										<Trans>Add to lists</Trans>
									</Menu.ItemText>
									<Menu.ItemIcon icon={List} />
								</Menu.Item>
								{isSelf && canGoLive && (
									<Menu.Item
										label={
											status.isDisabled
												? l`Go live (disabled)`
												: status.isActive
													? l`Edit live status`
													: l`Go live`
										}
										onClick={() => {
											if (status.isDisabled) {
												goLiveDisabledDialogHandle.open(null);
											} else {
												goLiveDialogHandle.open(null);
											}
										}}
									>
										<Menu.ItemText>
											{status.isDisabled ? (
												<Trans>Go live (disabled)</Trans>
											) : status.isActive ? (
												<Trans>Edit live status</Trans>
											) : (
												<Trans>Go live</Trans>
											)}
										</Menu.ItemText>
										<Menu.ItemIcon icon={LiveIcon} />
									</Menu.Item>
								)}
								{!isSelf && (
									<>
										{!profile.viewer?.blocking && !profile.viewer?.mutedByList && (
											<Menu.Item
												label={profile.viewer?.muted ? l`Unmute account` : l`Mute account`}
												onClick={() => mutePromptHandle.open(null)}
											>
												<Menu.ItemText>
													{profile.viewer?.muted ? (
														<Trans>Unmute account</Trans>
													) : (
														<Trans>Mute account</Trans>
													)}
												</Menu.ItemText>
												<Menu.ItemIcon icon={profile.viewer?.muted ? Unmute : Mute} />
											</Menu.Item>
										)}
										{!profile.viewer?.blockingByList && (
											<Menu.Item
												label={profile.viewer ? l`Unblock account` : l`Block account`}
												onClick={() => blockPromptHandle.open(null)}
											>
												<Menu.ItemText>
													{profile.viewer?.blocking ? (
														<Trans>Unblock account</Trans>
													) : (
														<Trans>Block account</Trans>
													)}
												</Menu.ItemText>
												<Menu.ItemIcon icon={profile.viewer?.blocking ? PersonCheck : PersonX} />
											</Menu.Item>
										)}
										<Menu.Item label={l`Report account`} onClick={onPressReportAccount}>
											<Menu.ItemText>
												<Trans>Report account</Trans>
											</Menu.ItemText>
											<Menu.ItemIcon icon={Flag} />
										</Menu.Item>
									</>
								)}
							</Menu.Group>
						</>
					)}
					{devModeEnabled ? (
						<>
							<Menu.Separator />
							<Menu.Group>
								<Menu.Item label={l`Copy at:// URI`} onClick={onPressShareATUri}>
									<Menu.ItemText>
										<Trans>Copy at:// URI</Trans>
									</Menu.ItemText>
									<Menu.ItemIcon icon={ClipboardIcon} />
								</Menu.Item>
								<Menu.Item label={l`Copy DID`} onClick={onPressShareDID}>
									<Menu.ItemText>
										<Trans>Copy DID</Trans>
									</Menu.ItemText>
									<Menu.ItemIcon icon={ClipboardIcon} />
								</Menu.Item>
							</Menu.Group>
						</>
					) : null}
				</Menu.Popup>
			</Menu.Root>
			<StarterPackDialog control={addToStarterPacksDialogControl} targetDid={profile.did} />
			<UserAddRemoveListsDialog
				control={addToListsDialogControl}
				profile={profile}
				onChange={invalidateProfileQuery}
			/>
			<ReportDialog
				control={reportDialogControl}
				subject={
					{
						...profile,
						$type: 'app.bsky.actor.defs#profileViewDetailed',
					} as unknown as Parameters<typeof ReportDialog>[0]['subject']
				}
			/>
			<BlockAccountPrompt
				handle={blockPromptHandle}
				isBlocking={!!profile.viewer?.blocking}
				isLabeler={!!profile.associated?.labeler}
				onConfirm={() => void blockAccount()}
			/>
			<MuteAccountPrompt
				handle={mutePromptHandle}
				isMuted={!!profile.viewer?.muted}
				onConfirm={() => void onPressMuteAccount()}
			/>
			<WebPrompt.Basic
				handle={loggedOutWarningPromptHandle}
				title={l`Note about sharing`}
				description={l`This profile is only visible to logged-in users. It won't be visible to people who aren't signed in.`}
				onConfirm={onPressShare}
				confirmButtonCta={l`Share anyway`}
			/>
			{status.isDisabled ? (
				<GoLiveDisabledDialog handle={goLiveDisabledDialogHandle} status={status} />
			) : status.isActive ? (
				<EditLiveDialog
					embed={status.embed as AppBskyEmbedExternal.View}
					handle={goLiveDialogHandle}
					status={status}
				/>
			) : (
				<GoLiveDialog handle={goLiveDialogHandle} profile={profile} />
			)}
		</>
	);
}

export { ProfileMenu };
