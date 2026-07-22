import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';

import { ArrowBottom_Stroke2_Corner0_Rounded as ArrowDownIcon } from '#/components/icons/Arrow';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './NewMessagesPill.css';

export function NewMessagesPill({ onPress: onPressInner }: { onPress: () => void }) {
	const { bottom: bottomInset } = useSafeAreaInsets();

	const onPress = () => {
		onPressInner?.();
	};

	return (
		<div className={css.root} style={{ bottom: bottomInset + 70 }}>
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
