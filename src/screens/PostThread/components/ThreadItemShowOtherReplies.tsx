import { clsx } from 'clsx';

import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
import * as PostLayout from '#/components/PostLayout';
import { frame as frameRecipe } from '#/components/PostLayout.css';
import { Text } from '#/components/Text';

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
						<EyeSlash size="sm" fill="currentColor" />
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
