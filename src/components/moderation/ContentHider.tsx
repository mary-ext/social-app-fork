import { type ReactNode, useState } from 'react';

import {
	type DisplayRestrictions,
	type LabelModerationCause,
	ModerationCauseType,
} from '@atcute/bluesky-moderation';

import { Collapsible } from '@base-ui/react/collapsible';
import { clsx } from 'clsx';

import { ADULT_CONTENT_LABELS, isJustAMute } from '#/lib/moderation';
import { useGlobalLabelStrings } from '#/lib/moderation/useGlobalLabelStrings';
import { getDefinition, getLabelStrings } from '#/lib/moderation/useLabelInfo';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useLabelDefinitions } from '#/state/preferences';

import { LOCALE } from '#/locale/intl/locale';

import * as Dialog from '#/components/Dialog';
import { ModerationDetailsDialog } from '#/components/moderation/ModerationDetailsDialog';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as styles from './ContentHider.css';

const isAdultLabel = (cause: LabelModerationCause) =>
	ADULT_CONTENT_LABELS.some((label) => label === cause.label.val);

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
 * renders children directly when nothing blurs them, otherwise a blur card with a Base UI {@link Collapsible}
 * disclosure that reveals the content on demand.
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
	const [override, setOverride] = useState(false);
	const handle = Dialog.useDialogHandle();
	const { labelDefs } = useLabelDefinitions();
	const globalLabelStrings = useGlobalLabelStrings();
	const blur = modui.blurs[0]!;
	const desc = useModerationCauseDescription(blur);

	let labelName: string | undefined;
	if (!modui?.blurs || !blur) {
		labelName = undefined;
	} else if (blur.type !== ModerationCauseType.Label || blur.source !== null) {
		if (desc.isSubjectAccount) {
			labelName = m['components.moderation.label.accountSuffix']({ name: desc.name });
		} else {
			labelName = desc.name;
		}
	} else {
		const selfBlurCauses = modui.blurs.filter((cause): cause is LabelModerationCause => {
			if (cause.type !== ModerationCauseType.Label) {
				return false;
			}
			if (cause.source !== null) {
				return false;
			}
			return true;
		});
		// keep only the first adult-content self-label; later ones are dropped so the UI doesn't
		// stack duplicate "Adult Content" entries.
		const firstAdultIdx = selfBlurCauses.findIndex(isAdultLabel);
		const selfBlurNames = selfBlurCauses
			.filter((cause, i) => {
				if (firstAdultIdx !== -1 && isAdultLabel(cause) && i !== firstAdultIdx) {
					return false;
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
					return m['common.moderation.adultContent']();
				}
				return getLabelStrings(LOCALE, globalLabelStrings, def).name;
			});

		if (selfBlurNames.length === 0) {
			labelName = desc.name;
		} else {
			labelName = [...new Set(selfBlurNames)].join(', ');
		}
	}

	const triggerInner = (
		<>
			<desc.icon size="lg" fill={colors.textContrastMedium} className={styles.iconWrap} />
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
					{override ? m['common.action.hide']() : m['common.action.show']()}
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
			<ModerationDetailsDialog handle={handle} modcause={blur} />
			{modui.noOverride ? (
				// noOverride content can never be revealed; its trigger opens the details dialog instead of toggling.
				<Dialog.Trigger handle={handle} className={styles.blurButton} aria-label={desc.name}>
					{triggerInner}
				</Dialog.Trigger>
			) : (
				<Collapsible.Trigger className={styles.blurButton} aria-label={desc.name}>
					{triggerInner}
				</Collapsible.Trigger>
			)}
			{desc.source && blur.type === ModerationCauseType.Label && !override && (
				<Dialog.Trigger
					handle={handle}
					className={styles.learnMoreButton}
					aria-label={m['components.moderation.label.learnMore.aboutContent']()}
				>
					<Text size="md_sub" color="textContrastMedium">
						{desc.sourceType === 'user'
							? m['components.moderation.label.labeledByAuthor']()
							: m['components.moderation.label.labeledBy']({ source: sanitizeDisplayName(desc.source) })}{' '}
						<Text size="md_sub" color="primary_500" className={styles.learnMoreLink}>
							{m['components.moderation.label.learnMore.dot']()}
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
