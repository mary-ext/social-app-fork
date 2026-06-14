import { useRef, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { clsx } from 'clsx';

import { getDeviceId } from '#/lib/device-id';
import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';

import { useDeleteActorDeclaration } from '#/state/queries/messages/actor-declaration';
import { useSessionApi } from '#/state/session';

import { Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon } from '#/components/icons/Accessibility';
import { Bell_Stroke2_Corner0_Rounded as NotificationIcon } from '#/components/icons/Bell';
import { CodeBrackets_Stroke2_Corner2_Rounded as CodeBracketsIcon } from '#/components/icons/CodeBrackets';
import { CodeLines_Stroke2_Corner2_Rounded as CodeLinesIcon } from '#/components/icons/CodeLines';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon } from '#/components/icons/PaintRoller';
import { Person_Stroke2_Corner2_Rounded as PersonIcon } from '#/components/icons/Person';
import { RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon } from '#/components/icons/RaisingHand';
import { Window_Stroke2_Corner2_Rounded as WindowIcon } from '#/components/icons/Window';
import { Wrench_Stroke2_Corner2_Rounded as WrenchIcon } from '#/components/icons/Wrench';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import * as Layout from '#/components/web/Layout';
import * as Prompt from '#/components/web/Prompt';

import * as env from '#/env';
import { setStringAsync } from '#/shims/clipboard';
import { account, auth, device } from '#/storage';
import { useDebugFeedContextEnabled } from '#/storage/hooks/debug';
import { useDevMode } from '#/storage/hooks/dev-mode';

import { AccountsSection } from './components/AccountsSection';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>;
export function SettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const { logoutEveryAccount } = useSessionApi();
	const signOutPromptHandle = Prompt.usePromptHandle();

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
				<Settings.List>
					<AccountsSection />

					<Settings.Section titleText={<Trans>Preferences</Trans>}>
						<Settings.LinkRow label={l`Account and privacy`} to="/settings/account">
							<Settings.Icon icon={PersonIcon} />
							<Settings.Label titleText={<Trans>Account & privacy</Trans>} />
						</Settings.LinkRow>
						<Settings.LinkRow label={l`Moderation and content filters`} to="/moderation">
							<Settings.Icon icon={HandIcon} />
							<Settings.Label titleText={<Trans>Moderation and content filters</Trans>} />
						</Settings.LinkRow>
						<Settings.LinkRow label={l`Notifications`} to="/settings/notifications">
							<Settings.Icon icon={NotificationIcon} />
							<Settings.Label titleText={<Trans>Notifications</Trans>} />
						</Settings.LinkRow>
						<Settings.LinkRow label={l`Content and media`} to="/settings/content-and-media">
							<Settings.Icon icon={WindowIcon} />
							<Settings.Label titleText={<Trans>Content and media</Trans>} />
						</Settings.LinkRow>
						<Settings.LinkRow label={l`Appearance`} to="/settings/appearance">
							<Settings.Icon icon={PaintRollerIcon} />
							<Settings.Label titleText={<Trans>Appearance</Trans>} />
						</Settings.LinkRow>
						<Settings.LinkRow label={l`Accessibility`} to="/settings/accessibility">
							<Settings.Icon icon={AccessibilityIcon} />
							<Settings.Label titleText={<Trans>Accessibility</Trans>} />
						</Settings.LinkRow>
						<Settings.LinkRow label={l`Languages`} to="/settings/language">
							<Settings.Icon icon={EarthIcon} />
							<Settings.Label titleText={<Trans>Languages</Trans>} />
						</Settings.LinkRow>
					</Settings.Section>

					<Settings.Section>
						<button
							aria-label={l`Sign out`}
							className={clsx(cardStyles.row, cardStyles.rowInteractive)}
							onClick={() => signOutPromptHandle.open(null)}
							type="button"
						>
							<Text className={cardStyles.title} color="negative_500" size="md" weight="medium">
								<Trans>Sign out</Trans>
							</Text>
						</button>
					</Settings.Section>

					<Settings.Section>
						<VersionRow />
						<Settings.LinkRow label={l`System log`} to="/sys/log">
							<Settings.Icon icon={CodeLinesIcon} />
							<Settings.Label titleText={<Trans>System log</Trans>} />
						</Settings.LinkRow>
					</Settings.Section>

					{env.IS_DEV && <DevOptionsSection />}
				</Settings.List>
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

