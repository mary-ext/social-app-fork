import type { FeedDescriptor } from '#/state/queries/post-feed';
import { useSession } from '#/state/session';

import { TinyChevronBottom_Stroke2_Corner0_Rounded as ChevronBottom } from '#/components/icons/Chevron';
import { Hashtag_Stroke2_Corner0_Rounded as FeedsIcon } from '#/components/icons/Hashtag';
import { ListSparkle_Stroke2_Corner0_Rounded as BrowseFeedsIcon } from '#/components/icons/ListSparkle';
import * as Menu from '#/components/Menu';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { LinkButton, useInternalLink } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './HomeHeaderLayout.css';

type HomeFeed = {
	id: FeedDescriptor;
	label: string;
};

type HomeHeaderLayoutProps = {
	activeFeed: HomeFeed | undefined;
	feeds: HomeFeed[];
	onSelectFeed: (id: FeedDescriptor) => void;
};

/** The home screen's sticky header. */
export function HomeHeaderLayout({ activeFeed, feeds, onSelectFeed }: HomeHeaderLayoutProps) {
	const { hasSession } = useSession();

	return (
		<Layout.Header.Outer>
			<Layout.Header.MenuButton />

			<Layout.Header.Content>
				{activeFeed ? (
					<FeedSwitcher activeFeed={activeFeed} feeds={feeds} onSelectFeed={onSelectFeed} />
				) : (
					<Layout.Header.TitleText>{m['common.nav.home']()}</Layout.Header.TitleText>
				)}
			</Layout.Header.Content>

			<Layout.Header.Slot>
				{hasSession && (
					<LinkButton
						color="secondary"
						label={m['view.feeds.explore.a11y']()}
						shape="round"
						size="small"
						to={{ name: 'Feeds' }}
						variant="ghost"
					>
						<ButtonIcon icon={FeedsIcon} size="lg" />
					</LinkButton>
				)}
			</Layout.Header.Slot>
		</Layout.Header.Outer>
	);
}

function FeedSwitcher({ activeFeed, feeds, onSelectFeed }: HomeHeaderLayoutProps & { activeFeed: HomeFeed }) {
	const browseFeeds = useInternalLink({ to: { name: 'Feeds' } });

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						className={styles.trigger}
						color="secondary"
						label={activeFeed.label}
						shape="rectangular"
						size="small"
						variant="ghost"
					/>
				}
			>
				<Text size="lg" weight="semiBold" numberOfLines={1}>
					{activeFeed.label}
				</Text>
				<ChevronBottom size="xs" fill="currentColor" className={styles.chevron} />
			</Menu.Trigger>
			<Menu.Popup label={m['screens.home.feedSwitcher.label']()} minWidth={200}>
				<Menu.Group>
					{feeds.map(({ id, label }) => (
						<Menu.Item key={id} label={label} onClick={() => onSelectFeed(id)}>
							<Menu.ItemText>{label}</Menu.ItemText>
							<Menu.ItemRadio selected={id === activeFeed.id} />
						</Menu.Item>
					))}
				</Menu.Group>
				<Menu.Separator />
				<Menu.Item
					label={m['screens.home.action.browseOtherFeeds']()}
					render={<a href={browseFeeds.href} onClick={browseFeeds.onClick} />}
				>
					<Menu.ItemText>{m['screens.home.action.browseOtherFeeds']()}</Menu.ItemText>
					<Menu.ItemIcon icon={BrowseFeedsIcon} position="right" />
				</Menu.Item>
			</Menu.Popup>
		</Menu.Root>
	);
}
