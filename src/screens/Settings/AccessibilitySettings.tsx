import { setRequireAltTextEnabled, useRequireAltTextEnabled } from '#/state/preferences/alt-text';
import { setLargeAltBadgeEnabled, useLargeAltBadgeEnabled } from '#/state/preferences/large-alt-badge';
import { useTitle } from '#/state/use-title';

import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import TextSizeIcon from '#/icons/central/TextSize_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export function AccessibilitySettingsScreen() {
	useTitle(m['navigation.settings.accessibility.title']());
	const requireAltTextEnabled = useRequireAltTextEnabled();
	const largeAltBadgeEnabled = useLargeAltBadgeEnabled();

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
							label={m['screens.settings.accessibility.requireAltText']()}
							onChange={setRequireAltTextEnabled}
							value={requireAltTextEnabled}
						>
							<Settings.Icon icon={ImageIcon} />
							<Settings.Label titleText={m['screens.settings.accessibility.requireAltText']()} />
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
				</Settings.List>
			</Layout.Content>
		</Layout.Screen>
	);
}
