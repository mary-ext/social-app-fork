import { useState } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useDeleteActorDeclaration } from '#/state/queries/messages/actor-declaration';
import { useProfileQuery, useProfilesQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession, useSessionApi } from '#/state/session';
import { useCloseAllActiveElements } from '#/state/util';

import { useBreakpoints } from '#/alf';

import { AvatarStackWithFetch } from '#/components/AvatarStack';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon } from '#/components/icons/Accessibility';
import { Bell_Stroke2_Corner0_Rounded as NotificationIcon } from '#/components/icons/Bell';
import { BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon } from '#/components/icons/BubbleInfo';
import { ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon } from '#/components/icons/Chevron';
import { CodeBrackets_Stroke2_Corner2_Rounded as CodeBracketsIcon } from '#/components/icons/CodeBrackets';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon } from '#/components/icons/PaintRoller';
import {
	Person_Stroke2_Corner2_Rounded as PersonIcon,
	PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon,
	PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon,
	PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person';
import { RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon } from '#/components/icons/RaisingHand';
import { Window_Stroke2_Corner2_Rounded as WindowIcon } from '#/components/icons/Window';
import { ProfileBadges } from '#/components/ProfileBadges';
import * as SettingsList from '#/components/SettingsList';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import * as Layout from '#/components/web/Layout';
import * as Menu from '#/components/web/Menu';
import * as Prompt from '#/components/web/Prompt';

import { IS_DEV } from '#/env';
import { useActorStatus } from '#/features/liveNow';
import { account, auth, device } from '#/storage';
import { useDebugFeedContextEnabled } from '#/storage/hooks/debug';

import * as styles from './Settings.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>;
export function SettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const { logoutEveryAccount } = useSessionApi();
	const { accounts, currentAccount } = useSession();
	const signOutPromptHandle = Prompt.usePromptHandle();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const { data: otherProfiles } = useProfilesQuery({
		handles: accounts.filter((acc) => acc.did !== currentAccount?.did).map((acc) => acc.handle),
	});
	const { onPressSwitchAccount, pendingDid } = useAccountSwitcher();
	const [showAccounts, setShowAccounts] = useState(false);
	const [showDevOptions, setShowDevOptions] = useState(false);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Settings</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<div className={styles.profileWrap}>{profile && <ProfilePreview profile={profile} />}</div>
					{accounts.length > 1 ? (
						<>
							<SettingsList.PressableItem
								accessibilityHint={l`Shows other accounts you can switch to`}
								label={l`Switch account`}
								onPress={() => setShowAccounts((s) => !s)}
							>
								<SettingsList.ItemIcon icon={PersonGroupIcon} />
								<SettingsList.ItemText>
									<Trans>Switch account</Trans>
								</SettingsList.ItemText>
								{showAccounts ? (
									<span className={styles.chevron}>
										<ChevronUpIcon fill="currentColor" size="md" />
									</span>
								) : (
									<AvatarStackWithFetch
										profiles={accounts
											.map((acc) => acc.did)
											.filter((did) => did !== currentAccount?.did)
											.slice(0, 5)}
									/>
								)}
							</SettingsList.PressableItem>
							{showAccounts && (
								<>
									<SettingsList.Divider />
									{accounts
										.filter((acc) => acc.did !== currentAccount?.did)
										.map((account) => (
											<AccountRow
												account={account}
												key={account.did}
												onPressSwitchAccount={(account) => void onPressSwitchAccount(account)}
												pendingDid={pendingDid}
												profile={otherProfiles?.profiles?.find((p) => p.did === account.did)}
											/>
										))}
									<AddAccountRow />
								</>
							)}
						</>
					) : (
						<AddAccountRow />
					)}
					<SettingsList.Divider />
					<SettingsList.LinkItem label={l`Account and privacy`} to="/settings/account">
						<SettingsList.ItemIcon icon={PersonIcon} />
						<SettingsList.ItemText>
							<Trans>Account & privacy</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem label={l`Moderation and content filters`} to="/moderation">
						<SettingsList.ItemIcon icon={HandIcon} />
						<SettingsList.ItemText>
							<Trans>Moderation and content filters</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem label={l`Notifications`} to="/settings/notifications">
						<SettingsList.ItemIcon icon={NotificationIcon} />
						<SettingsList.ItemText>
							<Trans>Notifications</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem label={l`Content and media`} to="/settings/content-and-media">
						<SettingsList.ItemIcon icon={WindowIcon} />
						<SettingsList.ItemText>
							<Trans>Content and media</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem label={l`Appearance`} to="/settings/appearance">
						<SettingsList.ItemIcon icon={PaintRollerIcon} />
						<SettingsList.ItemText>
							<Trans>Appearance</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem label={l`Accessibility`} to="/settings/accessibility">
						<SettingsList.ItemIcon icon={AccessibilityIcon} />
						<SettingsList.ItemText>
							<Trans>Accessibility</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem label={l`Languages`} to="/settings/language">
						<SettingsList.ItemIcon icon={EarthIcon} />
						<SettingsList.ItemText>
							<Trans>Languages</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem label={l`About`} to="/settings/about">
						<SettingsList.ItemIcon icon={BubbleInfoIcon} />
						<SettingsList.ItemText>
							<Trans>About</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.Divider />
					<SettingsList.PressableItem
						destructive
						label={l`Sign out`}
						onPress={() => signOutPromptHandle.open(null)}
					>
						<SettingsList.ItemText>
							<Trans>Sign out</Trans>
						</SettingsList.ItemText>
					</SettingsList.PressableItem>
					{IS_DEV && (
						<>
							<SettingsList.Divider />
							<SettingsList.PressableItem
								label={l`Developer options`}
								onPress={() => setShowDevOptions((d) => !d)}
							>
								<SettingsList.ItemIcon icon={CodeBracketsIcon} />
								<SettingsList.ItemText>
									<Trans>Developer options</Trans>
								</SettingsList.ItemText>
							</SettingsList.PressableItem>
							{showDevOptions && <DevOptions />}
						</>
					)}
				</SettingsList.Container>
			</Layout.Content>

			<Prompt.Basic
				cancelButtonCta={l`Cancel`}
				confirmButtonColor="negative"
				confirmButtonCta={l`Sign out`}
				description={l`You will be signed out of all your accounts.`}
				handle={signOutPromptHandle}
				onConfirm={() => logoutEveryAccount()}
				title={l`Sign out?`}
			/>
		</Layout.Screen>
	);
}