function VersionRow({ className }: { className?: string }) {
	const { t: l } = useLingui();
	const [devModeEnabled, setDevModeEnabled] = useDevMode();
	const firedLongPress = useRef(false);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const startLongPress = () => {
		firedLongPress.current = false;
		timer.current = setTimeout(() => {
			firedLongPress.current = true;
			const newDevModeEnabled = !devModeEnabled;
			setDevModeEnabled(newDevModeEnabled);
			Toast.show(
				newDevModeEnabled
					? l({ context: 'toast', message: 'Developer mode enabled' })
					: l({ context: 'toast', message: 'Developer mode disabled' }),
			);
		}, 500);
	};
	const cancelLongPress = () => clearTimeout(timer.current);

	const onCopy = () => {
		void setStringAsync(
			`Build version: ${env.APP_VERSION}; Bundle info: ${env.APP_METADATA}; Bundle date: ${env.BUNDLE_DATE}; Platform: web; User agent: ${navigator.userAgent}; Device ID: ${getDeviceId()}`,
		);
		Toast.show(l`Copied build version to clipboard`);
	};

	return (
		<button
			aria-label={l`Version ${env.APP_VERSION}`}
			className={clsx(cardStyles.row, cardStyles.rowInteractive, className)}
			onClick={() => {
				if (firedLongPress.current) {
					firedLongPress.current = false;
					return;
				}
				onCopy();
			}}
			onPointerDown={startLongPress}
			onPointerLeave={cancelLongPress}
			onPointerUp={cancelLongPress}
			type="button"
		>
			<Settings.Icon icon={WrenchIcon} />
			<Settings.Label subtitleText={env.APP_METADATA} titleText={<Trans>Version {env.APP_VERSION}</Trans>} />
		</button>
	);
}

function DevOptionsSection() {
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const { mutate: deleteChatDeclarationRecord } = useDeleteActorDeclaration();
	const [debugFeedContextEnabled, setDebugFeedContextEnabled] = useDebugFeedContextEnabled();
	const [open, setOpen] = useState(false);

	const clearAllStorage = () => {
		account.removeAll();
		auth.removeAll();
		device.removeAll();
		Toast.show(l`Storage cleared, you need to restart the app now.`);
	};

	return (
		<Settings.Section>
			<Settings.CollapsibleRow
				icon={CodeBracketsIcon}
				label={l`Developer options`}
				onOpenChange={setOpen}
				open={open}
				titleText={<Trans>Developer options</Trans>}
			>
				<Settings.SwitchRow
					label={l`Show feed context debug`}
					onChange={setDebugFeedContextEnabled}
					value={debugFeedContextEnabled}
				>
					<Settings.Label titleText={<Trans>Show feed context debug</Trans>} />
				</Settings.SwitchRow>
				<Settings.ButtonRow label={l`Open storybook page`} onPress={() => navigation.navigate('Debug')}>
					<Settings.Label titleText={<Trans>Storybook</Trans>} />
				</Settings.ButtonRow>
				<Settings.ButtonRow
					label={l`Open moderation debug page`}
					onPress={() => navigation.navigate('DebugMod')}
				>
					<Settings.Label titleText={<Trans>Debug Moderation</Trans>} />
				</Settings.ButtonRow>
				<Settings.ButtonRow
					label={l`Delete chat declaration record`}
					onPress={() => deleteChatDeclarationRecord()}
				>
					<Settings.Label titleText={<Trans>Delete chat declaration record</Trans>} />
				</Settings.ButtonRow>
				<Settings.ButtonRow label={l`Clear all storage data`} onPress={() => void clearAllStorage()}>
					<Settings.Label titleText={<Trans>Clear all storage data (restart after this)</Trans>} />
				</Settings.ButtonRow>
			</Settings.CollapsibleRow>
		</Settings.Section>
	);
}
