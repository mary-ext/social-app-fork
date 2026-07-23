import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import {
	BUILTIN_LABELS,
	type InterpretedLabelDefinition,
	type LabelPreference,
} from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import { useTitle } from '#/lib/hooks/useTitle';
import { getLabelingServiceTitle, isAppLabeler } from '#/lib/moderation';
import { useGlobalLabelStrings } from '#/lib/moderation/useGlobalLabelStrings';
import { makeProfileLink } from '#/lib/routes/links';
import { errorMessage } from '#/lib/strings/errors';

import { useRemoveLabelersMutation } from '#/state/queries/labeler';
import {
	useMyLabelersQuery,
	usePreferencesQuery,
	type UsePreferencesQueryResponse,
	usePreferencesSetAdultContentMutation,
	usePreferencesSetContentLabelMutation,
} from '#/state/queries/preferences';

import { logger } from '#/logger';

import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRight } from '#/components/icons/Chevron';
import { CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign } from '#/components/icons/CircleBanSign';
import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheck } from '#/components/icons/CircleCheck';
import { EditBig_Stroke2_Corner2_Rounded as EditBig } from '#/components/icons/EditBig';
import { Filter_Stroke2_Corner0_Rounded as Filter } from '#/components/icons/Filter';
import { Group3_Stroke2_Corner0_Rounded as Group } from '#/components/icons/Group';
import { Person_Stroke2_Corner0_Rounded as Person } from '#/components/icons/Person';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

import * as styles from './index.css';

// the global adult-content sub-labels, configurable once adult content is enabled; ordered least to most
// restrictive to match the Show/Warn/Hide control.
const ADULT_CONTENT_LABELS = [
	BUILTIN_LABELS.porn!,
	BUILTIN_LABELS.sexual!,
	BUILTIN_LABELS.nudity!,
	BUILTIN_LABELS['graphic-media']!,
];

export function ModerationScreen() {
	useTitle(m['common.moderation.label']());

	const { data: preferences, error, isLoading } = usePreferencesQuery();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.moderation.label']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				{isLoading ? (
					<div className={styles.status}>
						<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
					</div>
				) : error || !preferences ? (
					<Settings.List>
						<Admonition type="error">{error?.toString() || m['common.error.generic']()}</Admonition>
					</Settings.List>
				) : (
					<ModerationScreenInner preferences={preferences} />
				)}
			</Layout.Content>
		</Layout.Screen>
	);
}

