import type { ComponentType, SVGProps } from 'react';

import type { AppBskyNotificationDeclaration } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';

import { useNotificationDeclarationQuery } from '#/state/queries/activity-subscriptions';
import { useContentVisibilityMutation, useContentVisibilityQuery } from '#/state/queries/content-visibility';
import { RQKEY_ROOT as POST_FEED_RQKEY_ROOT } from '#/state/queries/post-feed';
import { useProfileQuery, useProfileUpdateMutation } from '#/state/queries/profile';
import { postThreadQueryKeyRoot } from '#/state/queries/usePostThread/types';
import { useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import * as Dialog from '#/components/Dialog';
import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import BellRingingIcon from '#/icons/central-custom/BellRinging_round_outlined_radius1_stroke2.svg';
import CarIcon from '#/icons/central/CarFrontView_round_outlined_radius1_stroke2.svg';
import EyeSlashIcon from '#/icons/central/EyeSlash_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import RobotIcon from '#/icons/central/Robot_round_outlined_radius0_stroke2.svg';
import { m } from '#/paraglide/messages';

import { ActivitySubscriptionDialog } from './components/ActivitySubscriptionDialog';
import { ExportCarDialog } from './components/ExportCarDialog';
import { PrivacyRequestDialog } from './components/PrivacyRequestDialog';

type AllowSubscriptions = AppBskyNotificationDeclaration.Main['allowSubscriptions'];

export function AccountSettingsScreen() {
	useTitle(m['common.account.privacy']());

	const exportCarHandle = Dialog.useDialogHandle();
	const activityHandle = Dialog.useDialogHandle();

	const automation = useSelfLabelToggle({ value: 'bot', invalidateFeeds: true });
	const pwi = useSelfLabelToggle({ value: '!no-unauthenticated' });

	const { data: declaration, isError, isPending } = useNotificationDeclarationQuery();

	const {
		data: contentVisibility,
		isError: isContentVisibilityError,
		isPending: isContentVisibilityPending,
	} = useContentVisibilityQuery();
	const updateContentVisibility = useContentVisibilityMutation();
	const hideFromRecommendations = contentVisibility?.value.hideFromAlgorithmicRecommendations ?? false;

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.account.privacy']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section titleText={m['screens.settings.export.title']()}>
						<Settings.SwitchRow
							disabled={!automation.canToggle}
							label={m['screens.settings.automation.showLabel']()}
							loading={automation.loading}
							onChange={automation.toggle}
							value={automation.enabled}
						>
							<Settings.Icon icon={RobotIcon} />
							<Settings.Label
								subtitleText={m['screens.settings.automation.showLabelHint']()}
								titleText={m['screens.settings.automation.label']()}
							/>
						</Settings.SwitchRow>

						<Settings.ButtonRow
							label={m['screens.settings.export.action.export']()}
							onPress={() => exportCarHandle.open(null)}
						>
							<Settings.Icon icon={CarIcon} />
							<Settings.Label titleText={m['screens.settings.export.action.export']()} />
						</Settings.ButtonRow>
					</Settings.Section>

					<Settings.Section titleText={m['screens.settings.privacy.title']()}>
						<Settings.ButtonRow
							label={m['screens.settings.activitySubscription.allowNotifying']()}
							onPress={() => activityHandle.open(null)}
						>
							<Settings.Icon icon={BellRingingIcon} />
							<Settings.Label
								loading={isPending}
								subtitleText={
									<AllowSubscriptionsValue isError={isError} value={declaration?.value?.allowSubscriptions} />
								}
								titleText={m['screens.settings.activitySubscription.allowNotifying']()}
							/>
						</Settings.ButtonRow>
					</Settings.Section>

					<Settings.Section>
						<PrivacyRequestRow
							descriptionText={m['screens.settings.privacy.algoVisibility.description']()}
							icon={MagnifyingGlassIcon}
							isError={isContentVisibilityError}
							loading={isContentVisibilityPending}
							onChange={updateContentVisibility.mutate}
							titleText={m['screens.settings.privacy.algoVisibility.request']()}
							value={hideFromRecommendations}
						/>

						<PrivacyRequestRow
							descriptionText={m['screens.settings.privacy.discoverability.description']()}
							icon={EyeSlashIcon}
							isError={pwi.isError}
							loading={!pwi.canToggle}
							onChange={pwi.toggle}
							titleText={m['screens.settings.privacy.discoverability.request']()}
							value={pwi.enabled}
						/>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
			<ExportCarDialog handle={exportCarHandle} />
			<ActivitySubscriptionDialog handle={activityHandle} />
		</Layout.Screen>
	);
}

