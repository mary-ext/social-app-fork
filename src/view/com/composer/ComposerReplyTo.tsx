import { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, View, type ViewStyle } from 'react-native';
import type { AnyProfileView, AppBskyEmbedImages } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';

import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import type { ComposerOptsPostRef } from '#/state/shell/composer';

import { PreviewableUserAvatar } from '#/view/com/util/UserAvatar';

import { atoms as a, useTheme } from '#/alf';

import { QuoteEmbed } from '#/components/Post/Embed';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Typography';

import { Image } from '#/shims/image';
import { parseEmbed } from '#/types/embed';

type WebViewStyle = ViewStyle & {
	userSelect?: 'text';
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style as unknown as ViewStyle;
};

export function ComposerReplyTo({ replyTo }: { replyTo: ComposerOptsPostRef }) {
	const t = useTheme();
	const { t: l } = useLingui();
	const embed = replyTo.embed;

	const [showFull, setShowFull] = useState(false);

	const onPress = useCallback(() => {
		setShowFull((prev) => !prev);
		LayoutAnimation.configureNext({
			duration: 350,
			update: { type: 'spring', springDamping: 0.7 },
		});
	}, []);

	const quoteEmbed = useMemo(() => {
		if (
			embed?.$type === 'app.bsky.embed.record#view' &&
			embed.record?.$type === 'app.bsky.embed.record#viewRecord' &&
			embed.record.value?.$type === 'app.bsky.feed.post'
		) {
			return embed;
		} else if (
			embed?.$type === 'app.bsky.embed.recordWithMedia#view' &&
			embed.record.record?.$type === 'app.bsky.embed.record#viewRecord' &&
			embed.record.record.value?.$type === 'app.bsky.feed.post'
		) {
			return embed.record;
		}
		return null;
	}, [embed]);
	const parsedQuoteEmbed = quoteEmbed
		? parseEmbed({
				$type: 'app.bsky.embed.record#view',
				...quoteEmbed,
			} as Parameters<typeof parseEmbed>[0])
		: null;

	const images = useMemo(() => {
		if (embed?.$type === 'app.bsky.embed.images#view') {
			return embed.images;
		} else if (
			embed?.$type === 'app.bsky.embed.recordWithMedia#view' &&
			embed.media?.$type === 'app.bsky.embed.images#view'
		) {
			return embed.media.images;
		}
	}, [embed]);

	return (
		<Pressable
			style={[
				a.flex_row,
				a.align_start,
				a.pt_xs,
				a.pb_lg,
				a.mb_md,
				a.mx_lg,
				a.border_b,
				t.atoms.border_contrast_medium,
				webViewStyle(a.user_select_text),
			]}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={l`Expand or collapse the full post you are replying to`}
			accessibilityHint=""
		>
			<PreviewableUserAvatar
				size={42}
				profile={replyTo.author as AnyProfileView}
				moderation={
					replyTo.moderation
						? getDisplayRestrictions(replyTo.moderation, DisplayContext.ProfileMedia)
						: undefined
				}
				type={replyTo.author.associated?.labeler ? 'labeler' : 'user'}
				disableNavigation={true}
			/>
			<View style={[a.flex_1, a.pl_md, a.pr_sm, a.gap_2xs]}>
				<View style={[a.flex_row, a.align_center, a.pr_xs]}>
					<Text style={[a.font_semi_bold, a.text_md, a.leading_snug, a.flex_shrink]} numberOfLines={1} emoji>
						{sanitizeDisplayName(replyTo.author.displayName || sanitizeHandle(replyTo.author.handle))}
					</Text>
					<ProfileBadges profile={replyTo.author as AnyProfileView} size="sm" style={[a.pl_xs]} />
				</View>
				<View style={[a.flex_row, a.gap_md]}>
					<View style={[a.flex_1, a.flex_grow]}>
						<Text
							style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}
							numberOfLines={!showFull ? 6 : undefined}
							emoji
						>
							{replyTo.text}
						</Text>
					</View>
					{images &&
						!(
							replyTo.moderation &&
							getDisplayRestrictions(replyTo.moderation, DisplayContext.ContentMedia).blurs.length > 0
						) && <ComposerReplyToImages images={images} showFull={showFull} />}
				</View>
				{showFull && parsedQuoteEmbed && parsedQuoteEmbed.type === 'post' && (
					<QuoteEmbed embed={parsedQuoteEmbed} linkDisabled />
				)}
			</View>
		</Pressable>
	);
}

function ComposerReplyToImages({ images }: { images: AppBskyEmbedImages.ViewImage[]; showFull: boolean }) {
	return (
		<View
			style={[
				a.rounded_xs,
				a.overflow_hidden,
				a.mt_2xs,
				a.mx_xs,
				{
					height: 64,
					width: 64,
				},
			]}
		>
			{(images.length === 1 && (
				<Image
					source={{ uri: images[0]!.thumb }}
					style={[a.flex_1]}
					cachePolicy="memory-disk"
					accessibilityIgnoresInvertColors
				/>
			)) ||
				(images.length === 2 && (
					<View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
						<Image
							source={{ uri: images[0]!.thumb }}
							style={[a.flex_1]}
							cachePolicy="memory-disk"
							accessibilityIgnoresInvertColors
						/>
						<Image
							source={{ uri: images[1]!.thumb }}
							style={[a.flex_1]}
							cachePolicy="memory-disk"
							accessibilityIgnoresInvertColors
						/>
					</View>
				)) ||
				(images.length === 3 && (
					<View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
						<Image
							source={{ uri: images[0]!.thumb }}
							style={[a.flex_1]}
							cachePolicy="memory-disk"
							accessibilityIgnoresInvertColors
						/>
						<View style={[a.flex_1, a.gap_2xs]}>
							<Image
								source={{ uri: images[1]!.thumb }}
								style={[a.flex_1]}
								cachePolicy="memory-disk"
								accessibilityIgnoresInvertColors
							/>
							<Image
								source={{ uri: images[2]!.thumb }}
								style={[a.flex_1]}
								cachePolicy="memory-disk"
								accessibilityIgnoresInvertColors
							/>
						</View>
					</View>
				)) ||
				(images.length === 4 && (
					<View style={[a.flex_1, a.gap_2xs]}>
						<View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
							<Image
								source={{ uri: images[0]!.thumb }}
								style={[a.flex_1]}
								cachePolicy="memory-disk"
								accessibilityIgnoresInvertColors
							/>
							<Image
								source={{ uri: images[1]!.thumb }}
								style={[a.flex_1]}
								cachePolicy="memory-disk"
								accessibilityIgnoresInvertColors
							/>
						</View>
						<View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
							<Image
								source={{ uri: images[2]!.thumb }}
								style={[a.flex_1]}
								cachePolicy="memory-disk"
								accessibilityIgnoresInvertColors
							/>
							<Image
								source={{ uri: images[3]!.thumb }}
								style={[a.flex_1]}
								cachePolicy="memory-disk"
								accessibilityIgnoresInvertColors
							/>
						</View>
					</View>
				))}
		</View>
	);
}
