import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import {
	type EmbedPlayerSource,
	exemptExternalEmbedSources,
	externalEmbedLabels,
} from '#/lib/strings/embed-player';

import { useExternalEmbedsPrefs, useSetExternalEmbedPref } from '#/state/preferences';

import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PreferencesExternalEmbeds'>;
export function ExternalMediaPreferencesScreen({}: Props) {
	const sources = useExternalEmbedsPrefs();
	const setExternalEmbedPref = useSetExternalEmbedPref();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.externalMedia.preferencesTitle']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section bodyText={m['common.externalMedia.hint']()}>
						{Object.entries(externalEmbedLabels)
							.filter(([key]) => !exemptExternalEmbedSources.has(key as EmbedPlayerSource))
							.map(([key, label]) => {
								const source = key as EmbedPlayerSource;
								const enabled = sources?.[source] === 'show';
								return (
									<Settings.SwitchRow
										key={source}
										label={label}
										onChange={(next) => setExternalEmbedPref(source, next ? 'show' : 'hide')}
										value={enabled}
									>
										<Settings.Label titleText={label} />
									</Settings.SwitchRow>
								);
							})}
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
		</Layout.Screen>
	);
}
