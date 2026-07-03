import { type TextStyle, View, type ViewStyle } from 'react-native';

import type { ModerationCause } from '@atcute/bluesky-moderation';

import { BSKY_LABELER_DID } from '#/lib/moderation/const';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';

import { atoms as a, useTheme, type ViewStyleProp } from '#/alf';

import { Button } from '#/components/Button';
import { Text } from '#/components/Typography';
import { UserAvatar } from '#/components/UserAvatar';
import * as Dialog from '#/components/web/Dialog';
import { ModerationDetailsDialog } from '#/components/web/moderation/ModerationDetailsDialog';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export type AppModerationCause =
	| ModerationCause
	| {
			type: 'reply-hidden';
			source: { type: 'user'; did: string };
			priority: 6;
			downgraded?: boolean;
	  };

export type CommonProps = {
	size?: 'sm' | 'lg';
};

export function Row({
	children,
	style,
	size = 'sm',
}: { children: React.ReactNode | React.ReactNode[] } & CommonProps & ViewStyleProp) {
	let styles: { gap: number }[];
	switch (size) {
		case 'lg':
			styles = [{ gap: 5 }];
			break;
		case 'sm':
		default:
			styles = [{ gap: 3 }];
			break;
	}
	return <View style={[a.flex_row, a.flex_wrap, a.gap_xs, styles, style]}>{children}</View>;
}

export type LabelProps = {
	cause: AppModerationCause;
	disableDetailsDialog?: boolean;
	noBg?: boolean;
} & CommonProps;

export function Label({ cause, size = 'sm', disableDetailsDialog, noBg }: LabelProps) {
	const t = useTheme();
	const handle = Dialog.useDialogHandle();
	const desc = useModerationCauseDescription(cause);
	const isLabeler = Boolean(desc.sourceType && desc.sourceDid);
	const isBlueskyLabel = desc.sourceType === 'labeler' && desc.sourceDid === BSKY_LABELER_DID;

	let outer: (ViewStyle | false)[];
	let avi: number;
	let text: TextStyle[];
	switch (size) {
		case 'lg': {
			outer = [
				t.atoms.bg_contrast_25,
				{
					gap: 5,
					paddingHorizontal: 5,
					paddingVertical: 5,
				},
			];
			avi = 16;
			text = [a.text_sm];
			break;
		}
		case 'sm':
		default: {
			outer = [
				!noBg && t.atoms.bg_contrast_25,
				{
					gap: 3,
					paddingHorizontal: 3,
					paddingVertical: 3,
				},
			];
			avi = 12;
			text = [a.text_xs];
			break;
		}
	}

	return (
		<>
			<Button
				disabled={disableDetailsDialog}
				label={desc.name}
				onPress={(e) => {
					e.preventDefault();
					e.stopPropagation();
					handle.open(null);
				}}
			>
				{({ hovered, pressed }) => (
					<View
						style={[
							a.flex_row,
							a.align_center,
							a.rounded_full,
							outer,
							(hovered || pressed) && t.atoms.bg_contrast_50,
						]}
					>
						{isBlueskyLabel || !isLabeler ? (
							<desc.icon width={avi} fill={colors.textContrastMedium} />
						) : (
							<UserAvatar avatar={desc.sourceAvi} type="user" size={avi} />
						)}

						<Text
							emoji
							style={[
								text,
								a.font_semi_bold,
								a.leading_tight,
								t.atoms.text_contrast_medium,
								{ paddingRight: 3 },
							]}
						>
							{desc.name}
						</Text>
					</View>
				)}
			</Button>

			{!disableDetailsDialog && <ModerationDetailsDialog handle={handle} modcause={cause} />}
		</>
	);
}

export function FollowsYou() {
	const t = useTheme();

	return (
		<View
			style={[
				{ paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
				a.justify_center,
				t.atoms.bg_contrast_50,
			]}
		>
			<Text style={[a.text_xs, a.leading_tight]}>{m['common.follow.followsYou']()}</Text>
		</View>
	);
}
