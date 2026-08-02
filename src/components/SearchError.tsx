import type { ReactNode } from 'react';

import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';

import * as css from './SearchError.css';

export function SearchError({ title, children }: { title?: string; children?: ReactNode }) {
	return (
		<Layout.Content>
			<div className={css.outer}>
				<XIcon className={css.xIcon} />
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
