import type { ThreadPreferences } from '#/state/queries/preferences/useThreadPreferences';

import { SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider } from '#/components/icons/SettingsSlider';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Menu from '#/components/web/Menu';

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
						label={m['screens.postThread.label.threadOptions']()}
						size="small"
						variant="ghost"
						color="secondary"
						shape="round"
					>
						<ButtonIcon icon={SettingsSlider} size="md" />
					</Button>
				}
			/>
			<Menu.Popup label={m['screens.postThread.label.threadOptions']()} align="end">
				<Menu.Group>
					<Menu.LabelText>{m['screens.postThread.label.showRepliesAs']()}</Menu.LabelText>
					<Menu.Item
						label={m['screens.postThread.label.linear']()}
						onClick={() => {
							setView('linear');
						}}
					>
						<Menu.ItemText>{m['screens.postThread.label.linear']()}</Menu.ItemText>
						<Menu.ItemRadio selected={view === 'linear'} />
					</Menu.Item>
					<Menu.Item
						label={m['screens.postThread.label.threaded']()}
						onClick={() => {
							setView('tree');
						}}
					>
						<Menu.ItemText>{m['screens.postThread.label.threaded']()}</Menu.ItemText>
						<Menu.ItemRadio selected={view === 'tree'} />
					</Menu.Item>
				</Menu.Group>
				<Menu.Separator />
				<Menu.Group>
					<Menu.LabelText>{m['screens.postThread.label.replySorting']()}</Menu.LabelText>
					<Menu.Item
						label={m['common.label.topRepliesFirst']()}
						onClick={() => {
							setSort('top');
						}}
					>
						<Menu.ItemText>{m['common.label.topRepliesFirst']()}</Menu.ItemText>
						<Menu.ItemRadio selected={sort === 'top'} />
					</Menu.Item>
					<Menu.Item
						label={m['common.label.oldestRepliesFirst']()}
						onClick={() => {
							setSort('oldest');
						}}
					>
						<Menu.ItemText>{m['common.label.oldestRepliesFirst']()}</Menu.ItemText>
						<Menu.ItemRadio selected={sort === 'oldest'} />
					</Menu.Item>
					<Menu.Item
						label={m['common.label.newestRepliesFirst']()}
						onClick={() => {
							setSort('newest');
						}}
					>
						<Menu.ItemText>{m['common.label.newestRepliesFirst']()}</Menu.ItemText>
						<Menu.ItemRadio selected={sort === 'newest'} />
					</Menu.Item>
				</Menu.Group>
			</Menu.Popup>
		</Menu.Root>
	);
}
