import { clsx } from 'clsx';

import { atoms as a } from '#/alf';

import { Button } from '#/components/Button';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as css from './ThreadItemShowOtherReplies.css';

export function ThreadItemShowOtherReplies({ onPress }: { onPress: () => void }) {
	const label = m['screens.postThread.action.showMoreReplies']();

	return (
		<Button
			onPress={() => {
				onPress();
			}}
			label={label}
			style={a.w_full}
		>
			{({ hovered, pressed }) => (
				<div className={clsx(css.row, hovered || pressed ? css.rowActive : css.rowIdle)}>
					<div className={css.iconCircle}>
						<EyeSlash size="sm" fill="currentColor" />
					</div>
					<Text className={css.label} color="textContrastMedium" numberOfLines={1}>
						{label}
					</Text>
				</div>
			)}
		</Button>
	);
}
