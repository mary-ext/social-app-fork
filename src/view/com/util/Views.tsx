/**
 * In the Web build, we center all content so that it mirrors the mobile experience (a single narrow column).
 * We then place a UI shell around the content if you're in desktop.
 *
 * Because scrolling is handled by components deep in the hierarchy, we can't just wrap the top-level element
 * with a max width. The centering has to be done at the ScrollView.
 *
 * These components wrap the RN ScrollView-based components to provide consistent layout. It also provides
 * <CenteredView> for views that need to match layout but which aren't scrolled.
 */

import { forwardRef } from 'react';
import { type ScrollViewProps, StyleSheet, View, type ViewProps } from 'react-native';

import Animated, { type AnimatedScrollView } from '#/lib/animations/reanimatedCompat';
import { usePalette } from '#/lib/hooks/usePalette';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { addStyle } from '#/lib/styles';

import { CENTER_COLUMN_WIDTH } from '#/components/Layout/const';

/** @deprecated use `Layout` components */
export const CenteredView = forwardRef(function CenteredView(
	{
		style,
		topBorder,
		...props
	}: React.PropsWithChildren<ViewProps & { sideBorders?: boolean; topBorder?: boolean }>,
	ref: React.Ref<View>,
) {
	const pal = usePalette('default');
	const { isMobile } = useWebMediaQueries();
	if (!isMobile) {
		style = addStyle(style, styles.container);
	}
	if (topBorder) {
		style = addStyle(style, {
			borderTopWidth: 1,
		});
		style = addStyle(style, pal.border);
	}
	return <View ref={ref} style={style} {...props} />;
});

/** @deprecated use `Layout` components */
export const ScrollView = forwardRef(function ScrollViewImpl(
	{ contentContainerStyle, ...props }: React.PropsWithChildren<ScrollViewProps>,
	ref: React.Ref<AnimatedScrollView>,
) {
	const { isMobile } = useWebMediaQueries();
	if (!isMobile) {
		contentContainerStyle = addStyle(contentContainerStyle, styles.containerScroll);
	}
	return (
		<Animated.ScrollView
			contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
			ref={ref}
			{...props}
		/>
	);
});

const styles = StyleSheet.create({
	contentContainer: {
		// @ts-expect-error web only
		minHeight: '100vh',
	},
	container: {
		width: '100%',
		maxWidth: CENTER_COLUMN_WIDTH,
		marginLeft: 'auto',
		marginRight: 'auto',
	},
	containerScroll: {
		width: '100%',
		maxWidth: CENTER_COLUMN_WIDTH,
		marginLeft: 'auto',
		marginRight: 'auto',
	},
});
