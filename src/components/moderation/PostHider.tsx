import { type ComponentProps, useCallback, useState } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import type { DisplayRestrictions, ModerationCause } from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';

import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';

import { BlockLink } from '#/components/BlockLink';
import { Text } from '#/components/Text';
import * as Dialog from '#/components/web/Dialog';
import {
	ModerationDetailsDialog,
	useModerationDetailsDialogControl,
} from '#/components/web/moderation/ModerationDetailsDialog';

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
 * Web-native moderation gate for a whole post row: renders the post (a {@link BlockLink}) when nothing blurs
 * it, otherwise a warning row whose icon opens the moderation-details dialog and whose `Show` reveals the
 * post. `noOverride` causes can't be revealed — only the dialog is reachable.
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
	const { t: l } = useLingui();
	const [override, setOverride] = useState(false);
	const control = useModerationDetailsDialogControl();
	const blur = modui.blurs[0] || (interpretFilterAsBlur ? getBlurrableFilter(modui) : undefined);
	const desc = useModerationCauseDescription(blur);

	const onBeforePress = useCallback(() => {
		unstableCacheProfileView(queryClient, profile);
	}, [queryClient, profile]);

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
			<ModerationDetailsDialog control={control} modcause={blur} />
			<Dialog.Trigger
				handle={control}
				className={styles.iconButton}
				aria-label={l`Learn more about this warning`}
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
					aria-label={l`Show the content`}
					onClick={() => {
						setOverride(true);
					}}
				>
					<Text color="primary_500">
						<Trans>Show</Trans>
					</Text>
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
