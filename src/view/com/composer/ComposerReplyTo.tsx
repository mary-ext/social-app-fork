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

import { EMPTY_ASPECT_RATIO } from '#/components/ImageEmbed/carousel/const';
import { QuoteEmbed } from '#/components/Post/Embed';
import { PreviewableUserAvatar } from '#/components/PreviewableUserAvatar';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './ComposerReplyTo.css';

export function ComposerReplyTo({ replyTo }: { replyTo: ComposerOptsPostRef }) {
	const embed = replyTo.embed;

	const [showFull, setShowFull] = useState(false);

	const onPress = () => {
		setShowFull((prev) => !prev);
	};

	const record = unwrapQuoteEmbed(unwrapRecordEmbed(embed));
	const quoteEmbed = record?.$type === 'app.bsky.embed.record#viewRecord' ? record : null;

	const media = unwrapMediaEmbed(embed);
	let images: AppBskyEmbedGallery.ViewImage[] = [];
	let totalNumber = 0;
	if (media) {
		switch (media.$type) {
			case 'app.bsky.embed.images#view': {
				images = imagesToGalleryItems(media.images);
				totalNumber = media.images.length;
				break;
			}
			case 'app.bsky.embed.gallery#view': {
				images = media.items;
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

				{showFull && quoteEmbed && <QuoteEmbed embed={quoteEmbed} linkDisabled />}
			</div>
		</div>
	);
}

/** Normalize images view items (`thumb`) to the shared gallery `ViewImage` shape (`thumbnail`). */
function imagesToGalleryItems(items: AppBskyEmbedImages.ViewImage[]): AppBskyEmbedGallery.ViewImage[] {
	return items.map((item) => ({
		alt: item.alt,
		aspectRatio: item.aspectRatio || EMPTY_ASPECT_RATIO,
		fullsize: item.fullsize,
		thumbnail: item.thumb,
	}));
}

function ReplyImage({ image }: { image: AppBskyEmbedGallery.ViewImage }) {
	return <img src={image.thumbnail} className={styles.image} alt={image.alt || ''} />;
}

function ComposerReplyToImages({
	images,
	totalNumber,
}: {
	images: AppBskyEmbedGallery.ViewImage[];
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
