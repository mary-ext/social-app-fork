import { useState } from 'react';

import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { makeCustomFeedLink, makeProfileLink } from '#/lib/routes/links';
import { shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';

import type { FeedSourceFeedInfo } from '#/state/queries/feed';
import { useLikeMutation, useUnlikeMutation } from '#/state/queries/like';
import {
	useAddSavedFeedsMutation,
	usePreferencesQuery,
	useRemoveFeedMutation,
	useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { formatCount } from '#/locale/intl/number';
import { Trans } from '#/locale/Trans';

import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share } from '#/components/icons/ArrowOutOfBox';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { DotGrid3x1_Stroke2_Corner0_Rounded as Ellipsis } from '#/components/icons/DotGrid';
import {
	Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled,
	Heart2_Stroke2_Corner0_Rounded as Heart,
} from '#/components/icons/Heart2';
import {
	Pin_Filled_Corner0_Rounded as PinFilled,
	Pin_Stroke2_Corner0_Rounded as Pin,
} from '#/components/icons/Pin';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Trash_Stroke2_Corner0_Rounded as Trash } from '#/components/icons/Trash';
import * as Menu from '#/components/Menu';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';
import { InlineLinkText } from '#/components/web/Link';
import { Stack } from '#/components/web/Stack';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './ProfileFeedHeader.css';

export function ProfileFeedHeaderSkeleton() {
	return (
		<Layout.Header.Outer>
			<Layout.Header.BackButton />
			<Layout.Header.Content>
				<div className={css.skeletonBar} />
			</Layout.Header.Content>
			<Layout.Header.Slot>
				<div className={css.skeletonPin}>
					<Pin size="lg" fill={colors.textContrastLow} />
				</div>
			</Layout.Header.Slot>
		</Layout.Header.Outer>
	);
}

