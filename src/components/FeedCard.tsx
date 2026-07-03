import { type ReactNode, useEffect } from 'react';

import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { weightedRandomIndex } from '#/lib/numbers';

import { precacheFeedFromGeneratorView, useFeedSourceInfoQuery } from '#/state/queries/feed';
import { useToggleSavedFeed } from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { MissingFeed } from '#/view/com/feeds/MissingFeed';

import { BlockLink } from '#/components/BlockLink';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { RichText } from '#/components/RichText';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Prompt from '#/components/web/Prompt';
import * as Skeleton from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';
import { borderRadius } from '#/styles/tokens.css';

import * as css from './FeedCard.css';

type Props = {
	onPress?: () => void;
	view: AppBskyFeedDefs.GeneratorView;
};

export function Default({
	className,
	onPress,
	topBorder,
	view,
}: Props & {
	className?: string;
	topBorder?: boolean;
}) {
	return (
		<Link className={clsx(css.defaultRow({ topBorder }), className)} onPress={onPress} view={view}>
			<Outer>
				<Header>
					<Avatar src={view.avatar} />
					<TitleAndByline creator={view.creator} title={view.displayName} />
					<SaveButton pin view={view} />
				</Header>

				<Description description={view.description} />
				<Likes count={view.likeCount || 0} />
			</Outer>
		</Link>
	);
}

/**
 * Resolves a feed generator by its at-uri and renders a compact, non-link card framed for embedding inside
 * another surface (e.g. a notification row). Shows a loading placeholder while resolving and a
 * {@link MissingFeed} fallback if the feed can't be loaded.
 *
 * @param uri the feed generator's at-uri
 */
export function ByUri({ uri }: { uri: string }) {
	const { data: feed, error } = useFeedSourceInfoQuery({ uri });

	if (!feed || feed.type !== 'feed' || !feed.view) {
		if (error) {
			return <MissingFeed uri={uri} error={error} hideTopBorder />;
		}
		return <EmbedPlaceholder />;
	}

	const { view } = feed;
	return (
		<Outer className={css.embedCard}>
			<Header>
				<Avatar src={view.avatar} />
				<TitleAndByline creator={view.creator} title={view.displayName} />
			</Header>
			<Likes count={view.likeCount || 0} />
		</Outer>
	);
}

function EmbedPlaceholder() {
	return (
		<Outer className={css.embedCard}>
			<Header>
				<AvatarPlaceholder />
				<TitleAndBylinePlaceholder creator />
			</Header>
			<Skeleton.Text size="sm" width="35%" />
		</Outer>
	);
}

export function Link({
	children,
	className,
	onPress,
	view,
}: Props & {
	children: ReactNode;
	className?: string;
}) {
	const queryClient = useQueryClient();

	const href = createProfileFeedHref({ feed: view });

	useEffect(() => {
		precacheFeedFromGeneratorView(queryClient, view);
	}, [queryClient, view]);

	return (
		<BlockLink
			className={clsx(css.link, className)}
			label={view.displayName}
			onBeforePress={onPress}
			to={href}
		>
			<div>{children}</div>
		</BlockLink>
	);
}

