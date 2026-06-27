import { type StyleProp, View, type ViewStyle } from 'react-native';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { getFeedTypeFromUri } from '#/state/queries/feed';
import { useProfileQuery } from '#/state/queries/profile';

import { atoms as a, useTheme } from '#/alf';

import { Button } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Divider } from '#/components/Divider';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

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
	const control = Dialog.useDialogControl();

	const type = getFeedTypeFromUri(uri);

	return (
		<>
			<Button
				label={type === 'feed' ? m['view.feeds.feed.error.connect']() : m['view.feeds.list.deleted']()}
				accessibilityHint={m['view.feeds.a11y.tapForInfo']()}
				onPress={control.open}
				style={[
					a.flex_1,
					a.p_lg,
					a.gap_md,
					!hideTopBorder && !a.border_t,
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
						<WarningIcon size="lg" />
					</View>
					<View style={[a.flex_1]}>
						<Text emoji style={[a.text_sm, a.font_semi_bold, a.leading_snug, a.italic]} numberOfLines={1}>
							{type === 'feed' ? m['view.feeds.feed.unavailable.title']() : m['view.feeds.list.deleted']()}
						</Text>
						<Text
							style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug, a.italic]}
							numberOfLines={1}
						>
							{m['view.feeds.a11y.clickForInfo']()}
						</Text>
					</View>
				</View>
			</Button>
			<Dialog.Outer control={control}>
				<Dialog.Handle />
				<DialogInner uri={uri} type={type} error={error} />
			</Dialog.Outer>
		</>
	);
}

function DialogInner({ uri, type, error }: { uri: string; type: 'feed' | 'list'; error: unknown }) {
	const control = Dialog.useDialogContext();
	const t = useTheme();
	const atUri = parseCanonicalResourceUri(uri);
	const { data: profile, isError: isProfileError } = useProfileQuery({
		did: atUri.repo,
	});
	const moderationOpts = useModerationOpts();

	return (
		<Dialog.ScrollableInner
			label={type === 'feed' ? m['view.feeds.feed.unavailable.a11y']() : m['view.feeds.list.deleted']()}
			style={{ maxWidth: 500 }}
		>
			<View style={[a.gap_sm]}>
				<Text style={[a.font_bold, a.text_2xl]}>
					{type === 'feed' ? m['view.feeds.feed.error.connectService']() : m['view.feeds.list.deleted']()}
				</Text>
				<Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
					{type === 'feed' ? m['view.feeds.feed.unavailable.message']() : m['view.feeds.list.notFound']()}
				</Text>
				<Divider style={[a.my_md]} />
				<Text style={[a.font_semi_bold, t.atoms.text_contrast_high]}>
					{type === 'feed' ? m['view.feeds.feed.a11y.creator']() : m['view.feeds.list.a11y.creator']()}
				</Text>
				{profile && moderationOpts && (
					<View style={[a.w_full, a.align_start]}>
						<ProfileCard.Link profile={profile} onPress={() => control.close()}>
							<ProfileCard.Header>
								<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} disabledPreview />
								<ProfileCard.NameAndHandle profile={profile} moderationOpts={moderationOpts} />
							</ProfileCard.Header>
						</ProfileCard.Link>
					</View>
				)}
				{isProfileError && (
					<Text style={[t.atoms.text_contrast_high, a.italic, a.text_center, a.w_full]}>
						{m['view.feeds.profile.notFound']()}
					</Text>
				)}
				{type === 'feed' && (
					<>
						<Text style={[a.font_semi_bold, t.atoms.text_contrast_high, a.mt_md]}>
							{m['view.feeds.feed.a11y.identifier']()}
						</Text>
						<Text style={[a.text_md, t.atoms.text_contrast_high, a.italic]}>{atUri.rkey}</Text>
					</>
				)}
				{error instanceof Error && (
					<>
						<Text style={[a.font_semi_bold, t.atoms.text_contrast_high, a.mt_md]}>
							{m['view.feeds.a11y.errorMessage']()}
						</Text>
						<Text style={[a.text_md, t.atoms.text_contrast_high, a.italic]}>{cleanError(error.message)}</Text>
					</>
				)}
			</View>

			<Dialog.Close />
		</Dialog.ScrollableInner>
	);
}