export function ProfileFeedHeader({ info }: { info: FeedSourceFeedInfo }) {
	const { hasSession } = useSession();
	const infoHandle = Dialog.useDialogHandle();
	const reportDialogHandle = Dialog.useDialogHandle();

	const { data: preferences } = usePreferencesQuery();

	// close this dialog before opening the report dialog so they don't stack on top of each other
	const onPressReport = () => {
		infoHandle.close();
		reportDialogHandle.open(null);
	};

	const [likeUri, setLikeUri] = useState(info.likeUri || '');
	const likeCount =
		(info.likeCount || 0) + (likeUri && !info.likeUri ? 1 : !likeUri && info.likeUri ? -1 : 0);

	const { mutateAsync: addSavedFeeds, isPending: isAddSavedFeedPending } = useAddSavedFeedsMutation();
	const { mutateAsync: removeFeed, isPending: isRemovePending } = useRemoveFeedMutation();
	const { mutateAsync: updateSavedFeeds, isPending: isUpdateFeedPending } = useUpdateSavedFeedsMutation();

	const isFeedStateChangePending = isAddSavedFeedPending || isRemovePending || isUpdateFeedPending;
	const savedFeedConfig = preferences?.savedFeeds?.find((f) => f.value === info.uri);
	const isSaved = Boolean(savedFeedConfig);
	const isPinned = Boolean(savedFeedConfig?.pinned);

	const onToggleSaved = async () => {
		try {
			if (savedFeedConfig) {
				await removeFeed(savedFeedConfig);
				Toast.show(m['common.feeds.removedToast']());
			} else {
				await addSavedFeeds([
					{
						type: 'feed',
						value: info.uri,
						pinned: false,
					},
				]);
				Toast.show(m['common.feeds.savedToast']());
			}
		} catch (err) {
			Toast.show(m['common.feeds.updateError'](), {
				type: 'error',
			});
			logger.error('Failed to update feeds', { message: err });
		}
	};

	const onTogglePinned = async () => {
		try {
			if (savedFeedConfig) {
				const pinned = !savedFeedConfig.pinned;
				await updateSavedFeeds([
					{
						...savedFeedConfig,
						pinned,
					},
				]);

				if (pinned) {
					Toast.show(m['screens.profile.feed.pinnedToast']({ name: info.displayName }));
				} else {
					Toast.show(m['screens.profile.feed.unpinnedToast']({ name: info.displayName }));
				}
			} else {
				await addSavedFeeds([
					{
						type: 'feed',
						value: info.uri,
						pinned: true,
					},
				]);
				Toast.show(m['screens.profile.feed.pinnedToast']({ name: info.displayName }));
			}
		} catch (e) {
			Toast.show(m['common.error.serverContact'](), {
				type: 'error',
			});
			logger.error('Failed to toggle pinned feed', { message: e });
		}
	};

	return (
		<>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<button
						className={css.infoButton}
						aria-label={m['screens.profile.feed.a11y.openInfo']()}
						onClick={() => infoHandle.open(null)}
					>
						{info.avatar && <UserAvatar size={36} type="algo" avatar={info.avatar} />}

						<span className={css.infoButtonText}>
							<Text weight="bold" size="lg" numberOfLines={2}>
								{info.displayName}
							</Text>
							<span className={css.infoButtonMeta}>
								<Text size="sm" color="textContrastMedium" numberOfLines={1} className={css.infoButtonHandle}>
									{info.creatorHandle}
								</Text>

								<span className={css.infoButtonLikes}>
									<HeartFilled size="xs" fill={likeUri ? colors.pink : colors.textContrastLow} />
									<Text size="sm" color="textContrastMedium" numberOfLines={1}>
										{formatCount(likeCount)}
									</Text>
								</span>
							</span>
						</span>

						<div className={css.infoButtonEllipsis}>
							<Ellipsis size="lg" fill={colors.contrast_600} />
						</div>
					</button>
				</Layout.Header.Content>

				{hasSession && (
					<Layout.Header.Slot>
						{isPinned ? (
							<Menu.Root>
								<Menu.Trigger
									render={
										<Button
											label={m['screens.profile.feed.a11y.openOptions']()}
											size="small"
											variant="ghost"
											shape="round"
											color="secondary"
										>
											<PinFilled size="lg" fill={colors.primary_500} />
										</Button>
									}
								/>

								<Menu.Popup label={m['screens.profile.feed.options']()} align="end">
									<Menu.Item
										disabled={isFeedStateChangePending}
										label={m['screens.profile.feed.action.unpin']()}
										onClick={() => void onTogglePinned()}
									>
										<Menu.ItemText>{m['screens.profile.feed.action.unpin']()}</Menu.ItemText>
										<Menu.ItemIcon icon={X} position="right" />
									</Menu.Item>
									<Menu.Item
										disabled={isFeedStateChangePending}
										label={
											isSaved ? m['common.feeds.action.remove']() : m['screens.profile.feed.action.save']()
										}
										onClick={() => void onToggleSaved()}
									>
										<Menu.ItemText>
											{isSaved ? m['common.feeds.action.remove']() : m['screens.profile.feed.action.save']()}
										</Menu.ItemText>
										<Menu.ItemIcon icon={isSaved ? Trash : Plus} position="right" />
									</Menu.Item>
								</Menu.Popup>
							</Menu.Root>
						) : (
							<Button
								label={m['screens.profileList.pin.action.pinToHome']()}
								size="small"
								variant="ghost"
								shape="round"
								color="secondary"
								onClick={() => void onTogglePinned()}
							>
								<ButtonIcon icon={Pin} size="lg" />
							</Button>
						)}
					</Layout.Header.Slot>
				)}
			</Layout.Header.Outer>
			<Dialog.Root handle={infoHandle}>
				<Dialog.Popup label={m['screens.profile.feed.a11y.menu']()} size="medium">
					<DialogInner
						info={info}
						likeUri={likeUri}
						setLikeUri={setLikeUri}
						likeCount={likeCount}
						isPinned={isPinned}
						onTogglePinned={() => void onTogglePinned()}
						isFeedStateChangePending={isFeedStateChangePending}
						closeDialog={() => infoHandle.close()}
						onPressReport={onPressReport}
					/>
				</Dialog.Popup>
			</Dialog.Root>
			{hasSession && info.view && (
				<ReportDialog
					handle={reportDialogHandle}
					subject={
						{
							...info.view,
							$type: 'app.bsky.feed.defs#generatorView',
						} as unknown as React.ComponentProps<typeof ReportDialog>['subject']
					}
				/>
			)}
		</>
	);
}

