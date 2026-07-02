import type { ReactNode, Ref } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { unstableCacheProfileView } from '#/state/queries/profile';

import { niceDate } from '#/locale/intl/datetime';

import { ProfileBadges } from '#/components/ProfileBadges';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { Text, type TextProps } from '#/components/Text';
import { Tooltip } from '#/components/Tooltip';
import { PreviewableUserAvatar } from '#/components/UserAvatar';
import { InlineLinkText } from '#/components/web/Link';

import { useActorStatus } from '#/features/liveNow';
import { m } from '#/paraglide/messages';

import * as css from './PostMeta.css';
import { TimeElapsed } from './TimeElapsed';

type AuthorLinkProps = Pick<
	TextProps,
	'align' | 'className' | 'color' | 'leading' | 'numberOfLines' | 'size' | 'weight'
> & {
	children: ReactNode;
	/** When set, render as inert text instead of a navigable link. */
	disabled: boolean;
	label: string;
	onPress: () => void;
	/** Forwarded to the host node (`<a>`, or `<span>` when inert) so it can back a headless trigger. */
	ref?: Ref<HTMLElement>;
	/** Sets the link's `tabindex`; pass `-1` to keep it clickable but out of the tab order. */
	tabIndex?: number;
	to: string;
};

/** A link in the meta row that collapses to plain {@link Text} when the surrounding row is non-interactive. */
function AuthorLink({ disabled, label, onPress, ref, tabIndex, to, ...text }: AuthorLinkProps) {
	// the ref lands on a different element per branch (`<span>` vs `<a>`); Base UI hands us a generic
	// element ref either way, so narrow it at the boundary.
	if (disabled) {
		return <Text ref={ref} {...text} />;
	}
	return (
		<InlineLinkText
			label={label}
			onPress={onPress}
			ref={ref as Ref<HTMLAnchorElement>}
			tabIndex={tabIndex}
			to={to}
			{...text}
		/>
	);
}

interface PostMetaOpts {
	author: AnyProfileView;
	className?: string;
	moderation: ModerationDecision | undefined;
	postHref: string;
	timestamp: string;
	linkDisabled?: boolean;
	showAvatar?: boolean;
	avatarSize?: number;
	onOpenAuthor?: () => void;
}

function PostMeta(opts: PostMetaOpts): ReactNode {
	const author = useProfileShadow(opts.author);
	const handle = author.handle;
	const profileLink = makeProfileLink(author);
	const queryClient = useQueryClient();
	const onOpenAuthor = opts.onOpenAuthor;
	const onBeforePressAuthor = () => {
		unstableCacheProfileView(queryClient, author);
		onOpenAuthor?.();
	};
	const onBeforePressPost = () => {
		unstableCacheProfileView(queryClient, author);
	};

	const timestampLabel = niceDate(opts.timestamp);
	const { isActive: live } = useActorStatus(author);

	const disabled = opts.linkDisabled ?? false;

	return (
		<div className={clsx(css.row, opts.className)}>
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
						tabIndex={-1}
					/>
				</div>
			)}
			<div className={css.author}>
				<ProfileHoverCard did={author.did}>
					<AuthorLink
						className={css.handle}
						color="textContrastHigh"
						weight="semiBold"
						disabled={disabled}
						label={m['common.profile.action.view']()}
						numberOfLines={1}
						onPress={onBeforePressAuthor}
						size="md"
						to={profileLink}
					>
						{sanitizeHandle(handle)}
					</AuthorLink>
				</ProfileHoverCard>

				<ProfileBadges className={css.badges} profile={author} size="sm" />

				<TimeElapsed timestamp={opts.timestamp}>
					{({ timeElapsed }) => (
						<>
							{/* eslint-disable-next-line bsky-internal/avoid-unwrapped-text */}
							<span aria-hidden> </span>

							<Tooltip label={timestampLabel}>
								<AuthorLink
									align="right"
									className={css.timestamp}
									color="textContrastMedium"
									disabled={disabled}
									label={timestampLabel}
									onPress={onBeforePressPost}
									size="md"
									to={opts.postHref}
								>
									{timeElapsed}
								</AuthorLink>
							</Tooltip>
						</>
					)}
				</TimeElapsed>
			</div>
		</div>
	);
}
export { PostMeta };
