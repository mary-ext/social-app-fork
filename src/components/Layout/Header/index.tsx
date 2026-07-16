import { createContext } from 'react';
import { type GestureResponderEvent, Keyboard, View, type ViewStyle } from 'react-native';

import { HITSLOP_30 } from '#/lib/constants';

import { useSetDrawerOpen } from '#/state/shell';

import { useIsWithinSplitView } from '#/screens/Messages/components/splitView/context';

import { atoms as a, type TextStyleProp, useBreakpoints, useGutters, useTheme } from '#/alf';

import { Button, ButtonIcon, type ButtonProps } from '#/components/Button';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft } from '#/components/icons/Arrow';
import { Menu_Stroke2_Corner0_Rounded as Menu } from '#/components/icons/Menu';
import {
	BUTTON_VISUAL_ALIGNMENT_OFFSET,
	CENTER_COLUMN_WIDTH,
	HEADER_SLOT_SIZE,
} from '#/components/Layout/const';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { useNavigate, useRouter } from '#/routes';

const webViewStyle = (style: unknown): ViewStyle => {
	return style as ViewStyle;
};

export function Outer({
	children,
	noBottomBorder,
	headerRef,
	sticky = true,
}: {
	children: React.ReactNode;
	noBottomBorder?: boolean;
	headerRef?: React.RefObject<View | null>;
	sticky?: boolean;
}) {
	const t = useTheme();
	const gutters = useGutters([0, 'base']);
	const { gtMobile } = useBreakpoints();
	const { isWithinLeftPanel } = useIsWithinSplitView();

	return (
		<View
			ref={headerRef}
			style={[
				a.w_full,
				!noBottomBorder && a.border_b,
				a.flex_row,
				a.align_center,
				a.gap_sm,
				sticky && [webViewStyle(a.sticky), { top: 0 }, a.z_10, t.atoms.bg],
				isWithinLeftPanel ? a.px_lg : gutters,
				a.py_xs,
				{ minHeight: 52 },
				t.atoms.border_contrast_low,
				gtMobile && [a.mx_auto, { maxWidth: CENTER_COLUMN_WIDTH }],
			]}
		>
			{children}
		</View>
	);
}

const AlignmentContext = createContext<'platform' | 'left'>('platform');
AlignmentContext.displayName = 'AlignmentContext';

export function Content({
	children,
	align = 'platform',
}: {
	children?: React.ReactNode;
	align?: 'platform' | 'left';
}) {
	return (
		<View style={[a.flex_1, a.justify_center, { minHeight: HEADER_SLOT_SIZE }]}>
			<AlignmentContext.Provider value={align}>{children}</AlignmentContext.Provider>
		</View>
	);
}

export function Slot({ children }: { children?: React.ReactNode }) {
	return <View style={[a.z_50, { width: HEADER_SLOT_SIZE }]}>{children}</View>;
}

export function BackButton({ onPress, style, ...props }: Partial<ButtonProps>) {
	const navigate = useNavigate();
	const router = useRouter();

	const onPressBack = (evt: GestureResponderEvent) => {
		onPress?.(evt);
		if (evt.defaultPrevented) return;
		if (router.canGoBack) {
			router.back();
		} else {
			navigate('Home');
		}
	};

	return (
		<Slot>
			<Button
				label={m['common.action.goBack']()}
				size="small"
				variant="ghost"
				color="secondary"
				shape="round"
				onPress={onPressBack}
				hitSlop={HITSLOP_30}
				style={[{ marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET }, a.bg_transparent, style]}
				{...props}
			>
				<ButtonIcon icon={ArrowLeft} size="lg" />
			</Button>
		</Slot>
	);
}

export function MenuButton() {
	const setDrawerOpen = useSetDrawerOpen();
	const { gtMobile } = useBreakpoints();

	const onPress = () => {
		Keyboard.dismiss();
		setDrawerOpen(true);
	};

	return gtMobile ? null : (
		<Slot>
			<Button
				label={m['common.a11y.openDrawerMenu']()}
				size="small"
				variant="ghost"
				color="secondary"
				shape="square"
				onPress={onPress}
				hitSlop={HITSLOP_30}
				style={[{ marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET }, a.bg_transparent]}
			>
				<ButtonIcon icon={Menu} size="lg" />
			</Button>
		</Slot>
	);
}

export function TitleText({ children, style }: { children: React.ReactNode } & TextStyleProp) {
	const { gtMobile } = useBreakpoints();
	const { isWithinLeftPanel } = useIsWithinSplitView();
	return (
		<Text
			style={[
				isWithinLeftPanel ? [a.text_xl, a.font_bold] : [a.text_lg, a.font_semi_bold],
				a.leading_tight,
				gtMobile && a.text_xl,
				style,
			]}
			numberOfLines={2}
			emoji
			maxFontSizeMultiplier={2}
		>
			{children}
		</Text>
	);
}

export function SubtitleText({ children }: { children: React.ReactNode }) {
	const t = useTheme();
	return (
		<Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]} numberOfLines={2}>
			{children}
		</Text>
	);
}
