import { ArrowBottom_Stroke2_Corner0_Rounded as ArrowDownIcon } from '#/components/icons/Arrow';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

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
				<ArrowDownIcon fill={colors.text} size="lg" />
			</button>
		</div>
	);
}
