import { useSession } from '#/state/session';

import * as styles from '#/view/com/home/HomeHeaderLayout.css';
import { Logo } from '#/view/icons/Logo';

import { useBreakpoints } from '#/alf';

import { Hashtag_Stroke2_Corner0_Rounded as FeedsIcon } from '#/components/icons/Hashtag';
import { ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { LinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

/** The home screen's scroll-away header above the feed tabs: a centered logo and a feeds-discovery link. */
export function HomeHeaderLayout() {
	const { gtMobile } = useBreakpoints();
	const { hasSession } = useSession();

	// logged out past the mobile breakpoint the side nav owns navigation, so there's nothing to show
	if (gtMobile && !hasSession) {
		return null;
	}

	return (
		<Layout.Header.Outer noBottomBorder sticky={false}>
			{gtMobile ? (
				<Layout.Header.Slot>
					<div className={styles.spacer} />
				</Layout.Header.Slot>
			) : (
				<Layout.Header.MenuButton />
			)}

			<div className={styles.logo}>
				<Logo width={30} />
			</div>

			<Layout.Header.Slot>
				{hasSession && (
					<LinkButton
						color="secondary"
						label={m['view.feeds.explore.a11y']()}
						shape="round"
						size="small"
						to="/feeds"
						variant="ghost"
					>
						<ButtonIcon icon={FeedsIcon} size="md" />
					</LinkButton>
				)}
			</Layout.Header.Slot>
		</Layout.Header.Outer>
	);
}
