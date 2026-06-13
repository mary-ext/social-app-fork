import { forwardRef, memo, useMemo } from 'react';
import { type StyleProp, View, type ViewProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Animated, {
	type AnimatedScrollView,
	type AnimatedScrollViewProps,
} from '#/lib/animations/reanimatedCompat';

import { useEnableMinimalShellModeForScreen } from '#/state/shell';

import { useIsWithinSplitView } from '#/screens/Messages/components/splitView/context';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { CENTER_COLUMN_WIDTH } from '#/components/Layout/const';
import { ScrollbarOffsetContext } from '#/components/Layout/context';

export * from '#/components/Layout/const';
export * as Header from '#/components/Layout/Header';

export type ScreenProps = React.ComponentProps<typeof View> & {
	style?: StyleProp<ViewStyle>;
	noInsetTop?: boolean;
	minimalShell?: boolean;
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
export const Screen = memo(function Screen({
	style,
	noInsetTop,
	minimalShell = false,
	...props
}: ScreenProps) {
	const { top } = useSafeAreaInsets();
	const { isWithinSplitView } = useIsWithinSplitView();

	useEnableMinimalShellModeForScreen({ enabled: minimalShell });

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
});

export type ContentProps = AnimatedScrollViewProps & {
	style?: StyleProp<ViewStyle>;
	contentContainerStyle?: StyleProp<ViewStyle>;
};

/** Default scroll view for simple pages */
export const Content = memo(
	forwardRef<AnimatedScrollView, ContentProps>(function Content(
		{ children, style, contentContainerStyle, ...props },
		ref,
	) {
		const t = useTheme();
		const { isWithinSplitView } = useIsWithinSplitView();

		return (
			<Animated.ScrollView
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
			</Animated.ScrollView>
		);
	}),
);

/** Utility component to center content within the screen */
export const Center = memo(function LayoutCenter({ children, style, ...props }: ViewProps) {
	const { gtMobile } = useBreakpoints();
	const { isWithinSplitView } = useIsWithinSplitView();
	const ctx = useMemo(() => ({ isWithinOffsetView: true }), []);
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
			<ScrollbarOffsetContext.Provider value={ctx}>{children}</ScrollbarOffsetContext.Provider>
		</View>
	);
});
