import type { AppBskyNotificationDefs } from '@atcute/bluesky';

import type { AllNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { useNotificationSettingsQuery } from '#/state/queries/notifications/settings';

import { NotificationSettingsDialog } from '#/components/dialogs/NotificationSettingsDialog';
import { At_Stroke2_Corner2_Rounded as AtIcon } from '#/components/icons/At';
import { BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import { Bubble_Stroke2_Corner2_Rounded as BubbleIcon } from '#/components/icons/Bubble';
import {
	Heart2_Stroke2_Corner0_Rounded as HeartIcon,
	LikeRepost_Stroke2_Corner2_Rounded as LikeRepostIcon,
} from '#/components/icons/Heart2';
import { PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon } from '#/components/icons/Person';
import { CloseQuote_Stroke2_Corner0_Rounded as CloseQuoteIcon } from '#/components/icons/Quote';
import {
	Repost_Stroke2_Corner2_Rounded as RepostIcon,
	RepostRepost_Stroke2_Corner2_Rounded as RepostRepostIcon,
} from '#/components/icons/Repost';
import { Shapes_Stroke2_Corner0_Rounded as ShapesIcon } from '#/components/icons/Shapes';
import * as Settings from '#/components/SettingsCards';
import { Admonition } from '#/components/web/Admonition';
import * as Dialog from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

import * as styles from './index.css';

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationSettings'>;
export function NotificationSettingsScreen({}: Props) {
	const { data: settings, isError } = useNotificationSettingsQuery();

	const likeHandle = Dialog.useDialogHandle();
	const followHandle = Dialog.useDialogHandle();
	const replyHandle = Dialog.useDialogHandle();
	const mentionHandle = Dialog.useDialogHandle();
	const quoteHandle = Dialog.useDialogHandle();
	const repostHandle = Dialog.useDialogHandle();
	const activityHandle = Dialog.useDialogHandle();
	const likeRepostHandle = Dialog.useDialogHandle();
	const repostRepostHandle = Dialog.useDialogHandle();
	const miscHandle = Dialog.useDialogHandle();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.nav.notifications']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				{isError && (
					<div className={styles.errorWrap}>
						<Admonition type="error">{m['common.error.loadNotificationSettings']()}</Admonition>
					</div>
				)}
				<Settings.List>
					<Settings.Section>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.title.like']()}
							onPress={() => likeHandle.open(null)}
						>
							<Settings.Icon icon={HeartIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.like} />}
								titleText={m['common.label.likes']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.title.follow']()}
							onPress={() => followHandle.open(null)}
						>
							<Settings.Icon icon={PersonPlusIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.follow} />}
								titleText={m['screens.settings.notifications.newFollowers']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.title.reply']()}
							onPress={() => replyHandle.open(null)}
						>
							<Settings.Icon icon={BubbleIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.reply} />}
								titleText={m['common.label.replies']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.title.mention']()}
							onPress={() => mentionHandle.open(null)}
						>
							<Settings.Icon icon={AtIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.mention} />}
								titleText={m['common.label.mentions']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.title.quote']()}
							onPress={() => quoteHandle.open(null)}
						>
							<Settings.Icon icon={CloseQuoteIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.quote} />}
								titleText={m['common.label.quotes']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.title.repost']()}
							onPress={() => repostHandle.open(null)}
						>
							<Settings.Icon icon={RepostIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.repost} />}
								titleText={m['screens.settings.notifications.reposts']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.title.activity']()}
							onPress={() => activityHandle.open(null)}
						>
							<Settings.Icon icon={BellRingingIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.subscribedPost} />}
								titleText={m['screens.settings.label.activityFromOthers']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.title.likeViaRepost']()}
							onPress={() => likeRepostHandle.open(null)}
						>
							<Settings.Icon icon={LikeRepostIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.likeViaRepost} />}
								titleText={m['screens.settings.notifications.likesOfReposts']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.title.repostViaRepost']()}
							onPress={() => repostRepostHandle.open(null)}
						>
							<Settings.Icon icon={RepostRepostIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.repostViaRepost} />}
								titleText={m['screens.settings.notifications.repostsOfReposts']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.title.everythingElse']()}
							onPress={() => miscHandle.open(null)}
						>
							<Settings.Icon icon={ShapesIcon} />
							<Settings.Label
								loading={!settings}
								// technically a bundle of several settings, but since they're set together
								// and are most likely in sync we'll just show the state of one of them
								subtitleText={<SettingPreview preference={settings?.starterpackJoined} />}
								titleText={m['screens.settings.label.everythingElse']()}
							/>
						</Settings.ButtonRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
			<NotificationSettingsDialog
				handle={likeHandle}
				name="like"
				subtitleText={m['screens.settings.notifications.likesDesc']()}
				titleText={m['common.label.likes']()}
			/>
			<NotificationSettingsDialog
				handle={followHandle}
				name="follow"
				subtitleText={m['screens.settings.notifications.followsDesc']()}
				titleText={m['screens.settings.notifications.newFollowers']()}
			/>
			<NotificationSettingsDialog
				handle={replyHandle}
				name="reply"
				subtitleText={m['screens.settings.notifications.repliesDesc']()}
				titleText={m['common.label.replies']()}
			/>
			<NotificationSettingsDialog
				handle={mentionHandle}
				name="mention"
				subtitleText={m['screens.settings.notifications.mentionsDesc']()}
				titleText={m['common.label.mentions']()}
			/>
			<NotificationSettingsDialog
				handle={quoteHandle}
				name="quote"
				subtitleText={m['screens.settings.notifications.quotesDesc']()}
				titleText={m['common.label.quotes']()}
			/>
			<NotificationSettingsDialog
				handle={repostHandle}
				name="repost"
				subtitleText={m['screens.settings.notifications.repostsDesc']()}
				titleText={m['screens.settings.notifications.reposts']()}
			/>
			<NotificationSettingsDialog
				allowDisableInApp={false}
				handle={activityHandle}
				name="subscribedPost"
				subtitleText={m['screens.settings.notifications.subscribedDesc']()}
				titleText={m['screens.settings.label.activityFromOthers']()}
			/>
			<NotificationSettingsDialog
				handle={likeRepostHandle}
				name="likeViaRepost"
				subtitleText={m['screens.settings.notifications.likesRepostsDesc']()}
				titleText={m['screens.settings.notifications.likesOfReposts']()}
			/>
			<NotificationSettingsDialog
				handle={repostRepostHandle}
				name="repostViaRepost"
				subtitleText={m['screens.settings.notifications.repostsRepostsDesc']()}
				titleText={m['screens.settings.notifications.repostsOfReposts']()}
			/>
			<NotificationSettingsDialog
				allowDisableInApp={false}
				handle={miscHandle}
				name="starterpackJoined"
				subtitleText={m['screens.settings.notifications.activityDesc']()}
				syncOthers={['verified', 'unverified']}
				titleText={m['screens.settings.label.everythingElse']()}
			/>
		</Layout.Screen>
	);
}

function SettingPreview({
	preference,
}: {
	preference?: AppBskyNotificationDefs.FilterablePreference | AppBskyNotificationDefs.Preference;
}) {
	if (!preference) {
		return null;
	} else {
		if ('include' in preference) {
			if (preference.include === 'all') {
				if (preference.list && preference.push) {
					return m['screens.settings.notifications.inAppPushEveryone']();
				} else if (preference.list) {
					return m['screens.settings.notifications.inAppEveryone']();
				} else if (preference.push) {
					return m['screens.settings.notifications.pushEveryone']();
				}
			} else if (preference.include === 'follows') {
				if (preference.list && preference.push) {
					return m['screens.settings.notifications.inAppPushFollowing']();
				} else if (preference.list) {
					return m['screens.settings.notifications.inAppFollowing']();
				} else if (preference.push) {
					return m['screens.settings.notifications.pushFollowing']();
				}
			}
		} else {
			if (preference.list && preference.push) {
				return m['screens.settings.notifications.inAppPush']();
			} else if (preference.list) {
				return m['screens.settings.notifications.inApp']();
			} else if (preference.push) {
				return m['screens.settings.notifications.push']();
			}
		}
	}

	return m['common.label.off']();
}
