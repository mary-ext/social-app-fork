import { useCallback, useEffect, useMemo } from 'react';
import { type GestureResponderEvent, View } from 'react-native';
import type { AnyProfileView, AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';

import { sanitizeHandle } from '#/lib/strings/handles';

import { precacheFeedFromGeneratorView } from '#/state/queries/feed';
import {
	useAddSavedFeedsMutation,
	usePreferencesQuery,
	useRemoveFeedMutation,
} from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { UserAvatar } from '#/view/com/util/UserAvatar';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, type ButtonProps, ButtonText } from '#/components/Button';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Link as InternalLink, type LinkProps } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as Prompt from '#/components/Prompt';
import { RichText, type RichTextProps } from '#/components/RichText';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from './icons/Trash';

type Props = {
	view: AppBskyFeedDefs.GeneratorView;
	onPress?: () => void;
};

export function Default(props: Props) {
	const { view } = props;
	return (
		<Link {...props}>
			<Outer>
				<Header>
					<Avatar src={view.avatar} />
					<TitleAndByline title={view.displayName} creator={view.creator as AnyProfileView} />
					<SaveButton view={view} pin />
				</Header>
				<Description description={view.description} />
				<Likes count={view.likeCount || 0} />
			</Outer>
		</Link>
	);
}

export function Link({ view, children, ...props }: Props & Omit<LinkProps, 'to' | 'label'>) {
	const queryClient = useQueryClient();

	const href = useMemo(() => {
		return createProfileFeedHref({ feed: view });
	}, [view]);

	useEffect(() => {
		precacheFeedFromGeneratorView(queryClient, view);
	}, [view, queryClient]);

	return (
		<InternalLink label={view.displayName} to={href} style={[a.flex_col]} {...props}>
			{children}
		</InternalLink>
	);
}

export function Outer({ children }: { children: React.ReactNode }) {
	return <View style={[a.w_full, a.gap_sm]}>{children}</View>;
}

export function Header({ children }: { children: React.ReactNode }) {
	return <View style={[a.flex_row, a.align_center, a.gap_sm]}>{children}</View>;
}

export type AvatarProps = { src: string | undefined; size?: number };

export function Avatar({ src, size = 40 }: AvatarProps) {
	return <UserAvatar type="algo" size={size} avatar={src} />;
}

export function AvatarPlaceholder({ size = 40 }: Omit<AvatarProps, 'src'>) {
	const t = useTheme();
	return (
		<View
			style={[
				t.atoms.bg_contrast_25,
				{
					width: size,
					height: size,
					borderRadius: 8,
				},
			]}
		/>
	);
}

export function TitleAndByline({ title, creator }: { title: string; creator?: AnyProfileView }) {
	const t = useTheme();

	return (
		<View style={[a.flex_1]}>
			<Text emoji style={[a.text_md, a.font_semi_bold, a.leading_snug]} numberOfLines={1}>
				{title}
			</Text>
			{creator && (
				<Text style={[a.leading_snug, t.atoms.text_contrast_medium]} numberOfLines={1}>
					<Trans>Feed by {sanitizeHandle(creator.handle, '@')}</Trans>
				</Text>
			)}
		</View>
	);
}

export function TitleAndBylinePlaceholder({ creator }: { creator?: boolean }) {
	const t = useTheme();

	return (
		<View style={[a.flex_1, a.gap_xs]}>
			<View
				style={[
					a.rounded_xs,
					t.atoms.bg_contrast_50,
					{
						width: '60%',
						height: 14,
					},
				]}
			/>

			{creator && (
				<View
					style={[
						a.rounded_xs,
						t.atoms.bg_contrast_25,
						{
							width: '40%',
							height: 10,
						},
					]}
				/>
			)}
		</View>
	);
}

export function Description({ description, ...rest }: { description?: string } & Partial<RichTextProps>) {
	if (!description) return null;
	return <RichText value={description} disableLinks {...rest} />;
}

export function DescriptionPlaceholder() {
	const t = useTheme();
	return (
		<View style={[a.gap_xs]}>
			<View style={[a.rounded_xs, a.w_full, t.atoms.bg_contrast_50, { height: 12 }]} />
			<View style={[a.rounded_xs, a.w_full, t.atoms.bg_contrast_50, { height: 12 }]} />
			<View style={[a.rounded_xs, a.w_full, t.atoms.bg_contrast_50, { height: 12, width: 100 }]} />
		</View>
	);
}

