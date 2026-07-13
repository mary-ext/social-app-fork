import type { AllNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import {
	useChatNotificationSettingsQuery,
	useNotificationSettingsQuery,
} from '#/state/queries/notifications/settings';

import * as Dialog from '#/components/Dialog';
import { NotificationSettingsDialog } from '#/components/dialogs/NotificationSettingsDialog';
import { At_Stroke2_Corner2_Rounded as AtIcon } from '#/components/icons/At';
import { BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import { Bubble_Stroke2_Corner2_Rounded as BubbleIcon } from '#/components/icons/Bubble';
import { Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon } from '#/components/icons/Envelope';
import {
	Heart2_Stroke2_Corner0_Rounded as HeartIcon,
	LikeRepost_Stroke2_Corner2_Rounded as LikeRepostIcon,
} from '#/components/icons/Heart2';
import { Message_Stroke2_Corner0_Rounded as MessageIcon } from '#/components/icons/Message';
import { PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon } from '#/components/icons/Person';
import { CloseQuote_Stroke2_Corner0_Rounded as CloseQuoteIcon } from '#/components/icons/Quote';
import {
	Repost_Stroke2_Corner2_Rounded as RepostIcon,
	RepostRepost_Stroke2_Corner2_Rounded as RepostRepostIcon,
} from '#/components/icons/Repost';
import { Shapes_Stroke2_Corner0_Rounded as ShapesIcon } from '#/components/icons/Shapes';
import * as Settings from '#/components/SettingsCards';
import { Admonition } from '#/components/web/Admonition';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

import { ChatNotificationDialogs } from './components/ChatNotificationDialogs';
import { SettingPreview } from './components/SettingPreview';
import * as styles from './index.css';

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationSettings'>;
export function NotificationSettingsScreen({}: Props) {
	const { data: settings, isError } = useNotificationSettingsQuery();
	const { data: chatSettings, isError: chatError } = useChatNotificationSettingsQuery();

	const likeHandle = Dialog.useDialogHandle();
	const followHandle = Dialog.useDialogHandle();
	const replyHandle = Dialog.useDialogHandle();
	const mentionHandle = Dialog.useDialogHandle();
	const quoteHandle = Dialog.useDialogHandle();
	const repostHandle = Dialog.useDialogHandle();
	const activityHandle = Dialog.useDialogHandle();
	const likeRepostHandle = Dialog.useDialogHandle();
	const repostRepostHandle = Dialog.useDialogHandle();
	const chatHandle = Dialog.useDialogHandle();
	const chatRequestHandle = Dialog.useDialogHandle();
	const miscHandle = Dialog.useDialogHandle();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.nav.notifications']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				{isError && (
					<div className={styles.errorWrap}>
						<Admonition type="error">{m['common.notifications.loadSettingsError']()}</Admonition>
					</div>
				)}
				<Settings.List>
					<Settings.Section titleText={m['screens.settings.notifications.interactions.title']()}>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.like.title']()}
							onPress={() => likeHandle.open(null)}
						>
							<Settings.Icon icon={HeartIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.like} />}
								titleText={m['common.like.label']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.follow.title']()}
							onPress={() => followHandle.open(null)}
						>
							<Settings.Icon icon={PersonPlusIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.follow} />}
								titleText={m['screens.settings.notifications.follow.label']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.reply.title']()}
							onPress={() => replyHandle.open(null)}
						>
							<Settings.Icon icon={BubbleIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.reply} />}
								titleText={m['common.reply.label']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.mention.title']()}
							onPress={() => mentionHandle.open(null)}
						>
							<Settings.Icon icon={AtIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.mention} />}
								titleText={m['common.mention.label']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.quote.title']()}
							onPress={() => quoteHandle.open(null)}
						>
							<Settings.Icon icon={CloseQuoteIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.quote} />}
								titleText={m['common.quote.label']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.repost.title']()}
							onPress={() => repostHandle.open(null)}
						>
							<Settings.Icon icon={RepostIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.repost} />}
								titleText={m['screens.settings.notifications.repost.label']()}
							/>
						</Settings.ButtonRow>
					</Settings.Section>
					<Settings.Section titleText={m['screens.settings.notifications.viaRepost.title']()}>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.likeViaRepost.title']()}
							onPress={() => likeRepostHandle.open(null)}
						>
							<Settings.Icon icon={LikeRepostIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.likeViaRepost} />}
								titleText={m['screens.settings.notifications.likeViaRepost.label']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.repostViaRepost.title']()}
							onPress={() => repostRepostHandle.open(null)}
						>
							<Settings.Icon icon={RepostRepostIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.repostViaRepost} />}
								titleText={m['screens.settings.notifications.repostViaRepost.label']()}
							/>
						</Settings.ButtonRow>
					</Settings.Section>
					<Settings.Section titleText={m['screens.settings.notifications.chat.title']()}>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.chat.newMessagesA11y']()}
							onPress={() => chatHandle.open(null)}
						>
							<Settings.Icon icon={MessageIcon} />
							<Settings.Label
								loading={!chatSettings && !chatError}
								subtitleText={
									chatError ? (
										m['common.notifications.loadSettingsError']()
									) : (
										<SettingPreview preference={chatSettings?.chat} />
									)
								}
								titleText={m['screens.settings.notifications.chat.newMessages']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.chat.newRequestsA11y']()}
							onPress={() => chatRequestHandle.open(null)}
						>
							<Settings.Icon icon={EnvelopeIcon} />
							<Settings.Label
								loading={!chatSettings && !chatError}
								subtitleText={
									chatError ? (
										m['common.notifications.loadSettingsError']()
									) : (
										<SettingPreview preference={chatSettings?.chatRequest} />
									)
								}
								titleText={m['screens.settings.notifications.chat.newRequests']()}
							/>
						</Settings.ButtonRow>
					</Settings.Section>
					<Settings.Section titleText={m['screens.settings.notifications.other.title']()}>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.activity.title']()}
							onPress={() => activityHandle.open(null)}
						>
							<Settings.Icon icon={BellRingingIcon} />
							<Settings.Label
								loading={!settings}
								subtitleText={<SettingPreview preference={settings?.subscribedPost} />}
								titleText={m['screens.settings.notifications.activity.label']()}
							/>
						</Settings.ButtonRow>
						<Settings.ButtonRow
							label={m['screens.settings.notifications.everythingElse.title']()}
							onPress={() => miscHandle.open(null)}
						>
							<Settings.Icon icon={ShapesIcon} />
							<Settings.Label
								loading={!settings}
								// technically a bundle of several settings, but since they're set together
								// and are most likely in sync we'll just show the state of one of them
								subtitleText={<SettingPreview preference={settings?.starterpackJoined} />}
								titleText={m['screens.settings.notifications.everythingElse.label']()}
							/>
						</Settings.ButtonRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
			<NotificationSettingsDialog
				handle={likeHandle}
				name="like"
				subtitleText={m['screens.settings.notifications.like.description']()}
				titleText={m['common.like.label']()}
			/>
			<NotificationSettingsDialog
				handle={followHandle}
				name="follow"
				subtitleText={m['screens.settings.notifications.follow.description']()}
				titleText={m['screens.settings.notifications.follow.label']()}
			/>
			<NotificationSettingsDialog
				handle={replyHandle}
				name="reply"
				subtitleText={m['screens.settings.notifications.reply.description']()}
				titleText={m['common.reply.label']()}
			/>
			<NotificationSettingsDialog
				handle={mentionHandle}
				name="mention"
				subtitleText={m['screens.settings.notifications.mention.description']()}
				titleText={m['common.mention.label']()}
			/>
			<NotificationSettingsDialog
				handle={quoteHandle}
				name="quote"
				subtitleText={m['screens.settings.notifications.quote.description']()}
				titleText={m['common.quote.label']()}
			/>
			<NotificationSettingsDialog
				handle={repostHandle}
				name="repost"
				subtitleText={m['screens.settings.notifications.repost.description']()}
				titleText={m['screens.settings.notifications.repost.label']()}
			/>
			<NotificationSettingsDialog
				allowDisableInApp={false}
				handle={activityHandle}
				name="subscribedPost"
				subtitleText={m['screens.settings.notifications.subscribed.description']()}
				titleText={m['screens.settings.notifications.activity.label']()}
			/>
			<NotificationSettingsDialog
				handle={likeRepostHandle}
				name="likeViaRepost"
				subtitleText={m['screens.settings.notifications.likeViaRepost.description']()}
				titleText={m['screens.settings.notifications.likeViaRepost.label']()}
			/>
			<NotificationSettingsDialog
				handle={repostRepostHandle}
				name="repostViaRepost"
				subtitleText={m['screens.settings.notifications.repostViaRepost.description']()}
				titleText={m['screens.settings.notifications.repostViaRepost.label']()}
			/>
			<ChatNotificationDialogs chatHandle={chatHandle} chatRequestHandle={chatRequestHandle} />
			<NotificationSettingsDialog
				allowDisableInApp={false}
				handle={miscHandle}
				name="starterpackJoined"
				subtitleText={m['screens.settings.notifications.activity.description']()}
				syncOthers={['verified', 'unverified']}
				titleText={m['screens.settings.notifications.everythingElse.label']()}
			/>
		</Layout.Screen>
	);
}
