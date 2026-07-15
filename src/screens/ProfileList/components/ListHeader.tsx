import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { makeProfileLink } from '#/lib/routes/links';

import { Trans } from '#/locale/Trans';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { preloadLightbox } from '#/components/Lightbox';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './ListHeader.css';

/**
 * profile-subpage header card for a list: avatar, title, and a "by …" byline, followed by the list
 * description.
 */
export function ListHeader({ isOwner, list }: { isOwner: boolean; list: AppBskyGraphDefs.ListView }) {
	const { lightboxHandle } = useGlobalDialogsHandleContext();

	const onPressAvi = () => {
		if (
			list.avatar // TODO && !(view.moderation.avatar.blur && view.moderation.avatar.noOverride)
		) {
			lightboxHandle.openWithPayload({
				images: [{ src: list.avatar }],
				index: 0,
			});
		}
	};

	const creatorLink = () => (
		<InlineLinkText
			to={makeProfileLink(list.creator)}
			label={m['screens.profile.avatar.a11y.viewProfile']({ handle: list.creator.handle })}
			color="textContrastMedium"
		>
			{list.creator.handle || ''}
		</InlineLinkText>
	);

	const descriptionRT = list.description
		? {
				facets: list.descriptionFacets ?? [],
				text: list.description,
			}
		: undefined;

	return (
		<div className={css.outer}>
			<div className={css.header}>
				<button
					type="button"
					className={css.avatarButton}
					aria-label={m['view.profile.action.viewAvatar']()}
					onClick={onPressAvi}
					onPointerDown={preloadLightbox}
				>
					<UserAvatar type="list" size={56} avatar={list.avatar} />
				</button>
				<div className={css.content}>
					<Text size="xl" weight="semiBold" numberOfLines={2}>
						{list.name || ''}
					</Text>
					<Text color="textContrastMedium" numberOfLines={1}>
						{list.purpose === 'app.bsky.graph.defs#modlist' ? (
							isOwner ? (
								m['view.profile.list.moderationByYou']()
							) : (
								<Trans message={m['view.profile.list.moderationBy']} markup={{ t0: creatorLink }} />
							)
						) : isOwner ? (
							m['view.profile.list.byYou']()
						) : (
							<Trans message={m['view.profile.list.by']} markup={{ t0: creatorLink }} />
						)}
					</Text>
				</div>
			</div>
			{descriptionRT ? <RichText value={descriptionRT} /> : null}
		</div>
	);
}
