import { useState } from 'react';

import { clsx } from 'clsx';

import { useTitle } from '#/lib/hooks/useTitle';

import {
	setDebugFeedContextEnabled,
	useDebugFeedContextEnabled,
} from '#/state/preferences/debug-feed-context';
import { setDevMode, useDevMode } from '#/state/preferences/dev-mode';
import { logoutEveryAccount } from '#/state/session';

import { Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon } from '#/components/icons/Accessibility';
import { Bell_Stroke2_Corner0_Rounded as NotificationIcon } from '#/components/icons/Bell';
import { CodeBrackets_Stroke2_Corner2_Rounded as CodeBracketsIcon } from '#/components/icons/CodeBrackets';
import { CodeLines_Stroke2_Corner2_Rounded as CodeLinesIcon } from '#/components/icons/CodeLines';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon } from '#/components/icons/PaintRoller';
import { Person_Stroke2_Corner2_Rounded as PersonIcon } from '#/components/icons/Person';
import { RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon } from '#/components/icons/RaisingHand';
import { Window_Stroke2_Corner2_Rounded as WindowIcon } from '#/components/icons/Window';
import * as Prompt from '#/components/Prompt';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

import { AccountsSection } from './components/AccountsSection';
import { ServiceWorkerSection } from './components/ServiceWorkerSection';

export function SettingsScreen() {
	useTitle(m['common.nav.settings']());

	const signOutPromptHandle = Prompt.usePromptHandle();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.nav.settings']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<AccountsSection />

					<Settings.Section titleText={m['screens.settings.preferences.title']()}>
						<Settings.LinkRow
							label={m['screens.settings.account.privacyTitle']()}
							to={{ name: 'AccountSettings' }}
						>
							<Settings.Icon icon={PersonIcon} />
							<Settings.Label titleText={m['common.account.privacy']()} />
						</Settings.LinkRow>
						<Settings.LinkRow label={m['screens.settings.moderation.title']()} to={{ name: 'Moderation' }}>
							<Settings.Icon icon={HandIcon} />
							<Settings.Label titleText={m['screens.settings.moderation.title']()} />
						</Settings.LinkRow>
						<Settings.LinkRow label={m['common.nav.notifications']()} to={{ name: 'NotificationSettings' }}>
							<Settings.Icon icon={NotificationIcon} />
							<Settings.Label titleText={m['common.nav.notifications']()} />
						</Settings.LinkRow>
						<Settings.LinkRow
							label={m['screens.settings.media.title']()}
							to={{ name: 'ContentAndMediaSettings' }}
						>
							<Settings.Icon icon={WindowIcon} />
							<Settings.Label titleText={m['screens.settings.media.title']()} />
						</Settings.LinkRow>
						<Settings.LinkRow label={m['common.appearance.label']()} to={{ name: 'AppearanceSettings' }}>
							<Settings.Icon icon={PaintRollerIcon} />
							<Settings.Label titleText={m['common.appearance.label']()} />
						</Settings.LinkRow>
						<Settings.LinkRow
							label={m['screens.settings.accessibility.title']()}
							to={{ name: 'AccessibilitySettings' }}
						>
							<Settings.Icon icon={AccessibilityIcon} />
							<Settings.Label titleText={m['screens.settings.accessibility.title']()} />
						</Settings.LinkRow>
						<Settings.LinkRow
							label={m['screens.settings.language.title']()}
							to={{ name: 'LanguageSettings' }}
						>
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
						<Settings.LinkRow label={m['common.developer.systemLog']()} to={{ name: 'Log' }}>
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
	const debugFeedContextEnabled = useDebugFeedContextEnabled();
	const devModeEnabled = useDevMode();
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
				onChange={setDevMode}
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
		</Settings.CollapsibleRow>
	);
}
