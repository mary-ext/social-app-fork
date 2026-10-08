import { setAltTextReminderEnabled, useAltTextReminderEnabled } from '#/state/preferences/alt-text';
import { setKeybindsDisabled, useKeybindsDisabled } from '#/state/preferences/keybinds';
import { setLargeAltBadgeEnabled, useLargeAltBadgeEnabled } from '#/state/preferences/large-alt-badge';
import { useTitle } from '#/state/use-title';

import { keybindsDialogHandle } from '#/components/dialogs/handles';
import * as Settings from '#/components/Settings';
import * as Layout from '#/components/web/Layout';

import BulletListIcon from '#/icons/central/BulletList_round_outlined_radius1_stroke2.svg';
import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import KeyboardIcon from '#/icons/central/KeyboardCable_round_outlined_radius1_stroke2.svg';
import TextSizeIcon from '#/icons/central/TextSize_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export function AccessibilitySettingsScreen() {
	useTitle(m['navigation.settings.accessibility.title']());
	const altTextReminderEnabled = useAltTextReminderEnabled();
	const largeAltBadgeEnabled = useLargeAltBadgeEnabled();
	const keybindsDisabled = useKeybindsDisabled();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['screens.settings.accessibility.title']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section titleText={m['common.altText.label']()}>
						<Settings.SwitchRow
							label={m['screens.settings.accessibility.altTextReminder']()}
							onChange={setAltTextReminderEnabled}
							value={altTextReminderEnabled}
						>
							<Settings.Icon icon={ImageIcon} />
							<Settings.Label titleText={m['screens.settings.accessibility.altTextReminder']()} />
						</Settings.SwitchRow>
						<Settings.SwitchRow
							label={m['screens.settings.accessibility.largerAltTextBadges']()}
							onChange={setLargeAltBadgeEnabled}
							value={largeAltBadgeEnabled}
						>
							<Settings.Icon icon={TextSizeIcon} />
							<Settings.Label titleText={m['screens.settings.accessibility.largerAltTextBadges']()} />
						</Settings.SwitchRow>
					</Settings.Section>
					<Settings.Section titleText={m['screens.settings.accessibility.keyboard']()}>
						<Settings.SwitchRow
							label={m['screens.settings.accessibility.keybinds.enable']()}
							onChange={(enabled) => setKeybindsDisabled(!enabled)}
							value={!keybindsDisabled}
						>
							<Settings.Icon icon={KeyboardIcon} />
							<Settings.Label titleText={m['screens.settings.accessibility.keybinds.enable']()} />
						</Settings.SwitchRow>
						<Settings.ButtonRow
							label={m['screens.settings.accessibility.keybinds.list']()}
							onPress={() => keybindsDialogHandle.open()}
						>
							<Settings.Icon icon={BulletListIcon} />
							<Settings.Label titleText={m['screens.settings.accessibility.keybinds.list']()} />
						</Settings.ButtonRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
		</Layout.Screen>
	);
}
