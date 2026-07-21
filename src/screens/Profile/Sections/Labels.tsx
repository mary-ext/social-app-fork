import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import { interpretLabelerDefinition, LabelFlags, type ModerationOptions } from '@atcute/bluesky-moderation';

import { mapDefined, unique } from '@mary/array-fns';

import { isLabelerSubscribed, lookupLabelValueDefinition } from '#/lib/moderation';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { LabelerLabelRow } from '#/components/moderation/LabelPreference';
import * as Settings from '#/components/SettingsCards';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { ErrorState } from '../ErrorState';
import * as css from './Labels.css';

interface LabelsSectionProps {
	isLabelerLoading: boolean;
	labelerInfo: AppBskyLabelerDefs.LabelerViewDetailed | undefined;
	labelerError: Error | null;
	moderationOpts: ModerationOptions;
}

export function ProfileLabelsSection({
	isLabelerLoading,
	labelerInfo,
	labelerError,
	moderationOpts,
}: LabelsSectionProps) {
	if (isLabelerLoading) {
		return (
			<div className={css.container}>
				<div className={css.statusBlock}>
					<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
				</div>
			</div>
		);
	}

	if (labelerError || !labelerInfo) {
		return (
			<div className={css.container}>
				<div className={css.statusBlock}>
					<ErrorState error={labelerError?.toString() || m['common.error.generic']()} />
				</div>
			</div>
		);
	}

	const isSubscribed = isLabelerSubscribed(labelerInfo, moderationOpts);
	const customDefs = Object.values(interpretLabelerDefinition(labelerInfo));
	const labelValues = mapDefined(unique(labelerInfo.policies.labelValues), (val) => {
		const def = lookupLabelValueDefinition(val, customDefs);
		if (def === undefined || def.flags & LabelFlags.NoConfigurable) {
			return;
		}

		return def;
	});
	const hasValues = labelValues.length > 0;

	return (
		<div className={css.container}>
			<Text>{m['screens.profile.labeler.labelsHint']()}</Text>

			{labelerInfo.creator.viewer?.blocking ? (
				<div className={css.blockHint}>
					<CircleInfo size="sm" fill={colors.textContrastMedium} />
					<Text size="md_sub" color="textContrastMedium">
						{m['screens.profile.labeler.blockHint']()}
					</Text>
				</div>
			) : null}

			{!hasValues ? (
				<Text size="md_sub" color="textContrastMedium">
					{m['screens.profile.labeler.noLabelsDeclared']()}
				</Text>
			) : !isSubscribed ? (
				<Text size="md_sub" color="textContrastMedium">
					{m['screens.profile.labeler.subscribePrompt']({ handle: labelerInfo.creator.handle })}
				</Text>
			) : null}

			{hasValues && (
				<Settings.Section>
					{labelValues.map((labelDefinition) => (
						<LabelerLabelRow
							disabled={isSubscribed ? undefined : true}
							key={labelDefinition.identifier}
							labelDefinition={labelDefinition}
							labelerDid={labelerInfo.creator.did}
						/>
					))}
				</Settings.Section>
			)}
		</div>
	);
}
