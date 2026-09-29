import { clsx } from 'clsx';

import ArrowIcon from '#/icons/central/ArrowUp_round_outlined_radius1_stroke2.svg';

import * as css from './LoadLatestBtn.css';

export function LoadLatestBtn({
	onPress,
	label,
	showIndicator,
}: {
	onPress: () => void;
	label: string;
	showIndicator: boolean;
}) {
	return (
		<div className={css.outer}>
			<button
				aria-label={label}
				className={clsx(css.button, showIndicator && css.indicator)}
				onClick={onPress}
				type="button"
			>
				<div className={css.hover} />
				<ArrowIcon className={clsx(css.icon, showIndicator && css.iconIndicating)} />
			</button>
		</div>
	);
}
