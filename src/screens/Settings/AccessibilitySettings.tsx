import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import * as SettingsList from '#/screens/Settings/components/SettingsList';

import { atoms as a } from '#/alf';

import * as Toggle from '#/components/forms/Toggle';
import { Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon } from '#/components/icons/Accessibility';
import * as Layout from '#/components/Layout';

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
				<SettingsList.Container>
					<SettingsList.Group contentContainerStyle={[a.gap_sm]}>
						<SettingsList.ItemIcon icon={AccessibilityIcon} />
						<SettingsList.ItemText>
							<Trans>Alt text</Trans>
						</SettingsList.ItemText>
						<Toggle.Item
							name="require_alt_text"
							label={l`Require alt text before posting`}
							value={requireAltTextEnabled ?? false}
							onChange={(value) => setRequireAltTextEnabled(value)}
							style={[a.w_full]}
						>
							<Toggle.LabelText style={[a.flex_1]}>
								<Trans>Require alt text before posting</Trans>
							</Toggle.LabelText>
							<Toggle.Platform />
						</Toggle.Item>
						<Toggle.Item
							name="large_alt_badge"
							label={l`Display larger alt text badges`}
							value={!!largeAltBadgeEnabled}
							onChange={(value) => setLargeAltBadgeEnabled(value)}
							style={[a.w_full]}
						>
							<Toggle.LabelText style={[a.flex_1]}>
								<Trans>Display larger alt text badges</Trans>
							</Toggle.LabelText>
							<Toggle.Platform />
						</Toggle.Item>
					</SettingsList.Group>
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}