function ProfilePreview({ profile }: { profile: AppBskyActorDefs.ProfileViewDetailed }) {
	const { gtMobile } = useBreakpoints();
	const shadow = useProfileShadow(profile);
	const moderationOpts = useModerationOpts();
	const { isActive: live } = useActorStatus(profile);

	if (!moderationOpts) return null;

	const moderation = moderateProfile(profile, moderationOpts);
	const displayName = sanitizeDisplayName(
		profile.displayName || sanitizeHandle(profile.handle),
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);

	return (
		<>
			<UserAvatar
				avatar={shadow.avatar}
				live={live}
				moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
				size={80}
				type={shadow.associated?.labeler ? 'labeler' : 'user'}
			/>
			<div className={styles.nameRow}>
				<Text
					className={styles.displayName}
					numberOfLines={1}
					size={gtMobile ? '_4xl' : '_3xl'}
					weight="bold"
				>
					{displayName}
				</Text>
				<div className={styles.badges}>
					<ProfileBadges interactive profile={shadow} size="xl" />
				</div>
			</div>
			<Text color="textContrastMedium" leading="snug" size="md">
				{sanitizeHandle(profile.handle, '@')}
			</Text>
		</>
	);
}

function DevOptions() {
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const { mutate: deleteChatDeclarationRecord } = useDeleteActorDeclaration();
	const [debugFeedContextEnabled, setDebugFeedContextEnabled] = useDebugFeedContextEnabled();

	const clearAllStorage = () => {
		account.removeAll();
		auth.removeAll();
		device.removeAll();
		Toast.show(l`Storage cleared, you need to restart the app now.`);
	};

	return (
		<>
			<SettingsList.CheckboxItem
				label={l`Show feed context debug`}
				onChange={setDebugFeedContextEnabled}
				value={debugFeedContextEnabled}
			>
				<SettingsList.ItemText>
					<Trans>Show feed context debug</Trans>
				</SettingsList.ItemText>
				<SettingsList.CheckboxBox />
			</SettingsList.CheckboxItem>
			<SettingsList.PressableItem label={l`Open system log`} onPress={() => navigation.navigate('Log')}>
				<SettingsList.ItemText>
					<Trans>System log</Trans>
				</SettingsList.ItemText>
			</SettingsList.PressableItem>
			<SettingsList.PressableItem label={l`Open storybook page`} onPress={() => navigation.navigate('Debug')}>
				<SettingsList.ItemText>
					<Trans>Storybook</Trans>
				</SettingsList.ItemText>
			</SettingsList.PressableItem>
			<SettingsList.PressableItem
				label={l`Open moderation debug page`}
				onPress={() => navigation.navigate('DebugMod')}
			>
				<SettingsList.ItemText>
					<Trans>Debug Moderation</Trans>
				</SettingsList.ItemText>
			</SettingsList.PressableItem>
			<SettingsList.PressableItem
				label={l`Delete chat declaration record`}
				onPress={() => deleteChatDeclarationRecord()}
			>
				<SettingsList.ItemText>
					<Trans>Delete chat declaration record</Trans>
				</SettingsList.ItemText>
			</SettingsList.PressableItem>
			<SettingsList.PressableItem label={l`Clear all storage data`} onPress={() => void clearAllStorage()}>
				<SettingsList.ItemText>
					<Trans>Clear all storage data (restart after this)</Trans>
				</SettingsList.ItemText>
			</SettingsList.PressableItem>
		</>
	);
}

