import type { AppBskyDraftDefs } from '@atcute/bluesky';

import { clsx } from 'clsx';

import { getBlobUrl } from '#/lib/utils/blob-url';

import { useCurrentAccountProfile } from '#/state/queries/profile';

import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { TimeElapsed } from '#/components/TimeElapsed';
import { Button, ButtonIcon } from '#/components/web/Button';

import DotsIcon from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import WarningIcon from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import PlayIcon from '#/icons/central/Play_round_filled_radius1_stroke2.svg';
import TrashIcon from '#/icons/central/TrashCan_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { Avatar } from '../post/Avatar';
import { GHOST_AVATAR_SIZE } from '../shared/layout';
import {
	getDraftDeviceName,
	getDraftMediaPaths,
	getDraftPostImages,
	isDraftFromThisDevice,
	parseDraftGif,
} from './draft-format';
import * as css from './DraftsDialog.css';
import { useDraftMediaQuery } from './queries';

/**
 * a saved draft in the drafts list.
 *
 * @param props.view the draft
 * @param props.storedMedia localRef paths of the draft attachments stored on this device
 * @param props.hideTopBorder omits the divider above the first row
 * @param props.isRestoring whether this draft is being opened
 * @param props.disabled prevents opening while another draft is being opened
 * @param props.onSelect opens the draft
 * @param props.onDelete deletes the draft after confirmation
 * @returns the row
 */
export function DraftRow({
	view,
	storedMedia,
	hideTopBorder,
	isRestoring,
	disabled,
	onSelect,
	onDelete,
}: {
	view: AppBskyDraftDefs.DraftView;
	storedMedia: ReadonlySet<string>;
	hideTopBorder: boolean;
	isRestoring: boolean;
	disabled: boolean;
	onSelect: () => void;
	onDelete: () => void;
}) {
	const { draft } = view;
	const [first] = draft.posts;

	const profile = useCurrentAccountProfile();
	const deletePromptHandle = Prompt.usePromptHandle();

	const hasQuote = draft.posts.some((post) => post.embedRecords?.length);
	const isLocal = isDraftFromThisDevice(draft);
	const isMissingMedia = getDraftMediaPaths(draft).some((path) => !isLocal || !storedMedia.has(path));

	let mediaNotice: string | undefined;
	if (isMissingMedia) {
		const deviceName = getDraftDeviceName(draft);
		if (isLocal) {
			mediaNotice = m['view.composer.media.missing']();
		} else if (deviceName === undefined) {
			mediaNotice = m['view.composer.media.storedOtherDevice']();
		} else {
			mediaNotice = m['view.composer.media.storedOn']({ deviceName });
		}
	}

	const replyCount = draft.posts.length - 1;

	return (
		<div className={css.row({ topBorder: !hideTopBorder })}>
			<button
				type="button"
				className={css.select}
				disabled={disabled}
				aria-label={m['view.composer.drafts.action.open']()}
				aria-busy={isRestoring}
				onClick={onSelect}
			>
				<div className={css.post}>
					<div className={css.rail}>
						<Avatar profile={profile} />
						{replyCount > 0 && <div className={css.line} />}
					</div>

					<div className={clsx(css.content, replyCount > 0 && css.threadContent)}>
						<div className={css.header}>
							<Text
								className={css.handle}
								color="textContrastHigh"
								size="md"
								weight="semiBold"
								numberOfLines={1}
							>
								{profile?.handle}
							</Text>
							<TimeElapsed timestamp={view.updatedAt}>
								{({ timeElapsed }) => (
									<Text className={css.time} color="textContrastMedium" size="md">
										{timeElapsed}
									</Text>
								)}
							</TimeElapsed>
							{isRestoring && <Spinner color="default" size="sm" label={`Opening draft`} />}
						</div>

						{first?.text.trim() && (
							<RichText
								disableLinks
								numberOfLines={6}
								size="md"
								color="textContrastHigh"
								value={first.text}
							/>
						)}

						{first && isLocal && <DraftThumbnails post={first} storedMedia={storedMedia} />}

						{(hasQuote || mediaNotice) && (
							<div className={css.meta}>
								{hasQuote && (
									<Text size="sm" color="textContrastMedium">
										{m['common.quote.post']()}
									</Text>
								)}
								{mediaNotice && (
									<>
										<WarningIcon className={css.warning} />
										<Text size="sm" color="textContrastMedium">
											{mediaNotice}
										</Text>
									</>
								)}
							</div>
						)}
					</div>
				</div>

				{replyCount > 0 && (
					<div className={css.replies}>
						<span className={css.repliesAvatar}>
							<Avatar profile={profile} size={GHOST_AVATAR_SIZE} noBorder />
						</span>
						<Text color="textContrastMedium" size="md">
							{replyCount === 1 ? `1 more post` : `${replyCount} more posts`}
						</Text>
					</div>
				)}
			</button>

			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							className={css.options}
							label={m['common.a11y.moreOptions']()}
							variant="ghost"
							color="secondary"
							shape="round"
							size="small"
						>
							<ButtonIcon icon={DotsIcon} />
						</Button>
					}
				/>
				<Menu.Popup label={m['common.a11y.moreOptions']()} align="end">
					<Menu.Group>
						<Menu.Item destructive onClick={() => deletePromptHandle.open(null)}>
							<Menu.ItemText>{`Delete draft`}</Menu.ItemText>
							<Menu.ItemIcon position="right" icon={TrashIcon} />
						</Menu.Item>
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>

			<Prompt.Basic
				handle={deletePromptHandle}
				title={m['view.composer.drafts.discard.title']()}
				description={m['view.composer.drafts.discard.message']()}
				confirmButtonCta={m['common.action.delete']()}
				confirmButtonColor="negative"
				onConfirm={onDelete}
			/>
		</div>
	);
}

function DraftThumbnails({
	post,
	storedMedia,
}: {
	post: AppBskyDraftDefs.DraftPost;
	storedMedia: ReadonlySet<string>;
}) {
	const images = getDraftPostImages(post).filter((image) => storedMedia.has(image.localRef.path));
	const hasVideo = post.embedVideos?.some((video) => storedMedia.has(video.localRef.path)) ?? false;
	const gif = post.embedExternals
		?.map(({ uri }) => parseDraftGif(uri))
		.find((parsed) => parsed !== undefined);

	if (images.length === 0 && !hasVideo && !gif) {
		return null;
	}

	return (
		<div className={css.thumbnails}>
			{images.slice(0, 4).map((image) => (
				<ImageThumbnail key={image.localRef.path} path={image.localRef.path} alt={image.alt ?? ''} />
			))}
			{gif && (
				<div className={css.thumbnail}>
					<img
						className={css.thumbnailImage}
						src={gif.media_formats.gif.url}
						alt={gif.content_description}
						decoding="async"
					/>
				</div>
			)}
			{hasVideo && (
				<div className={css.thumbnail}>
					<PlayIcon className={css.thumbnailIcon} aria-label={`Video`} />
				</div>
			)}
		</div>
	);
}

function ImageThumbnail({ path, alt }: { path: string; alt: string }) {
	const { data: blob } = useDraftMediaQuery(path);

	return (
		<div className={css.thumbnail}>
			{blob && <img className={css.thumbnailImage} src={getBlobUrl(blob)} alt={alt} decoding="async" />}
		</div>
	);
}
