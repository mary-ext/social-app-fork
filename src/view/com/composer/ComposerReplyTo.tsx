import { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, View, type ViewStyle } from 'react-native';
import type { AppBskyEmbedGallery, AppBskyEmbedImages } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';

import type { ComposerOptsPostRef } from '#/lib/hooks/useOpenComposer';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import { atoms as a, useTheme, utils } from '#/alf';

import { QuoteEmbed } from '#/components/Post/Embed';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Typography';
import { PreviewableUserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';
import { Image } from '#/shims/image';
import { parseEmbed } from '#/types/embed';

type WebViewStyle = ViewStyle & {
	userSelect?: 'text';
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style;
};

export function ComposerReplyTo({ replyTo }: { replyTo: ComposerOptsPostRef }) {
	const t = useTheme();
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
			})
		: null;

	const { images, totalNumber } = useMemo(() => {
		if (embed?.$type === 'app.bsky.embed.images#view') {
			return { images: embed.images, totalNumber: embed.images.length };
		} else if (embed?.$type === 'app.bsky.embed.gallery#view') {
			return { images: galleryItemsToImages(embed.items), totalNumber: embed.items.length };
		} else if (embed?.$type === 'app.bsky.embed.recordWithMedia#view') {
			if (embed.media?.$type === 'app.bsky.embed.images#view') {
				return { images: embed.media.images, totalNumber: embed.media.images.length };
			} else if (embed.media?.$type === 'app.bsky.embed.gallery#view') {
				return { images: galleryItemsToImages(embed.media.items), totalNumber: embed.media.items.length };
			}
		}
		return { images: [], totalNumber: 0 };
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
			accessibilityLabel={m['view.composer.reply.expand']()}
			accessibilityHint=""
		>
			<PreviewableUserAvatar
				size={42}
				profile={replyTo.author}
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
					<View style={[a.pl_xs]}>
						<ProfileBadges profile={replyTo.author} size="sm" />
					</View>
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
						) && <ComposerReplyToImages images={images} totalNumber={totalNumber} />}
				</View>
				{showFull && parsedQuoteEmbed && parsedQuoteEmbed.type === 'post' && (
					<QuoteEmbed embed={parsedQuoteEmbed} linkDisabled />
				)}
			</View>
		</Pressable>
	);
}

/** Normalize gallery view items (`thumbnail`) to the shared image `ViewImage` shape (`thumb`). */
function galleryItemsToImages(items: AppBskyEmbedGallery.ViewImage[]): AppBskyEmbedImages.ViewImage[] {
	return items.map((item) => ({
		alt: item.alt,
		aspectRatio: item.aspectRatio,
		fullsize: item.fullsize,
		thumb: item.thumbnail,
	}));
}

function ComposerReplyToImages({
	images,
	totalNumber,
}: {
	images: AppBskyEmbedImages.ViewImage[];
	totalNumber: number;
}) {
	const t = useTheme();

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
							<View style={[a.relative, a.flex_1]}>
								<Image
									source={{ uri: images[3]!.thumb }}
									style={[a.flex_1]}
									cachePolicy="memory-disk"
									accessibilityIgnoresInvertColors
								/>
								{totalNumber > 4 && (
									<View
										style={[
											a.absolute,
											a.inset_0,
											a.align_center,
											a.justify_center,
											{ backgroundColor: utils.alpha(t.palette.black, 0.6) },
										]}
									>
										<Text style={[a.text_xs, a.text_center, t.atoms.shadow_sm, { color: t.palette.white }]}>
											{m['view.composer.gallery.moreCount']({ count: totalNumber - 3 })}
										</Text>
									</View>
								)}
							</View>
						</View>
					</View>
				))}
		</View>
	);
}