/** The current activity-subscription selection, rendered as the drill-in row's value line. */
function AllowSubscriptionsValue({ isError, value }: { isError: boolean; value?: AllowSubscriptions }) {
	if (isError) {
		return m['screens.settings.preferences.error.loading']();
	}
	switch (value) {
		case 'mutuals': {
			return m['screens.settings.audience.onlyFollowersIFollow']();
		}
		case 'none': {
			return m['screens.settings.audience.noOne']();
		}
		case 'followers':
		default: {
			return m['screens.settings.audience.anyoneWhoFollowsMe']();
		}
	}
}

const PrivacyRequestRow = ({
	className,
	descriptionText,
	icon,
	isError,
	loading,
	onChange,
	titleText,
	value,
}: {
	className?: string;
	descriptionText: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	isError: boolean;
	loading: boolean;
	onChange: (value: boolean) => void;
	titleText: string;
	value: boolean;
}) => {
	const handle = Dialog.useDialogHandle();

	let subtitleText = value ? m['common.status.on']() : m['common.status.off']();
	if (isError) {
		subtitleText = m['screens.settings.preferences.error.loading']();
	}

	return (
		<>
			<Settings.ButtonRow className={className} label={titleText} onPress={() => handle.open(null)}>
				<Settings.Icon icon={icon} />
				<Settings.Label loading={!isError && loading} subtitleText={subtitleText} titleText={titleText} />
			</Settings.ButtonRow>

			<PrivacyRequestDialog
				descriptionText={descriptionText}
				disabled={isError || loading}
				handle={handle}
				isError={isError}
				onChange={onChange}
				titleText={titleText}
				value={value}
			/>
		</>
	);
};

/**
 * toggles a single self-label on the current account's profile record.
 *
 * @param value the self-label value to add or remove
 * @param invalidateFeeds whether to refetch feed and thread queries after a successful toggle
 */
function useSelfLabelToggle({ invalidateFeeds, value }: { invalidateFeeds?: boolean; value: string }) {
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();
	const { data: profile, isError, isPlaceholderData } = useProfileQuery({ did: currentAccount?.did });
	const updateProfile = useProfileUpdateMutation();

	const enabled = profile?.labels?.some((l) => l.val === value && l.src === profile.did) ?? false;
	const loading = updateProfile.isPending;
	const canToggle = !!profile && !isPlaceholderData && !loading;

	const toggle = () => {
		if (!profile) {
			return;
		}
		// capture the intended final state up front so a getRecord re-read on an InvalidSwap retry
		// can't invert the user's action
		const shouldAdd = !enabled;
		updateProfile.mutate(
			{
				profile,
				updates: (existing) => {
					const values =
						existing.labels?.$type === 'com.atproto.label.defs#selfLabels' ? [...existing.labels.values] : [];

					const nextValues: { val: string }[] = shouldAdd
						? values.some((l) => l.val === value)
							? values
							: [...values, { val: value }]
						: values.filter((l) => l.val !== value);

					existing.labels = nextValues.length
						? { $type: 'com.atproto.label.defs#selfLabels', values: nextValues }
						: undefined;

					return existing;
				},
				checkCommitted: (res) => !!res.labels?.some((l) => l.val === value) === shouldAdd,
			},
			invalidateFeeds
				? {
						onSuccess() {
							void queryClient.invalidateQueries({ queryKey: [POST_FEED_RQKEY_ROOT] });
							void queryClient.invalidateQueries({ queryKey: [postThreadQueryKeyRoot] });
						},
					}
				: undefined,
		);
	};

	return { canToggle, enabled, isError, loading, toggle };
}
