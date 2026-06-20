import { type StyleProp, View, type ViewStyle } from 'react-native';

import { MAX_GRAPHEME_LENGTH } from '#/lib/constants';

import { atoms as a, useTheme } from '#/alf';

import { ProgressCircle, ProgressPie } from '#/components/progress-circle';
import { Text } from '#/components/Typography';

export function CharProgress({ count, style }: { count: number; style?: StyleProp<ViewStyle> }) {
	const t = useTheme();
	const textColor = count > MAX_GRAPHEME_LENGTH ? '#e60000' : t.atoms.text.color;
	const circleColor = count > MAX_GRAPHEME_LENGTH ? '#e60000' : t.palette.primary_500;
	return (
		<View style={[a.flex_row, a.align_center, a.justify_between, a.gap_sm, style]}>
			<Text
				style={[{ color: textColor, fontVariant: ['tabular-nums'] }, a.flex_grow, a.text_right]}
				maxFontSizeMultiplier={1}
			>
				{MAX_GRAPHEME_LENGTH - count}
			</Text>
			{count > MAX_GRAPHEME_LENGTH ? (
				<ProgressPie
					size={20}
					borderWidth={4}
					borderColor={circleColor}
					color={circleColor}
					progress={Math.min((count - MAX_GRAPHEME_LENGTH) / MAX_GRAPHEME_LENGTH, 1)}
				/>
			) : (
				<ProgressCircle
					size={20}
					trackColor={t.atoms.border_contrast_low.borderColor}
					color={circleColor}
					progress={count / MAX_GRAPHEME_LENGTH}
				/>
			)}
		</View>
	);
}
