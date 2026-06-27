import { useState } from 'react';
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

import { m } from '#/paraglide/messages';
import { useDebugFeedContextEnabled } from '#/storage/hooks/debug';
import { useDevMode } from '#/storage/hooks/dev-mode';

import { AccountsSection } from './components/AccountsSection';
import { ServiceWorkerSection } from './components/ServiceWorkerSection';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>;
export function SettingsScreen({}: Props) {
	const { logoutEveryAccount } = useSessionApi();
	const signOutPromptHandle = Prompt.usePromptHandle();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.nav.settings']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<AccountsSection />

					<Settings.Section titleText={m['screens.settings.preferences.title']()}>
						<Settings.LinkRow label={m['screens.settings.account.privacyTitle']()} to="/settings/account">
							<Settings.Icon icon={PersonIcon} />
							<Settings.Label titleText={m['common.account.privacy']()} />
						</Settings.LinkRow>
						<Settings.LinkRow label={m['screens.settings.moderation.title']()} to="/moderation">
							<Settings.Icon icon={HandIcon} />
							<Settings.Label titleText={m['screens.settings.moderation.title']()} />
						</Settings.LinkRow>
						<Settings.LinkRow label={m['common.nav.notifications']()} to="/settings/notifications">
							<Settings.Icon icon={NotificationIcon} />
							<Settings.Label titleText={m['common.nav.notifications']()} />
						</Settings.LinkRow>
						<Settings.LinkRow label={m['screens.settings.media.title']()} to="/settings/content-and-media">
							<Settings.Icon icon={WindowIcon} />
							<Settings.Label titleText={m['screens.settings.media.title']()} />
						</Settings.LinkRow>
						<Settings.LinkRow label={m['common.appearance.label']()} to="/settings/appearance">
							<Settings.Icon icon={PaintRollerIcon} />
							<Settings.Label titleText={m['common.appearance.label']()} />
						</Settings.LinkRow>
						<Settings.LinkRow
							label={m['screens.settings.accessibility.title']()}
							to="/settings/accessibility"
						>
							<Settings.Icon icon={AccessibilityIcon} />
							<Settings.Label titleText={m['screens.settings.accessibility.title']()} />
						</Settings.LinkRow>
						<Settings.LinkRow label={m['screens.settings.language.title']()} to="/settings/language">
							<Settings.Icon icon={EarthIcon} />
							<Settings.Label titleText={m['screens.settings.language.title']()} />
						</Settings.LinkRow>
					</Settings.Section>

					{/* dev builds emit no service worker (see ServiceWorkerPrecachePlugin), so the install row is inert there — see registerServiceWorker */}
					<ServiceWorkerSection />

					<Settings.Section>
						<button
							aria-label={m['common.session.action.signOut']()}
							className={clsx(cardStyles.row, cardStyles.rowInteractive)}
							onClick={() => signOutPromptHandle.open(null)}
							type="button"
						>
							<Text className={cardStyles.title} color="negative_500" size="md" weight="medium">
								{m['common.session.action.signOut']()}
							</Text>
						</button>
					</Settings.Section>

					<Settings.Section>
						<Settings.LinkRow label={m['common.developer.systemLog']()} to="/sys/log">
							<Settings.Icon icon={CodeLinesIcon} />
							<Settings.Label titleText={m['common.developer.systemLog']()} />
						</Settings.LinkRow>
						<DevOptionsRow />
					</Settings.Section>
				</Settings.List>
			</Layout.Content>

			<Prompt.Basic
				cancelButtonCta={m['common.action.cancel']()}
				confirmButtonColor="negative"
				confirmButtonCta={m['common.session.action.signOut']()}
				description={m['common.session.signOut.message']()}
				handle={signOutPromptHandle}
				onConfirm={() => logoutEveryAccount()}
				title={m['common.session.signOut.title']()}
			/>
		</Layout.Screen>
	);
}

function DevOptionsRow({ className }: { className?: string }) {
	const navigation = useNavigation<NavigationProp>();
	const [debugFeedContextEnabled, setDebugFeedContextEnabled] = useDebugFeedContextEnabled();
	const [devModeEnabled, setDevModeEnabled] = useDevMode();
	const [open, setOpen] = useState(false);

	return (
		<Settings.CollapsibleRow
			className={className}
			icon={CodeBracketsIcon}
			label={m['screens.settings.developer.title']()}
			onOpenChange={setOpen}
			open={open}
			titleText={m['screens.settings.developer.title']()}
		>
			<Settings.SwitchRow
				label={m['screens.settings.developer.mode']()}
				onChange={setDevModeEnabled}
				value={devModeEnabled}
			>
				<Settings.Label titleText={m['screens.settings.developer.mode']()} />
			</Settings.SwitchRow>
			<Settings.SwitchRow
				label={m['screens.settings.developer.showFeedContext']()}
				onChange={setDebugFeedContextEnabled}
				value={debugFeedContextEnabled}
			>
				<Settings.Label titleText={m['screens.settings.developer.showFeedContext']()} />
			</Settings.SwitchRow>
			<Settings.ButtonRow
				label={m['screens.settings.developer.storybook.open']()}
				onPress={() => navigation.navigate('Debug')}
			>
				<Settings.Label titleText={m['screens.settings.developer.storybook.label']()} />
			</Settings.ButtonRow>
			<Settings.ButtonRow
				label={m['screens.settings.developer.moderationPlayground.open']()}
				onPress={() => navigation.navigate('DebugMod')}
			>
				<Settings.Label titleText={m['screens.settings.developer.moderationPlayground.label']()} />
			</Settings.ButtonRow>
		</Settings.CollapsibleRow>
	);
}
