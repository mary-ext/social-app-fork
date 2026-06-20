import { useCallback, useMemo, useState } from 'react';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

import { makeCustomFeedLink, makeProfileLink } from '#/lib/routes/links';
import { shareUrl } from '#/lib/sharing';
import { sanitizeHandle } from '#/lib/strings/handles';
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

import { formatCount } from '#/view/com/util/numeric/format';

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
import { ReportDialog, useReportDialogControl } from '#/components/moderation/ReportDialog';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';
import { InlineLinkText } from '#/components/web/Link';
import * as Menu from '#/components/web/Menu';

import { colors } from '#/styles/colors';

import * as styles from './ProfileFeedHeader.css';

export function ProfileFeedHeaderSkeleton() {
	return (
		<Layout.Header.Outer>
			<Layout.Header.BackButton />
			<Layout.Header.Content>
				<div className={styles.skeletonBar} />
			</Layout.Header.Content>
			<Layout.Header.Slot>
				<div className={styles.skeletonPin}>
					<Pin size="lg" fill={colors.textContrastLow} />
				</div>
			</Layout.Header.Slot>
		</Layout.Header.Outer>
	);
}

export function ProfileFeedHeader({ info }: { info: FeedSourceFeedInfo }) {
	const { t: l, i18n } = useLingui();
	const { hasSession } = useSession();
	const infoControl = Dialog.useDialogHandle();
	const reportDialogControl = useReportDialogControl();

	const { data: preferences } = usePreferencesQuery();

	// close this dialog before opening the report dialog so they don't stack on top of each other
	const onPressReport = useCallback(() => {
		infoControl.close();
		reportDialogControl.open(null);
	}, [infoControl, reportDialogControl]);

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
				Toast.show(l`Removed from your feeds`);
			} else {
				await addSavedFeeds([
					{
						type: 'feed',
						value: info.uri,
						pinned: false,
					},
				]);
				Toast.show(l`Saved to your feeds`);
			}
		} catch (err) {
			Toast.show(
				l`There was an issue updating your feeds, please check your internet connection and try again.`,
				{
					type: 'error',
				},
			);
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
					Toast.show(l`Pinned ${info.displayName} to Home`);
				} else {
					Toast.show(l`Unpinned ${info.displayName} from Home`);
				}
			} else {
				await addSavedFeeds([
					{
						type: 'feed',
						value: info.uri,
						pinned: true,
					},
				]);
				Toast.show(l`Pinned ${info.displayName} to Home`);
			}
		} catch (e) {
			Toast.show(l`There was an issue contacting the server`, {
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
						className={styles.infoButton}
						aria-label={l`Open feed info screen`}
						onClick={() => infoControl.open(null)}
					>
						{info.avatar && <UserAvatar size={36} type="algo" avatar={info.avatar} />}

						<span className={styles.infoButtonText}>
							<Text weight="bold" numberOfLines={2} className={styles.infoButtonTitle}>
								{info.displayName}
							</Text>
							<span className={styles.infoButtonMeta}>
								<Text
									size="sm"
									color="textContrastMedium"
									numberOfLines={1}
									className={styles.infoButtonHandle}
								>
									{sanitizeHandle(info.creatorHandle, '@')}
								</Text>
								<span className={styles.infoButtonLikes}>
									<HeartFilled size="xs" fill={likeUri ? colors.pink : colors.textContrastLow} />
									<Text size="sm" color="textContrastMedium" numberOfLines={1}>
										{formatCount(i18n, likeCount)}
									</Text>
								</span>
							</span>
						</span>

						<Ellipsis size="md" fill={colors.textContrastLow} />
					</button>
				</Layout.Header.Content>

				{hasSession && (
					<Layout.Header.Slot>
						{isPinned ? (
							<Menu.Root>
								<Menu.Trigger
									render={
										<Button
											label={l`Open feed options menu`}
											size="small"
											variant="ghost"
											shape="round"
											color="secondary"
										>
											<PinFilled size="lg" fill={colors.primary_500} />
										</Button>
									}
								/>

								<Menu.Popup label={l`Feed options`} align="end">
									<Menu.Item
										disabled={isFeedStateChangePending}
										label={l`Unpin from home`}
										onClick={() => void onTogglePinned()}
									>
										<Menu.ItemText>{l`Unpin from home`}</Menu.ItemText>
										<Menu.ItemIcon icon={X} position="right" />
									</Menu.Item>
									<Menu.Item
										disabled={isFeedStateChangePending}
										label={isSaved ? l`Remove from my feeds` : l`Save to my feeds`}
										onClick={() => void onToggleSaved()}
									>
										<Menu.ItemText>{isSaved ? l`Remove from my feeds` : l`Save to my feeds`}</Menu.ItemText>
										<Menu.ItemIcon icon={isSaved ? Trash : Plus} position="right" />
									</Menu.Item>
								</Menu.Popup>
							</Menu.Root>
						) : (
							<Button
								label={l`Pin to Home`}
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
			<Dialog.Root handle={infoControl}>
				<Dialog.Popup label={l`Feed menu`} className={styles.dialogPopup}>
					<DialogInner
						info={info}
						likeUri={likeUri}
						setLikeUri={setLikeUri}
						likeCount={likeCount}
						isPinned={isPinned}
						onTogglePinned={() => void onTogglePinned()}
						isFeedStateChangePending={isFeedStateChangePending}
						closeDialog={() => infoControl.close()}
						onPressReport={onPressReport}
					/>
				</Dialog.Popup>
			</Dialog.Root>
			{hasSession && info.view && (
				<ReportDialog
					control={reportDialogControl}
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
	const { t: l } = useLingui();
	const { hasSession } = useSession();
	const { mutateAsync: likeFeed, isPending: isLikePending } = useLikeMutation();
	const { mutateAsync: unlikeFeed, isPending: isUnlikePending } = useUnlikeMutation();

	const isLiked = !!likeUri;
	const feedRkey = useMemo(() => parseCanonicalResourceUri(info.uri).rkey, [info.uri]);

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
			Toast.show(
				l`There was an issue contacting the server, please check your internet connection and try again.`,
				{
					type: 'error',
				},
			);
			logger.error('Failed to toggle like', { message: err });
		}
	};

	const onPressShare = useCallback(() => {
		const url = toShareUrl(info.route.href);
		void shareUrl(url);
	}, [info]);

	return (
		<div className={styles.dialogBody}>
			<div className={styles.dialogHeaderRow}>
				<UserAvatar type="algo" size={48} avatar={info.avatar} />

				<div className={styles.dialogNameColumn}>
					<Text size="_2xl" weight="bold" numberOfLines={2} className={styles.dialogTitle}>
						{info.displayName}
					</Text>
					<Text size="sm" color="textContrastMedium" numberOfLines={1}>
						<Trans>
							by{' '}
							<InlineLinkText
								label={l`View ${info.creatorHandle}'s profile`}
								to={makeProfileLink({ did: info.creatorDid })}
								size="sm"
								color="textContrastMedium"
								numberOfLines={1}
								onPress={closeDialog}
							>
								{sanitizeHandle(info.creatorHandle, '@')}
							</InlineLinkText>
						</Trans>
					</Text>
				</div>

				<Button
					label={l`Share this feed`}
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

			<div className={styles.dialogLikedByRow}>
				{typeof likeCount === 'number' && (
					<InlineLinkText
						label={l`View users who like this feed`}
						to={makeCustomFeedLink(info.creatorDid, feedRkey, 'liked-by')}
						size="md_sub"
						color="textContrastMedium"
						onPress={closeDialog}
					>
						<Trans>
							Liked by <Plural value={likeCount} one="# user" other="# users" />
						</Trans>
					</InlineLinkText>
				)}
			</div>
			{hasSession && (
				<>
					<div className={styles.dialogActionsRow}>
						<Button
							disabled={isLikePending || isUnlikePending}
							label={l`Like this feed`}
							size="small"
							color="secondary"
							onClick={() => void onToggleLiked()}
							className={styles.dialogActionButton}
						>
							{isLiked ? <HeartFilled size="sm" fill={colors.pink} /> : <ButtonIcon icon={Heart} />}

							<ButtonText>{isLiked ? <Trans>Unlike</Trans> : <Trans>Like</Trans>}</ButtonText>
						</Button>
						<Button
							disabled={isFeedStateChangePending}
							label={isPinned ? l`Unpin feed` : l`Pin feed`}
							size="small"
							color={isPinned ? 'secondary' : 'primary'}
							onClick={onTogglePinned}
							className={styles.dialogActionButton}
						>
							<ButtonText>{isPinned ? <Trans>Unpin feed</Trans> : <Trans>Pin feed</Trans>}</ButtonText>
							<ButtonIcon icon={Pin} />
						</Button>
					</div>

					<div className={styles.dialogReportSection}>
						<div className={styles.dialogDivider} />

						<div className={styles.dialogReportRow}>
							<Text size="md_sub" color="textContrastMedium" className={styles.dialogWrongText}>
								<Trans>Something wrong? Let us know.</Trans>
							</Text>

							<Button
								label={l`Report feed`}
								size="small"
								variant="solid"
								color="secondary"
								onClick={onPressReport}
							>
								<ButtonText>
									<Trans>Report feed</Trans>
								</ButtonText>
								<ButtonIcon icon={CircleInfo} />
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
