import type { ReactNode } from 'react';
import type { ModerationCause } from '@atcute/bluesky-moderation';
import { clsx } from 'clsx';

import { BSKY_LABELER_DID } from '#/lib/moderation/const';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';

import type { AppModerationCause } from '#/components/Pills';
import * as Dialog from '#/components/web/Dialog';
import {
	ModerationDetailsDialog,
	useModerationDetailsDialogControl,
} from '#/components/web/moderation/ModerationDetailsDialog';
import * as styles from '#/components/web/Pills.css';
import { Text } from '#/components/web/Text';
import { UserAvatar } from '#/components/web/UserAvatar';

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
	return <div className={clsx(styles.row[size], className)}>{children}</div>;
}

export type LabelProps = {
	cause: AppModerationCause | ModerationCause;
	noBg?: boolean;
} & CommonProps;

/** A single moderation pill: a glyph/avatar + label that opens the moderation-details dialog when pressed. */
export function Label({ cause, noBg, size = 'sm' }: LabelProps) {
	const control = useModerationDetailsDialogControl();
	const desc = useModerationCauseDescription(cause);
	const isLabeler = Boolean(desc.sourceType && desc.sourceDid);
	const isBlueskyLabel = desc.sourceType === 'labeler' && desc.sourceDid === BSKY_LABELER_DID;
	const glyphSize = size === 'lg' ? 16 : 12;

	return (
		<>
			<Dialog.Trigger
				aria-label={desc.name}
				className={clsx(styles.pill[size], !noBg && styles.pillBg)}
				handle={control}
				// the pill lives inside a navigable post; keep its click from bubbling to the row's nav handler.
				onClick={(e) => e.stopPropagation()}
			>
				{isBlueskyLabel || !isLabeler ? (
					<desc.icon fill="currentColor" width={glyphSize} />
				) : (
					<UserAvatar avatar={desc.sourceAvi} size={glyphSize} type="user" />
				)}
				<Text
					className={styles.pillText}
					color="textContrastMedium"
					leading="tight"
					numberOfLines={1}
					size={size === 'lg' ? 'sm' : 'xs'}
					weight="semiBold"
				>
					{desc.name}
				</Text>
			</Dialog.Trigger>
			<ModerationDetailsDialog control={control} modcause={cause} />
		</>
	);
}
