import { useCallback } from 'react';
import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import {
	BUILTIN_LABELS,
	type InterpretedLabelDefinition,
	type LabelPreference,
} from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { getLabelingServiceTitle, isAppLabeler } from '#/lib/moderation';
import { useGlobalLabelStrings } from '#/lib/moderation/useGlobalLabelStrings';
import { makeProfileLink } from '#/lib/routes/links';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useRemoveLabelersMutation } from '#/state/queries/labeler';
import {
	useMyLabelersQuery,
	usePreferencesQuery,
	type UsePreferencesQueryResponse,
	usePreferencesSetAdultContentMutation,
	usePreferencesSetContentLabelMutation,
} from '#/state/queries/preferences';
import { isNonConfigurableModerationAuthority } from '#/state/session/additional-moderation-authorities';

import { logger } from '#/logger';

import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRight } from '#/components/icons/Chevron';
import { CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign } from '#/components/icons/CircleBanSign';
import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheck } from '#/components/icons/CircleCheck';
import { EditBig_Stroke2_Corner2_Rounded as EditBig } from '#/components/icons/EditBig';
import { Filter_Stroke2_Corner0_Rounded as Filter } from '#/components/icons/Filter';
import { Flag_Stroke2_Corner0_Rounded as Flag } from '#/components/icons/Flag';
import { Group3_Stroke2_Corner0_Rounded as Group } from '#/components/icons/Group';
import { Person_Stroke2_Corner0_Rounded as Person } from '#/components/icons/Person';
import { Loader } from '#/components/Loader';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import * as styles from './index.css';

// the global adult-content sub-labels, configurable once adult content is enabled; ordered least to most
// restrictive to match the Show/Warn/Hide control.
const ADULT_CONTENT_LABELS = [
	BUILTIN_LABELS.porn!,
	BUILTIN_LABELS.sexual!,
	BUILTIN_LABELS.nudity!,
	BUILTIN_LABELS['graphic-media']!,
];

export function ModerationScreen(_props: NativeStackScreenProps<CommonNavigatorParams, 'Moderation'>) {
	const { t: l } = useLingui();
	const { data: preferences, error, isLoading } = usePreferencesQuery();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Moderation</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				{isLoading ? (
					<div className={styles.status}>
						<Spinner color="currentColor" label={l`Loading`} size="xl" />
					</div>
				) : error || !preferences ? (
					<Settings.List>
						<Admonition type="error">
							{error?.toString() || l`Something went wrong, please try again.`}
						</Admonition>
					</Settings.List>
				) : (
					<ModerationScreenInner preferences={preferences} />
				)}
			</Layout.Content>
		</Layout.Screen>
	);
}

function ModerationScreenInner({ preferences }: { preferences: UsePreferencesQueryResponse }) {
	const { t: l } = useLingui();
	const { data: labelers, error: labelersError, isLoading: isLabelersLoading } = useMyLabelersQuery();
	const { isPending: isRemovingLabelers, mutateAsync: removeLabelers } = useRemoveLabelersMutation();
	const { mutateAsync: setAdultContentPref, variables: optimisticAdultContent } =
		usePreferencesSetAdultContentMutation();

	const subscribedDids = preferences.moderationPrefs.labelers.map((labeler) => labeler.did);
	const returnedDids = new Set(labelers?.map((labeler) => labeler.creator.did));
	const unavailableDids = subscribedDids.filter((did) => {
		const branded = did as `did:${string}:${string}`;
		return !returnedDids.has(branded) && !isAppLabeler(did) && !isNonConfigurableModerationAuthority(did);
	});

	const adultContentEnabled = !!(
		optimisticAdultContent?.enabled ||
		(!optimisticAdultContent && preferences.moderationPrefs.adultContentEnabled)
	);

	const onToggleAdultContentEnabled = useCallback(
		async (selected: boolean) => {
			try {
				await setAdultContentPref({ enabled: selected });
			} catch (e) {
				logger.error(`Failed to set adult content pref`, {
					message: e instanceof Error ? e.message : String(e),
				});
			}
		},
		[setAdultContentPref],
	);

	const handleCleanup = async () => {
		try {
			await removeLabelers({ dids: unavailableDids });
			Toast.show(l`Removed unavailable services`, { type: 'success' });
		} catch (e) {
			logger.error('Failed to remove unavailable labelers', {
				safeMessage: e instanceof Error ? e.message : String(e),
			});
		}
	};

	return (
		<Settings.List>
			<Settings.Section titleText={<Trans>Moderation tools</Trans>}>
				<Settings.LinkRow
					label={l`View your default post interaction settings`}
					to="/moderation/interaction-settings"
				>
					<Settings.Icon icon={EditBig} />
					<Settings.Label titleText={<Trans>Interaction settings</Trans>} />
				</Settings.LinkRow>

				<Settings.LinkRow label={l`View your muted words`} to="/moderation/muted-words">
					<Settings.Icon icon={Filter} />
					<Settings.Label titleText={<Trans>Muted words</Trans>} />
				</Settings.LinkRow>

				<Settings.LinkRow label={l`View your moderation lists`} to="/moderation/modlists">
					<Settings.Icon icon={Group} />
					<Settings.Label titleText={<Trans>Moderation lists</Trans>} />
				</Settings.LinkRow>

				<Settings.LinkRow label={l`View your muted accounts`} to="/moderation/muted-accounts">
					<Settings.Icon icon={Person} />
					<Settings.Label titleText={<Trans>Muted accounts</Trans>} />
				</Settings.LinkRow>

				<Settings.LinkRow label={l`View your blocked accounts`} to="/moderation/blocked-accounts">
					<Settings.Icon icon={CircleBanSign} />
					<Settings.Label titleText={<Trans>Blocked accounts</Trans>} />
				</Settings.LinkRow>

				<Settings.LinkRow label={l`Manage verification settings`} to="/moderation/verification-settings">
					<Settings.Icon icon={CircleCheck} />
					<Settings.Label titleText={<Trans>Verification settings</Trans>} />
				</Settings.LinkRow>
			</Settings.Section>

			<Settings.Section titleText={<Trans>Content filters</Trans>}>
				<Settings.SwitchRow
					label={l`Toggle to enable or disable adult content`}
					onChange={(selected) => void onToggleAdultContentEnabled(selected)}
					value={adultContentEnabled}
				>
					<Settings.Label titleText={<Trans>Enable adult content</Trans>} />
				</Settings.SwitchRow>

				{adultContentEnabled &&
					ADULT_CONTENT_LABELS.map((labelDefinition) => (
						<AdultContentLabelRow key={labelDefinition.identifier} labelDefinition={labelDefinition} />
					))}
			</Settings.Section>

			{unavailableDids.length > 0 && (
				<div className={styles.cleanup}>
					<Admonition type="tip">
						<Trans>Some moderation services in your list are no longer available.</Trans>
					</Admonition>
					<Button
						className={styles.removeButton}
						color="primary"
						disabled={isRemovingLabelers}
						label={l`Remove unavailable moderation services`}
						onClick={() => void handleCleanup()}
						size="small"
						variant="ghost"
					>
						{isRemovingLabelers && <ButtonIcon icon={Loader} />}
						<ButtonText>
							<Trans>Remove</Trans>
						</ButtonText>
					</Button>
				</div>
			)}

			{isLabelersLoading ? (
				<div className={styles.status}>
					<Spinner color="currentColor" label={l`Loading`} size="xl" />
				</div>
			) : labelersError || !labelers ? (
				<Admonition type="error">
					<Trans>We were unable to load your configured labelers at this time.</Trans>
				</Admonition>
			) : (
				<Settings.Section titleText={<Trans>Advanced</Trans>}>
					{labelers.map((labeler) => (
						<LabelerRow key={labeler.creator.did} labeler={labeler} />
					))}
				</Settings.Section>
			)}
		</Settings.List>
	);
}

