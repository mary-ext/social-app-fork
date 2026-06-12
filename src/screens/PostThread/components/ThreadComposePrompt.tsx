import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { useHideBottomBarBorderForScreen } from '#/lib/hooks/useHideBottomBarBorder';

import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { transparentifyColor } from '#/alf/util/colorGeneration';

import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import { LinearGradient } from '#/shims/linear-gradient';

import * as css from './ThreadComposePrompt.css';

export function ThreadComposePrompt({ onPressCompose }: { onPressCompose: () => void }) {
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const { t: l } = useLingui();
	const { gtMobile } = useBreakpoints();
	const t = useTheme();
	const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();

	useHideBottomBarBorderForScreen();

	return (
		<div className={clsx(css.outer, gtMobile ? css.outerDesktop : css.outerMobile)}>
			{!gtMobile && (
				<LinearGradient
					key={t.name} // android does not update when you change the colors. sigh.
					start={[0.5, 0]}
					end={[0.5, 1]}
					colors={[transparentifyColor(t.atoms.bg.backgroundColor, 0), t.atoms.bg.backgroundColor]}
					locations={[0.15, 0.4]}
					style={[a.absolute, a.inset_0]}
				/>
			)}
			<PressableScale
				accessibilityRole="button"
				accessibilityLabel={l`Compose reply`}
				accessibilityHint={l`Opens composer`}
				onPress={() => {
					onPressCompose();
				}}
				onLongPress={undefined}
				onHoverIn={onHoverIn}
				onHoverOut={onHoverOut}
				style={[
					a.flex_row,
					a.align_center,
					a.p_sm,
					a.gap_sm,
					a.rounded_full,
					(!gtMobile || hovered) && t.atoms.bg_contrast_25,
					a.transition_color,
				]}
			>
				<UserAvatar
					size={24}
					avatar={profile?.avatar}
					type={profile?.associated?.labeler ? 'labeler' : 'user'}
				/>
				<Text size="md" color="textContrastMedium">
					<Trans>Write your reply</Trans>
				</Text>
			</PressableScale>
		</div>
	);
}
