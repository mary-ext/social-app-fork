import type { AppBskyNotificationDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

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
import * as SettingsList from '#/components/SettingsList';
import { Admonition } from '#/components/web/Admonition';
import * as Dialog from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';

import { ItemTextWithSubtitle } from './components/ItemTextWithSubtitle';
import * as styles from './index.css';

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationSettings'>;
export function NotificationSettingsScreen({}: Props) {
	const { t: l } = useLingui();
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
					<Layout.Header.TitleText>
						<Trans>Notifications</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					{isError && (
						<div className={styles.errorWrap}>
							<Admonition type="error">
								<Trans>Failed to load notification settings.</Trans>
							</Admonition>
						</div>
					)}
					<div className={styles.list}>
						<SettingsList.PressableItem
							align="start"
							label={l`Settings for like notifications`}
							onPress={() => likeHandle.open(null)}
						>
							<SettingsList.ItemIcon icon={HeartIcon} />
							<ItemTextWithSubtitle
								showSkeleton={!settings}
								subtitleText={<SettingPreview preference={settings?.like} />}
								titleText={<Trans>Likes</Trans>}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							align="start"
							label={l`Settings for new follower notifications`}
							onPress={() => followHandle.open(null)}
						>
							<SettingsList.ItemIcon icon={PersonPlusIcon} />
							<ItemTextWithSubtitle
								showSkeleton={!settings}
								subtitleText={<SettingPreview preference={settings?.follow} />}
								titleText={<Trans>New followers</Trans>}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							align="start"
							label={l`Settings for reply notifications`}
							onPress={() => replyHandle.open(null)}
						>
							<SettingsList.ItemIcon icon={BubbleIcon} />
							<ItemTextWithSubtitle
								showSkeleton={!settings}
								subtitleText={<SettingPreview preference={settings?.reply} />}
								titleText={<Trans>Replies</Trans>}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							align="start"
							label={l`Settings for mention notifications`}
							onPress={() => mentionHandle.open(null)}
						>
							<SettingsList.ItemIcon icon={AtIcon} />
							<ItemTextWithSubtitle
								showSkeleton={!settings}
								subtitleText={<SettingPreview preference={settings?.mention} />}
								titleText={<Trans>Mentions</Trans>}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							align="start"
							label={l`Settings for quote notifications`}
							onPress={() => quoteHandle.open(null)}
						>
							<SettingsList.ItemIcon icon={CloseQuoteIcon} />
							<ItemTextWithSubtitle
								showSkeleton={!settings}
								subtitleText={<SettingPreview preference={settings?.quote} />}
								titleText={<Trans>Quotes</Trans>}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							align="start"
							label={l`Settings for repost notifications`}
							onPress={() => repostHandle.open(null)}
						>
							<SettingsList.ItemIcon icon={RepostIcon} />
							<ItemTextWithSubtitle
								showSkeleton={!settings}
								subtitleText={<SettingPreview preference={settings?.repost} />}
								titleText={<Trans>Reposts</Trans>}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							align="start"
							label={l`Settings for activity from others`}
							onPress={() => activityHandle.open(null)}
						>
							<SettingsList.ItemIcon icon={BellRingingIcon} />
							<ItemTextWithSubtitle
								showSkeleton={!settings}
								subtitleText={<SettingPreview preference={settings?.subscribedPost} />}
								titleText={<Trans>Activity from others</Trans>}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							align="start"
							label={l`Settings for notifications for likes of your reposts`}
							onPress={() => likeRepostHandle.open(null)}
						>
							<SettingsList.ItemIcon icon={LikeRepostIcon} />
							<ItemTextWithSubtitle
								showSkeleton={!settings}
								subtitleText={<SettingPreview preference={settings?.likeViaRepost} />}
								titleText={<Trans>Likes of your reposts</Trans>}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							align="start"
							label={l`Settings for notifications for reposts of your reposts`}
							onPress={() => repostRepostHandle.open(null)}
						>
							<SettingsList.ItemIcon icon={RepostRepostIcon} />
							<ItemTextWithSubtitle
								showSkeleton={!settings}
								subtitleText={<SettingPreview preference={settings?.repostViaRepost} />}
								titleText={<Trans>Reposts of your reposts</Trans>}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							align="start"
							label={l`Settings for notifications for everything else`}
							onPress={() => miscHandle.open(null)}
						>
							<SettingsList.ItemIcon icon={ShapesIcon} />
							<ItemTextWithSubtitle
								showSkeleton={!settings}
								// technically a bundle of several settings, but since they're set together
								// and are most likely in sync we'll just show the state of one of them
								subtitleText={<SettingPreview preference={settings?.starterpackJoined} />}
								titleText={<Trans>Everything else</Trans>}
							/>
						</SettingsList.PressableItem>
					</div>
				</SettingsList.Container>
			</Layout.Content>
			<NotificationSettingsDialog
				handle={likeHandle}
				name="like"
				subtitleText={<Trans>Get notifications when people like your posts.</Trans>}
				titleText={<Trans>Likes</Trans>}
			/>
			<NotificationSettingsDialog
				handle={followHandle}
				name="follow"
				subtitleText={<Trans>Get notifications when people follow you.</Trans>}
				titleText={<Trans>New followers</Trans>}
			/>
			<NotificationSettingsDialog
				handle={replyHandle}
				name="reply"
				subtitleText={<Trans>Get notifications when people reply to your posts.</Trans>}
				titleText={<Trans>Replies</Trans>}
			/>
			<NotificationSettingsDialog
				handle={mentionHandle}
				name="mention"
				subtitleText={<Trans>Get notifications when people mention you.</Trans>}
				titleText={<Trans>Mentions</Trans>}
			/>
			<NotificationSettingsDialog
				handle={quoteHandle}
				name="quote"
				subtitleText={<Trans>Get notifications when people quote your posts.</Trans>}
				titleText={<Trans>Quotes</Trans>}
			/>
			<NotificationSettingsDialog
				handle={repostHandle}
				name="repost"
				subtitleText={<Trans>Get notifications when people repost your posts.</Trans>}
				titleText={<Trans>Reposts</Trans>}
			/>
			<NotificationSettingsDialog
				allowDisableInApp={false}
				handle={activityHandle}
				name="subscribedPost"
				subtitleText={<Trans>Get notifications when there's activity on posts you're subscribed to.</Trans>}
				titleText={<Trans>Activity from others</Trans>}
			/>
			<NotificationSettingsDialog
				handle={likeRepostHandle}
				name="likeViaRepost"
				subtitleText={<Trans>Get notifications when people like your reposts.</Trans>}
				titleText={<Trans>Likes of your reposts</Trans>}
			/>
			<NotificationSettingsDialog
				handle={repostRepostHandle}
				name="repostViaRepost"
				subtitleText={<Trans>Get notifications when people repost your reposts.</Trans>}
				titleText={<Trans>Reposts of your reposts</Trans>}
			/>
			<NotificationSettingsDialog
				allowDisableInApp={false}
				handle={miscHandle}
				name="starterpackJoined"
				subtitleText={
					<Trans>Get notifications for starter pack joins, verification, and other activity.</Trans>
				}
				syncOthers={['verified', 'unverified']}
				titleText={<Trans>Everything else</Trans>}
			/>
		</Layout.Screen>
	);
}

function SettingPreview({
	preference,
}: {
	preference?: AppBskyNotificationDefs.FilterablePreference | AppBskyNotificationDefs.Preference;
}) {
	const { t: l } = useLingui();
	if (!preference) {
		return null;
	} else {
		if ('include' in preference) {
			if (preference.include === 'all') {
				if (preference.list && preference.push) {
					return l`In-app, Push, Everyone`;
				} else if (preference.list) {
					return l`In-app, Everyone`;
				} else if (preference.push) {
					return l`Push, Everyone`;
				}
			} else if (preference.include === 'follows') {
				if (preference.list && preference.push) {
					return l`In-app, Push, People you follow`;
				} else if (preference.list) {
					return l`In-app, People you follow`;
				} else if (preference.push) {
					return l`Push, People you follow`;
				}
			}
		} else {
			if (preference.list && preference.push) {
				return l`In-app, Push`;
			} else if (preference.list) {
				return l`In-app`;
			} else if (preference.push) {
				return l`Push`;
			}
		}
	}

	return l`Off`;
}
