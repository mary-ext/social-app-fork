import { type StyleProp, StyleSheet, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { useLingui } from '@lingui/react/macro';

import { usePalette } from '#/lib/hooks/usePalette';
import { useTheme } from '#/lib/ThemeContext';

import { ArrowRotateClockwise_Stroke2_Corner0_Rounded as ArrowRotateClockwiseIcon } from '#/components/icons/ArrowRotate';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Layout from '#/components/Layout';

import { Text } from '../text/Text';

export function ErrorMessage({
	message,
	numberOfLines,
	style,
	onPressTryAgain,
}: {
	message: string;
	numberOfLines?: number;
	style?: StyleProp<ViewStyle>;
	onPressTryAgain?: () => void;
}) {
	const theme = useTheme();
	const pal = usePalette('error');
	const { t: l } = useLingui();
	return (
		<Layout.Center>
			<View testID="errorMessageView" style={[styles.outer, pal.view, style]}>
				<View style={[styles.errorIcon, { backgroundColor: theme.palette.error.icon }]}>
					<WarningIcon width={16} fill={pal.text.color as string} />
				</View>
				<Text type="sm-medium" style={[styles.message, pal.text]} numberOfLines={numberOfLines}>
					{message}
				</Text>
				{onPressTryAgain && (
					<TouchableOpacity
						testID="errorMessageTryAgainButton"
						style={styles.btn}
						onPress={onPressTryAgain}
						accessibilityRole="button"
						accessibilityLabel={l`Retry`}
						accessibilityHint={l`Retries the last action, which errored out`}
					>
						<ArrowRotateClockwiseIcon width={18} fill={theme.palette.error.icon} />
					</TouchableOpacity>
				)}
			</View>
		</Layout.Center>
	);
}

const styles = StyleSheet.create({
	outer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 8,
	},
	errorIcon: {
		borderRadius: 12,
		width: 24,
		height: 24,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 8,
	},
	message: {
		flex: 1,
		paddingRight: 10,
	},
	btn: {
		paddingHorizontal: 4,
		paddingVertical: 4,
	},
});
