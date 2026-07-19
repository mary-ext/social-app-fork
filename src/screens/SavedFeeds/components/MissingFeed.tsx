import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { getFeedTypeFromUri } from '#/state/queries/feed';
import { useProfileQuery } from '#/state/queries/profile';

import * as Dialog from '#/components/Dialog';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

import * as css from './MissingFeed.css';

/**
 * fallback card shown in place of a saved feed or list that can't be resolved. clicking it opens a dialog
 * explaining what went wrong, including the source's creator and any error message.
 *
 * @param uri the feed generator or list AT-URI that failed to resolve.
 * @param error the error thrown while resolving, surfaced in the dialog.
 */
export function MissingFeed({ error, uri }: { error: unknown; uri: string }) {
	const handle = Dialog.useDialogHandle();
	const type = getFeedTypeFromUri(uri);

	return (
		<>
			<Dialog.Trigger
				aria-label={type === 'feed' ? m['view.feeds.feed.error.connect']() : m['view.feeds.list.deleted']()}
				className={css.button}
				handle={handle}
			>
				<div className={css.iconBox}>
					<WarningIcon size="xl" />
				</div>
				<div className={css.textColumn}>
					<Text className={css.italic} numberOfLines={1} weight="medium">
						{type === 'feed' ? m['view.feeds.feed.unavailable.title']() : m['view.feeds.list.deleted']()}
					</Text>
					<Text className={css.italic} color="textContrastMedium" numberOfLines={1} size="md_sub">
						{m['view.feeds.a11y.clickForInfo']()}
					</Text>
				</div>
			</Dialog.Trigger>

			<Dialog.Root handle={handle}>
				<Dialog.Popup size="wide">
					<DialogInner error={error} handle={handle} type={type} uri={uri} />
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}

function DialogInner({
	error,
	handle,
	type,
	uri,
}: {
	error: unknown;
	handle: Dialog.DialogHandle;
	type: 'feed' | 'list';
	uri: string;
}) {
	const atUri = parseCanonicalResourceUri(uri);
	const { data: profile, isError: isProfileError } = useProfileQuery({ did: atUri.repo });
	const moderationOpts = useModerationOpts();

	return (
		<Stack gap="sm">
			<Dialog.TitleRow>
				<Dialog.Title>
					{type === 'feed' ? m['view.feeds.feed.error.connectService']() : m['view.feeds.list.deleted']()}
				</Dialog.Title>
				<Dialog.Close />
			</Dialog.TitleRow>
			<Text color="textContrastHigh">
				{type === 'feed' ? m['view.feeds.feed.unavailable.message']() : m['view.feeds.list.notFound']()}
			</Text>
			<Dialog.Divider />
			<Text color="textContrastHigh" weight="semiBold">
				{type === 'feed' ? m['view.feeds.feed.a11y.creator']() : m['view.feeds.list.a11y.creator']()}
			</Text>
			{profile && moderationOpts && (
				<div className={css.profileRow}>
					<ProfileCard.Link profile={profile} onPress={() => handle.close()}>
						<ProfileCard.Header>
							<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} disabledPreview />
							<ProfileCard.NameAndHandle profile={profile} moderationOpts={moderationOpts} />
						</ProfileCard.Header>
					</ProfileCard.Link>
				</div>
			)}
			{isProfileError && (
				<Text className={css.notice} color="textContrastHigh" align="center">
					{m['view.feeds.profile.notFound']()}
				</Text>
			)}
			{type === 'feed' && (
				<>
					<Text className={css.labelSpaced} color="textContrastHigh" weight="semiBold">
						{m['view.feeds.feed.a11y.identifier']()}
					</Text>
					<Text className={css.italic} color="textContrastHigh">
						{atUri.rkey}
					</Text>
				</>
			)}
			{error instanceof Error && (
				<>
					<Text className={css.labelSpaced} color="textContrastHigh" weight="semiBold">
						{m['view.feeds.a11y.errorMessage']()}
					</Text>
					<Text className={css.italic} color="textContrastHigh">
						{cleanError(error.message)}
					</Text>
				</>
			)}
		</Stack>
	);
}
