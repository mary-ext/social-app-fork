import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { useTitle } from '#/lib/hooks/useTitle';
import { cleanError } from '#/lib/strings/errors';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useActivitySubscriptionsQuery } from '#/state/queries/activity-subscriptions';
import {
	useNotificationSettingsQuery,
	useNotificationSettingsUpdateMutation,
} from '#/state/queries/notifications/settings';

import { Trans } from '#/locale/Trans';

import { SubscribeProfileDialog } from '#/components/activity-notifications/SubscribeProfileDialog';
import * as Dialog from '#/components/Dialog';
import { List } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import * as Settings from '#/components/SettingsCards';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { InlineLinkText } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';

import BellRingingFilledIcon from '#/icons/central-custom/BellRinging_round_filled_radius1_stroke2.svg';
import BellRingingIcon from '#/icons/central-custom/BellRinging_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './ActivityNotificationSettings.css';

const SUBSCRIPTION_ITEM_HEIGHT_ESTIMATE = 90;

export function ActivityNotificationSettingsScreen() {
	useTitle(m['screens.settings.notifications.activity.label']());

	const moderationOpts = useModerationOpts();
	const { data: preferences, isError: isPreferencesError } = useNotificationSettingsQuery();
	const { isPending: isUpdatingPreferences, mutate: updatePreferences } =
		useNotificationSettingsUpdateMutation();
	const { data, error, fetchNextPage, hasNextPage, isError, isFetchingNextPage, isPending } =
		useActivitySubscriptionsQuery();

	const subscriptions = data?.pages.flatMap((page) => page.subscriptions) ?? [];

	const onChangePush = (push: boolean) => {
		if (!preferences) {
			return;
		}
		updatePreferences({ subscribedPost: { ...preferences.subscribedPost, push } });
	};

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || isError) {
			return;
		}
		fetchNextPage().catch(() => {});
	};

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						{m['screens.settings.notifications.activity.label']()}
					</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<List
				data={subscriptions}
				estimateHeight={SUBSCRIPTION_ITEM_HEIGHT_ESTIMATE}
				keyExtractor={(item) => item.did}
				ListHeaderComponent={
					<>
						{isPreferencesError && (
							<div className={css.error}>
								<Admonition type="error">{m['common.notifications.loadSettingsError']()}</Admonition>
							</div>
						)}
						<Settings.List>
							<Settings.Section
								bodyText={m['screens.settings.notifications.subscribed.description']()}
								titleText={m['screens.settings.notifications.activity.label']()}
							>
								{/* in-app notifications are always delivered for a subscribed post, so push is the only
								    channel there is anything to decide about */}
								<Settings.SwitchRow
									disabled={!preferences}
									label={m['screens.settings.notifications.channel.receivePush']()}
									loading={isUpdatingPreferences}
									onChange={onChangePush}
									value={preferences?.subscribedPost.push ?? false}
								>
									<Settings.Icon icon={BellRingingIcon} />
									<Settings.Label
										titleText={m['screens.settings.notifications.channel.pushNotifications']()}
									/>
								</Settings.SwitchRow>
							</Settings.Section>
						</Settings.List>
					</>
				}
				ListEmptyComponent={isPending || error ? null : <EmptyHint />}
				ListFooterComponent={
					<ListFooter
						error={cleanError(error)}
						hasNextPage={hasNextPage}
						isFetchingNextPage={isFetchingNextPage}
						onRetry={fetchNextPage}
					/>
				}
				onEndReached={onEndReached}
				onEndReachedThreshold={2}
				renderItem={({ item }) =>
					moderationOpts ? <SubscriptionRow moderationOpts={moderationOpts} profile={item} /> : null
				}
			/>
		</Layout.Screen>
	);
}

function EmptyHint() {
	return (
		<div className={css.empty}>
			<Admonition type="tip">
				<Trans
					markup={{
						t0: ({ children }) => (
							<Text weight="semiBold">
								{children} <BellRingingFilledIcon className={css.bellRingingFilledIcon} />
							</Text>
						),
					}}
					message={m['screens.settings.notifications.activity.empty.hint']}
				/>
				{'\n\n'}
				<Trans
					markup={{
						t0: ({ children }) => (
							<InlineLinkText
								label={m['screens.settings.account.privacyLink']()}
								to={{ name: 'AccountSettings' }}
								weight="semiBold"
							>
								{children}
							</InlineLinkText>
						),
					}}
					message={m['screens.settings.notifications.activity.empty.privacy']}
				/>
			</Admonition>
		</div>
	);
}

function SubscriptionRow({
	moderationOpts,
	profile: unshadowed,
}: {
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
}) {
	const profile = useProfileShadow(unshadowed);
	const editHandle = Dialog.useDialogHandle();

	const subscription = profile.viewer?.activitySubscription;
	let preview: string;
	if (subscription?.post && subscription.reply) {
		preview = m['components.activityNotifications.postsAndReplies']();
	} else if (subscription?.post) {
		preview = m['components.activityNotifications.postsOnly']();
	} else if (subscription?.reply) {
		preview = m['screens.settings.notifications.activity.preview.repliesOnly']();
	} else {
		preview = m['screens.settings.notifications.activity.preview.none']();
	}

	return (
		<div className={css.row}>
			<ProfileCard.Outer>
				<ProfileCard.Header>
					<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} />
					<div className={css.rowText}>
						<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
						<Text color="textContrastMedium" size="sm">
							{preview}
						</Text>
					</div>
					<Button
						color="primary"
						label={m['screens.settings.notifications.activity.a11y.edit']({ handle: profile.handle })}
						onClick={() => editHandle.open(null)}
						size="small"
						variant="solid"
					>
						<ButtonText>{m['common.action.edit']()}</ButtonText>
					</Button>
				</ProfileCard.Header>
			</ProfileCard.Outer>
			<SubscribeProfileDialog
				handle={editHandle}
				includeProfile
				moderationOpts={moderationOpts}
				profile={profile}
			/>
		</div>
	);
}