function AddAccountRow() {
	const { t: l } = useLingui();
	const { signinDialogControl } = useGlobalDialogsControlContext();
	const closeEverything = useCloseAllActiveElements();

	const onAddAnotherAccount = () => {
		closeEverything();
		signinDialogControl.open({ showStoredAccounts: false });
	};

	return (
		<SettingsList.PressableItem label={l`Add another account`} onPress={onAddAnotherAccount}>
			<SettingsList.ItemIcon icon={PersonPlusIcon} />
			<SettingsList.ItemText>
				<Trans>Add another account</Trans>
			</SettingsList.ItemText>
		</SettingsList.PressableItem>
	);
}

function AccountRow({
	account,
	onPressSwitchAccount,
	pendingDid,
	profile,
}: {
	account: SessionAccount;
	onPressSwitchAccount: (account: SessionAccount) => void;
	pendingDid: string | null;
	profile?: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const { t: l } = useLingui();
	const moderationOpts = useModerationOpts();
	const removePromptHandle = Prompt.usePromptHandle();
	const { removeAccount } = useSessionApi();
	const { isActive: live } = useActorStatus(profile);

	const onSwitchAccount = () => {
		if (pendingDid) return;
		onPressSwitchAccount(account);
	};

	return (
		<div className={styles.accountRow}>
			<SettingsList.PressableItem label={l`Switch account`} onPress={onSwitchAccount}>
				{moderationOpts && profile ? (
					<UserAvatar
						avatar={profile.avatar}
						hideLiveBadge
						live={live}
						moderation={getDisplayRestrictions(
							moderateProfile(profile, moderationOpts),
							DisplayContext.ProfileMedia,
						)}
						size={28}
						type={profile.associated?.labeler ? 'labeler' : 'user'}
					/>
				) : (
					<div className={styles.avatarPlaceholder} />
				)}
				<Text className={styles.handle} numberOfLines={1} size="md">
					{sanitizeHandle(account.handle, '@')}
				</Text>
				{pendingDid === account.did && (
					<Spinner color="currentColor" label={l`Switching account`} size="sm" />
				)}
			</SettingsList.PressableItem>
			{!pendingDid && (
				<Menu.Root>
					<Menu.Trigger aria-label={l`Account options`} className={styles.menuTrigger}>
						<DotsHorizontal fill="currentColor" size="md" />
					</Menu.Trigger>
					<Menu.Popup label={l`Account options`}>
						<Menu.Item label={l`Remove account`} onClick={() => removePromptHandle.open(null)}>
							<Menu.ItemText>
								<Trans>Remove account</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={PersonXIcon} />
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			)}

			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={l`Remove`}
				description={l`This will remove @${account.handle} from the quick access list.`}
				handle={removePromptHandle}
				onConfirm={() => {
					removeAccount(account);
					Toast.show(l`Account removed from quick access`);
				}}
				title={l`Remove from quick access?`}
			/>
		</div>
	);
}
