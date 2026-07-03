/** centers content on web to mirror the mobile layout, wrapping scrollable and static views */

import { forwardRef } from 'react';
import {
	ScrollView as RNScrollView,
	type ScrollViewProps,
	StyleSheet,
	View,
	type ViewProps,
} from 'react-native';

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
	ref: React.Ref<RNScrollView>,
) {
	const { isMobile } = useWebMediaQueries();
	if (!isMobile) {
		contentContainerStyle = addStyle(contentContainerStyle, styles.containerScroll);
	}
	return (
		<RNScrollView
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
