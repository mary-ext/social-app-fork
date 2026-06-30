import { useOpenComposer } from '#/lib/hooks/useOpenComposer';

import { useCurrentAccountProfile } from '#/state/queries/useCurrentAccountProfile';

import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './ComposerPrompt.css';

export function ComposerPrompt({ topBorder = false }: { topBorder?: boolean }) {
	const { openComposer } = useOpenComposer();
	const profile = useCurrentAccountProfile();

	if (!profile) {
		return null;
	}

	return (
		<div className={css.root({ topBorder })}>
			<button
				type="button"
				className={css.cover}
				aria-label={m['common.compose.action.compose']()}
				aria-description={m['view.feeds.composer.a11y']()}
				onClick={() => openComposer({ logContext: 'Fab' })}
			/>

			<UserAvatar avatar={profile.avatar} size={36} type={profile.associated?.labeler ? 'labeler' : 'user'} />

			<div className={css.body}>
				<Text color="textContrastMedium" size="md">
					{m['common.compose.placeholder']()}
				</Text>
			</div>

			<Button
				className={css.imageButton}
				label={m['view.feeds.image.add']()}
				aria-description={m['view.feeds.image.a11y']()}
				onClick={() => openComposer({ logContext: 'Fab', openGallery: true })}
				shape="round"
				variant="bare"
			>
				<ImageIcon fill="currentColor" size="lg" />
			</Button>
		</div>
	);
}
