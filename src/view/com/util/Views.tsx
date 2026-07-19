import { View, type ViewProps } from 'react-native';

import { usePalette } from '#/lib/hooks/usePalette';
import { addStyle } from '#/lib/styles';

/**
 * @deprecated use `Layout` components. the app shell now frames and centers the screen column, so
 * this only applies an optional top border.
 */
export function CenteredView({
	ref,
	style,
	topBorder,
	...props
}: React.PropsWithChildren<ViewProps & { sideBorders?: boolean; topBorder?: boolean }> & {
	ref?: React.Ref<View>;
}) {
	const pal = usePalette('default');
	if (topBorder) {
		style = addStyle(style, {
			borderTopWidth: 1,
		});
		style = addStyle(style, pal.border);
	}
	return <View ref={ref} style={style} {...props} />;
}
