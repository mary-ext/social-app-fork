import type { ReactElement } from 'react';

import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

import { Text } from '#/components/Text';
import * as styles from '#/components/Tooltip.css';

export type TooltipProps = {
	/**
	 * the trigger element. must forward a ref and spread DOM props onto its host node so the tooltip can wire
	 * its hover/focus behavior.
	 */
	children: ReactElement;
	/** The hint shown in the popup on hover/focus. */
	label: string;
	/** Which side of the trigger the popup prefers; defaults to `top`. */
	side?: BaseTooltip.Positioner.Props['side'];
};

/** A hover/focus hint built on Base UI's Tooltip, wrapping a single ref-forwarding trigger element. */
export function Tooltip({ children, label, side = 'top' }: TooltipProps) {
	return (
		<BaseTooltip.Root>
			<BaseTooltip.Trigger render={children} />
			<BaseTooltip.Portal>
				<BaseTooltip.Positioner className={styles.positioner} side={side} sideOffset={6}>
					<BaseTooltip.Popup className={styles.popup}>
						<Text color="text" size="sm" weight="medium">
							{label}
						</Text>
					</BaseTooltip.Popup>
				</BaseTooltip.Positioner>
			</BaseTooltip.Portal>
		</BaseTooltip.Root>
	);
}
