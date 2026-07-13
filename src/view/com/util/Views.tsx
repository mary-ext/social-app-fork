/** centers content on web to mirror the mobile layout, wrapping scrollable and static views */

import { forwardRef } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

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

const styles = StyleSheet.create({
	container: {
		width: '100%',
		maxWidth: CENTER_COLUMN_WIDTH,
		marginLeft: 'auto',
		marginRight: 'auto',
	},
});
