import { type ReactNode, type Ref, useCallback } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { makeProfileLink } from '#/lib/routes/links';
import { NON_BREAKING_SPACE } from '#/lib/strings/constants';
import { sanitizeHandle } from '#/lib/strings/handles';
import { niceDate } from '#/lib/strings/time';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { unstableCacheProfileView } from '#/state/queries/profile';

import { ProfileBadges } from '#/components/ProfileBadges';
import { Text, type TextProps } from '#/components/Text';
import { PreviewableUserAvatar } from '#/components/UserAvatar';
import { InlineLinkText } from '#/components/web/Link';
import { ProfileHoverCard } from '#/components/web/ProfileHoverCard';
import { Tooltip } from '#/components/web/Tooltip';

import { useActorStatus } from '#/features/liveNow';

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

let PostMeta = (opts: PostMetaOpts): ReactNode => {
	const { i18n, t: l } = useLingui();

	const author = useProfileShadow(opts.author);
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
						label={l`View profile`}
						numberOfLines={1}
						onPress={onBeforePressAuthor}
						size="md"
						tabIndex={-1}
						to={profileLink}
					>
						{sanitizeHandle(handle)}
					</AuthorLink>
				</ProfileHoverCard>

				<ProfileBadges className={css.badges} profile={author} size="sm" />

				<TimeElapsed timestamp={opts.timestamp}>
					{({ timeElapsed }) => (
						<span className={css.timestamp}>
							<Text aria-hidden color="textContrastMedium" size="md">
								{NON_BREAKING_SPACE}
							</Text>
							<Tooltip label={timestampLabel}>
								<AuthorLink
									align="right"
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
						</span>
					)}
				</TimeElapsed>
			</div>
		</div>
	);
};
export { PostMeta };
