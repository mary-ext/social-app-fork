import { type ReactNode, useEffect, useMemo } from 'react';
import type { AnyProfileView, AppBskyGraphDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	type DisplayRestrictions,
	getDisplayRestrictions,
	moderateList,
} from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { weightedRandomIndex } from '#/lib/numbers';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { precacheList } from '#/state/queries/feed';
import { useToggleSavedFeed } from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { BlockLink } from '#/components/BlockLink';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Hider from '#/components/moderation/Hider';
import { RichText } from '#/components/RichText';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, type ButtonProps, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Prompt from '#/components/web/Prompt';
import * as Skeleton from '#/components/web/Skeleton';

import { borderRadius } from '#/styles/tokens.css';

import * as css from './ListCard.css';

const CURATELIST = 'app.bsky.graph.defs#curatelist';
const MODLIST = 'app.bsky.graph.defs#modlist';

type Props = {
	showPinButton?: boolean;
	view: AppBskyGraphDefs.ListView;
};

export function Default({
	className,
	onPress,
	showPinButton,
	topBorder,
	view,
}: Props & {
	className?: string;
	onPress?: () => void;
	topBorder?: boolean;
}) {
	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts ? moderateList(view, moderationOpts) : undefined;

	return (
		<Link className={clsx(css.defaultRow({ topBorder }), className)} onPress={onPress} view={view}>
			<Outer>
				<Header>
					<Avatar src={view.avatar} />
					<TitleAndByline
						creator={view.creator}
						modUi={moderation ? getDisplayRestrictions(moderation, DisplayContext.ContentView) : undefined}
						purpose={view.purpose}
						title={view.name}
					/>
					{showPinButton && view.purpose === CURATELIST && <SaveButton pin view={view} />}
				</Header>
				<Description description={view.description} />
			</Outer>
		</Link>
	);
}

