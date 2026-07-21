import type { AnyProfileView } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import { clsx } from 'clsx';

import { makeProfileLink } from '#/lib/routes/links';

import { STALE } from '#/state/queries';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { Trans } from '#/locale/Trans';

import { ArrowCornerDownRight_Stroke2_Corner2_Rounded as ArrowCornerDownRightIcon } from '#/components/icons/ArrowCornerDownRight';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './PostRepliedTo.css';

export function PostRepliedTo({
	parentAuthor,
	isParentBlocked,
	isParentNotFound,
	className,
}: {
	parentAuthor: Did | AnyProfileView | undefined;
	isParentBlocked?: boolean;
	isParentNotFound?: boolean;
	/** Spacing escape hatch for the row's host; callers own the rhythm around it. */
	className?: string;
}) {
	const { currentAccount } = useSession();

	let label;
	if (isParentBlocked) {
		label = m['components.post.reply.toBlocked']();
	} else if (isParentNotFound) {
		label = m['components.post.reply.toPost']();
	} else if (parentAuthor) {
		const did = typeof parentAuthor === 'string' ? parentAuthor : parentAuthor.did;
		const isMe = currentAccount?.did === did;
		if (isMe) {
			label = m['components.post.reply.toYou']();
		} else {
			label = (
				<Trans
					message={m['components.post.reply.to']}
					markup={{ t0: () => <ParentAuthorName did={did} /> }}
				/>
			);
		}
	}

	if (!label) {
		// should not happen.
		return null;
	}

	return (
		<div className={clsx(css.row, className)}>
			<ArrowCornerDownRightIcon className={css.icon} fill={colors.textContrastMedium} size="xs" />
			<Text className={css.label} color="textContrastMedium" numberOfLines={1} size="sm">
				{label}
			</Text>
		</div>
	);
}

/**
 * the replied-to author's handle as an inline profile link wrapped in a hover card, falling back to a shimmer
 * while loading and to plain text on error
 */
function ParentAuthorName({ did }: { did: Did }) {
	// a feed of replies mounts many of these at once, so coalesce the author fetches into one request.
	const { data: profile, isError } = useProfileQuery({ batch: true, did, staleTime: STALE.INFINITY });

	if (isError) {
		return (
			<Text color="textContrastMedium" size="sm">
				user
			</Text>
		);
	}

	if (profile) {
		const name = profile.handle;
		return (
			<ProfileHoverCard did={did}>
				<InlineLinkText
					size="sm"
					label={name}
					weight="medium"
					color="textContrastMedium"
					to={makeProfileLink(profile)}
				>
					{name}
				</InlineLinkText>
			</ProfileHoverCard>
		);
	}

	return <span className={css.loadingName} />;
}
