import { type ReactNode, useMemo, useState } from 'react';
import { type DisplayRestrictions, ModerationCauseType } from '@atcute/bluesky-moderation';
import { Collapsible } from '@base-ui/react/collapsible';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { ADULT_CONTENT_LABELS, type AdultSelfLabel, isJustAMute } from '#/lib/moderation';
import { useGlobalLabelStrings } from '#/lib/moderation/useGlobalLabelStrings';
import { getDefinition, getLabelStrings } from '#/lib/moderation/useLabelInfo';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useLabelDefinitions } from '#/state/preferences';

import { Text } from '#/components/Text';
import * as Dialog from '#/components/web/Dialog';
import {
	ModerationDetailsDialog,
	useModerationDetailsDialogControl,
} from '#/components/web/moderation/ModerationDetailsDialog';

import { colors } from '#/styles/colors';

import * as styles from './ContentHider.css';

type ContentHiderProps = {
	modui: DisplayRestrictions | undefined;
	ignoreMute?: boolean;
	/** Always applied to the outer wrapper — carries the card chrome (border, radius). */
	className?: string;
	/** Added to the outer wrapper only when content is blurred. */
	activeClassName?: string;
	/** Wraps the revealed children once the blur is overridden. */
	childContainerClassName?: string;
	children?: ReactNode | ((props: { active: boolean }) => ReactNode);
};

/**
 * Web-native moderation gate: renders children directly when nothing blurs them, otherwise a blur card with a
 * Base UI {@link Collapsible} disclosure that reveals the content on demand.
 */
export function ContentHider({
	modui,
	ignoreMute,
	className,
	activeClassName,
	childContainerClassName,
	children,
}: ContentHiderProps) {
	const blur = modui?.blurs[0];
	if (!modui || !blur || (ignoreMute && isJustAMute(modui))) {
		return (
			<div className={clsx(styles.passthrough, className)}>
				{typeof children === 'function' ? children({ active: false }) : children}
			</div>
		);
	}
	return (
		<ContentHiderActive
			modui={modui}
			className={className}
			activeClassName={activeClassName}
			childContainerClassName={childContainerClassName}
		>
			{typeof children === 'function' ? children({ active: true }) : children}
		</ContentHiderActive>
	);
}

function ContentHiderActive({
	modui,
	className,
	activeClassName,
	childContainerClassName,
	children,
}: {
	modui: DisplayRestrictions;
	className?: string;
	activeClassName?: string;
	childContainerClassName?: string;
	children?: ReactNode;
}) {
	const { i18n, t: l } = useLingui();
	const [override, setOverride] = useState(false);
	const control = useModerationDetailsDialogControl();
	const { labelDefs } = useLabelDefinitions();
	const globalLabelStrings = useGlobalLabelStrings();
	const blur = modui.blurs[0]!;
	const desc = useModerationCauseDescription(blur);

	const labelName = useMemo(() => {
		if (!modui?.blurs || !blur) {
			return undefined;
		}
		if (blur.type !== ModerationCauseType.Label || blur.source !== null) {
			if (desc.isSubjectAccount) {
				return l`${desc.name} (Account)`;
			} else {
				return desc.name;
			}
		}

		let hasAdultContentLabel = false;
		const selfBlurNames = modui.blurs
			.filter((cause) => {
				if (cause.type !== ModerationCauseType.Label) {
					return false;
				}
				if (cause.source !== null) {
					return false;
				}
				if (ADULT_CONTENT_LABELS.includes(cause.label.val as AdultSelfLabel)) {
					if (hasAdultContentLabel) {
						return false;
					}
					hasAdultContentLabel = true;
				}
				return true;
			})
			.slice(0, 2)
			.map((cause) => {
				if (cause.type !== ModerationCauseType.Label) {
					return;
				}

				const def = cause.labelDef || getDefinition(labelDefs, cause.label);
				if (def.identifier === 'porn' || def.identifier === 'sexual') {
					return l`Adult Content`;
				}
				return getLabelStrings(i18n.locale, globalLabelStrings, def).name;
			});

		if (selfBlurNames.length === 0) {
			return desc.name;
		}
		return [...new Set(selfBlurNames)].join(', ');
	}, [l, modui.blurs, blur, desc.name, desc.isSubjectAccount, labelDefs, i18n.locale, globalLabelStrings]);

	const triggerInner = (
		<>
			<desc.icon size="md" fill={colors.textContrastMedium} className={styles.iconWrap} />
			<Text
				size="md"
				weight="medium"
				color="textContrastMedium"
				numberOfLines={2}
				className={styles.labelText}
			>
				{labelName}
			</Text>
			{!modui.noOverride && (
				<Text size="md_sub" weight="medium" color="textContrastHigh" className={styles.toggleText}>
					{override ? <Trans>Hide</Trans> : <Trans>Show</Trans>}
				</Text>
			)}
		</>
	);

	return (
		<Collapsible.Root
			open={override}
			onOpenChange={(open) => setOverride(open)}
			className={clsx(styles.activeOuter, className, activeClassName)}
		>
			<ModerationDetailsDialog control={control} modcause={blur} />
			{modui.noOverride ? (
				// noOverride content can never be revealed; its trigger opens the details dialog instead of toggling.
				<Dialog.Trigger handle={control} className={styles.blurButton} aria-label={desc.name}>
					{triggerInner}
				</Dialog.Trigger>
			) : (
				<Collapsible.Trigger className={styles.blurButton} aria-label={desc.name}>
					{triggerInner}
				</Collapsible.Trigger>
			)}
			{desc.source && blur.type === ModerationCauseType.Label && !override && (
				<Dialog.Trigger
					handle={control}
					className={styles.learnMoreButton}
					aria-label={l`Learn more about the moderation applied to this content`}
				>
					<Text size="md_sub" color="textContrastMedium">
						{desc.sourceType === 'user' ? (
							<Trans>Labeled by the author.</Trans>
						) : (
							<Trans>Labeled by {sanitizeDisplayName(desc.source)}.</Trans>
						)}{' '}
						<Text size="md_sub" color="primary_500" className={styles.learnMoreLink}>
							<Trans>Learn more.</Trans>
						</Text>
					</Text>
				</Dialog.Trigger>
			)}
			<Collapsible.Panel className={clsx(styles.panel, childContainerClassName)}>
				{children}
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}
