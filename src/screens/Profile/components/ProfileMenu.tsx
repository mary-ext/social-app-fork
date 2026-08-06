import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';

import { targetToShareUrl } from '#/lib/routes/app-links';
import { profileTarget } from '#/lib/routes/targets';
import { isAbortError } from '#/lib/strings/errors';

import type { Shadow } from '#/state/cache/types';
import { useDevMode } from '#/state/preferences/dev-mode';
import {
	RQKEY as profileQueryKey,
	useProfileBlockMutationQueue,
	useProfileFollowMutationQueue,
	useProfileMuteMutationQueue,
} from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { EditLiveDialog } from '#/features/liveNow/components/EditLiveDialog';
import { GoLiveDialog } from '#/features/liveNow/components/GoLiveDialog';
import { GoLiveDisabledDialog } from '#/features/liveNow/components/GoLiveDisabledDialog';
import { useActorStatus, useLiveNowConfig } from '#/features/liveNow/use-actor-status';

import * as Dialog from '#/components/Dialog';
import { UserAddRemoveListsDialog } from '#/components/dialogs/lists/UserAddRemoveListsDialog';
import { StarterPackDialog } from '#/components/dialogs/StarterPackDialog';
import * as Menu from '#/components/Menu';
import { BlockAccountPrompt } from '#/components/moderation/block-account-prompt';
import { MuteAccountPrompt } from '#/components/moderation/mute-account-prompt';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import { shareText, shareUrl } from '#/components/sharing';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';

import ChainLinkIcon from '#/icons/central/ChainLink3_round_outlined_radius1_stroke2.svg';
import ClipboardIcon from '#/icons/central/Clipboard_round_outlined_radius1_stroke2.svg';
import Ellipsis from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import Flag from '#/icons/central/Flag1_round_outlined_radius1_stroke2.svg';
import List from '#/icons/central/ListSparkle_round_outlined_radius1_stroke2.svg';
import LiveIcon from '#/icons/central/LiveFull_round_outlined_radius1_stroke2.svg';
import SearchIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import Mute from '#/icons/central/Mute_round_outlined_radius1_stroke2.svg';
import PersonCheck from '#/icons/central/PeopleAdded_round_outlined_radius1_stroke2.svg';
import UserMinus from '#/icons/central/PeopleRemove2_round_outlined_radius1_stroke2.svg';
import PersonX from '#/icons/central/PeopleRemove_round_outlined_radius1_stroke2.svg';
import Unmute from '#/icons/central/VolumeFull_round_outlined_radius1_stroke2.svg';
import StarterPack from '#/icons/original/StarterPack.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

