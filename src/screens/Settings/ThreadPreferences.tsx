import { Trans, useLingui } from '@lingui/react/macro';

import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import {
	normalizeSort,
	normalizeView,
	type ThreadSortOption,
	useThreadPreferences,
} from '#/state/queries/preferences/useThreadPreferences';

import { Bubbles_Stroke2_Corner2_Rounded as BubblesIcon } from '#/components/icons/Bubble';
import { Tree_Stroke2_Corner0_Rounded as TreeIcon } from '#/components/icons/Tree';
import * as Layout from '#/components/web/Layout';
import { RadioGroup } from '#/components/web/RadioGroup';
import * as SettingsList from '#/components/web/SettingsList';
import { Text } from '#/components/web/Text';

import { sprinkles } from '#/styles/sprinkles.css';

const bodyClass = sprinkles({ display: 'flex', flexDirection: 'column', gap: 'sm', width: 'full' });
const headerRowClass = sprinkles({ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 'sm' });
const insetColumnClass = sprinkles({
	display: 'flex',
	flexDirection: 'column',
	gap: 'md',
	paddingLeft: '_4xl',
});
const insetClass = sprinkles({ paddingLeft: '_4xl' });

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PreferencesThreads'>;
export function ThreadPreferencesScreen({}: Props) {
	const { t: l } = useLingui();
	const { sort, setSort, view, setView } = useThreadPreferences({ save: true });

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Thread Preferences</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<SettingsList.Group>
						<div className={bodyClass}>
							<div className={headerRowClass}>
								<SettingsList.ItemIcon icon={BubblesIcon} />
								<SettingsList.ItemText>
									<Trans>Sort replies</Trans>
								</SettingsList.ItemText>
							</div>
							<div className={insetColumnClass}>
								<Text size="sm" leading="none" color="textContrastMedium">
									<Trans>Sort replies to the same post by:</Trans>
								</Text>
								<RadioGroup<ThreadSortOption>
									label={l`Sort replies by`}
									value={sort}
									onValueChange={(value) => setSort(normalizeSort(value))}
									items={[
										{ label: l`Top replies first`, value: 'top' },
										{ label: l`Oldest replies first`, value: 'oldest' },
										{ label: l`Newest replies first`, value: 'newest' },
									]}
								/>
							</div>
						</div>
					</SettingsList.Group>

					<SettingsList.Group>
						<div className={bodyClass}>
							<div className={headerRowClass}>
								<SettingsList.ItemIcon icon={TreeIcon} />
								<SettingsList.ItemText>
									<Trans>Tree view</Trans>
								</SettingsList.ItemText>
							</div>
							<div className={insetClass}>
								<SettingsList.CheckboxItem
									flush
									label={l`Tree view`}
									value={view === 'tree'}
									onChange={(value) => setView(normalizeView({ treeViewEnabled: value }))}
								>
									<SettingsList.LabelText>
										<Trans>Show post replies in a threaded tree view</Trans>
									</SettingsList.LabelText>
									<SettingsList.CheckboxBox />
								</SettingsList.CheckboxItem>
							</div>
						</div>
					</SettingsList.Group>
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}