export function Likes({ count }: { count: number }) {
	const t = useTheme();
	return (
		<Text style={[a.text_sm, t.atoms.text_contrast_medium, a.font_semi_bold]}>
			<Trans>
				Liked by <Plural value={count || 0} one="# user" other="# users" />
			</Trans>
		</Text>
	);
}

export function SaveButton({
	view,
	pin,
	...props
}: {
	view: AppBskyFeedDefs.GeneratorView | AppBskyGraphDefs.ListView;
	pin?: boolean;
	text?: boolean;
} & Partial<ButtonProps>) {
	const { hasSession } = useSession();
	if (!hasSession) return null;
	return <SaveButtonInner view={view} pin={pin} {...props} />;
}

function SaveButtonInner({
	view,
	pin,
	text = true,
	...buttonProps
}: {
	view: AppBskyFeedDefs.GeneratorView | AppBskyGraphDefs.ListView;
	pin?: boolean;
	text?: boolean;
} & Partial<ButtonProps>) {
	const { t: l } = useLingui();
	const { data: preferences } = usePreferencesQuery();
	const { isPending: isAddSavedFeedPending, mutateAsync: saveFeeds } = useAddSavedFeedsMutation();
	const { isPending: isRemovePending, mutateAsync: removeFeed } = useRemoveFeedMutation();

	const uri = view.uri;
	const type = view.uri.includes('app.bsky.feed.generator') ? 'feed' : 'list';

	const savedFeedConfig = useMemo(() => {
		return preferences?.savedFeeds?.find((feed) => feed.value === uri);
	}, [preferences?.savedFeeds, uri]);
	const removePromptControl = Prompt.usePromptControl();
	const isPending = isAddSavedFeedPending || isRemovePending;

	const toggleSave = useCallback(
		async (e: GestureResponderEvent) => {
			e.preventDefault();
			e.stopPropagation();

			try {
				if (savedFeedConfig) {
					await removeFeed(savedFeedConfig);
				} else {
					await saveFeeds([
						{
							type,
							value: uri,
							pinned: !!pin,
						},
					]);
				}
				Toast.show(l({ message: 'Feeds updated!', context: 'toast' }));
			} catch (err) {
				logger.error(err instanceof Error ? err : String(err), {
					message: `FeedCard: failed to update feeds`,
					pin,
				});
				Toast.show(l`Failed to update feeds`, {
					type: 'error',
				});
			}
		},
		[l, pin, saveFeeds, removeFeed, uri, savedFeedConfig, type],
	);

	const onPromptRemoveFeed = useCallback(
		(e: GestureResponderEvent) => {
			e.preventDefault();
			e.stopPropagation();

			removePromptControl.open();
		},
		[removePromptControl],
	);

	return (
		<>
			<Button
				disabled={isPending}
				label={l`Add this feed to your feeds`}
				size="small"
				variant="solid"
				color={savedFeedConfig ? 'secondary' : 'primary'}
				onPress={(e: GestureResponderEvent) => (savedFeedConfig ? onPromptRemoveFeed(e) : void toggleSave(e))}
				{...buttonProps}
			>
				{savedFeedConfig ? (
					<>
						{isPending ? (
							<ButtonIcon size="md" icon={Loader} />
						) : (
							!text && <ButtonIcon size="md" icon={TrashIcon} />
						)}
						{text && (
							<ButtonText>
								<Trans>Unpin feed</Trans>
							</ButtonText>
						)}
					</>
				) : (
					<>
						<ButtonIcon size="md" icon={isPending ? Loader : PinIcon} />
						{text && (
							<ButtonText>
								<Trans>Pin feed</Trans>
							</ButtonText>
						)}
					</>
				)}
			</Button>

			<Prompt.Basic
				control={removePromptControl}
				title={l`Remove from your feeds?`}
				description={l`Are you sure you want to remove this from your feeds?`}
				onConfirm={(e: GestureResponderEvent) => void toggleSave(e)}
				confirmButtonCta={l`Remove`}
				confirmButtonColor="negative"
			/>
		</>
	);
}

export function createProfileFeedHref({ feed }: { feed: AppBskyFeedDefs.GeneratorView }) {
	const urip = parseCanonicalResourceUri(feed.uri);
	return `/profile/${feed.creator.did}/feed/${urip.rkey}`;
}
