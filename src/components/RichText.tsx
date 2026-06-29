import { type ReactNode, useMemo } from 'react';
import type { AppBskyRichtextFacet } from '@atcute/bluesky';
import { segmentize } from '@atcute/bluesky-richtext-segmenter';
import { clsx } from 'clsx';

import { detectFacetsWithoutResolution, type Richtext } from '#/lib/strings/rich-text-facets';
import { parseLinkableUrl, toShortUrl } from '#/lib/strings/url-helpers';

import { isOnlyEmoji } from '#/alf/typography';

import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { atomicSegment, emoji } from '#/components/RichText.css';
import { RichTextTag } from '#/components/RichTextTag';
import { Text, type TextProps } from '#/components/Text';
import {
	ContentLinkText,
	InlineLinkText,
	type InlineLinkTextProps,
	type InlineLinkUnderline,
} from '#/components/web/Link';

type Feature = AppBskyRichtextFacet.Main['features'][number];

export type RichTextProps = Pick<
	TextProps,
	'align' | 'color' | 'leading' | 'numberOfLines' | 'selectable' | 'weight'
> & {
	authorHandle?: string;
	className?: string;
	/**
	 * Render mentions as plain links without their profile hover card — set when RichText is itself inside a
	 * hover card, to stop cards cascading.
	 */
	disableHoverCards?: boolean;
	disableLinks?: boolean;
	/** Enlargement applied to emoji-only content: `normal` (1.85×) or `large` (3×). */
	emojiScale?: 'large' | 'normal';
	enableTags?: boolean;
	/** Underline timing for inline links, mentions, and tags; defaults to `hover`. */
	linkUnderline?: InlineLinkUnderline;
	onLinkPress?: InlineLinkTextProps['onPress'];
	/** The body-text sizes RichText renders (a subset of the full scale), each enlarged for emoji-only content. */
	size?: 'lg' | 'md' | 'sm' | 'xl' | 'xs';
	value: Richtext | string;
};

/**
 * Renders an atproto richtext value (or a plain string, whose facets are detected on the fly) as inline text
 * with mentions, links, and hashtags. Mentions and links inherit the text `color`, defaulting to the link
 * color when unset; emoji-only content is enlarged per {@link RichTextProps.emojiScale}.
 */
export function RichText({
	align,
	authorHandle,
	className,
	color,
	disableHoverCards,
	disableLinks,
	emojiScale = 'normal',
	enableTags = false,
	leading,
	linkUnderline,
	numberOfLines,
	onLinkPress,
	selectable,
	size,
	value,
	weight,
}: RichTextProps) {
	const { text, facets } = useMemo(() => {
		return typeof value === 'string' ? detectFacetsWithoutResolution(value) : value;
	}, [value]);

	// emoji-only text is enlarged and unclamped, so it takes its own host rather than the shared one below
	if (!facets?.length && isOnlyEmoji(text)) {
		return (
			<Text
				align={align}
				className={clsx(emoji({ scale: emojiScale, size }), className)}
				color={color}
				leading={leading}
				selectable={selectable}
				weight={weight}
			>
				{text}
			</Text>
		);
	}

	let children: ReactNode = text;
	if (facets?.length) {
		const els: ReactNode[] = [];
		let key = 0;
		for (const segment of segmentize<Feature>(text, facets)) {
			let el: ReactNode = segment.text;

			// Render the first feature we support, in array order — a facet's `features` can carry more
			// than one, and we take whichever comes first rather than imposing a type precedence.
			features: for (const feature of segment.features ?? []) {
				switch (feature.$type) {
					case 'app.bsky.richtext.facet#link': {
						// require a genuine http(s) URL with a real host — a loose match would render
						// degenerate facet URIs (`https://` + a run of dots, `at://…`, other schemes) as
						// clickable links whose visible text reveals nothing about where they lead
						const isValidLink = parseLinkableUrl(feature.uri) != null;
						if (!isValidLink || disableLinks) {
							el = toShortUrl(segment.text);
						} else {
							el = (
								<ContentLinkText
									color={color}
									href={feature.uri}
									key={key}
									leading={leading}
									onPress={onLinkPress}
									selectable={selectable}
									size={size}
									underline={linkUnderline}
									weight={weight}
								>
									{toShortUrl(segment.text)}
								</ContentLinkText>
							);
						}
						break features;
					}
					case 'app.bsky.richtext.facet#mention': {
						if (!disableLinks && feature.did.startsWith('did:')) {
							const link = (
								<InlineLinkText
									className={atomicSegment}
									color={color}
									key={key}
									leading={leading}
									onPress={onLinkPress}
									selectable={selectable}
									size={size}
									to={`/profile/${feature.did}`}
									underline={linkUnderline}
									weight={weight}
								>
									{segment.text}
								</InlineLinkText>
							);
							el = disableHoverCards ? (
								link
							) : (
								<ProfileHoverCard did={feature.did} key={key}>
									{link}
								</ProfileHoverCard>
							);
						}
						break features;
					}
					case 'app.bsky.richtext.facet#tag': {
						if (!disableLinks && enableTags) {
							el = (
								<RichTextTag
									authorHandle={authorHandle}
									color={color}
									display={segment.text}
									key={key}
									leading={leading}
									size={size}
									tag={feature.tag}
									underline={linkUnderline}
								/>
							);
						}
						break features;
					}
				}
			}

			els.push(el);
			key++;
		}
		children = els;
	}

	return (
		<Text
			align={align}
			className={className}
			color={color}
			leading={leading}
			numberOfLines={numberOfLines}
			selectable={selectable}
			size={size}
			weight={weight}
		>
			{children}
		</Text>
	);
}