function ProfileMenu({
	profile,
}: {
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
}): React.ReactNode {
	const { currentAccount, hasSession } = useSession();
	const reportDialogHandle = Dialog.useDialogHandle();
	const addToListsDialogHandle = Dialog.useDialogHandle();
	const queryClient = useQueryClient();
	const router = useRouter();
	const isSelf = currentAccount?.did === profile.did;
	const isFollowing = profile.viewer?.following;
	const isBlocked = profile.viewer?.blocking || profile.viewer?.blockedBy;
	const isFollowingBlockedAccount = isFollowing && isBlocked;
	const devModeEnabled = useDevMode();
	const { canGoLive } = useLiveNowConfig();
	const status = useActorStatus(profile);

	const [queueMute, queueUnmute] = useProfileMuteMutationQueue(profile);
	const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile);
	const [, queueUnfollow] = useProfileFollowMutationQueue(profile);

	const blockPromptHandle = Prompt.usePromptHandle();
	const mutePromptHandle = Prompt.usePromptHandle();
	const loggedOutWarningPromptHandle = Prompt.usePromptHandle();
	const goLiveDialogHandle = Dialog.useDialogHandle();
	const goLiveDisabledDialogHandle = Dialog.useDialogHandle();
	const addToStarterPacksDialogHandle = Dialog.useDialogHandle();

	const showLoggedOutWarning =
		profile.did !== currentAccount?.did &&
		!!profile.labels?.find((label) => label.val === '!no-unauthenticated');

	const invalidateProfileQuery = () => {
		void queryClient.invalidateQueries({
			queryKey: profileQueryKey(profile.did),
		});
	};

	const onPressAddToStarterPacks = () => {
		addToStarterPacksDialogHandle.open(null);
	};

	const onPressShare = () => {
		void shareUrl(targetToShareUrl(profileTarget(profile.did)));
	};

	const onPressMuteAccount = async () => {
		if (profile.viewer?.muted) {
			try {
				await queueUnmute();
				Toast.show(m['common.mute.unmutedToast']());
			} catch (e) {
				if (!isAbortError(e)) {
					Toast.show(m['common.error.issueWithDetail']({ error: String(e) }), {
						type: 'error',
					});
				}
			}
		} else {
			try {
				await queueMute();
				Toast.show(m['common.mute.mutedToast']());
			} catch (e) {
				if (!isAbortError(e)) {
					Toast.show(m['common.error.issueWithDetail']({ error: String(e) }), {
						type: 'error',
					});
				}
			}
		}
	};

	const blockAccount = async () => {
		if (profile.viewer?.blocking) {
			try {
				await queueUnblock();
				Toast.show(m['common.block.unblockedToast']());
			} catch (e) {
				if (!isAbortError(e)) {
					Toast.show(m['common.error.issueWithDetail']({ error: String(e) }), {
						type: 'error',
					});
				}
			}
		} else {
			try {
				await queueBlock();
				Toast.show(m['common.block.blockedToast']());
			} catch (e) {
				if (!isAbortError(e)) {
					Toast.show(m['common.error.issueWithDetail']({ error: String(e) }), {
						type: 'error',
					});
				}
			}
		}
	};

	const onPressUnfollowAccount = async () => {
		try {
			await queueUnfollow();
			Toast.show(m['view.profile.follow.unfollowedToast']());
		} catch (e) {
			if (!isAbortError(e)) {
				Toast.show(m['common.error.issueWithDetail']({ error: String(e) }), {
					type: 'error',
				});
			}
		}
	};

	const onPressReportAccount = () => {
		reportDialogHandle.open(null);
	};

	const onPressShareATUri = () => {
		void shareText(`at://${profile.did}`);
	};

	const onPressShareDID = () => {
		void shareText(profile.did);
	};

	const onPressSearch = () => {
		router.navigate({ to: { name: 'ProfileSearch', actor: profile.did } });
	};

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							label={m['common.a11y.moreOptions']()}
							variant="solid"
							color="secondary"
							size="small"
							shape="round"
						>
							<ButtonIcon icon={Ellipsis} size="sm" />
						</Button>
					}
				/>

				<Menu.Popup label={m['common.a11y.moreOptions']()} align="end" minWidth={170}>
					<Menu.Group>
						<Menu.Item
							label={m['view.profile.sharing.action.copyLink']()}
							onClick={() => {
								if (showLoggedOutWarning) {
									loggedOutWarningPromptHandle.open(null);
								} else {
									onPressShare();
								}
							}}
						>
							<Menu.ItemText>{m['view.profile.sharing.action.copyLink']()}</Menu.ItemText>
							<Menu.ItemIcon icon={ChainLinkIcon} />
						</Menu.Item>
						<Menu.Item label={m['view.profile.action.searchPosts']()} onClick={onPressSearch}>
							<Menu.ItemText>{m['view.profile.action.searchPosts']()}</Menu.ItemText>
							<Menu.ItemIcon icon={SearchIcon} />
						</Menu.Item>
					</Menu.Group>

					{hasSession && (
						<>
							<Menu.Separator />
							<Menu.Group>
								{!isSelf && isFollowingBlockedAccount && (
									<Menu.Item
										label={m['view.profile.follow.action.unfollow']()}
										onClick={() => void onPressUnfollowAccount()}
									>
										<Menu.ItemText>{m['view.profile.follow.action.unfollow']()}</Menu.ItemText>
										<Menu.ItemIcon icon={UserMinus} />
									</Menu.Item>
								)}
								<Menu.Item label={m['common.starterPack.action.add']()} onClick={onPressAddToStarterPacks}>
									<Menu.ItemText>{m['common.starterPack.action.add']()}</Menu.ItemText>
									<Menu.ItemIcon icon={StarterPack} />
								</Menu.Item>
								<Menu.Item
									label={m['view.profile.list.add']()}
									onClick={() => addToListsDialogHandle.open(null)}
								>
									<Menu.ItemText>{m['view.profile.list.add']()}</Menu.ItemText>
									<Menu.ItemIcon icon={List} />
								</Menu.Item>
								{isSelf && canGoLive && (
									<Menu.Item
										label={
											status.isDisabled
												? m['view.profile.liveStatus.action.goLiveDisabled']()
												: status.isActive
													? m['view.profile.liveStatus.action.edit']()
													: m['features.liveNow.goLive.confirm']()
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
											{status.isDisabled
												? m['view.profile.liveStatus.action.goLiveDisabled']()
												: status.isActive
													? m['view.profile.liveStatus.action.edit']()
													: m['features.liveNow.goLive.confirm']()}
										</Menu.ItemText>
										<Menu.ItemIcon icon={LiveIcon} />
									</Menu.Item>
								)}
								{!isSelf && (
									<>
										{!profile.viewer?.blocking && !profile.viewer?.mutedByList && (
											<Menu.Item
												label={
													profile.viewer?.muted
														? m['common.mute.action.unmuteAccount']()
														: m['common.mute.action.muteAccount']()
												}
												onClick={() => mutePromptHandle.open(null)}
											>
												<Menu.ItemText>
													{profile.viewer?.muted
														? m['common.mute.action.unmuteAccount']()
														: m['common.mute.action.muteAccount']()}
												</Menu.ItemText>
												<Menu.ItemIcon icon={profile.viewer?.muted ? Unmute : Mute} />
											</Menu.Item>
										)}
										{!profile.viewer?.blockingByList && (
											<Menu.Item
												label={
													profile.viewer
														? m['common.block.action.unblockAccount']()
														: m['common.block.action.blockAccount']()
												}
												onClick={() => blockPromptHandle.open(null)}
											>
												<Menu.ItemText>
													{profile.viewer?.blocking
														? m['common.block.action.unblockAccount']()
														: m['common.block.action.blockAccount']()}
												</Menu.ItemText>
												<Menu.ItemIcon icon={profile.viewer?.blocking ? PersonCheck : PersonX} />
											</Menu.Item>
										)}
										<Menu.Item label={m['view.profile.action.report']()} onClick={onPressReportAccount}>
											<Menu.ItemText>{m['view.profile.action.report']()}</Menu.ItemText>
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
								<Menu.Item label={m['view.profile.sharing.action.copyUri']()} onClick={onPressShareATUri}>
									<Menu.ItemText>{m['view.profile.sharing.action.copyUri']()}</Menu.ItemText>
									<Menu.ItemIcon icon={ClipboardIcon} />
								</Menu.Item>
								<Menu.Item label={m['view.profile.sharing.action.copyDid']()} onClick={onPressShareDID}>
									<Menu.ItemText>{m['view.profile.sharing.action.copyDid']()}</Menu.ItemText>
									<Menu.ItemIcon icon={ClipboardIcon} />
								</Menu.Item>
							</Menu.Group>
						</>
					) : null}
				</Menu.Popup>
			</Menu.Root>
			<StarterPackDialog handle={addToStarterPacksDialogHandle} targetDid={profile.did} />
			<UserAddRemoveListsDialog
				handle={addToListsDialogHandle}
				profile={profile}
				onChange={invalidateProfileQuery}
			/>
			<ReportDialog
				handle={reportDialogHandle}
				subject={{
					$type: 'app.bsky.actor.defs#profileViewDetailed',
					...profile,
				}}
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
			<Prompt.Basic
				handle={loggedOutWarningPromptHandle}
				title={m['view.profile.sharing.note']()}
				description={m['view.profile.sharing.loggedInOnly.message']()}
				onConfirm={onPressShare}
				confirmButtonCta={m['view.profile.sharing.loggedInOnly.confirm']()}
			/>
			{status.isDisabled ? (
				<GoLiveDisabledDialog handle={goLiveDisabledDialogHandle} status={status} />
			) : status.isActive && status.embed ? (
				<EditLiveDialog embed={status.embed} handle={goLiveDialogHandle} status={status} />
			) : (
				<GoLiveDialog handle={goLiveDialogHandle} profile={profile} />
			)}
		</>
	);
}

export { ProfileMenu };
