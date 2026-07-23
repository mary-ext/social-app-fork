import type { ReactNode } from 'react';

import type { ModerationCause } from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import { BSKY_LABELER_DID } from '#/lib/moderation/const';
import type { AppModerationCause } from '#/lib/moderation/types';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';

import * as Dialog from '#/components/Dialog';
import { ModerationDetailsDialog } from '#/components/moderation/ModerationDetailsDialog';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import * as styles from '#/components/web/Pills.css';

import { m } from '#/paraglide/messages';

export type { AppModerationCause };

export type CommonProps = {
	size?: 'lg' | 'sm';
};

/** A wrapping flex row of moderation pills. The `className` escape hatch lets a caller add outer spacing. */
export function Row({
	children,
	className,
	size = 'sm',
}: { children: ReactNode; className?: string } & CommonProps) {
	return <div className={clsx(styles.row({ size }), className)}>{children}</div>;
}

export type LabelProps = {
	cause: AppModerationCause | ModerationCause;
	/**
	 * When true, render a static pill that doesn't open the moderation-details dialog (e.g. inside a hover
	 * card).
	 */
	disableDetailsDialog?: boolean;
	noBg?: boolean;
} & CommonProps;

/** A single moderation pill: a glyph/avatar + label that opens the moderation-details dialog when pressed. */
export function Label({ cause, disableDetailsDialog, noBg, size = 'sm' }: LabelProps) {
	const handle = Dialog.useDialogHandle();
	const desc = useModerationCauseDescription(cause);
	const isLabeler = !!(desc.sourceType && desc.sourceDid);
	const isBlueskyLabel = desc.sourceType === 'labeler' && desc.sourceDid === BSKY_LABELER_DID;
	const glyphSize = size === 'lg' ? 16 : 12;

	const inner = (
		<>
			{isBlueskyLabel || !isLabeler ? (
				<desc.icon fill="currentColor" width={glyphSize} />
			) : (
				<UserAvatar avatar={desc.sourceAvi} size={glyphSize} type="user" />
			)}
			<Text
				className={styles.pillText}
				color="textContrastMedium"
				numberOfLines={1}
				size={size === 'lg' ? 'sm' : 'xs'}
				weight="semiBold"
			>
				{desc.name}
			</Text>
		</>
	);

	if (disableDetailsDialog) {
		return <div className={styles.pill({ bg: !noBg, size })}>{inner}</div>;
	}

	return (
		<>
			<Dialog.Trigger
				aria-label={desc.name}
				className={styles.pill({ bg: !noBg, size })}
				handle={handle}
				// the pill lives inside a navigable post; keep its click from bubbling to the row's nav handler.
				onClick={(e) => e.stopPropagation()}
			>
				{inner}
			</Dialog.Trigger>
			<ModerationDetailsDialog handle={handle} modcause={cause} />
		</>
	);
}

/** A static pill marking a profile the signed-in user is followed by. */
export function FollowsYou() {
	return (
		<div className={styles.followsYou}>
			<Text size="xs">{m['common.follow.followsYou']()}</Text>
		</div>
	);
}
