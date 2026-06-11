import type { Ref } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import { Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import { STALE } from '#/state/queries';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { ArrowCornerDownRight_Stroke2_Corner2_Rounded as ArrowCornerDownRightIcon } from '#/components/icons/ArrowCornerDownRight';
import { InlineLinkText } from '#/components/web/Link';
import { ProfileHoverCard } from '#/components/web/ProfileHoverCard';
import { Text } from '#/components/web/Text';

import * as css from './PostRepliedTo.css';

export function PostRepliedTo({
	parentAuthor,
	isParentBlocked,
	isParentNotFound,
	className,
}: {
	parentAuthor: string | AnyProfileView | undefined;
	isParentBlocked?: boolean;
	isParentNotFound?: boolean;
	/** Spacing escape hatch for the row's host; callers own the rhythm around it. */
	className?: string;
}) {
	const { currentAccount } = useSession();

	let label;
	if (isParentBlocked) {
		label = <Trans context="description">Replied to a blocked post</Trans>;
	} else if (isParentNotFound) {
		label = <Trans context="description">Replied to a post</Trans>;
	} else if (parentAuthor) {
		const did = typeof parentAuthor === 'string' ? parentAuthor : parentAuthor.did;
		const isMe = currentAccount?.did === did;
		if (isMe) {
			label = <Trans context="description">Replied to you</Trans>;
		} else {
			label = (
				<Trans context="description">
					Replied to{' '}
					<ProfileHoverCard did={did}>
						<ParentAuthorName did={did} />
					</ProfileHoverCard>
				</Trans>
			);
		}
	}

	if (!label) {
		// should not happen.
		return null;
	}

	return (
		<div className={clsx(css.row, className)}>
			<span className={css.icon}>
				<ArrowCornerDownRightIcon fill="currentColor" size="xs" />
			</span>
			<Text className={css.label} color="textContrastMedium" leading="snug" numberOfLines={1} size="sm">
				{label}
			</Text>
		</div>
	);
}

// only the `did` is ours; the rest (ref, hover/pointer handlers, aria/data attributes) is injected at runtime
// by the ProfileHoverCard trigger and forwarded to whichever host this resolves to.
type ParentAuthorNameProps = {
	did: string;
	ref?: Ref<HTMLElement>;
};

/**
 * The replied-to author's display name as an inline profile link, falling back to a shimmer while loading and
 * to plain text on error.
 */
function ParentAuthorName({ did, ref, ...rest }: ParentAuthorNameProps) {
	const { data: profile, isError } = useProfileQuery({ did, staleTime: STALE.INFINITY });

	if (isError) {
		return (
			<Text {...rest} ref={ref} color="textContrastMedium" leading="snug" size="sm">
				user
			</Text>
		);
	}

	if (profile) {
		const name = sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle));
		return (
			<InlineLinkText
				{...rest}
				ref={ref as Ref<HTMLAnchorElement>}
				color="textContrastMedium"
				label={name}
				leading="snug"
				size="sm"
				to={makeProfileLink(profile)}
			>
				{name}
			</InlineLinkText>
		);
	}

	return <span {...rest} ref={ref} className={css.loadingName} />;
}
