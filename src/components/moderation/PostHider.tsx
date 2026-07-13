import { type ComponentProps, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { DisplayRestrictions, ModerationCause } from '@atcute/bluesky-moderation';

import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';

import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';

import { BlockLink } from '#/components/BlockLink';
import * as Dialog from '#/components/Dialog';
import { ModerationDetailsDialog } from '#/components/moderation/ModerationDetailsDialog';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './PostHider.css';

type Props = ComponentProps<typeof BlockLink> & {
	disabled: boolean;
	/** Diameter of the cause-icon circle (aligns with the avatar it stands in for). */
	iconSize: number;
	/** Per-surface margins on the icon circle. */
	iconClassName?: string;
	modui: DisplayRestrictions;
	profile: AnyProfileView;
	interpretFilterAsBlur?: boolean;
	/** Chrome override for the warning row (background/padding per surface). */
	hiderClassName?: string;
};

/**
 * moderation gate for a post row that renders the post or a warning row.
 *
 * @param noOverride prevents revealing the post, allowing only the details dialog.
 */
export function PostHider({
	to,
	disabled,
	modui,
	hiderClassName,
	children,
	iconSize,
	iconClassName,
	profile,
	interpretFilterAsBlur,
	...props
}: Props) {
	const queryClient = useQueryClient();
	const [override, setOverride] = useState(false);
	const handle = Dialog.useDialogHandle();
	const blur = modui.blurs[0] || (interpretFilterAsBlur ? getBlurrableFilter(modui) : undefined);
	const desc = useModerationCauseDescription(blur);

	const onBeforePress = () => {
		unstableCacheProfileView(queryClient, profile);
	};

	if (!blur || (disabled && !modui.noOverride) || override) {
		// `display: contents` host: post bodies arrive as a component (or multiple elements), so BlockLink —
		// which clones a single DOM child to inject the press handlers — needs a real element to land them on,
		// without adding a layout box.
		return (
			<BlockLink to={to} onBeforePress={onBeforePress} {...props}>
				<div style={{ display: 'contents' }}>{children}</div>
			</BlockLink>
		);
	}

	return (
		<div className={clsx(styles.row, hiderClassName)}>
			<ModerationDetailsDialog handle={handle} modcause={blur} />
			<Dialog.Trigger
				handle={handle}
				className={styles.iconButton}
				aria-label={m['components.moderation.label.learnMore.aboutWarning']()}
			>
				<span
					className={clsx(styles.iconCircle, iconClassName)}
					style={{ borderRadius: iconSize, height: iconSize, width: iconSize }}
				>
					<desc.icon size="sm" fill="currentColor" />
				</span>
			</Dialog.Trigger>
			<Text className={styles.name} color="textContrastMedium" numberOfLines={1}>
				{desc.name}
			</Text>
			{!modui.noOverride && (
				<button
					type="button"
					className={styles.toggle}
					aria-label={m['components.moderation.label.showContent']()}
					onClick={() => {
						setOverride(true);
					}}
				>
					<Text color="primary_500">{m['common.action.show']()}</Text>
				</button>
			)}
		</div>
	);
}

function getBlurrableFilter(modui: DisplayRestrictions): ModerationCause | undefined {
	// moderation causes get "downgraded" when they originate from embedded content; a downgraded cause
	// should *only* drive filtering in feeds, so look for a filter that isn't downgraded.
	return modui.filters.find((filter) => !filter.downgraded);
}
