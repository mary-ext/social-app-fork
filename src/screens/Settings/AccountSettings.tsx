import type { AppBskyNotificationDeclaration } from '@atcute/bluesky';
import { Trans } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { useNotificationDeclarationQuery } from '#/state/queries/activity-subscriptions';
import { RQKEY_ROOT as POST_FEED_RQKEY_ROOT } from '#/state/queries/post-feed';
import { useProfileQuery, useProfileUpdateMutation } from '#/state/queries/profile';
import { postThreadQueryKeyRoot } from '#/state/queries/usePostThread/types';
import { useSession } from '#/state/session';

import { BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import { Bot_Stroke as RobotIcon } from '#/components/icons/Bot';
import { Car_Stroke2_Corner2_Rounded as CarIcon } from '#/components/icons/Car';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon } from '#/components/icons/EyeSlash';
import * as Settings from '#/components/SettingsCards';
import * as Dialog from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';
import { ExternalInlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import { ActivitySubscriptionDialog } from './components/ActivitySubscriptionDialog';
import { ExportCarDialog } from './components/ExportCarDialog';

type AllowSubscriptions = AppBskyNotificationDeclaration.Main['allowSubscriptions'];

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AccountSettings'>;
export function AccountSettingsScreen({}: Props) {
	const exportCarHandle = Dialog.useDialogHandle();
	const activityHandle = Dialog.useDialogHandle();

	const automation = useSelfLabelToggle({ value: 'bot', invalidateFeeds: true });
	const pwi = useSelfLabelToggle({ value: '!no-unauthenticated' });

	const { data: declaration, isError, isPending } = useNotificationDeclarationQuery();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.label.accountPrivacy']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section titleText={m['screens.settings.export.yourDataTitle']()}>
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
								titleText={m['screens.settings.label.automation']()}
							/>
						</Settings.SwitchRow>

						<Settings.ButtonRow
							label={m['screens.settings.action.exportData']()}
							onPress={() => exportCarHandle.open(null)}
						>
							<Settings.Icon icon={CarIcon} />
							<Settings.Label titleText={m['screens.settings.action.exportData']()} />
						</Settings.ButtonRow>
					</Settings.Section>

					<Settings.Section
						footnoteText={
							<Trans>
								Honoring this request is voluntary: your profile and posts stay publicly available, and some
								apps may show your account anyway.{' '}
								<ExternalInlineLinkText
									size="sm"
									label={m['screens.settings.privacy.learnMorePublic']()}
									href="https://blueskyweb.zendesk.com/hc/en-us/articles/15835264007693-Data-Privacy"
								>
									{m['components.moderation.action.learnMoreDot']()}
								</ExternalInlineLinkText>
							</Trans>
						}
						titleText={m['screens.settings.title.privacy']()}
					>
						<Settings.ButtonRow
							label={m['screens.settings.label.allowNotifyingOthers']()}
							onPress={() => activityHandle.open(null)}
						>
							<Settings.Icon icon={BellRingingIcon} />
							<Settings.Label
								loading={isPending}
								subtitleText={
									<AllowSubscriptionsValue isError={isError} value={declaration?.value?.allowSubscriptions} />
								}
								titleText={m['screens.settings.label.allowNotifyingOthers']()}
							/>
						</Settings.ButtonRow>

						<Settings.SwitchRow
							disabled={!pwi.canToggle}
							label={m['screens.settings.privacy.requestLimitedVisibility']()}
							loading={pwi.loading}
							onChange={pwi.toggle}
							value={pwi.enabled}
						>
							<Settings.Icon icon={EyeSlashIcon} />
							<Settings.Label
								subtitleText={m['screens.settings.privacy.discoverabilityDesc']()}
								titleText={m['screens.settings.privacy.requestLimitedVisibility']()}
							/>
						</Settings.SwitchRow>
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
		return m['screens.settings.error.loadingPreference']();
	}
	switch (value) {
		case 'mutuals':
			return m['screens.settings.option.onlyFollowersIFollow']();
		case 'none':
			return m['screens.messages.option.noOneInvites']();
		case 'followers':
		default:
			return m['screens.settings.option.anyoneWhoFollowsMe']();
	}
}

/**
 * Reads and toggles a single self-label (`com.atproto.label.defs#selfLabels` value) on the current account's
 * profile record.
 *
 * @param value the self-label value to add/remove (e.g. `'bot'`, `'!no-unauthenticated'`)
 * @param invalidateFeeds whether to refetch feed and thread queries after a successful toggle, so the label
 *   change is reflected wherever the account's posts render
 */
function useSelfLabelToggle({ invalidateFeeds, value }: { invalidateFeeds?: boolean; value: string }) {
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const updateProfile = useProfileUpdateMutation();

	const enabled = profile?.labels?.some((l) => l.val === value && l.src === profile.did) ?? false;
	const loading = updateProfile.isPending;
	const canToggle = !!profile && !loading;

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

	return { canToggle, enabled, loading, toggle };
}
