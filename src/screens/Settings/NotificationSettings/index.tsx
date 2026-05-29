import { View } from 'react-native';
import type { AppBskyNotificationDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import type { AllNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { useNotificationSettingsQuery } from '#/state/queries/notifications/settings';

import { atoms as a } from '#/alf';

import { Admonition } from '#/components/Admonition';
import * as Dialog from '#/components/Dialog';
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
import * as Layout from '#/components/Layout';

import * as SettingsList from '../components/SettingsList';
import { ItemTextWithSubtitle } from './components/ItemTextWithSubtitle';

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationSettings'>;
export function NotificationSettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const { data: settings, isError } = useNotificationSettingsQuery();

	const likeDialogControl = Dialog.useDialogControl();
	const followDialogControl = Dialog.useDialogControl();
	const replyDialogControl = Dialog.useDialogControl();
	const mentionDialogControl = Dialog.useDialogControl();
	const quoteDialogControl = Dialog.useDialogControl();
	const repostDialogControl = Dialog.useDialogControl();
	const activityDialogControl = Dialog.useDialogControl();
	const likeRepostDialogControl = Dialog.useDialogControl();
	const repostRepostDialogControl = Dialog.useDialogControl();
	const miscDialogControl = Dialog.useDialogControl();

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
						<View style={[a.px_lg, a.pb_md]}>
							<Admonition type="error">
								<Trans>Failed to load notification settings.</Trans>
							</Admonition>
						</View>
					)}
					<View style={[a.gap_sm]}>
						<SettingsList.PressableItem
							label={l`Settings for like notifications`}
							onPress={likeDialogControl.open}
							contentContainerStyle={[a.align_start]}
						>
							<SettingsList.ItemIcon icon={HeartIcon} />
							<ItemTextWithSubtitle
								titleText={<Trans>Likes</Trans>}
								subtitleText={<SettingPreview preference={settings?.like} />}
								showSkeleton={!settings}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							label={l`Settings for new follower notifications`}
							onPress={followDialogControl.open}
							contentContainerStyle={[a.align_start]}
						>
							<SettingsList.ItemIcon icon={PersonPlusIcon} />
							<ItemTextWithSubtitle
								titleText={<Trans>New followers</Trans>}
								subtitleText={<SettingPreview preference={settings?.follow} />}
								showSkeleton={!settings}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							label={l`Settings for reply notifications`}
							onPress={replyDialogControl.open}
							contentContainerStyle={[a.align_start]}
						>
							<SettingsList.ItemIcon icon={BubbleIcon} />
							<ItemTextWithSubtitle
								titleText={<Trans>Replies</Trans>}
								subtitleText={<SettingPreview preference={settings?.reply} />}
								showSkeleton={!settings}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							label={l`Settings for mention notifications`}
							onPress={mentionDialogControl.open}
							contentContainerStyle={[a.align_start]}
						>
							<SettingsList.ItemIcon icon={AtIcon} />
							<ItemTextWithSubtitle
								titleText={<Trans>Mentions</Trans>}
								subtitleText={<SettingPreview preference={settings?.mention} />}
								showSkeleton={!settings}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							label={l`Settings for quote notifications`}
							onPress={quoteDialogControl.open}
							contentContainerStyle={[a.align_start]}
						>
							<SettingsList.ItemIcon icon={CloseQuoteIcon} />
							<ItemTextWithSubtitle
								titleText={<Trans>Quotes</Trans>}
								subtitleText={<SettingPreview preference={settings?.quote} />}
								showSkeleton={!settings}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							label={l`Settings for repost notifications`}
							onPress={repostDialogControl.open}
							contentContainerStyle={[a.align_start]}
						>
							<SettingsList.ItemIcon icon={RepostIcon} />
							<ItemTextWithSubtitle
								titleText={<Trans>Reposts</Trans>}
								subtitleText={<SettingPreview preference={settings?.repost} />}
								showSkeleton={!settings}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							label={l`Settings for activity from others`}
							onPress={activityDialogControl.open}
							contentContainerStyle={[a.align_start]}
						>
							<SettingsList.ItemIcon icon={BellRingingIcon} />
							<ItemTextWithSubtitle
								titleText={<Trans>Activity from others</Trans>}
								subtitleText={<SettingPreview preference={settings?.subscribedPost} />}
								showSkeleton={!settings}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							label={l`Settings for notifications for likes of your reposts`}
							onPress={likeRepostDialogControl.open}
							contentContainerStyle={[a.align_start]}
						>
							<SettingsList.ItemIcon icon={LikeRepostIcon} />
							<ItemTextWithSubtitle
								titleText={<Trans>Likes of your reposts</Trans>}
								subtitleText={<SettingPreview preference={settings?.likeViaRepost} />}
								showSkeleton={!settings}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							label={l`Settings for notifications for reposts of your reposts`}
							onPress={repostRepostDialogControl.open}
							contentContainerStyle={[a.align_start]}
						>
							<SettingsList.ItemIcon icon={RepostRepostIcon} />
							<ItemTextWithSubtitle
								titleText={<Trans>Reposts of your reposts</Trans>}
								subtitleText={<SettingPreview preference={settings?.repostViaRepost} />}
								showSkeleton={!settings}
							/>
						</SettingsList.PressableItem>
						<SettingsList.PressableItem
							label={l`Settings for notifications for everything else`}
							onPress={miscDialogControl.open}
							contentContainerStyle={[a.align_start]}
						>
							<SettingsList.ItemIcon icon={ShapesIcon} />
							<ItemTextWithSubtitle
								titleText={<Trans>Everything else</Trans>}
								// technically a bundle of several settings, but since they're set together
								// and are most likely in sync we'll just show the state of one of them
								subtitleText={<SettingPreview preference={settings?.starterpackJoined} />}
								showSkeleton={!settings}
							/>
						</SettingsList.PressableItem>
					</View>
				</SettingsList.Container>
			</Layout.Content>
			<NotificationSettingsDialog
				control={likeDialogControl}
				name="like"
				icon={HeartIcon}
				titleText={<Trans>Likes</Trans>}
				subtitleText={<Trans>Get notifications when people like your posts.</Trans>}
			/>
			<NotificationSettingsDialog
				control={followDialogControl}
				name="follow"
				icon={PersonPlusIcon}
				titleText={<Trans>New followers</Trans>}
				subtitleText={<Trans>Get notifications when people follow you.</Trans>}
			/>
			<NotificationSettingsDialog
				control={replyDialogControl}
				name="reply"
				icon={BubbleIcon}
				titleText={<Trans>Replies</Trans>}
				subtitleText={<Trans>Get notifications when people reply to your posts.</Trans>}
			/>
			<NotificationSettingsDialog
				control={mentionDialogControl}
				name="mention"
				icon={AtIcon}
				titleText={<Trans>Mentions</Trans>}
				subtitleText={<Trans>Get notifications when people mention you.</Trans>}
			/>
			<NotificationSettingsDialog
				control={quoteDialogControl}
				name="quote"
				icon={CloseQuoteIcon}
				titleText={<Trans>Quotes</Trans>}
				subtitleText={<Trans>Get notifications when people quote your posts.</Trans>}
			/>
			<NotificationSettingsDialog
				control={repostDialogControl}
				name="repost"
				icon={RepostIcon}
				titleText={<Trans>Reposts</Trans>}
				subtitleText={<Trans>Get notifications when people repost your posts.</Trans>}
			/>
			<NotificationSettingsDialog
				control={activityDialogControl}
				name="subscribedPost"
				icon={BellRingingIcon}
				titleText={<Trans>Activity from others</Trans>}
				subtitleText={<Trans>Get notifications when there's activity on posts you're subscribed to.</Trans>}
				allowDisableInApp={false}
			/>
			<NotificationSettingsDialog
				control={likeRepostDialogControl}
				name="likeViaRepost"
				icon={LikeRepostIcon}
				titleText={<Trans>Likes of your reposts</Trans>}
				subtitleText={<Trans>Get notifications when people like your reposts.</Trans>}
			/>
			<NotificationSettingsDialog
				control={repostRepostDialogControl}
				name="repostViaRepost"
				icon={RepostRepostIcon}
				titleText={<Trans>Reposts of your reposts</Trans>}
				subtitleText={<Trans>Get notifications when people repost your reposts.</Trans>}
			/>
			<NotificationSettingsDialog
				control={miscDialogControl}
				name="starterpackJoined"
				syncOthers={['verified', 'unverified']}
				icon={ShapesIcon}
				titleText={<Trans>Everything else</Trans>}
				subtitleText={
					<Trans>Get notifications for starter pack joins, verification, and other activity.</Trans>
				}
				allowDisableInApp={false}
			/>
		</Layout.Screen>
	);
}

function SettingPreview({
	preference,
}: {
	preference?: AppBskyNotificationDefs.Preference | AppBskyNotificationDefs.FilterablePreference;
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
