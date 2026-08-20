import type { ReactNode } from 'react';

import * as Menu from '#/components/Menu';
import { Text } from '#/components/Text';
import { Button } from '#/components/web/Button';

import ChevronBottomIcon from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';

import * as css from './FeedFilterBar.css';

/**
 * renders a profile feed filter.
 *
 * @param props the filter props
 * @returns the filter menu
 */
export function FeedFilterBar({
	summary,
	label,
	children,
}: {
	summary: string;
	label: string;
	children: ReactNode;
}) {
	return (
		<div className={css.container}>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							className={css.trigger}
							color="secondary"
							label={label}
							shape="rectangular"
							size="small"
							variant="ghost"
						/>
					}
				>
					<Text size="md" weight="semiBold">
						{summary}
					</Text>
					<ChevronBottomIcon className={css.chevron} />
				</Menu.Trigger>
				<Menu.Popup label={label} minWidth={220}>
					{children}
				</Menu.Popup>
			</Menu.Root>
		</div>
	);
}
