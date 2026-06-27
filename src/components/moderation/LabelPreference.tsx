import {
	BUILTIN_LABELS,
	type InterpretedLabelDefinition,
	LabelFlags,
	type LabelPreference,
} from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { useGlobalLabelStrings } from '#/lib/moderation/useGlobalLabelStrings';
import { getLabelStrings } from '#/lib/moderation/useLabelInfo';

import { usePreferencesQuery, usePreferencesSetContentLabelMutation } from '#/state/queries/preferences';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './LabelPreference.css';

/**
 * A single labeler-published label rendered as a settings row. When the label is configurable here it is a
 * {@link Settings.SelectRow} dropdown (Show / Warn / Hide); when it is a global label (set in moderation
 * settings) or unavailable (adult content disabled) it falls back to a static value, and when the viewer is
 * not subscribed it is a non-interactive preview.
 */
export function LabelerLabelRow({
	className,
	disabled,
	labelDefinition,
	labelerDid,
}: {
	className?: string;
	disabled?: boolean;
	labelDefinition: InterpretedLabelDefinition;
	labelerDid?: string;
}) {
	const { i18n } = useLingui();
	const { identifier } = labelDefinition;
	// a global label is one backed by a built-in definition (porn, sexual, …); those are configured once in
	// moderation settings, not per labeler. (`isCustomLabelValue` is a format check — it's true for these
	// identifiers too — so it can't distinguish global from custom.)
	const isGlobalLabel = identifier in BUILTIN_LABELS;
	const { data: preferences } = usePreferencesQuery();
	const { mutate, variables } = usePreferencesSetContentLabelMutation();
	const globalLabelStrings = useGlobalLabelStrings();
	const labelStrings = getLabelStrings(i18n.locale, globalLabelStrings, labelDefinition);

	const savedPref =
		labelerDid && !isGlobalLabel
			? preferences?.moderationPrefs.labelers.find((labeler) => labeler.did === labelerDid)?.labels[
					identifier
				]
			: preferences?.moderationPrefs.labels[identifier];
	const pref = variables?.visibility ?? savedPref ?? labelDefinition.defaultPref ?? 'warn';

	// does the 'warn' setting make sense for this label?
	const canWarn = !(labelDefinition.blur === 'none' && labelDefinition.severity === 'none');
	const adultOnly = Boolean(labelDefinition.flags & LabelFlags.AdultOnly);
	const adultDisabled = adultOnly && !preferences?.moderationPrefs.adultContentEnabled;
	const cantConfigure = isGlobalLabel || adultDisabled;

	let prefAdjusted = pref;
	if (adultDisabled) {
		prefAdjusted = 'hide';
	} else if (!canWarn && pref === 'warn') {
		prefAdjusted = 'ignore';
	}

	const labelOptions: Record<LabelPreference, string> = {
		hide: m['common.action.hide'](),
		ignore: m['common.action.show'](),
		warn: m['common.action.warn'](),
	};

	// A label that is configured elsewhere (a global label, set in moderation settings) or unavailable (adult
	// content disabled), or one the viewer isn't subscribed to, can't be changed here — render it as a static
	// row: the description, an explanatory note for non-configurable labels, and the current value when known.
	if (disabled || cantConfigure) {
		return (
			<div className={clsx(cardStyles.row, className)}>
				<Text className={cardStyles.title} color="text" size="md" weight="medium">
					{labelStrings.name}
				</Text>
				<div className={styles.details}>
					<Text color="textContrastMedium" size="md_sub">
						{labelStrings.description}
					</Text>
					{cantConfigure && (
						<span className={styles.note}>
							<CircleInfo fill="currentColor" size="sm" />
							<Text color="textContrastMedium" size="sm" weight="medium">
								{adultDisabled ? (
									m['components.moderation.hint.adultContentDisabled']()
								) : (
									<Trans>
										Configured in{' '}
										<InlineLinkText
											label={m['components.moderation.label.moderationSettings']()}
											to="/moderation"
										>
											moderation settings
										</InlineLinkText>
										.
									</Trans>
								)}
							</Text>
						</span>
					)}
				</div>
				{!disabled && cantConfigure && (
					<span className={cardStyles.trailing}>
						<Text
							align="right"
							className={cardStyles.value}
							color="textContrastMedium"
							numberOfLines={1}
							size="sm"
						>
							{labelOptions[prefAdjusted]}
						</Text>
					</span>
				)}
			</div>
		);
	}

	const items = [
		{ label: labelOptions.ignore, value: 'ignore' },
		...(canWarn ? [{ label: labelOptions.warn, value: 'warn' }] : []),
		{ label: labelOptions.hide, value: 'hide' },
	];

	return (
		<Settings.SelectRow<LabelPreference>
			className={className}
			items={items}
			label={m['common.label.filteringFor']({ name: labelStrings.name })}
			onValueChange={(visibility) => mutate({ label: identifier, labelerDid, visibility })}
			value={prefAdjusted}
		>
			<Settings.Label subtitleText={labelStrings.description} titleText={labelStrings.name} />
		</Settings.SelectRow>
	);
}