function ModerationScreenInner({ preferences }: { preferences: UsePreferencesQueryResponse }) {
	const { data: labelers, error: labelersError, isLoading: isLabelersLoading } = useMyLabelersQuery();
	const { isPending: isRemovingLabelers, mutateAsync: removeLabelers } = useRemoveLabelersMutation();
	const { mutateAsync: setAdultContentPref, variables: optimisticAdultContent } =
		usePreferencesSetAdultContentMutation();

	const subscribedDids = preferences.moderationPrefs.labelers.map((labeler) => labeler.did);
	const returnedDids = new Set<string>(labelers?.map((labeler) => labeler.creator.did));
	const unavailableDids = subscribedDids.filter((did) => !returnedDids.has(did) && !isAppLabeler(did));

	const adultContentEnabled =
		optimisticAdultContent?.enabled ||
		(!optimisticAdultContent && preferences.moderationPrefs.adultContentEnabled);

	const onToggleAdultContentEnabled = async (selected: boolean) => {
		try {
			await setAdultContentPref({ enabled: selected });
		} catch (e) {
			logger.error(`Failed to set adult content pref`, {
				message: errorMessage(e),
			});
		}
	};

	const handleCleanup = async () => {
		try {
			await removeLabelers({ dids: unavailableDids });
			Toast.show(m['screens.moderation.labeler.removeUnavailable.toast'](), { type: 'success' });
		} catch (e) {
			logger.error('Failed to remove unavailable labelers', {
				safeMessage: errorMessage(e),
			});
		}
	};

	return (
		<Settings.List>
			<Settings.Section titleText={m['screens.moderation.title']()}>
				<Settings.LinkRow
					label={m['screens.moderation.interaction.description']()}
					to="/moderation/interaction-settings"
				>
					<Settings.Icon icon={EditBig} />
					<Settings.Label titleText={m['screens.moderation.interaction.title']()} />
				</Settings.LinkRow>

				<Settings.LinkRow
					label={m['screens.moderation.mutedWord.description']()}
					to="/moderation/muted-words"
				>
					<Settings.Icon icon={Filter} />
					<Settings.Label titleText={m['screens.moderation.mutedWord.title']()} />
				</Settings.LinkRow>

				<Settings.LinkRow
					label={m['screens.moderation.moderationList.description']()}
					to="/moderation/modlists"
				>
					<Settings.Icon icon={Group} />
					<Settings.Label titleText={m['common.moderation.listsLabel']()} />
				</Settings.LinkRow>

				<Settings.LinkRow label={m['screens.moderation.mute.description']()} to="/moderation/muted-accounts">
					<Settings.Icon icon={Person} />
					<Settings.Label titleText={m['screens.moderation.mute.title']()} />
				</Settings.LinkRow>

				<Settings.LinkRow
					label={m['screens.moderation.block.description']()}
					to="/moderation/blocked-accounts"
				>
					<Settings.Icon icon={CircleBanSign} />
					<Settings.Label titleText={m['screens.moderation.block.title']()} />
				</Settings.LinkRow>

				<Settings.LinkRow
					label={m['screens.moderation.verification.manage']()}
					to="/moderation/verification-settings"
				>
					<Settings.Icon icon={CircleCheck} />
					<Settings.Label titleText={m['screens.moderation.verification.title']()} />
				</Settings.LinkRow>
			</Settings.Section>
			<Settings.Section titleText={m['screens.moderation.adultContent.title']()}>
				<Settings.SwitchRow
					label={m['screens.moderation.adultContent.toggleA11y']()}
					onChange={(selected) => void onToggleAdultContentEnabled(selected)}
					value={adultContentEnabled}
				>
					<Settings.Label titleText={m['screens.moderation.adultContent.enable']()} />
				</Settings.SwitchRow>

				{adultContentEnabled &&
					ADULT_CONTENT_LABELS.map((labelDefinition) => (
						<AdultContentLabelRow key={labelDefinition.identifier} labelDefinition={labelDefinition} />
					))}
			</Settings.Section>
			{unavailableDids.length > 0 && (
				<div className={styles.cleanup}>
					<Admonition type="tip">{m['screens.moderation.labeler.servicesUnavailable']()}</Admonition>
					<Button
						className={styles.removeButton}
						color="primary"
						disabled={isRemovingLabelers}
						label={m['screens.moderation.labeler.removeUnavailable.action']()}
						onClick={() => void handleCleanup()}
						size="small"
						variant="ghost"
					>
						{isRemovingLabelers && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
						<ButtonText>{m['common.action.remove']()}</ButtonText>
					</Button>
				</div>
			)}
			{isLabelersLoading ? (
				<div className={styles.status}>
					<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
				</div>
			) : labelersError || !labelers ? (
				<Admonition type="error">{m['screens.moderation.labeler.loadError']()}</Admonition>
			) : (
				<Settings.Section titleText={m['screens.moderation.advanced']()}>
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
	const { identifier } = labelDefinition;
	const { data: preferences } = usePreferencesQuery();
	const { mutate, variables } = usePreferencesSetContentLabelMutation();
	const labelStrings = useGlobalLabelStrings()[identifier] ?? { description: '', name: identifier };
	const pref = variables?.visibility ?? preferences?.moderationPrefs.labels[identifier] ?? 'warn';

	return (
		<Settings.SelectRow<LabelPreference>
			className={className}
			items={[
				{ label: m['common.action.show'](), value: 'ignore' },
				{ label: m['common.moderation.warn'](), value: 'warn' },
				{ label: m['common.action.hide'](), value: 'hide' },
			]}
			label={m['common.search.filteringFor']({ name: labelStrings.name })}
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
	const { creator } = labeler;
	const title = getLabelingServiceTitle({ displayName: creator.displayName, handle: creator.handle });

	return (
		<Settings.LinkRowRaw
			className={clsx(cardStyles.rowPlain, className)}
			label={m['screens.moderation.labeler.viewA11y']({ handle: creator.handle })}
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
						{m['screens.moderation.labeler.byCreator']({ handle: creator.handle })}
					</Text>
				)}
			</div>
			<span className={clsx(cardStyles.chevron, styles.labelerChevron)}>
				<ChevronRight fill="currentColor" size="sm" />
			</span>
		</Settings.LinkRowRaw>
	);
}
