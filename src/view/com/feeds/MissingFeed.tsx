import { type StyleProp, View, type ViewStyle } from 'react-native';

import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { getFeedTypeFromUri } from '#/state/queries/feed';
import { useProfileQuery } from '#/state/queries/profile';

import { atoms as a, useTheme } from '#/alf';

import { Button } from '#/components/Button';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text } from '#/components/Text';
import { Text as LegacyText } from '#/components/Typography';
import * as Dialog from '#/components/web/Dialog';
import * as ProfileCard from '#/components/web/ProfileCard';
import { Stack } from '#/components/web/Stack';

import { m } from '#/paraglide/messages';

import * as styles from './MissingFeed.css';

export function MissingFeed({
	style,
	hideTopBorder,
	uri,
	error,
}: {
	style?: StyleProp<ViewStyle>;
	hideTopBorder?: boolean;
	uri: string;
	error?: unknown;
}) {
	const t = useTheme();
	const handle = Dialog.useDialogHandle();

	const type = getFeedTypeFromUri(uri);

	return (
		<>
			<Button
				label={type === 'feed' ? m['view.feeds.feed.error.connect']() : m['view.feeds.list.deleted']()}
				accessibilityHint={m['view.feeds.a11y.tapForInfo']()}
				onPress={() => handle.open(null)}
				style={[
					a.flex_1,
					a.p_lg,
					a.gap_md,
					!hideTopBorder && a.border_t,
					t.atoms.border_contrast_low,
					a.justify_start,
					style,
				]}
			>
				<View style={[a.flex_row, a.align_center]}>
					<View
						style={[
							{ width: 36, height: 36 },
							t.atoms.bg_contrast_25,
							a.rounded_sm,
							a.mr_md,
							a.align_center,
							a.justify_center,
						]}
					>
						<WarningIcon size="xl" />
					</View>
					<View style={[a.flex_1]}>
						<LegacyText
							emoji
							style={[a.text_sm, a.font_semi_bold, a.leading_snug, a.italic]}
							numberOfLines={1}
						>
							{type === 'feed' ? m['view.feeds.feed.unavailable.title']() : m['view.feeds.list.deleted']()}
						</LegacyText>
						<LegacyText
							style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug, a.italic]}
							numberOfLines={1}
						>
							{m['view.feeds.a11y.clickForInfo']()}
						</LegacyText>
					</View>
				</View>
			</Button>
			<Dialog.Root handle={handle}>
				<Dialog.Popup size="wide">
					<DialogInner handle={handle} uri={uri} type={type} error={error} />
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}

function DialogInner({
	handle,
	uri,
	type,
	error,
}: {
	handle: Dialog.DialogHandle;
	uri: string;
	type: 'feed' | 'list';
	error: unknown;
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
							<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} disabledPreview />
							<ProfileCard.NameAndHandle profile={profile} moderationOpts={moderationOpts} />
						</ProfileCard.Header>
					</ProfileCard.Link>
				</div>
			)}
			{isProfileError && (
				<Text className={styles.notice} color="textContrastHigh" align="center">
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
