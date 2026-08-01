import {
	type InterpretedLabelDefinition,
	LabelFlags,
	type LabelPreference,
} from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { clsx } from 'clsx';

import { resolveGlobalLabelPreference } from '#/lib/moderation/prefs';
import { useGlobalLabelStrings } from '#/lib/moderation/useGlobalLabelStrings';
import { getLabelStrings } from '#/lib/moderation/useLabelInfo';

import { usePreferencesQuery, usePreferencesSetContentLabelMutation } from '#/state/queries/preferences';

import { LOCALE } from '#/locale/intl/locale';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import type * as Select from '#/components/Select';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './LabelPreference.css';

/**
 * single labeler-published label rendered as a settings row. falls back to a non-interactive preview if the
 * label can't be configured (adult content off) or the viewer is unsubscribed.
 */
export function LabelerLabelRow({
	disabled,
	labelDefinition,
	labelerDid,
}: {
	disabled: boolean;
	labelDefinition: InterpretedLabelDefinition;
	labelerDid: Did;
}) {
	const { identifier } = labelDefinition;
	const { data: preferences } = usePreferencesQuery();
	const { isPending, mutate, variables } = usePreferencesSetContentLabelMutation();
	const globalLabelStrings = useGlobalLabelStrings();
	const labelStrings = getLabelStrings(LOCALE, globalLabelStrings, labelDefinition);

	const adultOnly = !!(labelDefinition.flags & LabelFlags.AdultOnly);
	const adultDisabled = adultOnly && !preferences?.moderationPrefs.adultContentEnabled;

	const labelOptions: Record<LabelPreference, string> = {
		hide: m['common.action.hide'](),
		ignore: m['common.action.show'](),
		warn: m['common.moderation.warn'](),
	};

	// nothing to configure: adult-only labels are forced to hide while adult content is off, and an
	// unsubscribed labeler's labels don't apply at all
	if (disabled || adultDisabled) {
		return (
			<div className={cardStyles.row}>
				<Text className={cardStyles.title} color="text" size="md" weight="medium">
					{labelStrings.name}
				</Text>
				<div className={clsx(cardStyles.subtitle, styles.details)}>
					<Text color="textContrastMedium" size="md_sub">
						{labelStrings.description}
					</Text>
					{adultDisabled && (
						<span className={styles.note}>
							<CircleInfo fill="currentColor" size="sm" />
							<Text color="textContrastMedium" size="sm" weight="medium">
								{m['components.moderation.adultContent.disabled']()}
							</Text>
						</span>
					)}
				</div>
				{!disabled && (
					<span className={cardStyles.trailing}>
						<Text
							align="right"
							className={cardStyles.value}
							color="textContrastMedium"
							numberOfLines={1}
							size="sm"
						>
							{labelOptions.hide}
						</Text>
					</span>
				)}
			</div>
		);
	}

	// does the 'warn' setting make sense for this label?
	const canWarn = !(labelDefinition.blur === 'none' && labelDefinition.severity === 'none');
	// display-only: a stored 'warn' renders nothing here, and 'warn' is absent from `items`
	const adjust = (pref: LabelPreference): LabelPreference => (!canWarn && pref === 'warn' ? 'ignore' : pref);

	const saved = preferences?.moderationPrefs.labelers.find((labeler) => labeler.did === labelerDid)?.labels[
		identifier
	];
	// `undefined` is a meaningful pending value (a clear), so this can't be `??`-ed
	const pref = isPending ? variables?.visibility : saved;
	const inherited = adjust(
		preferences
			? resolveGlobalLabelPreference(preferences.moderationPrefs, labelDefinition)
			: labelDefinition.defaultPref,
	);

	// `null` stands in for "no labeler-scoped preference"; the select has to name every option, but what
	// actually stores it is the absence of a `contentLabelPref` entry
	const allItems: Select.SelectItem<LabelPreference | null>[] = [
		{
			label: m['components.moderation.labelPreference.inherited']({ value: labelOptions[inherited] }),
			value: null,
		},
		{ label: labelOptions.ignore, value: 'ignore' },
		{ label: labelOptions.warn, value: 'warn' },
		{ label: labelOptions.hide, value: 'hide' },
	];
	const items = canWarn ? allItems : allItems.filter((item) => item.value !== 'warn');

	return (
		<Settings.SelectRow<LabelPreference | null>
			items={items}
			label={m['common.search.filteringFor']({ name: labelStrings.name })}
			onValueChange={(value) => mutate({ label: identifier, labelerDid, visibility: value ?? undefined })}
			value={pref ? adjust(pref) : null}
		>
			<Settings.Label subtitleText={labelStrings.description} titleText={labelStrings.name} />
		</Settings.SelectRow>
	);
}
