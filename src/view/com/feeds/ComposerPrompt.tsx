import { useCallback, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';

import { useCurrentAccountProfile } from '#/state/queries/useCurrentAccountProfile';

import { atoms as a, useTheme } from '#/alf';

import { Button } from '#/components/Button';
import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { SubtleHover } from '#/components/SubtleHover';
import { Text } from '#/components/Typography';
import { UserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';

type WebViewStyle = ViewStyle & {
	cursor?: 'pointer';
	outline?: 'none';
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style;
};

export function ComposerPrompt() {
	const t = useTheme();
	const { openComposer } = useOpenComposer();
	const profile = useCurrentAccountProfile();
	const [hover, setHover] = useState(false);

	const onPress = useCallback(() => {
		openComposer({ logContext: 'Fab' });
	}, [openComposer]);

	const onPressImage = useCallback(() => {
		openComposer({ openGallery: true, logContext: 'Fab' });
	}, [openComposer]);

	if (!profile) {
		return null;
	}

	return (
		<Pressable
			onPress={onPress}
			android_ripple={null}
			accessibilityRole="button"
			accessibilityLabel={m['common.compose.action.compose']()}
			accessibilityHint={m['view.feeds.composer.a11y']()}
			onPointerEnter={() => setHover(true)}
			onPointerLeave={() => setHover(false)}
			style={({ pressed }) => [
				a.relative,
				a.flex_row,
				a.align_start,
				{
					paddingLeft: 18,
					paddingRight: 15,
				},
				a.py_md,
				undefined,
				webViewStyle({
					cursor: 'pointer',
					outline: 'none',
				}),
				pressed && webViewStyle({ outline: 'none' }),
			]}
		>
			<SubtleHover hover={hover} />
			<UserAvatar avatar={profile.avatar} size={42} type={profile.associated?.labeler ? 'labeler' : 'user'} />
			<View
				style={[
					a.flex_1,
					a.ml_md,
					a.flex_row,
					a.align_center,
					a.justify_between,
					{
						height: 40,
					},
				]}
			>
				<Text style={[t.atoms.text_contrast_medium, a.text_md, { includeFontPadding: false }]}>
					{m['common.compose.placeholder']()}
				</Text>
				<View style={[a.flex_row, a.gap_md]}>
					<Button
						onPress={(e) => {
							e.stopPropagation();
							void onPressImage();
						}}
						label={m['view.feeds.image.add']()}
						accessibilityHint={m['view.feeds.image.a11y']()}
						variant="ghost"
						shape="round"
					>
						{({ hovered, pressed, focused }) => (
							<ImageIcon
								size="lg"
								style={{
									color: hovered || pressed || focused ? t.palette.primary_500 : t.palette.contrast_300,
								}}
							/>
						)}
					</Button>
				</View>
			</View>
		</Pressable>
	);
}
