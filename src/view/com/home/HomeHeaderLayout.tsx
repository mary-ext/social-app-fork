import { View } from 'react-native';

import { HITSLOP_10 } from '#/lib/constants';

import { useSession } from '#/state/session';

import { HomeHeaderLayoutMobile } from '#/view/com/home/HomeHeaderLayoutMobile';
import { Logo } from '#/view/icons/Logo';

import { atoms as a, useBreakpoints, useGutters, useTheme } from '#/alf';

import { ButtonIcon } from '#/components/Button';
import { Hashtag_Stroke2_Corner0_Rounded as FeedsIcon } from '#/components/icons/Hashtag';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';

import { m } from '#/paraglide/messages';

/**
 * The home screen's chrome above the feed tabs — the logo and a feeds-discovery link. Rendered as the
 * scroll-away header of the feed tabs; the tab bar below it stays sticky.
 */
export function HomeHeaderLayout() {
	const { gtMobile } = useBreakpoints();
	if (!gtMobile) {
		return <HomeHeaderLayoutMobile />;
	}
	return <HomeHeaderLayoutDesktopAndTablet />;
}

function HomeHeaderLayoutDesktopAndTablet() {
	const t = useTheme();
	const { hasSession } = useSession();
	const gutters = useGutters([0, 'base']);

	if (!hasSession) {
		return null;
	}

	return (
		<Layout.Center>
			<View style={[a.flex_row, a.align_center, gutters, a.pt_md, t.atoms.bg]}>
				<View style={{ width: 34 }} />
				<View style={[a.flex_1, a.align_center, a.justify_center]}>
					<Logo width={28} />
				</View>
				<Link
					to="/feeds"
					hitSlop={HITSLOP_10}
					label={m['view.feeds.explore.a11y']()}
					size="small"
					variant="ghost"
					color="secondary"
					shape="square"
					style={[a.justify_center]}
				>
					<ButtonIcon icon={FeedsIcon} size="lg" />
				</Link>
			</View>
		</Layout.Center>
	);
}
