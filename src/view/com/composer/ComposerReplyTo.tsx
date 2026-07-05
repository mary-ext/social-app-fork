import { useState } from 'react';

import {
	unwrapMediaEmbed,
	unwrapQuoteEmbed,
	unwrapRecordEmbed,
	type AppBskyEmbedGallery,
	type AppBskyEmbedImages,
} from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions } from '@atcute/bluesky-moderation';

import type { ComposerOptsPostRef } from '#/lib/hooks/useOpenComposer';

import { QuoteEmbed } from '#/components/Post/Embed';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { PreviewableUserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';
import { parseEmbed } from '#/types/embed';

import * as styles from './ComposerReplyTo.css';

export function ComposerReplyTo({ replyTo }: { replyTo: ComposerOptsPostRef }) {
	const embed = replyTo.embed;

	const [showFull, setShowFull] = useState(false);

	const onPress = () => {
		setShowFull((prev) => !prev);
	};

	const record = unwrapQuoteEmbed(unwrapRecordEmbed(embed));
	const quoteEmbed = record?.$type === 'app.bsky.embed.record#viewRecord' ? record : null;
	const parsedQuoteEmbed = quoteEmbed
		? parseEmbed({
				$type: 'app.bsky.embed.record#view',
				record: quoteEmbed,
			})
		: null;

	const media = unwrapMediaEmbed(embed);
	let images: AppBskyEmbedImages.ViewImage[] = [];
	let totalNumber = 0;
	if (media) {
		switch (media.$type) {
			case 'app.bsky.embed.images#view': {
				images = media.images;
				totalNumber = media.images.length;
				break;
			}
			case 'app.bsky.embed.gallery#view': {
				images = galleryItemsToImages(media.items);
				totalNumber = media.items.length;
				break;
			}
		}
	}

	return (
		<div
			className={styles.container}
			onClick={onPress}
			role="button"
			aria-label={m['view.composer.reply.expand']()}
		>
			<PreviewableUserAvatar
				size={36}
				profile={replyTo.author}
				moderation={
					replyTo.moderation
						? getDisplayRestrictions(replyTo.moderation, DisplayContext.ProfileMedia)
						: undefined
				}
				type={replyTo.author.associated?.labeler ? 'labeler' : 'user'}
				disableNavigation={true}
			/>

			<div className={styles.content}>
				<div className={styles.header}>
					<Text className={styles.name} color="textContrastHigh" numberOfLines={1} weight="semiBold">
						{replyTo.author.handle}
					</Text>

					<ProfileBadges profile={replyTo.author} size="sm" className={styles.badge} />
				</div>

				<div className={styles.bodyRow}>
					<div className={styles.flexGrow}>
						<Text size="md" leading="snug" color="textContrastHigh" numberOfLines={!showFull ? 6 : 16}>
							{replyTo.text}
						</Text>
					</div>

					{images &&
						!(
							replyTo.moderation &&
							getDisplayRestrictions(replyTo.moderation, DisplayContext.ContentMedia).blurs.length > 0
						) && <ComposerReplyToImages images={images} totalNumber={totalNumber} />}
				</div>

				{showFull && parsedQuoteEmbed && parsedQuoteEmbed.type === 'post' && (
					<QuoteEmbed embed={parsedQuoteEmbed} linkDisabled />
				)}
			</div>
		</div>
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

function ReplyImage({ image }: { image: AppBskyEmbedImages.ViewImage }) {
	return <img src={image.thumb} className={styles.image} alt={image.alt || ''} />;
}

function ComposerReplyToImages({
	images,
	totalNumber,
}: {
	images: AppBskyEmbedImages.ViewImage[];
	totalNumber: number;
}) {
	if (images.length === 1) {
		return (
			<div className={styles.imagesContainer}>
				<ReplyImage image={images[0]!} />
			</div>
		);
	}
	if (images.length === 2) {
		return (
			<div className={styles.imagesContainer}>
				<div className={styles.imagesRow}>
					<ReplyImage image={images[0]!} />
					<ReplyImage image={images[1]!} />
				</div>
			</div>
		);
	}
	if (images.length === 3) {
		return (
			<div className={styles.imagesContainer}>
				<div className={styles.imagesRow}>
					<ReplyImage image={images[0]!} />
					<div className={styles.imagesCol}>
						<ReplyImage image={images[1]!} />
						<ReplyImage image={images[2]!} />
					</div>
				</div>
			</div>
		);
	}
	if (images.length >= 4) {
		return (
			<div className={styles.imagesContainer}>
				<div className={styles.imagesCol}>
					<div className={styles.imagesRow}>
						<ReplyImage image={images[0]!} />
						<ReplyImage image={images[1]!} />
					</div>
					<div className={styles.imagesRow}>
						<ReplyImage image={images[2]!} />
						<div className={styles.imageOverlayWrapper}>
							<ReplyImage image={images[3]!} />
							{totalNumber > 4 && (
								<div className={styles.imageOverlay}>
									<Text weight="medium">
										{m['view.composer.gallery.moreCount']({ count: totalNumber - 3 })}
									</Text>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}
	return null;
}
