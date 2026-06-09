import { type ReactNode, useMemo } from 'react';
import type { AppBskyRichtextFacet } from '@atcute/bluesky';
import { segmentize } from '@atcute/bluesky-richtext-segmenter';
import { clsx } from 'clsx';

import { detectFacetsWithoutResolution, type Richtext } from '#/lib/strings/rich-text-facets';
import { definitelyUrl, toShortUrl } from '#/lib/strings/url-helpers';

import { isOnlyEmoji } from '#/alf/typography';

import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { InlineLinkText, type InlineLinkTextProps } from '#/components/web/Link';
import { content, emoji } from '#/components/web/RichText.css';
import { RichTextTag } from '#/components/web/RichTextTag';
import { Text, type TextProps } from '#/components/web/Text';

type Feature = AppBskyRichtextFacet.Main['features'][number];

export type RichTextProps = Pick<
	TextProps,
	'align' | 'color' | 'leading' | 'numberOfLines' | 'selectable' | 'weight'
> & {
	authorHandle?: string;
	className?: string;
	disableLinks?: boolean;
	/** Enlargement applied to emoji-only content: `normal` (1.85×) or `large` (3×). */
	emojiScale?: 'large' | 'normal';
	enableTags?: boolean;
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
	disableLinks,
	emojiScale = 'normal',
	enableTags = false,
	leading,
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
				className={clsx(content, emoji({ scale: emojiScale, size }), className)}
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
						const isValidLink = definitelyUrl(feature.uri) != null;
						if (!isValidLink || disableLinks) {
							el = toShortUrl(segment.text);
						} else {
							el = (
								<InlineLinkText
									color={color}
									key={key}
									leading={leading}
									onPress={onLinkPress}
									selectable={selectable}
									size={size}
									to={feature.uri}
									weight={weight}
								>
									{toShortUrl(segment.text)}
								</InlineLinkText>
							);
						}
						break features;
					}
					case 'app.bsky.richtext.facet#mention': {
						if (!disableLinks && feature.did.startsWith('did:')) {
							el = (
								<ProfileHoverCard key={key} did={feature.did} inline>
									<InlineLinkText
										color={color}
										leading={leading}
										onPress={onLinkPress}
										selectable={selectable}
										size={size}
										to={`/profile/${feature.did}`}
										weight={weight}
									>
										{segment.text}
									</InlineLinkText>
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
			className={clsx(content, className)}
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