function AdultContentLabelRow({
	className,
	labelDefinition,
}: {
	className?: string;
	labelDefinition: InterpretedLabelDefinition;
}) {
	const { t: l } = useLingui();
	const { identifier } = labelDefinition;
	const { data: preferences } = usePreferencesQuery();
	const { mutate, variables } = usePreferencesSetContentLabelMutation();
	const labelStrings = useGlobalLabelStrings()[identifier] ?? { description: '', name: identifier };
	const pref = variables?.visibility ?? preferences?.moderationPrefs.labels[identifier] ?? 'warn';

	return (
		<Settings.SelectRow<LabelPreference>
			className={className}
			items={[
				{ label: l`Show`, value: 'ignore' },
				{ label: l`Warn`, value: 'warn' },
				{ label: l`Hide`, value: 'hide' },
			]}
			label={l`Filtering for ${labelStrings.name}`}
			onValueChange={(visibility) => mutate({ label: identifier, labelerDid: undefined, visibility })}
			value={pref}
		>
			<Settings.Label subtitleText={labelStrings.description || undefined} titleText={labelStrings.name} />
		</Settings.SelectRow>
	);
}

function LabelerRow({
	className,
	labeler,
}: {
	className?: string;
	labeler: AppBskyLabelerDefs.LabelerViewDetailed;
}) {
	const { t: l } = useLingui();
	const { creator } = labeler;
	const title = getLabelingServiceTitle({ displayName: creator.displayName, handle: creator.handle });

	return (
		<Settings.LinkRowRaw
			className={clsx(cardStyles.rowPlain, className)}
			label={l`View the labeling service provided by @${creator.handle}`}
			to={makeProfileLink({ did: creator.did })}
		>
			<UserAvatar avatar={creator.avatar} className={styles.labelerAvatar} size={40} type="labeler" />
			<div className={styles.identity}>
				<Text numberOfLines={1} size="md" weight="medium">
					{title}
				</Text>
				{creator.description ? (
					<Text color="textContrastMedium" numberOfLines={2} size="md_sub">
						{creator.description}
					</Text>
				) : (
					<Text color="textContrastMedium" size="md_sub">
						{l`By ${sanitizeHandle(creator.handle, '@')}`}
					</Text>
				)}
				{isNonConfigurableModerationAuthority(creator.did) && (
					<span className={styles.regionalNotice}>
						<Flag fill="currentColor" size="sm" />
						<Text size="sm">
							<Trans>Required in your region</Trans>
						</Text>
					</span>
				)}
			</div>
			<span className={clsx(cardStyles.chevron, styles.labelerChevron)}>
				<ChevronRight fill="currentColor" size="sm" />
			</span>
		</Settings.LinkRowRaw>
	);
}
