import { View } from 'react-native';
import { useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { HITSLOP_10 } from '#/lib/constants';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import type { NavigationProp } from '#/lib/routes/types';

import { softReset } from '#/state/events';
import { useSession } from '#/state/session';

import { Logo } from '#/view/icons/Logo';

import { atoms as a } from '#/alf';

import { ButtonIcon } from '#/components/Button';
import { Hashtag_Stroke2_Corner0_Rounded as FeedsIcon } from '#/components/icons/Hashtag';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';

import { IS_DEV } from '#/env';

export function HomeHeaderLayoutMobile() {
	const { t: l } = useLingui();
	const { hasSession } = useSession();
	const { navigate } = useNavigation<NavigationProp>();

	return (
		<Layout.Header.Outer noBottomBorder sticky={false}>
			<Layout.Header.Slot>
				<Layout.Header.MenuButton />
			</Layout.Header.Slot>

			<View style={[a.flex_1, a.align_center]}>
				<PressableScale
					targetScale={0.9}
					onPress={() => {
						if (IS_DEV) {
							navigate('Debug');
						} else {
							softReset.emit();
						}
					}}
				>
					<Logo width={30} />
				</PressableScale>
			</View>

			<Layout.Header.Slot>
				{hasSession && (
					<Link
						testID="viewHeaderHomeFeedPrefsBtn"
						to={{ screen: 'Feeds' }}
						hitSlop={HITSLOP_10}
						label={l`View your feeds and explore more`}
						size="small"
						variant="ghost"
						color="secondary"
						shape="square"
						style={[
							a.justify_center,
							{ marginRight: -Layout.BUTTON_VISUAL_ALIGNMENT_OFFSET },
							a.bg_transparent,
						]}
					>
						<ButtonIcon icon={FeedsIcon} size="lg" />
					</Link>
				)}
			</Layout.Header.Slot>
		</Layout.Header.Outer>
	);
}
