import type { ComponentType, SVGProps } from 'react';

import * as styles from './ControlButton.css';

export function ControlButton({
	active,
	activeLabel,
	inactiveLabel,
	activeIcon: ActiveIcon,
	inactiveIcon: InactiveIcon,
	onPress,
}: {
	active: boolean;
	activeLabel: string;
	inactiveLabel: string;
	activeIcon: ComponentType<SVGProps<SVGSVGElement>>;
	inactiveIcon: ComponentType<SVGProps<SVGSVGElement>>;
	onPress: () => void;
}) {
	const Icon = active ? ActiveIcon : InactiveIcon;
	return (
		<button
			type="button"
			className={styles.button}
			aria-label={active ? activeLabel : inactiveLabel}
			onClick={onPress}
		>
			<Icon className={styles.icon} aria-hidden />
		</button>
	);
}
