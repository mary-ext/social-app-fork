import { useCallback, useEffect, useState } from 'react';
import { type GestureResponderEvent, View } from 'react-native';
import { Trans } from '@lingui/react/macro';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, type ButtonProps } from '#/components/Button';
import { SquareBehindSquare_Stroke2_Corner2_Rounded as CopyIcon } from '#/components/icons/SquareBehindSquare4';
import { Text } from '#/components/Typography';

import * as Clipboard from '#/shims/clipboard';

export function CopyTextButton({
	children,
	disabled,
	style,
	value,
	onPress: onPressProp,
	...props
}: ButtonProps & { value: string }) {
	const t = useTheme();

	const [hasBeenCopied, setHasBeenCopied] = useState(false);

	useEffect(() => {
		if (hasBeenCopied) {
			const timeout = setTimeout(() => setHasBeenCopied(false), 100);
			return () => clearTimeout(timeout);
		}
	}, [hasBeenCopied]);

	const onPress = useCallback(
		(evt: GestureResponderEvent) => {
			void Clipboard.setStringAsync(value);
			setHasBeenCopied(true);
			onPressProp?.(evt);
		},
		[value, onPressProp],
	);

	return (
		<View style={[a.relative]}>
			{hasBeenCopied && (
				<View
					style={[a.absolute, { bottom: '100%', right: 0 }, a.justify_center, a.gap_sm, a.z_10, a.pb_sm]}
					pointerEvents="none"
				>
					<Text style={[a.font_medium, a.text_right, a.text_sm, t.atoms.text_contrast_high]}>
						<Trans>Copied!</Trans>
					</Text>
				</View>
			)}
			<Button
				color="secondary"
				disabled={disabled}
				style={[a.flex_1, a.justify_between, { borderRadius: 10 }, style]}
				onPress={onPress}
				{...props}
			>
				{(context) => (
					<View style={[a.flex_1, a.flex_row, a.justify_between, a.p_md]}>
						{typeof children === 'function' ? children(context) : children}
						{disabled ? null : <ButtonIcon icon={CopyIcon} size="lg" />}
					</View>
				)}
			</Button>
		</View>
	);
}