function DialogInner({
	info,
	likeUri,
	setLikeUri,
	likeCount,
	isPinned,
	onTogglePinned,
	isFeedStateChangePending,
	closeDialog,
	onPressReport,
}: {
	info: FeedSourceFeedInfo;
	likeUri: string;
	setLikeUri: (uri: string) => void;
	likeCount: number;
	isPinned: boolean;
	onTogglePinned: () => void;
	isFeedStateChangePending: boolean;
	closeDialog: () => void;
	onPressReport: () => void;
}) {
	const { hasSession } = useSession();
	const { mutateAsync: likeFeed, isPending: isLikePending } = useLikeMutation();
	const { mutateAsync: unlikeFeed, isPending: isUnlikePending } = useUnlikeMutation();

	const isLiked = !!likeUri;
	const feedRkey = parseCanonicalResourceUri(info.uri).rkey;

	const onToggleLiked = async () => {
		try {
			if (isLiked && likeUri) {
				await unlikeFeed({ uri: likeUri });
				setLikeUri('');
			} else {
				const res = await likeFeed({ uri: info.uri, cid: info.cid });
				setLikeUri(res.uri);
			}
		} catch (err) {
			Toast.show(m['screens.profile.error.server'](), {
				type: 'error',
			});
			logger.error('Failed to toggle like', { message: err });
		}
	};

	const onPressShare = () => {
		const url = toShareUrl(info.route.href);
		void shareUrl(url);
	};

	return (
		<Stack gap="md">
			<div className={css.dialogHeaderRow}>
				<UserAvatar type="algo" size={48} avatar={info.avatar} />

				<div className={css.dialogNameColumn}>
					<Text size="_2xl" weight="bold" numberOfLines={2} className={css.dialogTitle}>
						{info.displayName}
					</Text>
					<Text size="sm" color="textContrastMedium" numberOfLines={1}>
						<Trans
							message={m['screens.profile.feed.byCreator']}
							inputs={{ handle: info.creatorHandle }}
							markup={{
								t0: ({ children }) => (
									<InlineLinkText
										label={m['screens.profile.avatar.a11y.viewProfile']({ handle: info.creatorHandle })}
										to={makeProfileLink({ did: info.creatorDid })}
										size="sm"
										color="textContrastMedium"
										numberOfLines={1}
										onPress={closeDialog}
									>
										{children}
									</InlineLinkText>
								),
							}}
						/>
					</Text>
				</div>

				<Button
					label={m['screens.profile.feed.action.share']()}
					size="small"
					variant="ghost"
					color="secondary"
					shape="round"
					onClick={onPressShare}
				>
					<ButtonIcon icon={Share} size="lg" />
				</Button>
			</div>

			<RichText size="md" value={info.description} />

			<div className={css.dialogLikedByRow}>
				{typeof likeCount === 'number' && (
					<InlineLinkText
						label={m['screens.profile.feed.action.viewLikes']()}
						to={makeCustomFeedLink(info.creatorDid, feedRkey, 'liked-by')}
						size="md_sub"
						color="textContrastMedium"
						onPress={closeDialog}
					>
						{m['screens.profile.feed.likes.count']({ count: likeCount })}
					</InlineLinkText>
				)}
			</div>
			{hasSession && (
				<>
					<div className={css.dialogActionsRow}>
						<Button
							disabled={isLikePending || isUnlikePending}
							label={m['screens.profile.feed.action.like']()}
							size="small"
							color="secondary"
							onClick={() => void onToggleLiked()}
							className={css.dialogActionButton}
						>
							{isLiked ? <HeartFilled size="sm" fill={colors.pink} /> : <ButtonIcon icon={Heart} />}

							<ButtonText>
								{isLiked ? m['screens.profile.action.unlike']() : m['common.action.like']()}
							</ButtonText>
						</Button>
						<Button
							disabled={isFeedStateChangePending}
							label={isPinned ? m['common.feeds.action.unpin']() : m['common.feeds.action.pin']()}
							size="small"
							color={isPinned ? 'secondary' : 'primary'}
							onClick={onTogglePinned}
							className={css.dialogActionButton}
						>
							<ButtonIcon icon={Pin} />

							<ButtonText>
								{isPinned ? m['common.feeds.action.unpin']() : m['common.feeds.action.pin']()}
							</ButtonText>
						</Button>
					</div>

					<div className={css.dialogReportSection}>
						<Dialog.Divider />

						<div className={css.dialogReportRow}>
							<Text size="md_sub" color="textContrastMedium" className={css.dialogWrongText}>
								{m['screens.profile.feedback.reportIssue']()}
							</Text>

							<Button
								label={m['screens.profile.feed.action.report']()}
								size="small"
								variant="solid"
								color="secondary"
								onClick={onPressReport}
							>
								<ButtonText>{m['screens.profile.feed.action.report']()}</ButtonText>
								<ButtonIcon icon={CircleInfo} />
							</Button>
						</div>
					</div>
				</>
			)}
		</Stack>
	);
}
