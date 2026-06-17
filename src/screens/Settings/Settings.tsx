import { useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { clsx } from 'clsx';

import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';

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
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';
import * as Prompt from '#/components/web/Prompt';

import { useDebugFeedContextEnabled } from '#/storage/hooks/debug';
import { useDevMode } from '#/storage/hooks/dev-mode';

import { AccountsSection } from './components/AccountsSection';
import { ServiceWorkerSection } from './components/service-worker-section';

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

					{/* the service worker is only emitted by production builds (see ServiceWorkerPrecachePlugin) */}
					{import.meta.env.PROD && <ServiceWorkerSection />}

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
						<Settings.LinkRow label={l`System log`} to="/sys/log">
							<Settings.Icon icon={CodeLinesIcon} />
							<Settings.Label titleText={<Trans>System log</Trans>} />
						</Settings.LinkRow>
						<DevOptionsRow />
					</Settings.Section>
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

function DevOptionsRow({ className }: { className?: string }) {
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const [debugFeedContextEnabled, setDebugFeedContextEnabled] = useDebugFeedContextEnabled();
	const [devModeEnabled, setDevModeEnabled] = useDevMode();
	const [open, setOpen] = useState(false);

	return (
		<Settings.CollapsibleRow
			className={className}
			icon={CodeBracketsIcon}
			label={l`Developer options`}
			onOpenChange={setOpen}
			open={open}
			titleText={<Trans>Developer options</Trans>}
		>
			<Settings.SwitchRow label={l`Developer mode`} onChange={setDevModeEnabled} value={devModeEnabled}>
				<Settings.Label titleText={<Trans>Developer mode</Trans>} />
			</Settings.SwitchRow>
			<Settings.SwitchRow
				label={l`Show feed context debug`}
				onChange={setDebugFeedContextEnabled}
				value={debugFeedContextEnabled}
			>
				<Settings.Label titleText={<Trans>Show feed context debug</Trans>} />
			</Settings.SwitchRow>
			<Settings.ButtonRow label={l`Open component storybook`} onPress={() => navigation.navigate('Debug')}>
				<Settings.Label titleText={<Trans>Component storybook</Trans>} />
			</Settings.ButtonRow>
			<Settings.ButtonRow
				label={l`Open moderation playground`}
				onPress={() => navigation.navigate('DebugMod')}
			>
				<Settings.Label titleText={<Trans>Moderation playground</Trans>} />
			</Settings.ButtonRow>
		</Settings.CollapsibleRow>
	);
}
