import { useTitle } from '#/lib/hooks/useTitle';
import {
	type EmbedPlayerSource,
	exemptExternalEmbedSources,
	externalEmbedLabels,
} from '#/lib/strings/embed-player';

import { useExternalEmbedsPrefs, useSetExternalEmbedPref } from '#/state/preferences';

import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `externalEmbedLabels` is a literal, so its key set is exactly `EmbedPlayerSource`
const embedLabelEntries = Object.entries(externalEmbedLabels) as [EmbedPlayerSource, string][];

export function ExternalMediaPreferencesScreen() {
	useTitle(m['common.externalMedia.preferencesTitle']());

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
						{embedLabelEntries
							.filter(([source]) => !exemptExternalEmbedSources.has(source))
							.map(([source, label]) => {
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
