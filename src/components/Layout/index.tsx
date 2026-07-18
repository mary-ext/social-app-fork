import {
	ScrollView,
	type ScrollViewProps,
	type StyleProp,
	View,
	type ViewProps,
	type ViewStyle,
} from 'react-native';

import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';

import { useIsWithinSplitView } from '#/screens/Messages/components/splitView/context';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { CENTER_COLUMN_WIDTH } from '#/components/Layout/const';

export * from '#/components/Layout/const';
export * as Header from '#/components/Layout/Header';

export type ScreenProps = React.ComponentProps<typeof View> & {
	style?: StyleProp<ViewStyle>;
	noInsetTop?: boolean;
};

type WebScrollStyle = ViewStyle & {
	overflowY?: 'scroll';
	scrollbarColor?: string;
	scrollbarWidth?: 'thin';
};

const webScrollStyle = (style: WebScrollStyle): ViewStyle => {
	return style;
};

/** Outermost component of every screen */
export function Screen({ style, noInsetTop, ...props }: ScreenProps) {
	const { top } = useSafeAreaInsets();
	const { isWithinSplitView } = useIsWithinSplitView();

	return (
		<View
			style={[
				a.util_screen_outer,
				{ paddingTop: noInsetTop ? 0 : top },
				isWithinSplitView && { maxHeight: '100%' },
				style,
			]}
			{...props}
		/>
	);
}

export type ContentProps = ScrollViewProps & {
	style?: StyleProp<ViewStyle>;
	contentContainerStyle?: StyleProp<ViewStyle>;
};

/** Default scroll view for simple pages */
export function Content({
	children,
	contentContainerStyle,
	ref,
	style,
	...props
}: ContentProps & { ref?: React.Ref<ScrollView> }) {
	const t = useTheme();
	const { isWithinSplitView } = useIsWithinSplitView();

	return (
		<ScrollView
			ref={ref}
			id="content"
			automaticallyAdjustsScrollIndicatorInsets={false}
			indicatorStyle={t.scheme === 'dark' ? 'white' : 'black'}
			style={[
				a.w_full,
				isWithinSplitView &&
					webScrollStyle({
						flex: 1,
						overflowY: 'scroll',
						scrollbarWidth: 'thin',
						scrollbarColor: `${t.palette.contrast_100} transparent`,
					}),
				style,
			]}
			contentContainerStyle={[contentContainerStyle]}
			{...props}
		>
			<Center>{children}</Center>
		</ScrollView>
	);
}

/** Utility component to center content within the screen */
export function Center({ children, style, ...props }: ViewProps) {
	const { gtMobile } = useBreakpoints();
	const { isWithinSplitView } = useIsWithinSplitView();
	return (
		<View
			style={[
				a.w_full,
				!isWithinSplitView && a.mx_auto,
				gtMobile && {
					maxWidth: CENTER_COLUMN_WIDTH,
				},
				style,
			]}
			{...props}
		>
			{children}
		</View>
	);
}