export function Link({
	children,
	className,
	onPress,
	view,
}: {
	children: ReactNode;
	className?: string;
	onPress?: () => void;
	view: AppBskyGraphDefs.ListView;
}) {
	const queryClient = useQueryClient();

	const href = useMemo(() => createProfileListHref({ list: view }), [view]);

	useEffect(() => {
		precacheList(queryClient, view);
	}, [queryClient, view]);

	return (
		<BlockLink className={clsx(css.link, className)} label={view.name} onBeforePress={onPress} to={href}>
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

export function TitleAndByline({
	creator,
	modUi,
	purpose = CURATELIST,
	title,
}: {
	creator?: AnyProfileView;
	modUi?: DisplayRestrictions;
	purpose?: AppBskyGraphDefs.ListView['purpose'];
	title: string;
}) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();

	return (
		<div className={css.titleColumn}>
			<Hider.Outer
				allowOverride={creator && currentAccount?.did === creator.did}
				isContentVisibleInitialState={creator && currentAccount?.did === creator.did}
				modui={modUi}
			>
				<Hider.Mask>
					<Text className={css.italic} numberOfLines={1} weight="medium">
						<Trans>Hidden list</Trans>
					</Text>
				</Hider.Mask>
				<Hider.Content>
					<Text numberOfLines={1} weight="medium">
						{title}
					</Text>
				</Hider.Content>
			</Hider.Outer>
			{creator && (
				<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
					{purpose === MODLIST
						? l`Moderation list by ${sanitizeHandle(creator.handle, '@')}`
						: l`List by ${sanitizeHandle(creator.handle, '@')}`}
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

export function Description({ description }: { description?: string }) {
	if (!description) {
		return null;
	}
	return <RichText disableLinks value={description} />;
}

export function SaveButton({
	pin,
	view,
	...props
}: {
	pin?: boolean;
	text?: boolean;
	view: AppBskyGraphDefs.ListView;
} & Partial<ButtonProps>) {
	const { hasSession } = useSession();
	if (!hasSession) {
		return null;
	}
	return <SaveButtonInner pin={pin} view={view} {...props} />;
}

function SaveButtonInner({
	pin,
	text = true,
	view,
	...buttonProps
}: {
	pin?: boolean;
	text?: boolean;
	view: AppBskyGraphDefs.ListView;
} & Partial<ButtonProps>) {
	const { t: l } = useLingui();
	const removePromptHandle = Prompt.usePromptHandle();
	const { isPending, isSaved, toggleSave } = useToggleSavedFeed({ pin, type: 'list', uri: view.uri });

	return (
		<>
			<Button
				color={isSaved ? 'secondary' : 'primary'}
				disabled={isPending}
				label={l`Add this feed to your feeds`}
				onClick={isSaved ? () => removePromptHandle.open(null) : () => void toggleSave()}
				size="small"
				variant="solid"
				{...buttonProps}
			>
				{isSaved ? (
					<>
						{isPending ? (
							<Spinner color="currentColor" label={null} size="sm" />
						) : (
							!text && <ButtonIcon icon={TrashIcon} size="md" />
						)}
						{text && (
							<ButtonText>
								<Trans>Unpin feed</Trans>
							</ButtonText>
						)}
					</>
				) : (
					<>
						{isPending ? (
							<Spinner color="currentColor" label={null} size="sm" />
						) : (
							<ButtonIcon icon={PinIcon} size="md" />
						)}
						{text && (
							<ButtonText>
								<Trans>Pin feed</Trans>
							</ButtonText>
						)}
					</>
				)}
			</Button>

			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={l`Remove`}
				description={l`Are you sure you want to remove this from your feeds?`}
				handle={removePromptHandle}
				onConfirm={() => void toggleSave()}
				title={l`Remove from your feeds?`}
			/>
		</>
	);
}

// weighted description-line counts: most list descriptions are short (1 line) or empty, with a long
// tail toward 2–3 lines. index = line count (0–3).
const DESCRIPTION_LINE_WEIGHTS = [12, 10, 4, 1];

function LoadingRow({ descriptionLines, topBorder }: { descriptionLines: number; topBorder: boolean }) {
	return (
		<Skeleton.Col className={css.loadingRow({ topBorder })} gap="md">
			<Skeleton.Row align="center" gap="md">
				<AvatarPlaceholder />
				<TitleAndBylinePlaceholder creator />
			</Skeleton.Row>
			{descriptionLines > 0 && <Skeleton.Lines count={descriptionLines} lastWidth={70} size="md" />}
		</Skeleton.Col>
	);
}

// fallback row count when the caller doesn't know how many lists to expect, and a cap so a profile with
// many lists doesn't render dozens of placeholder rows.
const DEFAULT_LOADING_ROW_COUNT = 3;
const MAX_LOADING_ROW_COUNT = 10;

/**
 * A stack of list-card placeholders for the loading state, mirroring {@link Default}'s layout (avatar,
 * title/byline, description) so it sits on the same rhythm as the real cards.
 *
 * @param count number of placeholder rows; callers should pass the known list count when available (e.g.
 *   `profile.associated.lists`). Defaults to a small value and is capped so large counts don't render
 *   excessive rows.
 */
export function LoadingPlaceholder({ count }: { count?: number }): React.ReactNode {
	const rowCount = Math.min(count ?? DEFAULT_LOADING_ROW_COUNT, MAX_LOADING_ROW_COUNT);
	const rows = Array.from({ length: rowCount }, () => ({
		// list descriptions are often empty or short; weight toward 0–1 lines with a tail toward 2–3.
		descriptionLines: weightedRandomIndex(DESCRIPTION_LINE_WEIGHTS),
	}));

	return (
		<>
			{rows.map((row, i) => (
				<LoadingRow key={i} descriptionLines={row.descriptionLines} topBorder={i !== 0} />
			))}
		</>
	);
}

export function createProfileListHref({ list }: { list: AppBskyGraphDefs.ListView }) {
	const urip = parseCanonicalResourceUri(list.uri);
	return `/profile/${list.creator.did}/lists/${urip.rkey}`;
}
