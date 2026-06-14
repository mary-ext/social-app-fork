import type { AppBskyNotificationDeclaration } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
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
import { InlineLinkText } from '#/components/web/Link';

import { ActivitySubscriptionDialog } from './components/ActivitySubscriptionDialog';
import { ExportCarDialog } from './components/ExportCarDialog';

type AllowSubscriptions = AppBskyNotificationDeclaration.Main['allowSubscriptions'];

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AccountSettings'>;
export function AccountSettingsScreen({}: Props) {
	const { t: l } = useLingui();
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
					<Layout.Header.TitleText>
						<Trans>Account & privacy</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section titleText={<Trans>Your data</Trans>}>
						<Settings.SwitchRow
							disabled={!automation.canToggle}
							label={l`Show automation label`}
							loading={automation.loading}
							onChange={automation.toggle}
							value={automation.enabled}
						>
							<Settings.Icon icon={RobotIcon} />
							<Settings.Label
								subtitleText={<Trans>Show others that this account is automated.</Trans>}
								titleText={<Trans>Automation label</Trans>}
							/>
						</Settings.SwitchRow>

						<Settings.ButtonRow label={l`Export my data`} onPress={() => exportCarHandle.open(null)}>
							<Settings.Icon icon={CarIcon} />
							<Settings.Label titleText={<Trans>Export my data</Trans>} />
						</Settings.ButtonRow>
					</Settings.Section>

					<Settings.Section
						footnoteText={
							<Trans>
								Honoring this request is voluntary: your profile and posts stay publicly available, and some
								apps may show your account anyway.{' '}
								<InlineLinkText
									size="sm"
									label={l`Learn more about what is public on Bluesky.`}
									to="https://blueskyweb.zendesk.com/hc/en-us/articles/15835264007693-Data-Privacy"
								>
									<Trans>Learn more.</Trans>
								</InlineLinkText>
							</Trans>
						}
						titleText={<Trans>Privacy</Trans>}
					>
						<Settings.ButtonRow
							label={l`Allow notifying others of my posts`}
							onPress={() => activityHandle.open(null)}
						>
							<Settings.Icon icon={BellRingingIcon} />
							<Settings.Label
								loading={isPending}
								subtitleText={
									<AllowSubscriptionsValue isError={isError} value={declaration?.value?.allowSubscriptions} />
								}
								titleText={<Trans>Allow notifying others of my posts</Trans>}
							/>
						</Settings.ButtonRow>

						<Settings.SwitchRow
							disabled={!pwi.canToggle}
							label={l`Request limited account visibility`}
							loading={pwi.loading}
							onChange={pwi.toggle}
							value={pwi.enabled}
						>
							<Settings.Icon icon={EyeSlashIcon} />
							<Settings.Label
								subtitleText={
									<Trans>
										Notifies every app, including the Bluesky app, that you don't want your account shown to
										people who aren't signed in.
									</Trans>
								}
								titleText={<Trans>Request limited account visibility</Trans>}
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
		return <Trans>Error loading preference</Trans>;
	}
	switch (value) {
		case 'mutuals':
			return <Trans>Only followers who I follow</Trans>;
		case 'none':
			return <Trans context="enable for">No one</Trans>;
		case 'followers':
		default:
			return <Trans>Anyone who follows me</Trans>;
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
