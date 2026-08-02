import ArrowDownIcon from '#/icons/central/ArrowDown_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './NewMessagesPill.css';

export function NewMessagesPill({ onPress: onPressInner }: { onPress: () => void }) {
	const onPress = () => {
		onPressInner?.();
	};

	return (
		<div className={css.root}>
			<button
				aria-label={m['components.dms.scrollDown.a11y.label']()}
				className={css.button}
				onClick={onPress}
				type="button"
			>
				<ArrowDownIcon className={css.arrowDownIcon} />
			</button>
		</div>
	);
}
