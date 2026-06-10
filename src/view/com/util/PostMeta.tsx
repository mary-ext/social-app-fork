import { memo, type ReactNode, useCallback } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';

import { makeProfileLink } from '#/lib/routes/links';
import { forceLTR } from '#/lib/strings/bidi';
import { NON_BREAKING_SPACE } from '#/lib/strings/constants';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { niceDate } from '#/lib/strings/time';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { unstableCacheProfileView } from '#/state/queries/profile';

import { ProfileBadges } from '#/components/ProfileBadges';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { type InlineLinkUnderline, InlineLinkText } from '#/components/web/Link';
import { Text, type TextProps } from '#/components/web/Text';
import { PreviewableUserAvatar } from '#/components/web/UserAvatar';

import { useActorStatus } from '#/features/liveNow';

import * as css from './PostMeta.css';
import { TimeElapsed } from './TimeElapsed';

type AuthorLinkProps = Pick<
	TextProps,
	'align' | 'className' | 'color' | 'leading' | 'numberOfLines' | 'size' | 'title' | 'weight'
> & {
	children: ReactNode;
	/** When set, render as inert text instead of a navigable link. */
	disabled: boolean;
	label: string;
	onPress: () => void;
	to: string;
	underline?: InlineLinkUnderline;
};

/** A link in the meta row that collapses to plain {@link Text} when the surrounding row is non-interactive. */
function AuthorLink({ disabled, label, onPress, to, underline, ...text }: AuthorLinkProps) {
	if (disabled) {
		return <Text {...text} />;
	}
	return (
		<InlineLinkText
			disableMismatchWarning
			label={label}
			onPress={onPress}
			to={to}
			underline={underline}
			{...text}
		/>
	);
}

interface PostMetaOpts {
	author: AnyProfileView;
	moderation: ModerationDecision | undefined;
	postHref: string;
	timestamp: string;
	linkDisabled?: boolean;
	showAvatar?: boolean;
	avatarSize?: number;
	onOpenAuthor?: () => void;
}

let PostMeta = (opts: PostMetaOpts): ReactNode => {
	const { i18n, t: l } = useLingui();

	const author = useProfileShadow(opts.author);
	const displayName = author.displayName || author.handle;
	const handle = author.handle;
	const profileLink = makeProfileLink(author);
	const queryClient = useQueryClient();
	const onOpenAuthor = opts.onOpenAuthor;
	const onBeforePressAuthor = useCallback(() => {
		unstableCacheProfileView(queryClient, author);
		onOpenAuthor?.();
	}, [queryClient, author, onOpenAuthor]);
	const onBeforePressPost = useCallback(() => {
		unstableCacheProfileView(queryClient, author);
	}, [queryClient, author]);

	const timestampLabel = niceDate(i18n, opts.timestamp);
	const { isActive: live } = useActorStatus(author);

	const disabled = opts.linkDisabled ?? false;

	return (
		<div className={css.row}>
			{opts.showAvatar && (
				<div className={css.avatar}>
					<PreviewableUserAvatar
						size={opts.avatarSize || 16}
						profile={author}
						moderation={
							opts.moderation && getDisplayRestrictions(opts.moderation, DisplayContext.ProfileMedia)
						}
						type={author.associated?.labeler ? 'labeler' : 'user'}
						live={live}
						hideLiveBadge
						disableNavigation={disabled}
					/>
				</div>
			)}
			<div className={css.author}>
				<ProfileHoverCard did={author.did}>
					<div className={css.author}>
						<AuthorLink
							className={css.name}
							color="text"
							disabled={disabled}
							label={l`View profile`}
							leading="tight"
							numberOfLines={1}
							onPress={onBeforePressAuthor}
							size="md"
							to={profileLink}
							weight="semiBold"
						>
							{forceLTR(
								sanitizeDisplayName(
									displayName,
									opts.moderation && getDisplayRestrictions(opts.moderation, DisplayContext.ProfileBio),
								),
							)}
						</AuthorLink>
						<ProfileBadges profile={author} size="sm" style={{ alignSelf: 'center', paddingLeft: 2 }} />
						<AuthorLink
							className={css.handle}
							color="textContrastMedium"
							disabled={disabled}
							label={l`View profile`}
							leading="tight"
							numberOfLines={1}
							onPress={onBeforePressAuthor}
							size="md"
							to={profileLink}
							underline="none"
						>
							{NON_BREAKING_SPACE + sanitizeHandle(handle, '@')}
						</AuthorLink>
					</div>
				</ProfileHoverCard>

				<TimeElapsed timestamp={opts.timestamp}>
					{({ timeElapsed }) => (
						<AuthorLink
							align="right"
							className={css.timestamp}
							color="textContrastMedium"
							disabled={disabled}
							label={timestampLabel}
							leading="tight"
							onPress={onBeforePressPost}
							size="md"
							title={timestampLabel}
							to={opts.postHref}
							underline="none"
						>
							<Text aria-hidden color="textContrastMedium" leading="tight" size="md">
								·{' '}
							</Text>
							{timeElapsed}
						</AuthorLink>
					)}
				</TimeElapsed>
			</div>
		</div>
	);
};
PostMeta = memo(PostMeta);
export { PostMeta };
