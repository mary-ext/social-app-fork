import { clsx } from 'clsx';

import * as PostLayout from '#/components/PostLayout';
import { frame as frameRecipe } from '#/components/PostLayout.css';
import { Text } from '#/components/Text';

import EyeSlash from '#/icons/central/EyeSlash_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './ThreadItemShowOtherReplies.css';

export function ThreadItemShowOtherReplies({ onPress }: { onPress: () => void }) {
	const label = m['screens.postThread.reply.action.showMore']();
	return (
		<button
			onClick={onPress}
			aria-label={label}
			className={clsx(frameRecipe({ hoverable: true, topBorder: true }), css.button)}
		>
			<PostLayout.Row className={css.row}>
				<PostLayout.AvatarColumn className={css.avatarColumn}>
					<div className={css.iconCircle}>
						<EyeSlash className={css.eyeSlashIcon} />
					</div>
				</PostLayout.AvatarColumn>
				<PostLayout.ContentColumn className={css.contentColumn}>
					<Text className={css.label} color="textContrastMedium" numberOfLines={1}>
						{label}
					</Text>
				</PostLayout.ContentColumn>
			</PostLayout.Row>
		</button>
	);
}
