import type { ReactNode } from 'react';

import * as Menu from '#/components/Menu';
import { Button, ButtonIcon } from '#/components/web/Button';

import SettingsSliderIcon from '#/icons/central/SettingsSliderVer_round_outlined_radius1_stroke2.svg';

import * as css from './FilterMenu.css';

/**
 * @param props filter label and menu items
 * @returns a profile filter menu
 */
export function FilterMenu({ label, children }: { label: string; children: ReactNode }) {
	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						className={css.trigger}
						color="secondary"
						label={label}
						shape="round"
						size="small"
						variant="ghost"
					>
						<ButtonIcon icon={SettingsSliderIcon} size="md" />
					</Button>
				}
			/>
			<Menu.Popup align="end" label={label} minWidth={220}>
				{children}
			</Menu.Popup>
		</Menu.Root>
	);
}
