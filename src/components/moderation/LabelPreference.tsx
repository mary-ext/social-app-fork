import {
	type InterpretedLabelDefinition,
	LabelFlags,
	type LabelPreference,
} from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { resolveGlobalLabelPreference } from '#/lib/moderation/prefs';

import { useGlobalLabelStrings } from '#/state/moderation/use-global-label-strings';
import { getLabelStrings } from '#/state/moderation/use-label-info';
import { usePreferencesQuery, usePreferencesSetContentLabelMutation } from '#/state/queries/preferences';

import { LOCALE } from '#/locale/intl/locale';

import * as Toggle from '#/components/forms/Toggle';
import * as Settings from '#/components/SettingsCards';
import { Text } from '#/components/Text';

import CircleInfo from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './LabelPreference.css';

// the API uses an absent preference for inheritance
const INHERIT_VALUE = 'inherit';

type LabelOption = {
	label: string;
	value?: LabelPreference;
};

const toggleValue = (pref: LabelPreference | undefined) => pref ?? INHERIT_VALUE;

/**
 * an expandable row for a labeler's label preference.
 *
 * @param className additional row class
 * @param disabled whether the preference can be changed
 * @param labelDefinition label definition
 * @param labelerDid labeler DID
 * @param onOpenChange called when the row opens or closes
 * @param open whether the row is open
 */
export function LabelerLabelRow({
	className,
	disabled,
	labelDefinition,
	labelerDid,
	onOpenChange,
	open,
}: {
	className?: string;
	disabled: boolean;
	labelDefinition: InterpretedLabelDefinition;
	labelerDid: Did;
	onOpenChange: (open: boolean) => void;
	open: boolean;
}) {
	const { identifier } = labelDefinition;
	const { data: preferences } = usePreferencesQuery();
	const { isPending, mutate, variables } = usePreferencesSetContentLabelMutation();
	const globalLabelStrings = useGlobalLabelStrings();
	const labelStrings = getLabelStrings(LOCALE, globalLabelStrings, labelDefinition);

	const adultOnly = !!(labelDefinition.flags & LabelFlags.AdultOnly);
	const adultDisabled = adultOnly && !preferences?.moderationPrefs.adultContentEnabled;
	// adult-only labels are hidden while adult content is off
	const configurable = !disabled && !adultDisabled;

	const labelOptions: Record<LabelPreference, string> = {
		hide: m['common.action.hide'](),
		ignore: m['common.action.show'](),
		warn: m['common.moderation.warn'](),
	};

	// labels without blur or severity cannot warn
	const canWarn = !(labelDefinition.blur === 'none' && labelDefinition.severity === 'none');
	// map stored warn to ignore when warn is unavailable
	const adjust = (pref: LabelPreference): LabelPreference => (!canWarn && pref === 'warn' ? 'ignore' : pref);

	const saved = preferences?.moderationPrefs.labelers.find((labeler) => labeler.did === labelerDid)?.labels[
		identifier
	];
	// pending clears must not fall back to the saved value
	const current = isPending ? variables?.visibility : saved;
	const pref = current ? adjust(current) : undefined;
	const inherited = adjust(
		preferences
			? resolveGlobalLabelPreference(preferences.moderationPrefs, labelDefinition)
			: labelDefinition.defaultPref,
	);
	const effective = adultDisabled ? 'hide' : (pref ?? inherited);

	const allOptions: LabelOption[] = [
		{ label: m['components.moderation.labelPreference.inherited']({ value: labelOptions[inherited] }) },
		{ label: labelOptions.ignore, value: 'ignore' },
		{ label: labelOptions.warn, value: 'warn' },
		{ label: labelOptions.hide, value: 'hide' },
	];
	const options = canWarn ? allOptions : allOptions.filter((option) => option.value !== 'warn');

	const onChangeVisibility = ([selected]: string[]) => {
		const option = options.find((candidate) => toggleValue(candidate.value) === selected);
		if (option) {
			mutate({ label: identifier, labelerDid, visibility: option.value });
		}
	};

	return (
		<Settings.CollapsibleRow
			className={className}
			label={labelStrings.name}
			onOpenChange={onOpenChange}
			open={open}
			panel="body"
			titleText={labelStrings.name}
			trailing={!disabled && <Settings.Value text={labelOptions[effective]} />}
		>
			<Text color="textContrastMedium" size="md_sub">
				{labelStrings.description}
			</Text>
			{adultDisabled && (
				<span className={styles.note}>
					<CircleInfo className={styles.circleInfoIcon} />
					<Text color="textContrastMedium" size="sm" weight="medium">
						{m['components.moderation.adultContent.disabled']()}
					</Text>
				</span>
			)}
			{configurable && (
				<Toggle.Group
					className={styles.radioList}
					label={m['common.search.filteringFor']({ name: labelStrings.name })}
					onChange={onChangeVisibility}
					type="radio"
					values={[toggleValue(pref)]}
				>
					{options.map((option) => (
						<Toggle.RadioItem
							key={toggleValue(option.value)}
							label={option.label}
							value={toggleValue(option.value)}
						>
							<Toggle.Panel>
								<Toggle.RadioIndicator />
								<Toggle.PanelText>{option.label}</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
					))}
				</Toggle.Group>
			)}
		</Settings.CollapsibleRow>
	);
}
