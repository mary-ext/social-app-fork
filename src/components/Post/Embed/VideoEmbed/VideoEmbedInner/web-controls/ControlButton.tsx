import type { Props as IconProps } from '#/components/icons/common';

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
	activeIcon: React.ComponentType<IconProps>;
	inactiveIcon: React.ComponentType<IconProps>;
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
			<Icon fill="#fff" width={20} height={20} aria-hidden />
		</button>
	);
}