export function Outer({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={clsx(css.outer, className)}>{children}</div>;
}

export function Header({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={clsx(css.header, className)}>{children}</div>;
}

export type AvatarProps = { size?: number; src: string | undefined };

export function Avatar({ size = 40, src }: AvatarProps) {
	return <UserAvatar avatar={src} size={size} type="algo" />;
}

export function AvatarPlaceholder({ size = 40 }: Omit<AvatarProps, 'src'>) {
	return <Skeleton.Square radius={borderRadius.sm} size={size} />;
}

export function TitleAndByline({ creator, title }: { creator?: AnyProfileView; title: string }) {
	return (
		<div className={css.titleColumn}>
			<Text numberOfLines={1} weight="medium">
				{title}
			</Text>
			{creator && (
				<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
					{m['common.feeds.feedBy']({ handle: creator.handle })}
				</Text>
			)}
		</div>
	);
}

export function TitleAndBylinePlaceholder({ creator }: { creator?: boolean }) {
	return (
		<Skeleton.Col>
			<Skeleton.Text size="md" width="60%" />
			{creator && <Skeleton.Text blend size="md" width="40%" />}
		</Skeleton.Col>
	);
}

/** Placeholder for the "Pin feed" / "Unpin feed" pill in the header. */
export function SaveButtonPlaceholder() {
	return <div className={css.saveButtonPlaceholder} />;
}

export function Description({ description }: { description?: string }) {
	if (!description) {
		return null;
	}
	return <RichText disableLinks value={description} />;
}

export function Likes({ count }: { count: number }) {
	return (
		<Text color="textContrastMedium" size="sm" weight="semiBold">
			{m['common.like.likedByCount']({ count: count || 0 })}
		</Text>
	);
}

export function SaveButton({ pin, view }: { pin?: boolean; view: AppBskyFeedDefs.GeneratorView }) {
	const { hasSession } = useSession();
	if (!hasSession) {
		return null;
	}
	return <SaveButtonInner pin={pin} view={view} />;
}

function SaveButtonInner({ pin, view }: { pin?: boolean; view: AppBskyFeedDefs.GeneratorView }) {
	const removePromptHandle = Prompt.usePromptHandle();
	const { isPending, isSaved, toggleSave } = useToggleSavedFeed({ pin, type: 'feed', uri: view.uri });

	return (
		<>
			<Button
				color={isSaved ? 'secondary' : 'primary'}
				disabled={isPending}
				label={m['common.feeds.action.add']()}
				onClick={isSaved ? () => removePromptHandle.open(null) : () => void toggleSave()}
				size="small"
				variant="solid"
			>
				{isSaved ? (
					<>
						{isPending && <Spinner color="white" label={null} size="sm" />}
						<ButtonText>{m['common.feeds.action.unpin']()}</ButtonText>
					</>
				) : (
					<>
						{isPending ? (
							<Spinner color="white" label={null} size="sm" />
						) : (
							<ButtonIcon icon={PinIcon} size="md" />
						)}
						<ButtonText>{m['common.feeds.action.pin']()}</ButtonText>
					</>
				)}
			</Button>

			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={m['common.action.remove']()}
				description={m['common.feeds.remove.message']()}
				handle={removePromptHandle}
				onConfirm={() => void toggleSave()}
				title={m['common.feeds.remove.title']()}
			/>
		</>
	);
}

export function createProfileFeedHref({ feed }: { feed: AppBskyFeedDefs.GeneratorView }) {
	const urip = parseCanonicalResourceUri(feed.uri);
	return `/profile/${feed.creator.did}/feed/${urip.rkey}`;
}

// weighted description-line counts: most feed descriptions are short (1 line) or empty, with a long
// tail toward 2–3 lines. index = line count (0–3).
const DESCRIPTION_LINE_WEIGHTS = [20, 10, 4, 1];

function LoadingRow({ descriptionLines, topBorder }: { descriptionLines: number; topBorder: boolean }) {
	return (
		<Skeleton.Col className={css.loadingRow({ topBorder })} gap="md">
			<Skeleton.Row align="center" gap="md">
				<AvatarPlaceholder />
				<TitleAndBylinePlaceholder creator />
				<SaveButtonPlaceholder />
			</Skeleton.Row>
			{descriptionLines > 0 && <Skeleton.Lines count={descriptionLines} lastWidth={70} size="md" />}
			<Skeleton.Text size="sm" width="35%" />
		</Skeleton.Col>
	);
}

// fallback row count when the caller doesn't know how many feeds to expect, and a cap so a profile with
// many feeds doesn't render dozens of placeholder rows.
const DEFAULT_LOADING_ROW_COUNT = 3;
const MAX_LOADING_ROW_COUNT = 10;

/**
 * A stack of feed-card placeholders for the loading state, mirroring {@link Default}'s layout (avatar,
 * title/byline, save pill, description, like count) so it sits on the same rhythm as the real cards.
 *
 * @param count number of placeholder rows; callers should pass the known feed-generator count when available
 *   (e.g. `profile.associated.feedgens`). Defaults to a small value and is capped so large counts don't
 *   render excessive rows.
 * @param topBorder whether the first row carries a top divider (later rows always do); set it when the
 *   placeholder sits directly beneath a borderless header, like the real cards do. Defaults to `false`.
 */
export function LoadingPlaceholder({
	count,
	topBorder = false,
}: {
	count?: number;
	topBorder?: boolean;
}): React.ReactNode {
	const rowCount = Math.min(count ?? DEFAULT_LOADING_ROW_COUNT, MAX_LOADING_ROW_COUNT);
	const rows = Array.from({ length: rowCount }, () => ({
		// ~5% of feeds carry no description; the rest cluster around 1 line with a long tail.
		descriptionLines: weightedRandomIndex(DESCRIPTION_LINE_WEIGHTS),
	}));

	return (
		<>
			{rows.map((row, i) => (
				<LoadingRow key={i} descriptionLines={row.descriptionLines} topBorder={i === 0 ? topBorder : true} />
			))}
		</>
	);
}
