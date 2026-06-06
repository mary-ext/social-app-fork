import { Trans } from '@lingui/react/macro';

import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import {
	type EmbedPlayerSource,
	exemptExternalEmbedSources,
	externalEmbedLabels,
} from '#/lib/strings/embed-player';

import { useExternalEmbedsPrefs, useSetExternalEmbedPref } from '#/state/preferences';

import { Admonition } from '#/components/web/Admonition';
import * as Layout from '#/components/web/Layout';
import * as SettingsList from '#/components/web/SettingsList';

import * as styles from './ExternalMediaPreferences.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PreferencesExternalEmbeds'>;
export function ExternalMediaPreferencesScreen({}: Props) {
	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>External Media Preferences</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<SettingsList.Item>
						<Admonition type="info">
							<Trans>
								External media may allow websites to collect information about you and your device. No
								information is sent or requested until you press the "play" button.
							</Trans>
						</Admonition>
					</SettingsList.Item>
					<div className={styles.heading}>
						<SettingsList.ItemText>
							<Trans>Enable media players for</Trans>
						</SettingsList.ItemText>
					</div>
					{Object.entries(externalEmbedLabels)
						.filter(([key]) => !exemptExternalEmbedSources.has(key as EmbedPlayerSource))
						.map(([key, label]) => (
							<PrefSelector key={key} source={key as EmbedPlayerSource} label={label} />
						))}
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}

function PrefSelector({ source, label }: { source: EmbedPlayerSource; label: string }) {
	const setExternalEmbedPref = useSetExternalEmbedPref();
	const sources = useExternalEmbedsPrefs();
	const enabled = sources?.[source] === 'show';

	return (
		<SettingsList.CheckboxItem
			label={label}
			value={enabled}
			onChange={() => setExternalEmbedPref(source, enabled ? 'hide' : 'show')}
		>
			<SettingsList.CheckboxBox />
			<SettingsList.LabelText size="md">{label}</SettingsList.LabelText>
		</SettingsList.CheckboxItem>
	);
}
