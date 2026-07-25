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

import * as styles from './MissingFeed.css';

export function MissingFeed({
	error,
	hideTopBorder,
	uri,
}: {
	error?: unknown;
	hideTopBorder?: boolean;
	uri: string;
}) {
	const handle = Dialog.useDialogHandle();
	const type = getFeedTypeFromUri(uri);

	return (
		<>
			<button
				type="button"
				aria-label={type === 'feed' ? m['view.feeds.feed.error.connect']() : m['view.feeds.list.deleted']()}
				className={styles.button({ borderTop: !hideTopBorder })}
				onClick={() => handle.open(null)}
			>
				<div className={styles.iconBox}>
					<WarningIcon size="xl" />
				</div>
				<div className={styles.textContent}>
					<Text className={styles.titleText} leading="snug" size="sm" weight="semiBold">
						{type === 'feed' ? m['view.feeds.feed.unavailable.title']() : m['view.feeds.list.deleted']()}
					</Text>
					<Text className={styles.italic} color="textContrastMedium" leading="snug" size="sm">
						{m['view.feeds.a11y.clickForInfo']()}
					</Text>
				</div>
			</button>
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
	const { data: profile, isError: isProfileError } = useProfileQuery({
		did: atUri.repo,
	});
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
				<div className={styles.profileRow}>
					<ProfileCard.Link profile={profile} onPress={() => handle.close()}>
						<ProfileCard.Header>
							<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} />
							<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
						</ProfileCard.Header>
					</ProfileCard.Link>
				</div>
			)}
			{isProfileError && (
				<Text align="center" className={styles.notice} color="textContrastHigh">
					{m['view.feeds.profile.notFound']()}
				</Text>
			)}
			{type === 'feed' && (
				<>
					<Text className={styles.labelSpaced} color="textContrastHigh" weight="semiBold">
						{m['view.feeds.feed.a11y.identifier']()}
					</Text>
					<Text className={styles.italic} color="textContrastHigh">
						{atUri.rkey}
					</Text>
				</>
			)}
			{error instanceof Error && (
				<>
					<Text className={styles.labelSpaced} color="textContrastHigh" weight="semiBold">
						{m['view.feeds.a11y.errorMessage']()}
					</Text>
					<Text className={styles.italic} color="textContrastHigh">
						{cleanError(error.message)}
					</Text>
				</>
			)}
		</Stack>
	);
}
