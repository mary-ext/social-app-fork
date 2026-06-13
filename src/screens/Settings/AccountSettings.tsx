import type { AppBskyNotificationDeclaration } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import {
	useNotificationDeclarationMutation,
	useNotificationDeclarationQuery,
} from '#/state/queries/activity-subscriptions';
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

import { ExportCarDialog } from './components/ExportCarDialog';

type AllowSubscriptions = AppBskyNotificationDeclaration.Main['allowSubscriptions'];

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AccountSettings'>;
export function AccountSettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const exportCarHandle = Dialog.useDialogHandle();

	const automation = useSelfLabelToggle({ value: 'bot', invalidateFeeds: true });
	const pwi = useSelfLabelToggle({ value: '!no-unauthenticated' });

	const { data: declaration, isError, isPending } = useNotificationDeclarationQuery();
	const { mutate: setDeclaration } = useNotificationDeclarationMutation();
	const onChangeAllowSubscriptions = (allowSubscriptions: AllowSubscriptions) => {
		setDeclaration({ $type: 'app.bsky.notification.declaration', allowSubscriptions });
	};

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
								Bluesky is an open and public network. Logged-out visibility only limits your content on the
								Bluesky app and website; other apps may not respect it, and your content may still be shown to
								logged-out users elsewhere.{' '}
								<InlineLinkText
									label={l`Learn more about what is public on Bluesky.`}
									to="https://blueskyweb.zendesk.com/hc/en-us/articles/15835264007693-Data-Privacy"
								>
									<Trans>Learn more about what is public on Bluesky.</Trans>
								</InlineLinkText>
							</Trans>
						}
						titleText={<Trans>Privacy</Trans>}
					>
						<Settings.SelectRow<AllowSubscriptions>
							disabled={isError}
							label={l`Allow others to be notified of your posts`}
							loading={isPending}
							onValueChange={onChangeAllowSubscriptions}
							value={declaration?.value?.allowSubscriptions ?? 'followers'}
							items={[
								{ label: l`Anyone who follows me`, value: 'followers' },
								{ label: l`Only followers who I follow`, value: 'mutuals' },
								{ label: l({ context: 'enable for', message: `No one` }), value: 'none' },
							]}
						>
							<Settings.Icon icon={BellRingingIcon} />
							<Settings.Label
								subtitleText={<Trans>Who can subscribe to notifications for your posts and replies.</Trans>}
								titleText={<Trans>Allow others to be notified of your posts</Trans>}
							/>
						</Settings.SelectRow>

						<Settings.SwitchRow
							disabled={!pwi.canToggle}
							label={l`Hide my account from logged-out users`}
							loading={pwi.loading}
							onChange={pwi.toggle}
							value={pwi.enabled}
						>
							<Settings.Icon icon={EyeSlashIcon} />
							<Settings.Label
								subtitleText={
									<Trans>
										Discourage apps from showing your profile and posts to people who aren't signed in.
									</Trans>
								}
								titleText={<Trans>Hide my account from logged-out users</Trans>}
							/>
						</Settings.SwitchRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
			<ExportCarDialog handle={exportCarHandle} />
		</Layout.Screen>
	);
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
