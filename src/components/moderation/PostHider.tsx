import { type ComponentProps, type MouseEvent, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { DisplayRestrictions, ModerationCause } from '@atcute/bluesky-moderation';

import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { INTERACTIVE_SELECTOR } from '#/lib/browser/interactive';
import { mergeRefs } from '#/lib/utils/merge-refs';

import { useModerationCauseDescription } from '#/state/moderation/use-moderation-cause-description';
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
 * renders a post or a click-to-reveal moderation warning.
 *
 * @param modui.noOverride prevents revealing the post; only the details dialog is available
 * @param ref receives the post link or warning row
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
	ref,
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
			<BlockLink ref={ref} to={to} onBeforePress={onBeforePress} {...props}>
				<div style={{ display: 'contents' }}>{children}</div>
			</BlockLink>
		);
	}

	const onRowClick = (ev: MouseEvent<HTMLDivElement>) => {
		const interactive = ev.target instanceof Element ? ev.target.closest(INTERACTIVE_SELECTOR) : null;
		if (interactive === null || !ev.currentTarget.contains(interactive)) {
			setOverride(true);
		}
	};

	return (
		<div
			ref={mergeRefs<HTMLElement>([ref])}
			className={clsx(styles.row, !modui.noOverride && styles.revealable, hiderClassName)}
			onClick={modui.noOverride ? undefined : onRowClick}
		>
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
					<desc.icon className={styles.icon} />
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
					<Text color="textLink">{m['common.action.show']()}</Text>
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
