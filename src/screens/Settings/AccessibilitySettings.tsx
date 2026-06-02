import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { Checkbox } from '#/components/web/Checkbox';
import { Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon } from '#/components/icons/Accessibility';
import * as Layout from '#/components/web/Layout';
import * as SettingsList from '#/components/web/SettingsList';

import { useRequireAltTextEnabled } from '#/storage/hooks/alt-text-required';
import { useLargeAltBadgeEnabled } from '#/storage/hooks/large-alt-badge';

import { sprinkles } from '#/styles/sprinkles.css';

const groupBodyClass = sprinkles({ display: 'flex', flexDirection: 'column', gap: 'sm', width: 'full' });
const headerRowClass = sprinkles({ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 'sm' });
// inset the rows to align under the title text, past the header icon (24px) + gap (8px)
const insetColumnClass = sprinkles({ display: 'flex', flexDirection: 'column', gap: 'sm', paddingLeft: '_4xl' });

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
					<SettingsList.Group>
						<div className={groupBodyClass}>
							<div className={headerRowClass}>
								<SettingsList.ItemIcon icon={AccessibilityIcon} />
								<SettingsList.ItemText>
									<Trans>Alt text</Trans>
								</SettingsList.ItemText>
							</div>
							<div className={insetColumnClass}>
								<Checkbox
									label={l`Require alt text before posting`}
									checked={requireAltTextEnabled ?? false}
									onChange={setRequireAltTextEnabled}
								/>
								<Checkbox
									label={l`Display larger alt text badges`}
									checked={!!largeAltBadgeEnabled}
									onChange={setLargeAltBadgeEnabled}
								/>
							</div>
						</div>
					</SettingsList.Group>
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}
