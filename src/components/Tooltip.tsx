'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ReactElement } from 'react';

import * as BaseTooltip from '#/components/primitives/tooltip';
import { Text } from '#/components/Text';
import * as styles from '#/components/Tooltip.css';

export type TooltipProps = {
	/** trigger element; must forward its ref and DOM props to the same host node. */
	children: ReactElement;
	/** hint text. */
	label: string;
};

/**
 * shows a hint on hover or keyboard focus.
 *
 * @param props trigger and hint text
 * @returns the trigger and tooltip
 */
export function Tooltip({ children, label }: TooltipProps) {
	return (
		<BaseTooltip.Root disableHoverablePopup>
			<BaseTooltip.Trigger render={children} />
			<BaseTooltip.Positioner side="top" sideOffset={6}>
				<BaseTooltip.Popup className={styles.popup}>
					<Text color="text" size="sm" weight="medium">
						{label}
					</Text>
				</BaseTooltip.Popup>
			</BaseTooltip.Positioner>
		</BaseTooltip.Root>
	);
}
