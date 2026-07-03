import { View } from 'react-native';
import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import {
	type InterpretedLabelDefinition,
	interpretLabelerDefinition,
	LabelFlags,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { isLabelerSubscribed, lookupLabelValueDefinition } from '#/lib/moderation';

import { List } from '#/view/com/util/List';

import { atoms as a, useTheme } from '#/alf';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { ListFooter } from '#/components/Lists';
import { LabelerLabelRow } from '#/components/moderation/LabelPreference';
import * as Settings from '#/components/SettingsCards';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Typography';

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
	const isSubscribed = labelerInfo ? !!isLabelerSubscribed(labelerInfo, moderationOpts) : false;

	let labelValues: InterpretedLabelDefinition[] = [];
	if (!isLabelerLoading && labelerInfo && !labelerError) {
		const customDefs = Object.values(interpretLabelerDefinition(labelerInfo));
		labelValues = labelerInfo.policies.labelValues
			.filter((val, i, arr) => arr.indexOf(val) === i) // dedupe
			.map((val) => lookupLabelValueDefinition(val, customDefs))
			.filter((def) => def && !(def.flags & LabelFlags.NoConfigurable)) as InterpretedLabelDefinition[];
	}

	return (
		<View>
			<List
				data={NO_ITEMS}
				renderItem={renderNothing}
				contentContainerStyle={a.px_xl}
				progressViewOffset={undefined}
				ListHeaderComponent={
					<>
						<LabelerListHeader
							isLabelerLoading={isLabelerLoading}
							labelerInfo={labelerInfo}
							labelerError={labelerError}
							hasValues={labelValues.length !== 0}
							isSubscribed={isSubscribed}
						/>
						{labelerInfo && !isLabelerLoading && !labelerError && labelValues.length > 0 && (
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
					</>
				}
				ListFooterComponent={<ListFooter className={css.footer} />}
			/>
		</View>
	);
}

// the label rows are rendered as a card in the list header; the list body itself carries no items.
const NO_ITEMS: InterpretedLabelDefinition[] = [];
const renderNothing = () => null;

function LabelerListHeader({
	isLabelerLoading,
	labelerError,
	labelerInfo,
	hasValues,
	isSubscribed,
}: {
	isLabelerLoading: boolean;
	labelerError?: Error | null;
	labelerInfo?: AppBskyLabelerDefs.LabelerViewDetailed;
	hasValues: boolean;
	isSubscribed: boolean;
}) {
	const t = useTheme();
	if (isLabelerLoading) {
		return (
			<View style={[a.w_full, a.align_center, a.py_4xl]}>
				<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
			</View>
		);
	}

	if (labelerError || !labelerInfo) {
		return (
			<View style={[a.w_full, a.align_center, a.py_4xl]}>
				<ErrorState error={labelerError?.toString() || m['common.error.generic']()} />
			</View>
		);
	}

	return (
		<View style={[a.py_xl]}>
			<Text style={[t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
				{m['screens.profile.labeler.labelsHint']()}
			</Text>
			{labelerInfo?.creator.viewer?.blocking ? (
				<View style={[a.flex_row, a.gap_sm, a.align_center, a.mt_md]}>
					<CircleInfo size="sm" fill={colors.textContrastMedium} />
					<Text style={[t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
						{m['screens.profile.labeler.blockHint']()}
					</Text>
				</View>
			) : null}
			{!hasValues ? (
				<Text style={[a.pt_xl, t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
					{m['screens.profile.labeler.noLabelsDeclared']()}
				</Text>
			) : !isSubscribed ? (
				<Text style={[a.pt_xl, t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
					{m['screens.profile.labeler.subscribePrompt']({ handle: labelerInfo.creator.handle })}
				</Text>
			) : null}
		</View>
	);
}
