import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { TextSize_Stroke2_Corner0_Rounded as TextSizeIcon } from '#/components/icons/TextSize';
import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import { useRequireAltTextEnabled } from '#/storage/hooks/alt-text-required';
import { useLargeAltBadgeEnabled } from '#/storage/hooks/large-alt-badge';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AccessibilitySettings'>;
export function AccessibilitySettingsScreen({}: Props) {
	const { t: l } = useLingui();

	const [requireAltTextEnabled, setRequireAltTextEnabled] = useRequireAltTextEnabled();
	const [largeAltBadgeEnabled, setLargeAltBadgeEnabled] = useLargeAltBadgeEnabled();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Accessibility</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section titleText={<Trans>Alt text</Trans>}>
						<Settings.SwitchRow
							label={l`Require alt text before posting`}
							onChange={setRequireAltTextEnabled}
							value={requireAltTextEnabled}
						>
							<Settings.Icon icon={ImageIcon} />
							<Settings.Label titleText={<Trans>Require alt text before posting</Trans>} />
						</Settings.SwitchRow>
						<Settings.SwitchRow
							label={l`Display larger alt text badges`}
							onChange={setLargeAltBadgeEnabled}
							value={largeAltBadgeEnabled}
						>
							<Settings.Icon icon={TextSizeIcon} />
							<Settings.Label titleText={<Trans>Display larger alt text badges</Trans>} />
						</Settings.SwitchRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
		</Layout.Screen>
	);
}
