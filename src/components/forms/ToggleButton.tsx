import { type AccessibilityProps, type TextStyle, View, type ViewStyle } from 'react-native';

import { atoms as a, useTheme } from '#/alf';

import * as Toggle from '#/components/forms/Toggle';
import { Text } from '#/components/Typography';

type ItemProps = Omit<Toggle.ItemProps, 'style' | 'role' | 'children'> &
	AccessibilityProps & {
		children: React.ReactElement;
		testID?: string;
	};

export type GroupProps = Omit<Toggle.GroupProps, 'style' | 'type'> & {
	multiple?: boolean;
};

/** @deprecated - use SegmentedControl */
export function Group({ children, multiple, ...props }: GroupProps) {
	const t = useTheme();
	return (
		<Toggle.Group type={multiple ? 'checkbox' : 'radio'} {...props}>
			<View
				style={[
					a.w_full,
					a.flex_row,
					a.rounded_sm,
					a.overflow_hidden,
					t.atoms.border_contrast_low,
					{ borderWidth: 1 },
				]}
			>
				{children}
			</View>
		</Toggle.Group>
	);
}

/** @deprecated - use SegmentedControl */
export function Button({ children, ...props }: ItemProps) {
	return (
		<Toggle.Item {...props} style={[a.flex_grow, a.flex_1]}>
			<ButtonInner>{children}</ButtonInner>
		</Toggle.Item>
	);
}

function ButtonInner({ children }: React.PropsWithChildren<{}>) {
	const t = useTheme();
	const state = Toggle.useItemContext();

	const baseStyles: ViewStyle[] = [];
	const hoverStyles: ViewStyle[] = [];
	const activeStyles: ViewStyle[] = [];

	hoverStyles.push(t.name === 'light' ? t.atoms.bg_contrast_100 : t.atoms.bg_contrast_25);

	if (state.selected) {
		activeStyles.push({
			backgroundColor: t.palette.contrast_800,
		});
		hoverStyles.push({
			backgroundColor: t.palette.contrast_800,
		});

		if (state.disabled) {
			activeStyles.push({
				backgroundColor: t.palette.contrast_500,
			});
		}
	}

	if (state.disabled) {
		baseStyles.push({
			backgroundColor: t.palette.contrast_100,
		});
	}

	return (
		<View
			style={[
				{
					borderLeftWidth: 1,
					marginLeft: -1,
				},
				a.flex_grow,
				a.py_md,
				a.px_md,
				t.atoms.bg,
				t.atoms.border_contrast_low,
				baseStyles,
				activeStyles,
				(state.hovered || state.pressed) && hoverStyles,
			]}
		>
			{children}
		</View>
	);
}

/** @deprecated - use SegmentedControl */
export function ButtonText({ children }: { children: React.ReactNode }) {
	const t = useTheme();
	const state = Toggle.useItemContext();

	const textStyles: TextStyle[] = [];
	if (state.selected) {
		textStyles.push(t.atoms.text_inverted);
	}
	if (state.disabled) {
		textStyles.push({
			opacity: 0.5,
		});
	}

	return (
		<Text style={[a.text_center, a.font_semi_bold, t.atoms.text_contrast_medium, textStyles]}>
			{children}
		</Text>
	);
}
