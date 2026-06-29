import type { ThreadPreferences } from '#/state/queries/preferences/useThreadPreferences';

import { SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider } from '#/components/icons/SettingsSlider';
import * as Menu from '#/components/Menu';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

export function HeaderDropdown({
	sort,
	view,
	setSort,
	setView,
}: Pick<ThreadPreferences, 'sort' | 'setSort' | 'view' | 'setView'>): React.ReactNode {
	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						label={m['screens.postThread.threadOptions.label']()}
						size="small"
						variant="ghost"
						color="secondary"
						shape="round"
					>
						<ButtonIcon icon={SettingsSlider} size="lg" />
					</Button>
				}
			/>
			<Menu.Popup label={m['screens.postThread.threadOptions.label']()} align="end">
				<Menu.Group>
					<Menu.LabelText>{m['screens.postThread.threadOptions.display.label']()}</Menu.LabelText>
					<Menu.Item
						label={m['screens.postThread.threadOptions.display.linear']()}
						onClick={() => {
							setView('linear');
						}}
					>
						<Menu.ItemText>{m['screens.postThread.threadOptions.display.linear']()}</Menu.ItemText>
						<Menu.ItemRadio selected={view === 'linear'} />
					</Menu.Item>
					<Menu.Item
						label={m['screens.postThread.threadOptions.display.threaded']()}
						onClick={() => {
							setView('tree');
						}}
					>
						<Menu.ItemText>{m['screens.postThread.threadOptions.display.threaded']()}</Menu.ItemText>
						<Menu.ItemRadio selected={view === 'tree'} />
					</Menu.Item>
				</Menu.Group>
				<Menu.Separator />
				<Menu.Group>
					<Menu.LabelText>{m['screens.postThread.threadOptions.sorting']()}</Menu.LabelText>
					<Menu.Item
						label={m['common.thread.sort.top']()}
						onClick={() => {
							setSort('top');
						}}
					>
						<Menu.ItemText>{m['common.thread.sort.top']()}</Menu.ItemText>
						<Menu.ItemRadio selected={sort === 'top'} />
					</Menu.Item>
					<Menu.Item
						label={m['common.thread.sort.oldest']()}
						onClick={() => {
							setSort('oldest');
						}}
					>
						<Menu.ItemText>{m['common.thread.sort.oldest']()}</Menu.ItemText>
						<Menu.ItemRadio selected={sort === 'oldest'} />
					</Menu.Item>
					<Menu.Item
						label={m['common.thread.sort.newest']()}
						onClick={() => {
							setSort('newest');
						}}
					>
						<Menu.ItemText>{m['common.thread.sort.newest']()}</Menu.ItemText>
						<Menu.ItemRadio selected={sort === 'newest'} />
					</Menu.Item>
				</Menu.Group>
			</Menu.Popup>
		</Menu.Root>
	);
}
