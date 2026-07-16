import { useTitle } from '#/lib/hooks/useTitle';

import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { TextSize_Stroke2_Corner0_Rounded as TextSizeIcon } from '#/components/icons/TextSize';
import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useRequireAltTextEnabled } from '#/storage/hooks/alt-text-required';
import { useLargeAltBadgeEnabled } from '#/storage/hooks/large-alt-badge';

export function AccessibilitySettingsScreen() {
	useTitle(m['navigation.settings.accessibility.title']());
	const [requireAltTextEnabled, setRequireAltTextEnabled] = useRequireAltTextEnabled();
	const [largeAltBadgeEnabled, setLargeAltBadgeEnabled] = useLargeAltBadgeEnabled();

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
