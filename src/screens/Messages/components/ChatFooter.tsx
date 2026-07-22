import type { Props as SVGIconProps } from '#/components/icons/common';
import { Text } from '#/components/Text';

import { colors } from '#/styles/colors';

import * as css from './ChatFooter.css';

export function ChatFooter({
	children,
	heading,
	subheading,
	icon: Icon,
}: React.PropsWithChildren<{
	heading: string;
	subheading?: string;
	icon: React.ComponentType<SVGIconProps>;
}>) {
	return (
		<div className={css.outer}>
			<div className={css.pill}>
				<div className={css.inner}>
					<Icon className={css.icon} fill={colors.textContrastMedium} size="lg" />
					<div className={css.textColumn}>
						<Text color="textContrastMedium" numberOfLines={1} size="sm" weight="semiBold">
							{heading}
						</Text>
						{subheading ? (
							<Text color="textContrastMedium" numberOfLines={2} size="xs">
								{subheading}
							</Text>
						) : null}
					</div>
				</div>
				{children}
			</div>
		</div>
	);
}
