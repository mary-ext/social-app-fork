import { Trans, useLingui } from '@lingui/react/macro';

import type { ThreadPreferences } from '#/state/queries/preferences/useThreadPreferences';

import { SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider } from '#/components/icons/SettingsSlider';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Menu from '#/components/web/Menu';

export function HeaderDropdown({
	sort,
	view,
	setSort,
	setView,
}: Pick<ThreadPreferences, 'sort' | 'setSort' | 'view' | 'setView'>): React.ReactNode {
	const { t: l } = useLingui();
	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button label={l`Thread options`} size="small" variant="ghost" color="secondary" shape="round">
						<ButtonIcon icon={SettingsSlider} size="md" />
					</Button>
				}
			/>
			<Menu.Popup label={l`Thread options`} align="end">
				<Menu.Group>
					<Menu.LabelText>
						<Trans>Show replies as</Trans>
					</Menu.LabelText>
					<Menu.Item
						label={l`Linear`}
						onClick={() => {
							setView('linear');
						}}
					>
						<Menu.ItemText>
							<Trans>Linear</Trans>
						</Menu.ItemText>
						<Menu.ItemRadio selected={view === 'linear'} />
					</Menu.Item>
					<Menu.Item
						label={l`Threaded`}
						onClick={() => {
							setView('tree');
						}}
					>
						<Menu.ItemText>
							<Trans>Threaded</Trans>
						</Menu.ItemText>
						<Menu.ItemRadio selected={view === 'tree'} />
					</Menu.Item>
				</Menu.Group>
				<Menu.Separator />
				<Menu.Group>
					<Menu.LabelText>
						<Trans>Reply sorting</Trans>
					</Menu.LabelText>
					<Menu.Item
						label={l`Top replies first`}
						onClick={() => {
							setSort('top');
						}}
					>
						<Menu.ItemText>
							<Trans>Top replies first</Trans>
						</Menu.ItemText>
						<Menu.ItemRadio selected={sort === 'top'} />
					</Menu.Item>
					<Menu.Item
						label={l`Oldest replies first`}
						onClick={() => {
							setSort('oldest');
						}}
					>
						<Menu.ItemText>
							<Trans>Oldest replies first</Trans>
						</Menu.ItemText>
						<Menu.ItemRadio selected={sort === 'oldest'} />
					</Menu.Item>
					<Menu.Item
						label={l`Newest replies first`}
						onClick={() => {
							setSort('newest');
						}}
					>
						<Menu.ItemText>
							<Trans>Newest replies first</Trans>
						</Menu.ItemText>
						<Menu.ItemRadio selected={sort === 'newest'} />
					</Menu.Item>
				</Menu.Group>
			</Menu.Popup>
		</Menu.Root>
	);
}
