import { useSession } from '#/state/session';

import * as Menu from '#/components/Menu';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { LinkButton, useInternalLink } from '#/components/web/Link';
import * as Skele from '#/components/web/Skeleton';

import ChevronBottom from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';
import FeedsIcon from '#/icons/central/Hashtag_round_outlined_radius1_stroke2.svg';
import BrowseFeedsIcon from '#/icons/central/ListSparkle_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './HomeHeaderLayout.css';

type HomeFeed = {
	id: string;
	label: string;
};

type FeedSwitcherProps = {
	activeFeed: HomeFeed;
	feeds: HomeFeed[];
	onSelectFeed: (id: string) => void;
};

type HomeHeaderLayoutProps = {
	feedSwitcher: FeedSwitcherProps | undefined;
	pending: boolean;
};

/** The home screen's sticky header. */
export function HomeHeaderLayout({ feedSwitcher, pending }: HomeHeaderLayoutProps) {
	const { hasSession } = useSession();

	return (
		<Layout.Header.Outer>
			<Layout.Header.MenuButton />

			<Layout.Header.Content>
				<HeaderContent feedSwitcher={feedSwitcher} pending={pending} />
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

function HeaderContent({ feedSwitcher, pending }: HomeHeaderLayoutProps) {
	if (feedSwitcher) {
		return <FeedSwitcher {...feedSwitcher} />;
	}

	if (pending) {
		return <Skele.Text size="lg" width={74} />;
	}

	return <Layout.Header.TitleText>{m['common.nav.home']()}</Layout.Header.TitleText>;
}

function FeedSwitcher({ activeFeed, feeds, onSelectFeed }: FeedSwitcherProps) {
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
				<ChevronBottom className={styles.chevron} />
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
