import type { ReactNode } from 'react';

import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';

import { colors } from '#/styles/colors';

import * as css from './SearchError.css';

export function SearchError({ title, children }: { title?: string; children?: ReactNode }) {
	return (
		<Layout.Content>
			<div className={css.outer}>
				<XIcon size="3xl" fill={colors.textContrastLow} />
				<div className={css.body}>
					<Text align="center" size="lg" weight="semiBold">
						{title}
					</Text>
					{children}
				</div>
			</div>
		</Layout.Content>
	);
}
